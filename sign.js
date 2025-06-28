#!/usr/bin/env node

import { ethers } from 'ethers'
import { readFileSync } from 'fs'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

const args = yargs(hideBin(process.argv))
  .option('safe', { type: 'string', required: true, desc: 'Safe address' })
  .option('key', { type: 'string', required: true, desc: 'Owner private key' })
  .option('msg', { type: 'string', required: true, desc: 'Message file path' })
  .option('rpc', { type: 'string', required: true, desc: 'RPC endpoint' })
  .help()
  .argv

async function createSafeMessageHash(safeAddress, message, chainId) {
  // Safe domain separator
  const domain = {
    chainId: chainId,
    verifyingContract: safeAddress
  }
  
  // Safe message type
  const types = {
    SafeMessage: [
      { name: 'message', type: 'bytes' }
    ]
  }
  
  // Message data
  const messageBytes = ethers.toUtf8Bytes(message)
  const value = { message: messageBytes }
  
  return ethers.TypedDataEncoder.hash(domain, types, value)
}

async function main() {
  const { safe, key, msg, rpc } = args
  
  if (!ethers.isAddress(safe)) {
    console.error('Invalid Safe address')
    process.exit(1)
  }

  let message
  try {
    message = readFileSync(msg, 'utf8').trim()
  } catch {
    console.error(`Cannot read ${msg}`)
    process.exit(1)
  }

  const provider = new ethers.JsonRpcProvider(rpc)
  const signer = new ethers.Wallet(key, provider)
  
  try {
    await provider.getNetwork()
  } catch {
    console.error('RPC connection failed')
    process.exit(1)
  }

  const network = await provider.getNetwork()
  const chainId = Number(network.chainId)
  
  // Create Safe-compatible message hash
  const safeMessageHash = await createSafeMessageHash(safe, message, chainId)
  
  // Sign the Safe message hash
  const signature = await signer.signMessage(ethers.getBytes(safeMessageHash))
  const signerAddress = signer.address

  console.log(`Message: ${message}`)
  console.log(`Safe Message Hash: ${safeMessageHash}`)
  console.log(`Signature: ${signature}`)
  console.log(`Signer: ${signerAddress}`)
  console.log(`Safe: ${safe}`)
  console.log(`Chain ID: ${chainId}`)
}

main().catch(err => {
  console.error(err.message)
  process.exit(1)
}) 