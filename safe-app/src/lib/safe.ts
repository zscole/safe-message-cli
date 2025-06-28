import { ethers } from 'ethers'

export function safeTypedData(safe: string, message: string, chainId: string | number) {
  const numericChainId = typeof chainId === 'string' ? parseInt(chainId) : chainId
  return {
    domain: { chainId: numericChainId, verifyingContract: safe },
    types: { SafeMessage: [{ name: 'message', type: 'bytes' }] },
    value: { message: ethers.toUtf8Bytes(message) }
  }
}

export function safeMessageHash(safeAddress: string, message: string, chainId: string): string {
  const domain = {
    chainId: parseInt(chainId),
    verifyingContract: safeAddress
  };

  const types = {
    SafeMessage: [
      { name: 'message', type: 'bytes' }
    ]
  };

  const value = {
    message: ethers.toUtf8Bytes(message)
  };

  return ethers.TypedDataEncoder.hash(domain, types, value);
} 