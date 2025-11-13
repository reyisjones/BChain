# Blockchain Contract & Media Authenticity System

> Design, implement, and document an end‑to‑end blockchain-based authenticity and provenance system for digital contracts and associated media assets (images, video, audio, PDFs, other documents). Provides on-chain integrity anchors, off-chain storage, verifiable metadata, and developer/user workflows.

## Table of Contents
1. [Goal](#goal)
2. [Scope & Non-Goals](#scope--non-goals)
3. [Primary Stack Choice](#primary-stack-choice)
4. [High-Level Architecture](#high-level-architecture)
5. [Workflow (Happy Path)](#workflow-happy-path)
6. [Data Model (On-Chain)](#data-model-on-chain)
7. [Cryptographic & Hash Strategy](#cryptographic--hash-strategy)
8. [Security & Threat Model](#security--threat-model)
9. [Verification Proofs](#verification-proofs)
10. [Environments & Migration](#environments--migration)
11. [Implementation Phases](#implementation-phases)
12. [API Surface (Initial)](#api-surface-initial)
13. [CLI Commands](#cli-commands)
14. [Testing Strategy](#testing-strategy)
15. [Monitoring & Observability (Future)](#monitoring--observability-future)
16. [Acceptance Criteria](#acceptance-criteria)
17. [Stretch Goals](#stretch-goals)
18. [Assumptions](#assumptions)
19. [Prompt Usage Examples](#prompt-usage-examples)

## Goal
Design, implement, and document a blockchain-based authenticity and provenance system for digital contracts and associated media assets. Ensure reliable integrity anchoring, verifiable hashes, and clear developer/user tooling.

## Scope & Non-Goals
**In-scope:**
- Asset registration & updates
- Hash storage & verification (content + metadata)
- EIP‑712 signature verification
- Ownership transfer & contract linkage
- API, CLI, minimal admin UI
- Documentation & security model

**Out-of-scope (initial):**
- Full NFT marketplace features
- Complex royalty/payment rails
- Advanced zero-knowledge proofs (beyond Merkle) in Phase 1
- Large-scale streaming optimizations

## Primary Stack Choice
Default: **EVM + Solidity + TypeScript/Node.js** (Hardhat + ethers.js).
- Mature ecosystem, wallet compatibility, tooling richness.
Optional future additions: Foundry tests; alternative stacks (Solana/Anchor, Hyperledger Fabric) documented but not implemented initially.

## High-Level Architecture
**On-Chain (MediaRegistry)** stores:
- `assetId` (keccak) – deterministic identifier
- `contentHash` (Keccak-256 or Keccak(SHA-256))
- `uri` pointer (IPFS / Arweave / Azure Blob / S3)
- `mimeType`
- `metadataRoot` (Merkle root or keccak of canonical JSON Phase 1)
- `contractRefHash` (optional legal doc hash)
- `owner`, `registeredAt`, `updatedAt`, `version`
- EIP-712 domain separator for typed data

**Off-Chain Services:**
- API (Fastify/Express) for orchestration & provenance graph assembly
- Storage abstraction: IPFS primary + pluggable Azure Blob / S3 fallback
- Database (SQLite dev → PostgreSQL prod) for indexing/audit/webhook state
- Optional queue (Redis/RabbitMQ) for async verification jobs (Phase 2)

**Clients:** CLI & minimal admin UI

**External Integrations:** Webhooks/events for DMS/DAM/CI; optional REST/GraphQL integrations.

## Suggested Hybrid Architecture (Recommended Approach)

For this use case, a hybrid EVM-based design balances decentralization, cost, and enterprise integration.

| Layer                          | Technology                     | Purpose                                                     |
| ------------------------------ | ------------------------------ | ----------------------------------------------------------- |
| **Smart Contracts (On-chain)** | Solidity on Polygon / Base     | Store hashes, ownership, and timestamps                     |
| **Off-chain Storage**          | IPFS + Arweave                 | Store actual files/media and metadata                       |
| **Verification Service**       | Node.js / Python API           | Compute & compare file hashes; handle user auth             |
| **Frontend**                   | React + ethers.js              | Uploading, browsing & verifying assets                      |
| **CI/CD + Monitoring**         | GitHub Actions + Azure Monitor | Automated deployments & health checks                       |

### Why This Hybrid Works
1. Keeps blockchain footprint minimal (only proofs/hashes on-chain) → lower gas & higher scalability.
2. Easy integration with existing cloud / enterprise workflows.
3. Supports compliance (e.g., GDPR) since raw files remain off-chain & can be access-controlled.
4. Leveraging Polygon/Base reduces cost while retaining EVM tooling maturity.

### Comparative Criteria
| Criteria                        | Best Option            | Rationale                                  |
| ------------------------------- | ---------------------- | ------------------------------------------ |
| **Developer familiarity**       | **EVM + Solidity**     | Large ecosystem & accessible tooling       |
| **Enterprise control**          | **Hyperledger Fabric** | Fine-grained governance & private channels |
| **Performance**                 | **Solana**             | High throughput & low latency               |
| **Sustainability / cost**       | **Algorand / Polygon** | Low fees & eco-friendly consensus           |
| **Decentralized media storage** | **IPFS + Arweave**     | Content-addressed & tamper-resistant        |

> Decision: Proceed with EVM + Solidity + IPFS/Arweave hybrid unless strict permissioning or Solana-specific performance drivers emerge.

## Workflow (Happy Path)
1. User prepares media + optional contract PDF
2. CLI/API computes normalized content hash (streaming for large files)
3. Metadata JSON canonicalized & hashed → `metadataRoot`
4. EIP-712 typed data (AssetRegistration) constructed
5. User signs off-chain (wallet/private key)
6. Tx `registerAsset(signature, data...)` verifies signer & stores record
7. Off-chain service pins asset (IPFS) and emits `asset.registered` webhook
8. Verification: recompute local hash & compare with on-chain record

## Data Model (On-Chain)
```solidity
struct Asset {
	address owner;               // current owner
	bytes32 assetId;             // keccak(contentHash, owner, metadataRoot)
	bytes32 contentHash;         // canonical content hash
	bytes32 metadataRoot;        // Merkle root or keccak(JSON)
	bytes32 contractRefHash;     // optional linked contract/document
	string  uri;                 // IPFS CID / HTTPS pointer
	string  mimeType;            // MIME type of asset
	uint256 registeredAt;        // timestamp of initial registration
	uint256 updatedAt;           // last update timestamp
	uint256 version;             // incremented on updates
}

event AssetRegistered(bytes32 indexed assetId, address indexed owner);
event AssetUpdated(bytes32 indexed assetId, uint256 version);
event OwnershipTransferred(bytes32 indexed assetId, address indexed oldOwner, address indexed newOwner);
event ContractLinked(bytes32 indexed assetId, bytes32 contractRefHash);
```

**Off-chain Index Row:** Mirrors on-chain fields + signature, `blockNumber`, `txHash`, status, provenance chain pointer.

## Cryptographic & Hash Strategy
- File hashing: **SHA-256** (broad support) → Optionally re-hash with Keccak for on-chain uniformity
- Canonical pipeline (example): `sha256(fileBytes)` → hex → `keccak256(hexBytes)`
- Metadata root: Phase 1 simple `keccak256(canonicalJSONString)`; Phase 2 per-field Merkle tree
- Signatures: EIP-712 typed structs `AssetRegistration`, `AssetUpdate`
- Time-stamping: Block timestamp + optional off-chain RFC3339 & planned OpenTimestamps integration

## Security & Threat Model
**Threats:**
- Replay of old signatures → mitigate with `version`/nonce
- Off-chain tampering → periodic re-hash & pin validation
- Key compromise → ownership rotation / future multisig
- URI poisoning → hash + URI synergy; mismatch alert
- Malicious metadata → canonicalization, size limits, sanitation

**Controls:**
- Owner-only mutability (plus approved delegate pattern future)
- Role-based API (JWT/OAuth) for admin endpoints
- Append-only audit log (future externalization)
- Least privilege key separation (hot update key vs cold transfer key)

## Verification Proofs
- Direct content hash equality
- EIP-712 signature recovery matches owner
- (Phase 2) Merkle proofs for metadata subset
- Version chain linking previous state hash
- External timestamp attestation (future)

## Environments & Migration
- **Dev:** Hardhat local chain + SQLite
- **Test:** Ephemeral Hardhat/Anvil in CI
- **Staging:** Testnet (Polygon Mumbai / Base Sepolia) + pinned IPFS
- **Prod:** Mainnet or production L2
**Deployment Pipeline:** `scripts/deploy/*.ts`, env-configured networks; later UUPS proxy upgrade scripts.

## Implementation Phases
**Phase 1 (MVP):** Contract, register/update/verify, CLI+API, docs, ≥70% test coverage
**Phase 2:** Merkle metadata proofs, delegation/multisig, monitoring, ≥90% coverage
**Phase 3:** Provenance visualization, SLA dashboards, batch registration optimizations

## API Surface (Initial)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | /assets/register | Register new asset |
| POST | /assets/verify | Verify content & metadata |
| GET  | /assets/{assetId} | Retrieve asset record |
| POST | /assets/{assetId}/update | Update asset content/metadata |
| POST | /assets/{assetId}/link-contract | Link legal contract hash |

**Webhooks:** `asset.registered`, `asset.updated`, `asset.alert.hashMismatch`

**GraphQL (Phase 2):** `asset(id)`, `assets(filter)`, `verifyAsset(hash)`, `provenanceChain(id)`

## CLI Commands
```bash
bchain hash <file>
bchain register --file <path> --mime <type> --metadata <jsonfile>
bchain verify --asset <assetId> --file <path>
bchain update --asset <assetId> --file <newpath>
bchain link-contract --asset <assetId> --contract-file <pdf>
```

## Testing Strategy
- Solidity unit tests: registration, updates, signature recovery, access control reverts
- Integration: API register → on-chain verify → local re-hash
- Property/fuzz (Phase 2): uniqueness & collision resistance of `assetId`
- Coverage target: ≥90% lines & branches (Phase 2) via `solidity-coverage`

## Monitoring & Observability (Future)
- Hash drift scheduled jobs (re-pin & re-hash)
- Alerts (Slack/Teams) on mismatch/pinning failures
- Metrics: `totalAssets`, `updateCount`, `verificationFailures`

## Acceptance Criteria
- End-to-end demo (register + verify via CLI & API)
- On-chain storage of `contentHash` & `metadataRoot` with events
- EIP-712 signature enforcement
- Passing integration suite & targeted coverage goals
- Repeatable deployments (scripts + env configs)
- Comprehensive docs (Getting Started, Developer Guide, Process Integration, Security Checklist)

## Stretch Goals
- Batch registration & Merkle batching
- ZK proof integration for confidential fields
- DAM webhook transformer
- Third-party auditor signed attestations

## Assumptions
- User has wallet (MetaMask or private key for CLI)
- IPFS node or pinning service available
- Files fit memory (streaming optimization later)

## Prompt Usage Examples
> Use these when interacting with an AI assistant or codegen tool.

1. "Generate AssetRegistration EIP-712 struct and hashing function."
2. "Draft Foundry tests for asset update authorization."
3. "Create CLI command to compute file SHA-256 and produce keccak pipeline."

---
_End of design document._