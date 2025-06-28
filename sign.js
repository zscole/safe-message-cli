#!/usr/bin/env node

import { ethers } from 'ethers'
import { readFileSync } from 'fs'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { safeTypedData, safeMessageHash } from './lib/safe.js'

const cli = yargs(hideBin(process.argv))
  .option('safe', { type: 'string', required: true, desc: 'Safe address' })
  .option('key', { type: 'string', required: true, desc: 'Private key' })
  .option('msg', { type: 'string', required: true, desc: 'Message file' })
  .option('rpc', { type: 'string', required: true, desc: 'RPC URL' })
  .help()
  .argv

async function main() {
  const { safe, key, msg, rpc } = cli
  
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
  const wallet = new ethers.Wallet(key, provider)
  
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
  const signature = await wallet.signTypedData(domain, types, value)

  console.log(`Message: ${message}`)
  console.log(`Safe: ${safe}`)
  console.log(`Chain: ${chainId}`)
  console.log(`Hash: ${messageHash}`)
  console.log(`Signature: ${signature}`)
  console.log(`Signer: ${wallet.address}`)
}

main().catch(err => {
  console.error(err.message)
  process.exit(1)
}) 