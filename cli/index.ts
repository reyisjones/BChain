#!/usr/bin/env node
import { Command } from 'commander';
import { createHash } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { ethers } from 'ethers';
import * as dotenv from 'dotenv';

dotenv.config();

const program = new Command();
program
  .name('bchain')
  .description('Blockchain media authenticity CLI')
  .version('0.1.0');

program
  .command('hash')
  .argument('<file>', 'file to hash')
  .description('Compute SHA-256 then keccak256 pipeline hash')
  .action((file) => {
    const p = path.resolve(process.cwd(), file);
    const buf = fs.readFileSync(p);
    const sha256 = createHash('sha256').update(buf).digest('hex');
    const contentHash = ethers.keccak256('0x' + sha256);
    console.log(JSON.stringify({ 
      file: p, 
      sha256: '0x' + sha256, 
      contentHash 
    }, null, 2));
  });

program
  .command('register')
  .argument('<file>', 'file to register')
  .requiredOption('--uri <uri>', 'Storage URI (e.g., ipfs://...)')
  .requiredOption('--mime <type>', 'MIME type (e.g., image/png)')
  .option('--metadata <json>', 'Metadata JSON string', '{}')
  .option('--rpc <url>', 'RPC endpoint', process.env.RPC_URL || 'http://localhost:8545')
  .option('--contract <address>', 'Contract address', process.env.CONTRACT_ADDRESS)
  .option('--key <private>', 'Private key', process.env.DEPLOYER_KEY)
  .description('Register asset on-chain with EIP-712 signature')
  .action(async (file, options) => {
    try {
      const p = path.resolve(process.cwd(), file);
      const buf = fs.readFileSync(p);
      const sha256 = createHash('sha256').update(buf).digest('hex');
      const contentHash = ethers.keccak256('0x' + sha256);
      const metadataRoot = ethers.keccak256(ethers.toUtf8Bytes(options.metadata));
      
      if (!options.contract) throw new Error('--contract address required');
      if (!options.key) throw new Error('--key (private key) required');

      const provider = new ethers.JsonRpcProvider(options.rpc);
      const signer = new ethers.Wallet(options.key, provider);
      
      const abi = [
        'function register(address owner, bytes32 contentHash, bytes32 metadataRoot, string uri, string mimeType, bytes signature) returns (bytes32)',
        'function domainSeparator() view returns (bytes32)',
        'function NAME() view returns (string)',
        'function VERSION() view returns (string)'
      ];
      const registry = new ethers.Contract(options.contract, abi, signer);
      
      const network = await provider.getNetwork();
      const domain = {
        name: 'MediaRegistry',
        version: '1',
        chainId: network.chainId,
        verifyingContract: options.contract
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
        contentHash,
        metadataRoot,
        uri: options.uri,
        mimeType: options.mime
      };
      
      const signature = await signer.signTypedData(domain, types, value);
      
      console.log('Submitting registration transaction...');
      const tx = await registry.register(
        signer.address,
        contentHash,
        metadataRoot,
        options.uri,
        options.mime,
        signature
      );
      
      console.log('Transaction hash:', tx.hash);
      const receipt = await tx.wait();
      console.log('Registration confirmed in block:', receipt.blockNumber);
      
      const assetId = ethers.keccak256(ethers.concat([
        contentHash,
        signer.address,
        metadataRoot
      ]));
      
      console.log(JSON.stringify({ 
        assetId,
        contentHash,
        metadataRoot,
        owner: signer.address,
        txHash: tx.hash
      }, null, 2));
    } catch (err: any) {
      console.error('Error:', err.message);
      process.exit(1);
    }
  });

program
  .command('verify')
  .argument('<file>', 'file to verify')
  .argument('<assetId>', 'on-chain asset ID')
  .option('--rpc <url>', 'RPC endpoint', process.env.RPC_URL || 'http://localhost:8545')
  .option('--contract <address>', 'Contract address', process.env.CONTRACT_ADDRESS)
  .description('Verify file against on-chain asset')
  .action(async (file, assetId, options) => {
    try {
      const p = path.resolve(process.cwd(), file);
      const buf = fs.readFileSync(p);
      const sha256 = createHash('sha256').update(buf).digest('hex');
      const contentHash = ethers.keccak256('0x' + sha256);
      
      if (!options.contract) throw new Error('--contract address required');
      
      const provider = new ethers.JsonRpcProvider(options.rpc);
      const abi = [
        'function getAsset(bytes32 assetId) view returns (tuple(address owner, bytes32 assetId, bytes32 contentHash, bytes32 metadataRoot, bytes32 contractRefHash, string uri, string mimeType, uint256 registeredAt, uint256 updatedAt, uint256 version))'
      ];
      const registry = new ethers.Contract(options.contract, abi, provider);
      
      const asset = await registry.getAsset(assetId);
      const match = asset.contentHash === contentHash;
      
      console.log(JSON.stringify({
        assetId,
        computedHash: contentHash,
        onChainHash: asset.contentHash,
        match,
        owner: asset.owner,
        version: asset.version.toString(),
        uri: asset.uri
      }, null, 2));
      
      process.exit(match ? 0 : 1);
    } catch (err: any) {
      console.error('Error:', err.message);
      process.exit(1);
    }
  });

program.parse();
