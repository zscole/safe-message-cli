import { ethers } from 'ethers'

export function safeTypedData(safe, message, chainId) {
  return {
    domain: { chainId, verifyingContract: safe },
    types: { SafeMessage: [{ name: 'message', type: 'bytes' }] },
    value: { message: ethers.toUtf8Bytes(message) }
  }
}

export function safeMessageHash(safe, message, chainId) {
  const { domain, types, value } = safeTypedData(safe, message, chainId)
  return ethers.TypedDataEncoder.hash(domain, types, value)
} 