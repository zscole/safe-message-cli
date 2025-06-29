#!/usr/bin/env node

import { ethers } from 'ethers'
import { readFileSync } from 'fs'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { safeTypedData, safeMessageHash } from '../lib/safe.js'

const EIP1271_ABI = ['function isValidSignature(bytes32,bytes) view returns (bytes4)']
const EIP1271_MAGIC = '0x1626ba7e'

const cli = yargs(hideBin(process.argv))
  .option('safe', { 
    type: 'string', 
    required: true, 
    describe: 'Safe address' 
  })
  .option('sig', { 
    type: 'string', 
    required: true, 
    describe: 'Signature to verify' 
  })
  .option('msg', { 
    type: 'string', 
    required: true, 
    describe: 'Message file path' 
  })
  .option('rpc', { 
    type: 'string', 
    required: true, 
    describe: 'RPC endpoint URL' 
  })
  .option('signer', { 
    type: 'string', 
    describe: 'Expected signer address' 
  })
  .option('onchain', { 
    type: 'boolean', 
    describe: 'Use EIP-1271 verification' 
  })
  .help()
  .argv

async function main() {
  const { safe, sig, msg, rpc, signer, onchain } = cli

  if (!ethers.isAddress(safe)) {
    console.error('invalid safe address')
    process.exit(1)
  }

  let message
  try {
    message = readFileSync(msg, 'utf8').trim()
  } catch {
    console.error(`failed to read ${msg}`)
    process.exit(1)
  }

  const provider = new ethers.JsonRpcProvider(rpc)
  
  let chainId
  try {
    const network = await provider.getNetwork()
    chainId = Number(network.chainId)
  } catch {
    console.error('rpc connection failed')
    process.exit(1)
  }

  const { domain, types, value } = safeTypedData(safe, message, chainId)
  const messageHash = safeMessageHash(safe, message, chainId)
  
  console.log(`Message: ${message}`)
  console.log(`Safe: ${safe}`)
  console.log(`Chain: ${chainId}`)
  console.log(`Hash: ${messageHash}`)
  console.log(`Signature: ${sig}`)

  if (onchain) {
    const contract = new ethers.Contract(safe, EIP1271_ABI, provider)
    try {
      const result = await contract.isValidSignature(messageHash, ethers.getBytes(sig))
      const valid = result === EIP1271_MAGIC
      console.log(`Valid: ${valid}`)
      process.exit(valid ? 0 : 1)
    } catch (err) {
      console.error(`eip-1271 failed: ${err.message}`)
      process.exit(1)
    }
  } else {
    try {
      const recovered = ethers.verifyTypedData(domain, types, value, sig)
      console.log(`Recovered: ${recovered}`)
      
      if (signer) {
        const match = recovered.toLowerCase() === signer.toLowerCase()
        console.log(`Expected: ${signer}`)
        console.log(`Match: ${match}`)
        process.exit(match ? 0 : 1)
      }
    } catch (err) {
      console.error(`recovery failed: ${err.message}`)
      process.exit(1)
    }
  }
}

main().catch(err => {
  console.error(err.message)
  process.exit(1)
}) 