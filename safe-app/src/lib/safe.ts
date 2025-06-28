import { ethers } from 'ethers'

export function safeTypedData(safe: string, message: string, chainId: string | number) {
  const numericChainId = typeof chainId === 'string' ? parseInt(chainId) : chainId
  return {
    domain: { chainId: numericChainId, verifyingContract: safe },
    types: { SafeMessage: [{ name: 'message', type: 'bytes' }] },
    value: { message: ethers.toUtf8Bytes(message) }
  }
}

export function safeMessageHash(safe: string, message: string, chainId: string | number): string {
  const { domain, types, value } = safeTypedData(safe, message, chainId)
  return ethers.TypedDataEncoder.hash(domain, types, value)
} 