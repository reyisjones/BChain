# Getting Started

## Prerequisites

- **Node.js** 18+ and npm/pnpm
- **Git**
- **Metamask** or similar wallet (for testnet interactions)
- Optional: Docker (for containerized deployment)

## Installation

```bash
git clone <repository-url> bchain
cd bchain
npm install
```

## Configuration

Create `.env` file in project root:

```env
# Network Configuration
RPC_URL=http://localhost:8545
POLYGON_MUMBAI_RPC=https://rpc-mumbai.maticvigil.com
BASE_SEPOLIA_RPC=https://sepolia.base.org

# Contract
CONTRACT_ADDRESS=

# Deployment
DEPLOYER_KEY=your_private_key_here

# API Keys (for verification)
POLYGONSCAN_API_KEY=
BASESCAN_API_KEY=

# API Server
PORT=3000
```

## Local Development

### 1. Compile Contracts

```bash
npx hardhat compile
```

### 2. Run Tests

```bash
npx hardhat test
```

### 3. Check Coverage

```bash
npx hardhat coverage
```

### 4. Start Local Node

```bash
npx hardhat node
```

In another terminal:

```bash
npx hardhat run scripts/deploy/deployMediaRegistry.ts --network localhost
```

Copy the deployed contract address to `.env` as `CONTRACT_ADDRESS`.

### 5. Start API Server

```bash
npm run dev
```

API will be available at `http://localhost:3000`.

### 6. Use CLI

```bash
# Hash a file
node cli/index.ts hash ./path/to/file.png

# Register asset (requires deployed contract)
node cli/index.ts register ./path/to/file.png \
  --uri ipfs://QmXXX \
  --mime image/png \
  --metadata '{"title":"Demo"}' \
  --contract 0x... \
  --key 0x...

# Verify asset
node cli/index.ts verify ./path/to/file.png <assetId> \
  --contract 0x...
```

## Testnet Deployment

### Deploy to Polygon Mumbai

```bash
npx hardhat run scripts/deploy/deployMediaRegistry.ts --network polygonMumbai
```

### Deploy to Base Sepolia

```bash
npx hardhat run scripts/deploy/deployMediaRegistry.ts --network baseSepolia
```

## API Usage Examples

### Register Asset

```bash
curl -X POST http://localhost:3000/assets/register \
  -H "Content-Type: application/json" \
  -d '{
    "owner": "0x...",
    "contentHash": "0x...",
    "metadataRoot": "0x...",
    "uri": "ipfs://QmXXX",
    "mimeType": "image/png",
    "signature": "0x..."
  }'
```

### Get Asset

```bash
curl http://localhost:3000/assets/<assetId>
```

### Verify Asset

```bash
curl -X POST http://localhost:3000/assets/verify \
  -H "Content-Type: application/json" \
  -d '{
    "assetId": "0x...",
    "fileHash": "0x..."
  }'
```

### Hash File

```bash
curl -X POST http://localhost:3000/assets/hash \
  -F "file=@./path/to/file.png"
```

## Next Steps

- Review [Developer Guide](./DeveloperGuide.md) for architecture details
- Check [Security Checklist](./SecurityChecklist.md) for production considerations
- See [Process Integration](./ProcessIntegration.md) for workflow integration patterns

Pending full content. Will cover: installation, environment setup, registering first asset.
