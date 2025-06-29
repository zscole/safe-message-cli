#!/usr/bin/env node

import { ethers } from 'ethers'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

const SAFE_ABI = [
  'function getTransactionHash(address to, uint256 value, bytes data, uint8 operation, uint256 safeTxGas, uint256 baseGas, uint256 gasPrice, address gasToken, address refundReceiver, uint256 nonce) view returns (bytes32)',
  'function execTransaction(address to, uint256 value, bytes data, uint8 operation, uint256 safeTxGas, uint256 baseGas, uint256 gasPrice, address gasToken, address refundReceiver, bytes signatures) returns (bool success)',
  'function nonce() view returns (uint256)',
  'function getOwners() view returns (address[])',
  'function getThreshold() view returns (uint256)',
  'function isOwner(address owner) view returns (bool)'
]

const cli = yargs(hideBin(process.argv))
  .option('safe', { 
    type: 'string', 
    required: true, 
    describe: 'Safe address' 
  })
  .option('to', { 
    type: 'string', 
    required: true, 
    describe: 'Recipient address' 
  })
  .option('value', { 
    type: 'string', 
    default: '0', 
    describe: 'ETH value in wei' 
  })
  .option('data', { 
    type: 'string', 
    default: '0x', 
    describe: 'Transaction data' 
  })
  .option('operation', { 
    type: 'number', 
    default: 0, 
    describe: 'Operation type (0=call, 1=delegatecall)' 
  })
  .option('rpc', { 
    type: 'string', 
    required: true, 
    describe: 'RPC endpoint URL' 
  })
  .option('key', { 
    type: 'string', 
    describe: 'Private key to sign with' 
  })
  .option('output', { 
    type: 'string', 
    default: 'transaction.json', 
    describe: 'Output file path' 
  })
  .option('execute', { 
    type: 'boolean', 
    describe: 'Execute the transaction' 
  })
  .option('executor-key', { 
    type: 'string', 
    describe: 'Executor private key' 
  })
  .help()
  .argv

function loadTransaction(file) {
  if (!existsSync(file)) {
    return {
      safe: '', to: '', value: '0', data: '0x', operation: 0,
      safeTxGas: 0, baseGas: 0, gasPrice: 0,
      gasToken: ethers.ZeroAddress, refundReceiver: ethers.ZeroAddress,
      nonce: 0, txHash: '', signatures: [], executed: false
    }
  }
  
  try {
    return JSON.parse(readFileSync(file, 'utf8'))
  } catch {
    console.error(`failed to read ${file}`)
    process.exit(1)
  }
}

function saveTransaction(file, data) {
  try {
    writeFileSync(file, JSON.stringify(data, null, 2))
  } catch (error) {
    console.error(`failed to save ${file}: ${error.message}`)
    process.exit(1)
  }
}

function packSignatures(signatures) {
  const sorted = signatures
    .filter(s => s.signature && s.signer)
    .sort((a, b) => a.signer.toLowerCase().localeCompare(b.signer.toLowerCase()))
  
  let packed = '0x'
  for (const s of sorted) {
    packed += s.signature.slice(2)
  }
  
  return { packed, signers: sorted.map(s => s.signer) }
}

async function main() {
  const { safe, to, value, data, operation, rpc, key, output, execute, executorKey } = cli
  
  if (!ethers.isAddress(safe)) {
    console.error('invalid safe address')
    process.exit(1)
  }
  
  if (!ethers.isAddress(to)) {
    console.error('invalid recipient address')
    process.exit(1)
  }

  const provider = new ethers.JsonRpcProvider(rpc)
  
  try {
    await provider.getNetwork()
  } catch {
    console.error('rpc connection failed')
    process.exit(1)
  }

  const contract = new ethers.Contract(safe, SAFE_ABI, provider)
  let tx = loadTransaction(output)
  
  // Initialize new transaction
  if (!tx.txHash) {
    const nonce = await contract.nonce()
    
    tx = {
      safe, to, value, data, operation,
      safeTxGas: 0, baseGas: 0, gasPrice: 0,
      gasToken: ethers.ZeroAddress, refundReceiver: ethers.ZeroAddress,
      nonce: Number(nonce), signatures: [], executed: false
    }
    
    tx.txHash = await contract.getTransactionHash(
      to, value, data, operation,
      tx.safeTxGas, tx.baseGas, tx.gasPrice,
      tx.gasToken, tx.refundReceiver, tx.nonce
    )
    
    saveTransaction(output, tx)
    console.log(`created transaction ${tx.txHash}`)
  }
  
  // Validate transaction consistency
  const expectedHash = await contract.getTransactionHash(
    tx.to, tx.value, tx.data, tx.operation,
    tx.safeTxGas, tx.baseGas, tx.gasPrice,
    tx.gasToken, tx.refundReceiver, tx.nonce
  )
  
  if (tx.txHash !== expectedHash) {
    console.error('transaction hash mismatch')
    process.exit(1)
  }
  
  // Sign transaction
  if (key) {
    const wallet = new ethers.Wallet(key, provider)
    
    const isOwner = await contract.isOwner(wallet.address)
    if (!isOwner) {
      console.error(`${wallet.address} not a safe owner`)
      process.exit(1)
    }
    
    const signature = await wallet.signMessage(ethers.getBytes(tx.txHash))
    
    const existing = tx.signatures.find(s => s.signer.toLowerCase() === wallet.address.toLowerCase())
    if (existing) {
      existing.signature = signature
    } else {
      tx.signatures.push({ signer: wallet.address, signature })
    }
    
    saveTransaction(output, tx)
    console.log(`signed with ${wallet.address}`)
  }
  
  // Get Safe info
  const threshold = await contract.getThreshold()
  const owners = await contract.getOwners()
  
  console.log(`Safe: ${safe}`)
  console.log(`To: ${tx.to}`)
  console.log(`Value: ${tx.value} wei`)
  console.log(`Hash: ${tx.txHash}`)
  console.log(`Signatures: ${tx.signatures.length}/${threshold}`)
  console.log(`Executed: ${tx.executed}`)
  
  if (tx.signatures.length > 0) {
    tx.signatures.forEach((s, i) => {
      const isOwner = owners.some(o => o.toLowerCase() === s.signer.toLowerCase())
      console.log(`  ${i + 1}. ${s.signer} ${isOwner ? '(owner)' : '(not owner)'}`)
    })
  }
  
  // Execute transaction
  if (execute && !tx.executed) {
    if (tx.signatures.length < threshold) {
      console.error(`need ${threshold} signatures, have ${tx.signatures.length}`)
      process.exit(1)
    }
    
    if (!executorKey) {
      console.error('executor key required')
      process.exit(1)
    }
    
    const executor = new ethers.Wallet(executorKey, provider)
    const { packed } = packSignatures(tx.signatures)
    
    try {
      const result = await contract.connect(executor).execTransaction(
        tx.to, tx.value, tx.data, tx.operation,
        tx.safeTxGas, tx.baseGas, tx.gasPrice,
        tx.gasToken, tx.refundReceiver, packed
      )
      
      console.log(`executing ${result.hash}...`)
      const receipt = await result.wait()
      console.log(`executed in block ${receipt.blockNumber}`)
      
      tx.executed = true
      tx.executionTxHash = result.hash
      tx.executionBlock = receipt.blockNumber
      saveTransaction(output, tx)
      
    } catch (error) {
      console.error(`execution failed: ${error.message}`)
      process.exit(1)
    }
  }
  
  if (tx.signatures.length >= threshold && !tx.executed) {
    console.log('ready to execute')
  }
}

main().catch(err => {
  console.error(err.message)
  process.exit(1)
}) 