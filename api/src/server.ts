import Fastify from 'fastify';
import dotenv from 'dotenv';
import { ethers } from 'ethers';
import { createHash } from 'crypto';
import multipart from '@fastify/multipart';

dotenv.config();

const fastify = Fastify({ logger: true });
fastify.register(multipart);

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'http://localhost:8545');
const contractAddress = process.env.CONTRACT_ADDRESS;

const abi = [
  'function register(address owner, bytes32 contentHash, bytes32 metadataRoot, string uri, string mimeType, bytes signature) returns (bytes32)',
  'function getAsset(bytes32 assetId) view returns (tuple(address owner, bytes32 assetId, bytes32 contentHash, bytes32 metadataRoot, bytes32 contractRefHash, string uri, string mimeType, uint256 registeredAt, uint256 updatedAt, uint256 version))',
  'function update(bytes32 assetId, bytes32 newContentHash, bytes32 newMetadataRoot, string newUri, bytes signature)',
  'function domainSeparator() view returns (bytes32)'
];

fastify.get('/health', async () => ({ status: 'ok', contract: contractAddress }));

// Register asset endpoint
fastify.post<{
  Body: {
    owner: string;
    contentHash: string;
    metadataRoot: string;
    uri: string;
    mimeType: string;
    signature: string;
  };
}>('/assets/register', async (request, reply) => {
  try {
    if (!contractAddress) {
      return reply.code(500).send({ error: 'CONTRACT_ADDRESS not configured' });
    }

    const { owner, contentHash, metadataRoot, uri, mimeType, signature } = request.body;

    const signer = new ethers.Wallet(process.env.DEPLOYER_KEY || '', provider);
    const registry = new ethers.Contract(contractAddress, abi, signer);

    const tx = await registry.register(owner, contentHash, metadataRoot, uri, mimeType, signature);
    const receipt = await tx.wait();

    const assetId = ethers.keccak256(ethers.concat([contentHash, owner, metadataRoot]));

    return {
      success: true,
      assetId,
      txHash: tx.hash,
      blockNumber: receipt.blockNumber
    };
  } catch (err: any) {
    request.log.error(err);
    return reply.code(400).send({ error: err.message });
  }
});

// Verify asset endpoint
fastify.post<{
  Body: {
    assetId: string;
    fileHash?: string;
  };
}>('/assets/verify', async (request, reply) => {
  try {
    if (!contractAddress) {
      return reply.code(500).send({ error: 'CONTRACT_ADDRESS not configured' });
    }

    const { assetId, fileHash } = request.body;
    const registry = new ethers.Contract(contractAddress, abi, provider);

    const asset = await registry.getAsset(assetId);

    const response: any = {
      assetId,
      owner: asset.owner,
      contentHash: asset.contentHash,
      metadataRoot: asset.metadataRoot,
      uri: asset.uri,
      mimeType: asset.mimeType,
      version: asset.version.toString(),
      registeredAt: new Date(Number(asset.registeredAt) * 1000).toISOString(),
      updatedAt: new Date(Number(asset.updatedAt) * 1000).toISOString()
    };

    if (fileHash) {
      response.match = asset.contentHash === fileHash;
    }

    return response;
  } catch (err: any) {
    request.log.error(err);
    return reply.code(404).send({ error: err.message });
  }
});

// Get asset by ID
fastify.get<{
  Params: { assetId: string };
}>('/assets/:assetId', async (request, reply) => {
  try {
    if (!contractAddress) {
      return reply.code(500).send({ error: 'CONTRACT_ADDRESS not configured' });
    }

    const { assetId } = request.params;
    const registry = new ethers.Contract(contractAddress, abi, provider);
    const asset = await registry.getAsset(assetId);

    return {
      assetId,
      owner: asset.owner,
      contentHash: asset.contentHash,
      metadataRoot: asset.metadataRoot,
      contractRefHash: asset.contractRefHash,
      uri: asset.uri,
      mimeType: asset.mimeType,
      version: asset.version.toString(),
      registeredAt: new Date(Number(asset.registeredAt) * 1000).toISOString(),
      updatedAt: new Date(Number(asset.updatedAt) * 1000).toISOString()
    };
  } catch (err: any) {
    request.log.error(err);
    return reply.code(404).send({ error: 'Asset not found' });
  }
});

// Hash file upload endpoint
fastify.post('/assets/hash', async (request, reply) => {
  try {
    const data = await request.file();
    if (!data) {
      return reply.code(400).send({ error: 'No file uploaded' });
    }

    const buffer = await data.toBuffer();
    const sha256 = createHash('sha256').update(buffer).digest('hex');
    const contentHash = ethers.keccak256('0x' + sha256);

    return {
      filename: data.filename,
      sha256: '0x' + sha256,
      contentHash
    };
  } catch (err: any) {
    request.log.error(err);
    return reply.code(400).send({ error: err.message });
  }
});

const port = Number(process.env.PORT || 3000);
fastify.listen({ port, host: '0.0.0.0' }).then(() => {
  fastify.log.info(`API listening on :${port}`);
});
