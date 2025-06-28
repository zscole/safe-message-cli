#!/usr/bin/env node

import { ethers } from 'ethers'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { safeTypedData, safeMessageHash } from '../lib/safe.js'

const cli = yargs(hideBin(process.argv))
  .option('safe', { type: 'string', required: true, desc: 'Safe address' })
  .option('msg', { type: 'string', required: true, desc: 'Message file' })
  .option('rpc', { type: 'string', required: true, desc: 'RPC URL' })
  .option('sig', { type: 'string', desc: 'Signature to add' })
  .option('signer', { type: 'string', desc: 'Signer address (required with --sig)' })
  .option('output', { type: 'string', default: 'signatures.json', desc: 'Output file' })
  .option('verify', { type: 'boolean', desc: 'Verify signatures' })
  .help()
  .argv

function loadSignatures(file) {
  if (!existsSync(file)) {
    return { message: '', hash: '', safe: '', chainId: 0, signatures: [] }
  }
  
  try {
    return JSON.parse(readFileSync(file, 'utf8'))
  } catch {
    console.error(`failed to read ${file}`)
    process.exit(1)
  }
}

function saveSignatures(file, data) {
  try {
    writeFileSync(file, JSON.stringify(data, null, 2))
  } catch (error) {
    console.error(`failed to save ${file}: ${error.message}`)
    process.exit(1)
  }
}

async function getSafeOwners(safe, provider) {
  try {
    const contract = new ethers.Contract(safe, ['function getOwners() view returns (address[])'], provider)
    return await contract.getOwners()
  } catch {
    return []
  }
}

async function main() {
  const { safe, msg, rpc, sig, signer, output, verify } = cli
  
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

  const messageHash = safeMessageHash(safe, message, chainId)
  let data = loadSignatures(output)
  
  // Initialize or validate
  if (data.signatures.length === 0) {
    data = { message, hash: messageHash, safe, chainId, signatures: [] }
  } else if (data.hash !== messageHash || data.safe !== safe || data.chainId !== chainId) {
    console.error('signature file mismatch - use different output file')
    process.exit(1)
  }
  
  // Add signature
  if (sig && signer) {
    if (!ethers.isAddress(signer)) {
      console.error('invalid signer address')
      process.exit(1)
    }
    
    const existing = data.signatures.find(s => s.signer.toLowerCase() === signer.toLowerCase())
    if (existing) {
      existing.signature = sig
    } else {
      data.signatures.push({ signer, signature: sig })
    }
    
    saveSignatures(output, data)
    console.log(`added signature from ${signer}`)
  }
  
  // Verify signatures
  if (verify) {
    const { domain, types, value } = safeTypedData(safe, message, chainId)
    const owners = await getSafeOwners(safe, provider)
    let valid = 0
    
    for (const s of data.signatures) {
      try {
        const recovered = ethers.verifyTypedData(domain, types, value, s.signature)
        const isValid = recovered.toLowerCase() === s.signer.toLowerCase()
        const isOwner = owners.length === 0 || owners.some(o => o.toLowerCase() === s.signer.toLowerCase())
        
        if (isValid && isOwner) valid++
        console.log(`${s.signer}: ${isValid ? 'valid' : 'invalid'} ${isOwner ? '(owner)' : '(not owner)'}`)
      } catch {
        console.log(`${s.signer}: verification failed`)
      }
    }
    
    console.log(`${valid}/${data.signatures.length} valid signatures`)
  }
  
  // Status
  console.log(`Message: ${message}`)
  console.log(`Safe: ${safe}`)
  console.log(`Hash: ${messageHash}`)
  console.log(`Signatures: ${data.signatures.length}`)
  
  if (data.signatures.length > 0) {
    data.signatures.forEach((s, i) => {
      console.log(`  ${i + 1}. ${s.signer}`)
    })
  }
}

main().catch(err => {
  console.error(err.message)
  process.exit(1)
}) 