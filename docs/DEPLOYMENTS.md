# 📝 Deployment Summary

## Overview

This document tracks all deployments of the MediaRegistry smart contract across different networks.

## Deployment History

### Testnet Deployments

#### Local Hardhat Network (Development)

| Deployment | Date | Contract Address | Deployer | Status |
|------------|------|------------------|----------|--------|
| v0.1.0 | 2024-01-XX | 0x5FbDB2315678afecb367f032d93F642f64180aa3 | Local | ✅ Active |

**Purpose:** Development and testing
**Network:** Hardhat local node (chainId: 31337)

---

### Upcoming Testnet Deployments

#### Polygon Mumbai (Planned)

**Network Details:**
- Chain ID: 80001
- RPC: https://rpc-mumbai.maticvigil.com
- Explorer: https://mumbai.polygonscan.com
- Faucet: https://faucet.polygon.technology

**Deployment Steps:**
```bash
# Check balance
npx hardhat run scripts/checkBalance.ts --network polygonMumbai

# Deploy
npx hardhat run scripts/deploy/deployMediaRegistry.ts --network polygonMumbai

# Verify
npx hardhat verify --network polygonMumbai <CONTRACT_ADDRESS>

# Test
CONTRACT_ADDRESS=<address> npx hardhat run scripts/testDeployment.ts --network polygonMumbai
```

---

#### Base Sepolia (Planned)

**Network Details:**
- Chain ID: 84532
- RPC: https://sepolia.base.org
- Explorer: https://sepolia.basescan.org
- Faucet: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet

**Deployment Steps:**
```bash
# Check balance
npx hardhat run scripts/checkBalance.ts --network baseSepolia

# Deploy
npx hardhat run scripts/deploy/deployMediaRegistry.ts --network baseSepolia

# Verify
npx hardhat verify --network baseSepolia <CONTRACT_ADDRESS>

# Test
CONTRACT_ADDRESS=<address> npx hardhat run scripts/testDeployment.ts --network baseSepolia
```

---

## Configuration

### Required Environment Variables

```bash
# RPC URLs
POLYGON_MUMBAI_RPC=https://rpc-mumbai.maticvigil.com
BASE_SEPOLIA_RPC=https://sepolia.base.org
SEPOLIA_RPC=https://ethereum-sepolia-rpc.publicnode.com

# Private key (NEVER commit)
DEPLOYER_KEY=your_private_key

# API Keys
POLYGONSCAN_API_KEY=your_key
BASESCAN_API_KEY=your_key
ETHERSCAN_API_KEY=your_key

# Deployed address
CONTRACT_ADDRESS=0x...
```

### Hardhat Networks

Configured networks in `hardhat.config.ts`:
- `hardhat` - Local development
- `polygonMumbai` - Polygon testnet
- `baseSepolia` - Base testnet
- `sepolia` - Ethereum testnet

## Deployment Scripts

### 1. Deploy Contract
```bash
npx hardhat run scripts/deploy/deployMediaRegistry.ts --network <network>
```

**Outputs:**
- Contract address
- Deployment transaction hash
- Deployer address and balance
- Saves deployment info to `deployments/<network>-<timestamp>.json`

### 2. Check Balance
```bash
npx hardhat run scripts/checkBalance.ts --network <network>
```

**Checks:**
- Wallet address
- Current balance
- Network details

### 3. Test Deployment
```bash
CONTRACT_ADDRESS=<address> npx hardhat run scripts/testDeployment.ts --network <network>
```

**Tests:**
- Contract connection
- Domain separator retrieval
- Asset registration (with EIP-712 signature)
- Asset retrieval

### 4. Verify Contract
```bash
npx hardhat verify --network <network> <CONTRACT_ADDRESS>
```

**Verifies:**
- Source code on block explorer
- Enables public read/write interface
- Increases transparency and trust

## Contract Specification

### MediaRegistry v1.0

**Compiler:** Solidity 0.8.20
**Optimization:** Enabled (200 runs)
**License:** MIT

**Functions:**
- `register(address owner, bytes32 contentHash, bytes32 metadataRoot, string uri, string mimeType, bytes signature)` - Register new asset
- `update(bytes32 assetId, bytes32 contentHash, bytes32 metadataRoot, string uri, bytes signature)` - Update asset
- `transferOwnership(bytes32 assetId, address newOwner)` - Transfer asset ownership
- `linkContract(bytes32 assetId, bytes32 contractRefHash)` - Link legal contract
- `getAsset(bytes32 assetId)` - Get asset details
- `domainSeparator()` - Get EIP-712 domain separator

**Events:**
- `AssetRegistered(bytes32 assetId, address owner, bytes32 contentHash, bytes32 metadataRoot, string uri, string mimeType)`
- `AssetUpdated(bytes32 assetId, uint256 version, bytes32 contentHash, bytes32 metadataRoot, string uri)`
- `OwnershipTransferred(bytes32 assetId, address oldOwner, address newOwner)`
- `ContractLinked(bytes32 assetId, bytes32 contractRefHash)`

## Testing

### Local Testing
```bash
# Run all tests
npx hardhat test

# Run with coverage
npx hardhat coverage

# Run demo
npx hardhat test test/Demo.ts
```

**Current Status:** ✅ 15 tests passing, 94% coverage

### Testnet Testing

After deployment, test via:

1. **CLI Tool:**
```bash
node cli hash test.txt
node cli register --contract <ADDRESS> --network <NETWORK> ...
node cli verify --contract <ADDRESS> --network <NETWORK> ...
```

2. **Hardhat Console:**
```bash
npx hardhat console --network <network>
> const registry = await ethers.getContractAt("MediaRegistry", "<ADDRESS>")
> await registry.domainSeparator()
```

3. **Test Script:**
```bash
CONTRACT_ADDRESS=<address> npx hardhat run scripts/testDeployment.ts --network <network>
```

## Security Considerations

### Pre-Deployment Checklist

- [x] All tests passing
- [x] Coverage ≥90%
- [x] EIP-712 signatures validated
- [ ] Testnet deployment successful
- [ ] Contract verified on explorer
- [ ] Third-party audit (for mainnet)

### Operational Security

- Use hardware wallet for mainnet deployments
- Store private keys in secure vault (AWS Secrets Manager, Azure Key Vault)
- Never commit `.env` file
- Use multi-sig wallet for contract ownership (mainnet)
- Implement monitoring and alerting

## Troubleshooting

### Common Issues

**1. Insufficient funds**
```
Error: insufficient funds for gas
```
**Solution:** Get testnet tokens from faucet

**2. Network unreachable**
```
Error: could not detect network
```
**Solution:** Check RPC URL in `.env`

**3. Verification failed**
```
Error: contract verification failed
```
**Solution:** Ensure compiler version matches (0.8.20)

## Next Steps

1. [ ] Deploy to Polygon Mumbai
2. [ ] Verify on Mumbai Polygonscan
3. [ ] Test CLI against Mumbai deployment
4. [ ] Deploy to Base Sepolia
5. [ ] Verify on Base Sepolia Explorer
6. [ ] Test API against testnet
7. [ ] Integrate IPFS for URI storage
8. [ ] Setup GitHub Actions CI/CD
9. [ ] Prepare for mainnet deployment

## Resources

- [Deployment Guide](./DEPLOYMENT.md)
- [Security Checklist](./SecurityChecklist.md)
- [Getting Started](./GettingStarted.md)
- [Design Document](../Design.md)

---

**Last Updated:** 2024-01-XX
**Maintainer:** reyisjones
**Repository:** https://github.com/reyisjones/BChain
