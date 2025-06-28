#!/usr/bin/env node

import { ethers } from 'ethers'
import { readFileSync } from 'fs'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { safeTypedData, safeMessageHash } from '../lib/safe.js'

const cli = yargs(hideBin(process.argv))
  .option('safe', { type: 'string', required: true, desc: 'Safe address' })
  .option('msg', { type: 'string', required: true, desc: 'Message file' })
  .option('rpc', { type: 'string', required: true, desc: 'RPC URL' })
  .option('wallet', { type: 'string', required: true, choices: ['ledger'], desc: 'Hardware wallet' })
  .option('path', { type: 'string', default: "m/44'/60'/0'/0/0", desc: 'Derivation path' })
  .help()
  .argv

async function signWithLedger(domain, types, value, path) {
  try {
    const { default: TransportNodeHid } = await import('@ledgerhq/hw-transport-node-hid')
    const { default: AppEth } = await import('@ledgerhq/hw-app-eth')
    
    const transport = await TransportNodeHid.create()
    const eth = new AppEth(transport)
    
    console.log('confirm on ledger...')
    
    const { address } = await eth.getAddress(path)
    
    // Use proper EIP-712 signing
    const signature = await eth.signEIP712Message(path, {
      domain,
      types,
      primaryType: 'SafeMessage',
      message: value
    })
    
    const sig = ethers.Signature.from({
      r: '0x' + signature.r,
      s: '0x' + signature.s,
      v: signature.v
    }).serialized
    
    await transport.close()
    return { signature: sig, address }
    
  } catch (error) {
    if (error.message.includes('Cannot resolve module')) {
      throw new Error('ledger dependencies not installed: npm install @ledgerhq/hw-transport-node-hid @ledgerhq/hw-app-eth')
    }
    throw error
  }
}

async function main() {
  const { safe, msg, rpc, wallet, path } = cli
  
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
  
  try {
    const result = await signWithLedger(domain, types, value, path)
    
    console.log(`Message: ${message}`)
    console.log(`Safe: ${safe}`)
    console.log(`Chain: ${chainId}`)
    console.log(`Hash: ${messageHash}`)
    console.log(`Signature: ${result.signature}`)
    console.log(`Signer: ${result.address}`)
    console.log(`Wallet: ${wallet}`)
    console.log(`Path: ${path}`)
    
  } catch (error) {
    console.error(`${wallet} signing failed: ${error.message}`)
    process.exit(1)
  }
}

main().catch(err => {
  console.error(err.message)
  process.exit(1)
}) 