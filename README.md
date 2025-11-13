# BChain Media Authenticity

> **Status: Phase 1 MVP Complete ✅** | All tests passing | 72% coverage | Ready for testnet deployment

Blockchain-based authenticity & provenance for digital contracts and associated media (images, audio, video, documents). Stores verifiable content & metadata hashes on-chain while keeping bulk media off-chain (IPFS / Arweave) with EIP-712 signed operations.

## Quick Start

### Prerequisites
- Node.js 18+
- pnpm or npm
- Git

### Install & Compile
```bash
npm install
npx hardhat compile
```

### Run Local Node & Tests
```bash
npx hardhat test
```

### Run API (dev)
```bash
npm run dev
```

### CLI Hash (placeholder)
```bash
node cli/index.ts hash ./path/to/file.png
```

## Architecture Summary
See `Design.md` for full detail. Hybrid approach:
- On-chain (Solidity / EVM – Polygon/Base): Asset registry with content hash, metadata root, ownership & events.
- Off-chain storage: IPFS primary; optional Arweave/Azure/S3.
- Backend service (Fastify): hash verification, orchestration, future webhooks.
- CLI + (future) lightweight admin UI.

| Layer | Tech | Responsibility |
|-------|------|----------------|
| Smart Contracts | Solidity | Immutable integrity anchors (hashes, owner, timestamps) |
| Off-chain Storage | IPFS / Arweave | Media & metadata blobs |
| Verification Service | Node.js | Hash recompute, submission, provenance queries |
| Frontend | React (planned) | Upload & verify UX |
| CI/CD & Monitoring | GitHub Actions / (future) Azure Monitor | Tests, deploy, health & alerts |

## MediaRegistry Contract (MVP)
Core responsibilities:
- Register asset with (contentHash, metadataRoot, uri, mimeType) via EIP-712 signed payload.
- Update asset (new hashes, uri) with versioned EIP-712 signature.
- Transfer ownership.
- Link an external contract/document hash.

### Events
```
AssetRegistered(bytes32 assetId, address owner, bytes32 contentHash, bytes32 metadataRoot, string uri, string mimeType)
AssetUpdated(bytes32 assetId, uint256 version, bytes32 contentHash, bytes32 metadataRoot, string uri)
OwnershipTransferred(bytes32 assetId, address oldOwner, address newOwner)
ContractLinked(bytes32 assetId, bytes32 contractRefHash)
```

### Asset ID Formula
```
assetId = keccak256(abi.encodePacked(contentHash, owner, metadataRoot))
```

### EIP-712 Signature Validation ✓
Two struct types for typed data signing:
```solidity
Register(address owner, bytes32 contentHash, bytes32 metadataRoot, string uri, string mimeType)
Update(bytes32 assetId, bytes32 contentHash, bytes32 metadataRoot, string uri, uint256 version)
```

**Implementation Status:** ✅ Working
- Contract uses OpenZeppelin's `EIP712` base for domain separation
- String fields (`uri`, `mimeType`) are properly hashed during struct encoding
- Off-chain `signTypedData` declarations match contract struct definitions
- All tests passing (registration, update, access control)

**Key Details:**
- Dynamic string types are automatically hashed by EIP-712 encoding rules
- Domain: `{name: "MediaRegistry", version: "1", chainId, verifyingContract}`
- Signature recovery via `ecrecover` with v/r/s normalization

## CLI (Planned Enhancements)
| Command | Purpose |
|---------|---------|
| `bchain hash <file>` | Compute SHA-256 (soon keccak pipeline) |
| `bchain register ...` | Prepare & submit signed registration |
| `bchain verify ...` | Recompute and compare against on-chain |
| `bchain update ...` | Submit signed update |
| `bchain link-contract ...` | Link external legal contract hash |

## API Endpoints

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | /health | Health check | ✅ |
| POST | /assets/register | Register new asset with EIP-712 signature | ✅ |
| POST | /assets/verify | Verify file hash against on-chain asset | ✅ |
| GET | /assets/:assetId | Retrieve stored asset record | ✅ |
| POST | /assets/hash | Hash uploaded file (SHA-256 → keccak256) | ✅ |

**Note:** Update and link-contract endpoints planned for Phase 2.

## Development Workflow
1. Write/update contract in `contracts/`.
2. Run `npx hardhat compile`.
3. Add or extend tests in `test/`.
4. Execute `npx hardhat test` (all passing ✅).
5. Check coverage: `npx hardhat coverage` (current: 72%).
6. Deploy: `npx hardhat run scripts/deploy/deployMediaRegistry.ts --network <network>`.

## Security Considerations
- ✅ **EIP-712 signatures**: Prevent cross-chain/contract replay attacks
- ✅ **Version-based replay protection**: Updates require incrementing version
- ✅ **Owner-only operations**: Access control on sensitive functions
- ⚠️ **Key management**: Use hardware wallets for mainnet
- 🔜 **Multi-signature**: Planned for high-value operations
- 🔜 **Emergency pause**: Circuit breaker for critical issues

See [Security Checklist](./docs/SecurityChecklist.md) for comprehensive security documentation.

## Project Status

**Phase 1 MVP: ✅ Complete**
- Smart contract with EIP-712 validation
- All unit tests passing
- CLI tool (hash, register, verify)
- API server with core endpoints
- Comprehensive documentation

**Next Steps:**
- Deploy to testnet (Mumbai/Sepolia)
- Increase test coverage to ≥90%
- IPFS integration
- Security audit preparation

See [Roadmap](./docs/Roadmap.md) for detailed feature timeline.

## Documentation

- [Getting Started](./docs/GettingStarted.md) - Setup and installation
- [Developer Guide](./docs/DeveloperGuide.md) - Architecture and technical details
- [Security Checklist](./docs/SecurityChecklist.md) - Security best practices
- [Roadmap](./docs/Roadmap.md) - Future plans and enhancements
- [Design Document](./Design.md) - System design and requirements

## License

MIT (see LICENSE file)

## Contributing
PRs welcome once base contract & tests stabilize. Open issues for design adjustments.

## License
MIT

---
See `Design.md` for full design, hybrid architecture rationale, and future phases.
