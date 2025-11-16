# BChain Media Authenticity

![CI/CD](https://github.com/reyisjones/BChain/workflows/CI%2FCD%20Pipeline/badge.svg)
![Tests](https://img.shields.io/badge/tests-15%20passing-success)
![Coverage](https://img.shields.io/badge/coverage-94%25-success)
![License](https://img.shields.io/badge/license-MIT-blue)

> **Status: Phase 2 Complete** ✅ | Testnet-ready | IPFS integrated | CI/CD configured

## 📖 What is BChain?

**BChain** is a blockchain-based system that provides **cryptographic proof of authenticity** for digital contracts and media files. It solves the critical problem of verifying that digital documents, images, videos, and audio files haven't been tampered with since their creation.

### The Problem

In today's digital world:
- 📄 Legal contracts can be altered after signing
- 🖼️ Images and videos can be deepfaked or manipulated
- 🎵 Audio recordings lack verifiable authenticity
- 📝 Document provenance is difficult to prove
- ⚖️ Disputes arise over "who created what, when?"

### The Solution

BChain creates an **immutable record** on the blockchain that proves:
- ✅ **Authenticity** - File hasn't been modified
- ✅ **Ownership** - Who created/owns the content
- ✅ **Timestamp** - Exact registration time
- ✅ **Provenance** - Complete history of updates
- ✅ **Verification** - Anyone can verify authenticity

### How It Works

```
1. Upload File → 2. Generate Hash → 3. Sign with Wallet → 4. Store on Blockchain
                                                                    ↓
                    Anyone can verify ← Download & Compare ← Immutable Record
```

**Key Features:**
- 🔐 **EIP-712 Cryptographic Signatures** - Military-grade security
- 🌐 **IPFS Decentralized Storage** - Files never lost or censored
- ⛓️ **Multi-chain Support** - Polygon, Base, Ethereum testnets
- 🔄 **Version Tracking** - Update files while maintaining history
- 🔗 **Contract Linking** - Link media to legal agreements

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have:
- **Node.js 18+** - [Download](https://nodejs.org/)
- **Git** - [Download](https://git-scm.com/)
- **MetaMask** (optional) - For testnet interaction

### 1. Clone & Install

```bash
# Clone repository
git clone https://github.com/reyisjones/BChain.git
cd BChain

# Install dependencies
npm install

# Compile smart contracts
npx hardhat compile
```

### 2. Run Tests

```bash
# Run all tests (should see 15 passing ✅)
npx hardhat test

# Run with coverage report
npx hardhat coverage

# Run demo workflow
npx hardhat test test/Demo.ts
```

**Expected output:**
```
✅ 15 passing (2s)
📊 Coverage: 94.29%
```

### 3. Start Local Blockchain

```bash
# Terminal 1: Start local Hardhat node
npx hardhat node

# Terminal 2: Deploy contract
npx hardhat run scripts/deploy/deployMediaRegistry.ts --network localhost
```

**Save the contract address** printed in the console!

### 4. Start API Server

```bash
# Set environment variables
cp .env.example .env
# Edit .env and add:
# CONTRACT_ADDRESS=<address from step 3>

# Start server
cd api
npm run dev
```

Server runs on `http://localhost:3000`

### 5. Test the API

```bash
# Health check
curl http://localhost:3000/health

# Hash a file
curl -X POST http://localhost:3000/assets/hash \
  -F "file=@/path/to/your/file.pdf"

# Upload to IPFS (requires PINATA_JWT in .env)
curl -X POST "http://localhost:3000/assets/hash?uploadToIPFS=true" \
  -F "file=@/path/to/your/file.pdf"
```

### 6. Use CLI Tool

```bash
# Hash a file
node cli hash ./docs/Design.md

# Register asset (requires signature)
node cli register \
  --content-hash 0x... \
  --owner 0xYourAddress \
  --uri ipfs://QmHash \
  --mime-type application/pdf \
  --signature 0x...

# Verify asset
node cli verify --asset-id 0x...
```

## 🎯 Use Cases

### 1. Legal Contract Authentication
- Law firms register executed contracts
- Clients verify contracts haven't been altered
- Timestamped proof for court proceedings

### 2. Digital Media Rights
- Photographers prove original authorship
- Artists protect against copyright infringement
- Content creators establish ownership

### 3. Corporate Documentation
- Companies authenticate official documents
- Auditors verify document integrity
- Compliance departments maintain provenance

### 4. Academic Research
- Researchers timestamp discoveries
- Universities verify thesis submissions
- Journals authenticate published papers

### 5. Supply Chain Verification
- Manufacturers certify product specifications
- Inspectors verify compliance documents
- Consumers validate authenticity certificates

## 🏗️ Architecture

BChain uses a **hybrid architecture** combining blockchain and decentralized storage:

```
┌─────────────────┐
│   User Upload   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────┐
│   API Server    │─────▶│  IPFS/Pinata │ (File Storage)
│   (Fastify)     │      └──────────────┘
└────────┬────────┘
         │ Hash + Signature
         ▼
┌─────────────────┐      ┌──────────────┐
│ Smart Contract  │─────▶│  Blockchain  │ (Hash Storage)
│ (MediaRegistry) │      │ Polygon/Base │
└─────────────────┘      └──────────────┘
```

### Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Smart Contract** | Solidity 0.8.20 | Immutable hash registry |
| **Blockchain** | Polygon, Base, Ethereum | Decentralized ledger |
| **Storage** | IPFS (Pinata) | Decentralized file storage |
| **Backend** | Node.js + Fastify | API endpoints |
| **Testing** | Hardhat + Chai | Contract testing |
| **CI/CD** | GitHub Actions | Automated testing & deployment |
| **Signatures** | EIP-712 | Cryptographic signing |

### Data Flow

1. **Upload**: User uploads file via API or CLI
2. **Hash**: System computes SHA-256 → Keccak256 hash
3. **IPFS**: File uploaded to IPFS, returns CID
4. **Sign**: User signs registration with EIP-712 signature
5. **Register**: Contract stores hash, owner, timestamp on-chain
6. **Verify**: Anyone can download file, recompute hash, compare with blockchain

## 📊 Project Status

✅ **Phase 1: Core Development** (Complete)
- Smart contract with EIP-712 signatures
- Comprehensive test suite (94% coverage)
- CLI tool (hash, register, verify)
- API server with 8 endpoints
- Complete documentation suite

✅ **Phase 2: Infrastructure** (Complete)
- Testnet deployment ready (Mumbai, Base Sepolia, Sepolia)
- IPFS integration via Pinata
- CI/CD pipeline with GitHub Actions
- Automated testing & coverage reporting

⏳ **Phase 3: Production** (Next)
- Mainnet deployment
- Frontend web application
- Advanced monitoring & analytics
- Professional security audit

## 🔐 MediaRegistry Smart Contract

The core of BChain is the `MediaRegistry.sol` smart contract that provides:

### Core Functions

```solidity
// Register new asset with cryptographic signature
function register(
    address owner,
    bytes32 contentHash,
    bytes32 metadataRoot,
    string uri,
    string mimeType,
    bytes signature
) returns (bytes32 assetId)

// Update existing asset (version-controlled)
function update(
    bytes32 assetId,
    bytes32 newContentHash,
    bytes32 newMetadataRoot,
    string newUri,
    bytes signature
)

// Transfer ownership to another address
function transferOwnership(bytes32 assetId, address newOwner)

// Link to external legal contract
function linkContract(bytes32 assetId, bytes32 contractRefHash)

// Retrieve asset details
function getAsset(bytes32 assetId) view returns (Asset)
```

### Events Emitted

- `AssetRegistered` - New asset created
- `AssetUpdated` - Asset modified (version incremented)
- `OwnershipTransferred` - Owner changed
- `ContractLinked` - Legal contract linked

### Security Features

- ✅ **EIP-712 Signatures** - Prevents replay attacks across chains/contracts
- ✅ **Version Control** - Updates require correct version number
- ✅ **Owner-Only Operations** - Access control on sensitive functions
- ✅ **Zero Address Protection** - Prevents invalid ownership
- ✅ **Duplicate Prevention** - Can't register same asset twice

**Asset ID Formula:**
```solidity
assetId = keccak256(abi.encodePacked(contentHash, owner, metadataRoot))
```

## 🌐 API Endpoints

The Fastify-based API server provides RESTful endpoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check with IPFS status |
| POST | `/assets/hash` | Hash file (optionally upload to IPFS) |
| POST | `/assets/register` | Register asset on blockchain |
| POST | `/assets/verify` | Verify file against blockchain |
| GET | `/assets/:assetId` | Get asset details |
| POST | `/ipfs/upload` | Upload file to IPFS |
| GET | `/ipfs/test` | Test IPFS connection |

**Example: Hash and Upload to IPFS**
```bash
curl -X POST "http://localhost:3000/assets/hash?uploadToIPFS=true" \
  -F "file=@contract.pdf"

# Response:
{
  "filename": "contract.pdf",
  "sha256": "0x65cb86d9c906d482...",
  "contentHash": "0x10457300aab24c79...",
  "mimeType": "application/pdf",
  "ipfs": {
    "cid": "QmYwAPJzv5CZsnA6xjKmR9YqKRVA5S7aKXcP7KQr2eR9Nj",
    "url": "https://gateway.pinata.cloud/ipfs/Qm...",
    "uri": "ipfs://QmYwAPJzv5CZsnA6xjKmR9YqKRVA5S7aKXcP7KQr2eR9Nj"
  }
}
```

## 🛠️ CLI Tool

Command-line interface for asset management:

```bash
# Hash a file
node cli hash ./document.pdf

# Register asset (requires EIP-712 signature)
node cli register \
  --content-hash 0xabc123... \
  --owner 0xYourAddress \
  --uri ipfs://QmHash \
  --mime-type application/pdf \
  --signature 0xdef456...

# Verify asset
node cli verify --asset-id 0x789...
```

## 🧪 Testing & Coverage

```bash
# Run all tests
npx hardhat test

# Run with gas reporting
REPORT_GAS=true npx hardhat test

# Generate coverage report
npx hardhat coverage

# Run specific test
npx hardhat test test/MediaRegistry.ts
```

**Current Metrics:**
- ✅ 15 tests passing
- ✅ 94.29% statement coverage
- ✅ 78.13% branch coverage
- ✅ 91.67% function coverage

## 🚢 Deployment

### Local Development
```bash
# Start local blockchain
npx hardhat node

# Deploy contract
npx hardhat run scripts/deploy/deployMediaRegistry.ts --network localhost
```

### Testnet Deployment
```bash
# Check deployer balance
npx hardhat run scripts/checkBalance.ts --network polygonMumbai

# Deploy to Polygon Mumbai
npx hardhat run scripts/deploy/deployMediaRegistry.ts --network polygonMumbai

# Verify on Polygonscan
npx hardhat verify --network polygonMumbai <CONTRACT_ADDRESS>

# Test deployment
CONTRACT_ADDRESS=<address> npx hardhat run scripts/testDeployment.ts --network polygonMumbai
```

See [Deployment Guide](./docs/DEPLOYMENT.md) for detailed instructions.

## 📚 Documentation

- **[Getting Started](./docs/GettingStarted.md)** - Installation and setup
- **[Deployment Guide](./docs/DEPLOYMENT.md)** - Deploy to testnets/mainnet
- **[IPFS Integration](./docs/IPFS_INTEGRATION.md)** - Decentralized storage setup
- **[CI/CD Pipeline](./docs/CI_CD.md)** - Automated testing and deployment
- **[Security Checklist](./docs/SecurityChecklist.md)** - Security best practices
- **[Design Document](./Design.md)** - Architecture and technical design
- **[Roadmap](./docs/Roadmap.md)** - Future features and timeline

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** with conventional commits (`git commit -m 'feat: add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Commit Convention
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `test:` Test additions/changes
- `chore:` Maintenance tasks

### Development Workflow
1. Ensure all tests pass: `npx hardhat test`
2. Check coverage: `npx hardhat coverage` (must be ≥90%)
3. Update documentation if needed
4. Follow code style guidelines

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenZeppelin** - EIP-712 implementation
- **Hardhat** - Development environment
- **Pinata** - IPFS infrastructure
- **ethers.js** - Ethereum library
- **Fastify** - Web framework

## 📧 Contact & Support

- **Issues**: [GitHub Issues](https://github.com/reyisjones/BChain/issues)
- **Discussions**: [GitHub Discussions](https://github.com/reyisjones/BChain/discussions)
- **Repository**: [github.com/reyisjones/BChain](https://github.com/reyisjones/BChain)

---

**Built with ❤️ for a more trustworthy digital world**

MIT (see LICENSE file)

## Contributing
PRs welcome once base contract & tests stabilize. Open issues for design adjustments.

## License
MIT

---
See `Design.md` for full design, hybrid architecture rationale, and future phases.
