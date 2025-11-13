# Developer Guide

## Architecture Overview

The BChain Media Authenticity system uses a hybrid architecture combining on-chain integrity anchors with off-chain storage.

### Components

```
┌─────────────────┐
│   Users/Apps    │
└────────┬────────┘
         │
    ┌────┴─────┬─────────────┐
    │          │             │
┌───▼───┐  ┌──▼──┐     ┌────▼────┐
│  CLI  │  │ API │     │  React  │
└───┬───┘  └──┬──┘     │   UI    │
    │         │        └────┬────┘
    └────┬────┘             │
         │                  │
    ┌────▼──────────────────▼────┐
    │   MediaRegistry Contract   │
    │   (Polygon/Base/Ethereum)  │
    └────┬──────────────────┬────┘
         │                  │
    ┌────▼────┐        ┌────▼────┐
    │  IPFS   │        │ Arweave │
    └─────────┘        └─────────┘
```

### Data Flow

#### Registration Flow

1. **User** uploads file via CLI/API/UI
2. **Client** computes SHA-256 of file bytes
3. **Client** wraps SHA-256 in keccak256 → `contentHash`
4. **Client** creates metadata JSON → keccak256 → `metadataRoot`
5. **Client** uploads file to IPFS → gets CID → `uri`
6. **Client** signs EIP-712 typed data:
   ```typescript
   {
     owner: address,
     contentHash: bytes32,
     metadataRoot: bytes32,
     uri: string,
     mimeType: string
   }
   ```
7. **Contract** verifies signature via `ecrecover`
8. **Contract** stores asset with `assetId = keccak256(contentHash || owner || metadataRoot)`
9. **Contract** emits `AssetRegistered` event

#### Verification Flow

1. **User** provides file + `assetId`
2. **Client** recomputes `contentHash` from file
3. **Client** calls `getAsset(assetId)` on contract
4. **Client** compares computed hash with on-chain `contentHash`
5. **Client** optionally fetches file from IPFS via `uri` and re-verifies

#### Update Flow

1. **Owner** creates new version of asset
2. **Owner** signs EIP-712 Update struct with `version = currentVersion + 1`
3. **Contract** verifies signature and version
4. **Contract** updates asset fields, increments version
5. **Contract** emits `AssetUpdated` event

## Smart Contract Details

### MediaRegistry.sol

**State Variables:**
- `mapping(bytes32 => Asset) private assets` - Asset storage by ID
- EIP-712 domain separator (via OpenZeppelin EIP712)

**Core Functions:**

```solidity
function register(
  address owner,
  bytes32 contentHash,
  bytes32 metadataRoot,
  string calldata uri,
  string calldata mimeType,
  bytes calldata signature
) external returns (bytes32 assetId)
```

```solidity
function update(
  bytes32 assetId,
  bytes32 newContentHash,
  bytes32 newMetadataRoot,
  string calldata newUri,
  bytes calldata signature
) external onlyOwner(assetId)
```

```solidity
function transferOwnership(
  bytes32 assetId,
  address newOwner
) external onlyOwner(assetId)
```

```solidity
function getAsset(
  bytes32 assetId
) external view returns (Asset memory)
```

### Asset Structure

```solidity
struct Asset {
  address owner;
  bytes32 assetId;
  bytes32 contentHash;      // keccak256(sha256(fileBytes))
  bytes32 metadataRoot;     // keccak256(metadata JSON)
  bytes32 contractRefHash;  // optional linked legal contract
  string uri;               // IPFS CID or storage pointer
  string mimeType;
  uint256 registeredAt;
  uint256 updatedAt;
  uint256 version;
}
```

## EIP-712 Implementation

### Domain

```typescript
{
  name: "MediaRegistry",
  version: "1",
  chainId: <network chain ID>,
  verifyingContract: <contract address>
}
```

### Types

**Register:**
```solidity
Register(
  address owner,
  bytes32 contentHash,
  bytes32 metadataRoot,
  string uri,
  string mimeType
)
```

**Update:**
```solidity
Update(
  bytes32 assetId,
  bytes32 contentHash,
  bytes32 metadataRoot,
  string uri,
  uint256 version
)
```

### Signing (TypeScript)

```typescript
const domain = {
  name: 'MediaRegistry',
  version: '1',
  chainId: await provider.getNetwork().chainId,
  verifyingContract: contractAddress
};

const types = {
  Register: [
    { name: 'owner', type: 'address' },
    { name: 'contentHash', type: 'bytes32' },
    { name: 'metadataRoot', type: 'bytes32' },
    { name: 'uri', type: 'string' },
    { name: 'mimeType', type: 'string' }
  ]
};

const value = {
  owner: signer.address,
  contentHash: '0x...',
  metadataRoot: '0x...',
  uri: 'ipfs://...',
  mimeType: 'image/png'
};

const signature = await signer.signTypedData(domain, types, value);
```

## Testing Strategy

### Unit Tests

Located in `test/MediaRegistry.ts`:

- ✅ Register asset with valid signature
- ✅ Update asset with version bump
- ✅ Reject update from non-owner
- 🔜 Transfer ownership
- 🔜 Link contract hash
- 🔜 Replay attack prevention

### Coverage Target

Current: ~72% | Target: ≥90%

Run coverage:
```bash
npx hardhat coverage
```

### Integration Tests (Planned)

- E2E registration flow with IPFS upload
- Multi-version update sequence
- Cross-contract verification

## API Reference

See [Getting Started](./GettingStarted.md#api-usage-examples) for endpoints.

## CLI Reference

See [Getting Started](./GettingStarted.md#6-use-cli) for commands.

## Security Considerations

See [Security Checklist](./SecurityChecklist.md).

## Future Enhancements

- **Merkle Proofs**: Embed metadata merkle root for selective disclosure
- **Batch Operations**: Register multiple assets in single transaction
- **Provenance Graph**: Link assets to show derivation chain
- **Event Indexing**: Subgraph for efficient querying
- **Multi-signature**: Require multiple approvers for registration
- **Time-locks**: Delay updates to prevent rapid manipulation
