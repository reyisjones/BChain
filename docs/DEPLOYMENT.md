# 🚀 Deployment Guide

Complete guide for deploying MediaRegistry to testnets and mainnet.

## 📋 Prerequisites

Before deploying, ensure you have:

1. **Node.js & Dependencies**
   ```bash
   npm install
   ```

2. **Testnet ETH** (for gas fees)
   - **Polygon Mumbai**: Get MATIC from [Mumbai Faucet](https://faucet.polygon.technology/)
   - **Base Sepolia**: Get ETH from [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet)
   - **Sepolia**: Get ETH from [Sepolia Faucet](https://sepoliafaucet.com/)

3. **API Keys**
   - **Polygonscan**: [Sign up](https://polygonscan.com/apis) for API key
   - **Basescan**: [Sign up](https://basescan.org/apis) for API key
   - **Etherscan**: [Sign up](https://etherscan.io/apis) for API key

4. **Wallet Private Key**
   - Export from MetaMask: Settings → Security & Privacy → Show private key
   - **⚠️ NEVER commit this key or use a key with mainnet funds**

## 🔧 Configuration

### 1. Setup Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` with your values:

```bash
# Testnet RPC URLs (use Alchemy, Infura, or public RPCs)
POLYGON_MUMBAI_RPC=https://rpc-mumbai.maticvigil.com
BASE_SEPOLIA_RPC=https://sepolia.base.org

# Deployer private key (WITHOUT 0x prefix)
DEPLOYER_KEY=your_private_key_here

# Block explorer API keys (for contract verification)
POLYGONSCAN_API_KEY=your_polygonscan_key
BASESCAN_API_KEY=your_basescan_key

# Contract address (will be filled after deployment)
CONTRACT_ADDRESS=
```

### 2. Verify Configuration

```bash
# Check network connectivity
npx hardhat run scripts/deploy/deployMediaRegistry.ts --network polygonMumbai --dry-run
```

## 📦 Deployment Steps

### Option 1: Polygon Mumbai (Recommended for testing)

```bash
# Deploy contract
npx hardhat run scripts/deploy/deployMediaRegistry.ts --network polygonMumbai

# Verify on Polygonscan
npx hardhat verify --network polygonMumbai <CONTRACT_ADDRESS>
```

### Option 2: Base Sepolia

```bash
# Deploy contract
npx hardhat run scripts/deploy/deployMediaRegistry.ts --network baseSepolia

# Verify on Basescan
npx hardhat verify --network baseSepolia <CONTRACT_ADDRESS>
```

### Option 3: Local Hardhat Network (for development)

```bash
# Terminal 1: Start local node
npx hardhat node

# Terminal 2: Deploy to local network
npx hardhat run scripts/deploy/deployMediaRegistry.ts --network localhost
```

## ✅ Post-Deployment

### 1. Save Deployment Info

Deployment details are automatically saved to `deployments/<network>-<timestamp>.json`:

```json
{
  "network": "polygonMumbai",
  "chainId": "80001",
  "contractAddress": "0x...",
  "deployer": "0x...",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "blockNumber": 12345678
}
```

### 2. Update Environment

Add contract address to `.env`:

```bash
CONTRACT_ADDRESS=0xYourDeployedContractAddress
```

### 3. Verify Contract on Block Explorer

**Polygon Mumbai:**
```bash
npx hardhat verify --network polygonMumbai <CONTRACT_ADDRESS>
```

View on [Mumbai Polygonscan](https://mumbai.polygonscan.com/)

**Base Sepolia:**
```bash
npx hardhat verify --network baseSepolia <CONTRACT_ADDRESS>
```

View on [Base Sepolia Explorer](https://sepolia.basescan.org/)

### 4. Test Deployment

#### Using CLI

```bash
# Hash a test file
node cli hash test.txt

# Register asset (requires EIP-712 signature)
node cli register \
  --contract <CONTRACT_ADDRESS> \
  --network polygonMumbai \
  --content-hash 0x... \
  --owner 0x... \
  --uri ipfs://QmTest \
  --mime-type text/plain \
  --signature 0x...

# Verify asset
node cli verify \
  --contract <CONTRACT_ADDRESS> \
  --network polygonMumbai \
  --asset-id 0x...
```

#### Using Hardhat Console

```bash
npx hardhat console --network polygonMumbai

> const MediaRegistry = await ethers.getContractFactory("MediaRegistry");
> const registry = await MediaRegistry.attach("0xYourContractAddress");
> const domainSep = await registry.domainSeparator();
> console.log("Domain Separator:", domainSep);
```

## 🔒 Security Checklist

Before deploying to mainnet:

- [ ] Code has been audited or reviewed
- [ ] All tests pass (`npx hardhat test`)
- [ ] Coverage ≥90% (`npx hardhat coverage`)
- [ ] Contract verified on block explorer
- [ ] Tested on testnet with real transactions
- [ ] Emergency procedures documented
- [ ] Multi-sig wallet for ownership (recommended)
- [ ] Rate limiting implemented in API
- [ ] Environment variables secured
- [ ] Private keys stored in secure vault (not in `.env`)

## 🌐 Network Details

### Polygon Mumbai (Testnet)
- **Chain ID**: 80001
- **RPC**: https://rpc-mumbai.maticvigil.com
- **Explorer**: https://mumbai.polygonscan.com
- **Faucet**: https://faucet.polygon.technology
- **Gas Token**: MATIC (test)

### Base Sepolia (Testnet)
- **Chain ID**: 84532
- **RPC**: https://sepolia.base.org
- **Explorer**: https://sepolia.basescan.org
- **Faucet**: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
- **Gas Token**: ETH (test)

### Polygon Mainnet (Production)
- **Chain ID**: 137
- **RPC**: https://polygon-rpc.com
- **Explorer**: https://polygonscan.com
- **Gas Token**: MATIC

### Base Mainnet (Production)
- **Chain ID**: 8453
- **RPC**: https://mainnet.base.org
- **Explorer**: https://basescan.org
- **Gas Token**: ETH

## 🐛 Troubleshooting

### Error: Insufficient funds

**Solution**: Ensure deployer wallet has testnet ETH/MATIC from faucet.

```bash
# Check balance
npx hardhat run scripts/checkBalance.ts --network polygonMumbai
```

### Error: Invalid API key

**Solution**: Verify API keys in `.env` are correct and active.

### Error: Network unreachable

**Solution**: Check RPC URL is correct and accessible.

```bash
# Test RPC connectivity
curl -X POST https://rpc-mumbai.maticvigil.com \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

### Error: Contract verification failed

**Solution**: Ensure constructor arguments match and compiler version is correct.

```bash
# Verify with specific compiler version
npx hardhat verify --network polygonMumbai \
  --contract contracts/MediaRegistry.sol:MediaRegistry \
  <CONTRACT_ADDRESS>
```

## 📚 Additional Resources

- [Hardhat Deployment Documentation](https://hardhat.org/hardhat-runner/docs/guides/deploying)
- [Polygon Mumbai Guide](https://wiki.polygon.technology/docs/supernets/operate/deploy-scs/)
- [Base Network Documentation](https://docs.base.org/)
- [EIP-712 Specification](https://eips.ethereum.org/EIPS/eip-712)

## 🎯 Next Steps

After successful deployment:

1. **Integrate IPFS**: Store media files on IPFS/Arweave
2. **Setup CI/CD**: Automate testing and deployment
3. **Add Monitoring**: Track contract events with The Graph
4. **Build Frontend**: Create web UI for asset registration
5. **Security Audit**: Professional audit before mainnet

---

**Need help?** Open an issue on [GitHub](https://github.com/reyisjones/BChain/issues)
