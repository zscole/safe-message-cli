#!/usr/bin/env node

import { ethers } from 'ethers'
import { readFileSync } from 'fs'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

const EIP1271_ABI = ['function isValidSignature(bytes32,bytes) view returns (bytes4)']
const MAGIC_VALUE = '0x1626ba7e'

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

const args = yargs(hideBin(process.argv))
  .option('safe', { type: 'string', required: true, desc: 'Safe address' })
  .option('sig', { type: 'string', required: true, desc: 'Signature to verify' })
  .option('msg', { type: 'string', required: true, desc: 'Message file path' })
  .option('rpc', { type: 'string', required: true, desc: 'RPC endpoint' })
  .option('signer', { type: 'string', desc: 'Expected signer address' })
  .option('onchain', { type: 'boolean', desc: 'Use EIP-1271 verification' })
  .help()
  .argv

async function main() {
  const { safe, sig, msg, rpc, signer, onchain } = args

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
  
  try {
    await provider.getNetwork()
  } catch {
    console.error('RPC connection failed')
    process.exit(1)
  }

  const network = await provider.getNetwork()
  const chainId = Number(network.chainId)
  
  // Create Safe-compatible message hash (same as sign.js)
  const safeMessageHash = await createSafeMessageHash(safe, message, chainId)
  
  console.log(`Message: ${message}`)
  console.log(`Safe Message Hash: ${safeMessageHash}`)
  console.log(`Signature: ${sig}`)
  console.log(`Chain ID: ${chainId}`)

  if (onchain) {
    const contract = new ethers.Contract(safe, EIP1271_ABI, provider)
    try {
      const result = await contract.isValidSignature(safeMessageHash, sig)
      const valid = result === MAGIC_VALUE
      console.log(`EIP-1271: ${valid ? 'valid' : 'invalid'}`)
      process.exit(valid ? 0 : 1)
    } catch (err) {
      console.error(`Contract call failed: ${err.message}`)
      process.exit(1)
    }
  } else {
    try {
      const recovered = ethers.verifyMessage(ethers.getBytes(safeMessageHash), sig)
      console.log(`Recovered: ${recovered}`)
      
      if (signer) {
        const match = recovered.toLowerCase() === signer.toLowerCase()
        console.log(`Expected: ${signer}`)
        console.log(`Match: ${match ? 'yes' : 'no'}`)
        process.exit(match ? 0 : 1)
      }
    } catch (err) {
      console.error(`Signature recovery failed: ${err.message}`)
      process.exit(1)
    }
  }
}

main().catch(err => {
  console.error(err.message)
  process.exit(1)
}) 