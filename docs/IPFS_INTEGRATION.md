# 📦 IPFS Integration Guide

## Overview

BChain uses **Pinata** for IPFS storage, providing decentralized, permanent storage for media files and metadata while keeping content hashes on-chain for verification.

## Why IPFS?

- **Decentralized**: No single point of failure
- **Content-Addressed**: Files referenced by cryptographic hash (CID)
- **Immutable**: Content cannot be changed without changing the CID
- **Permanent**: Files remain accessible as long as pinned
- **Cost-Effective**: Store large media off-chain, only hashes on-chain

## Architecture

```
User uploads file → API hashes file → Uploads to IPFS → Returns CID
                                                              ↓
                                         User signs EIP-712 with ipfs://CID as URI
                                                              ↓
                                         Smart contract stores contentHash + URI
```

## Setup

### 1. Get Pinata API Key

1. Sign up at [Pinata](https://app.pinata.cloud/)
2. Navigate to **Developers** → **API Keys**
3. Click **New Key**
4. Give permissions: `pinFileToIPFS`, `pinJSONToIPFS`
5. Copy the **JWT** (not API Key/Secret)

### 2. Configure Environment

Add to `.env`:

```bash
PINATA_JWT=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your_jwt_here
```

### 3. Test Connection

```bash
# Start API server
cd api
npm run dev

# Test IPFS connection
curl http://localhost:3000/ipfs/test
```

**Expected Response:**
```json
{
  "configured": true,
  "connected": true,
  "message": "IPFS service operational"
}
```

## API Endpoints

### 1. Upload File to IPFS

**POST** `/ipfs/upload`

Upload a file directly to IPFS and get the CID.

**Request:**
```bash
curl -X POST \
  http://localhost:3000/ipfs/upload \
  -F "file=@/path/to/document.pdf"
```

**Response:**
```json
{
  "success": true,
  "filename": "document.pdf",
  "mimeType": "application/pdf",
  "size": 123456,
  "sha256": "0x65cb86d9c906d482...",
  "contentHash": "0x10457300aab24c79...",
  "ipfs": {
    "cid": "QmYwAPJzv5CZsnA6xjKmR9YqKRVA5S7aKXcP7KQr2eR9Nj",
    "url": "https://gateway.pinata.cloud/ipfs/QmYwAPJzv5CZsnA6xjKmR9YqKRVA5S7aKXcP7KQr2eR9Nj",
    "uri": "ipfs://QmYwAPJzv5CZsnA6xjKmR9YqKRVA5S7aKXcP7KQr2eR9Nj"
  }
}
```

### 2. Hash File (with Optional IPFS Upload)

**POST** `/assets/hash?uploadToIPFS=true`

Compute file hash and optionally upload to IPFS in one request.

**Request:**
```bash
curl -X POST \
  "http://localhost:3000/assets/hash?uploadToIPFS=true" \
  -F "file=@/path/to/image.png"
```

**Response:**
```json
{
  "filename": "image.png",
  "sha256": "0x65cb86d9c906d482...",
  "contentHash": "0x10457300aab24c79...",
  "mimeType": "image/png",
  "ipfs": {
    "cid": "QmHash123...",
    "url": "https://gateway.pinata.cloud/ipfs/QmHash123...",
    "uri": "ipfs://QmHash123..."
  }
}
```

### 3. Test IPFS Configuration

**GET** `/ipfs/test`

Check if IPFS is configured and connection is working.

**Request:**
```bash
curl http://localhost:3000/ipfs/test
```

**Response:**
```json
{
  "configured": true,
  "connected": true,
  "message": "IPFS service operational"
}
```

## Complete Workflow Example

### Upload → Register → Verify

```bash
# Step 1: Upload file to IPFS
curl -X POST http://localhost:3000/ipfs/upload \
  -F "file=@contract.pdf" > upload_result.json

# Extract values
CID=$(jq -r '.ipfs.cid' upload_result.json)
CONTENT_HASH=$(jq -r '.contentHash' upload_result.json)
MIME_TYPE=$(jq -r '.mimeType' upload_result.json)

echo "CID: $CID"
echo "Content Hash: $CONTENT_HASH"
echo "URI: ipfs://$CID"

# Step 2: Sign registration (use CLI or custom script)
# This requires EIP-712 signature with:
# - owner address
# - contentHash (from upload)
# - metadataRoot (hash of metadata JSON)
# - uri (ipfs://$CID)
# - mimeType

# Step 3: Register on blockchain
curl -X POST http://localhost:3000/assets/register \
  -H "Content-Type: application/json" \
  -d "{
    \"owner\": \"0xYourAddress\",
    \"contentHash\": \"$CONTENT_HASH\",
    \"metadataRoot\": \"0xMetadataHash\",
    \"uri\": \"ipfs://$CID\",
    \"mimeType\": \"$MIME_TYPE\",
    \"signature\": \"0xYourEIP712Signature\"
  }"

# Step 4: Verify anytime by fetching from IPFS and comparing hash
wget https://gateway.pinata.cloud/ipfs/$CID -O downloaded.pdf
sha256sum downloaded.pdf
# Compare with on-chain contentHash
```

## IPFS Gateways

### Public Gateways

- **Pinata**: `https://gateway.pinata.cloud/ipfs/<CID>`
- **IPFS.io**: `https://ipfs.io/ipfs/<CID>`
- **Cloudflare**: `https://cloudflare-ipfs.com/ipfs/<CID>`
- **Infura**: `https://ipfs.infura.io/ipfs/<CID>`

### Private Gateway (Recommended for Production)

Pinata offers **Dedicated Gateways** for better performance:
- Faster loading
- Custom domain (e.g., `media.yourdomain.com`)
- Access control
- Analytics

## Best Practices

### 1. Metadata Structure

Store rich metadata as JSON on IPFS:

```json
{
  "name": "Legal Contract - Acme Corp Agreement",
  "description": "Service agreement between Acme Corp and Client",
  "contentType": "application/pdf",
  "createdAt": "2024-01-15T10:30:00Z",
  "creator": "0xCreatorAddress",
  "tags": ["contract", "legal", "acme"],
  "version": "1.0",
  "relatedAssets": ["ipfs://QmRelated1", "ipfs://QmRelated2"]
}
```

Upload metadata to IPFS and use its CID as `metadataRoot`.

### 2. Pin Important Files

Files uploaded via Pinata are automatically pinned (won't be garbage collected).

**Check pin status:**
```bash
curl "https://api.pinata.cloud/data/pinList?status=pinned" \
  -H "Authorization: Bearer $PINATA_JWT"
```

### 3. Backup Strategy

- **Primary**: Pinata (main pinning service)
- **Secondary**: Pin to own IPFS node or second service (Infura, Web3.Storage)
- **Archive**: Backup to Arweave for permanent storage

### 4. Large Files

For files >100MB:
- Consider chunking
- Use Pinata's stream upload
- Or use `pinata-web3` SDK for advanced features

## CLI Integration

Update CLI to support IPFS:

```typescript
// cli/index.ts
program
  .command('upload')
  .description('Upload file to IPFS and get CID')
  .argument('<file>', 'File to upload')
  .action(async (file) => {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(file));
    
    const res = await fetch('http://localhost:3000/ipfs/upload', {
      method: 'POST',
      body: formData
    });
    
    const data = await res.json();
    console.log('IPFS CID:', data.ipfs.cid);
    console.log('URI:', data.ipfs.uri);
    console.log('Gateway URL:', data.ipfs.url);
  });
```

## Troubleshooting

### Error: IPFS not configured

**Cause:** `PINATA_JWT` not set in `.env`

**Solution:**
```bash
echo "PINATA_JWT=your_jwt_here" >> .env
```

### Error: Failed to authenticate with Pinata

**Cause:** Invalid or expired JWT

**Solution:**
1. Go to Pinata dashboard
2. Regenerate API key
3. Update `.env` with new JWT

### Error: Upload failed (413 Payload Too Large)

**Cause:** File exceeds size limit

**Solution:**
- Pinata free tier: 100MB per file
- Upgrade to paid plan for larger files
- Or compress file before upload

### Slow Gateway Loading

**Cause:** Public gateways can be slow

**Solution:**
- Use Pinata dedicated gateway
- Or cache frequently accessed files on CDN

## Advanced: Arweave for Permanent Storage

For truly permanent storage (pay once, store forever):

```bash
npm install @irys/sdk

# Upload to Arweave via Irys
import Irys from '@irys/sdk';

const irys = new Irys({
  url: "https://node2.irys.xyz",
  token: "matic",
  key: process.env.DEPLOYER_KEY
});

const receipt = await irys.uploadFile(filePath);
console.log('Arweave TX:', receipt.id);
console.log('URL:', `https://arweave.net/${receipt.id}`);
```

## Resources

- [Pinata Docs](https://docs.pinata.cloud/)
- [IPFS Docs](https://docs.ipfs.tech/)
- [CID Inspector](https://cid.ipfs.tech/)
- [IPFS Desktop](https://github.com/ipfs/ipfs-desktop) - Run own node
- [Arweave](https://www.arweave.org/) - Permanent storage

---

**Next:** [CI/CD Setup](./CI_CD.md) | [Security Checklist](./SecurityChecklist.md)
