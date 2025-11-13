import { expect } from 'chai';
import { ethers } from 'hardhat';
import { createHash } from 'crypto';

describe('🎬 DEMO: Complete Registration & Verification Flow', () => {
  it('demonstrates end-to-end asset registration and verification', async () => {
    // Deploy contract
    console.log('\n📦 Step 1: Deploying MediaRegistry contract...');
    const Factory = await ethers.getContractFactory('MediaRegistry');
    const registry = await Factory.deploy();
    await registry.waitForDeployment();
    const contractAddress = await registry.getAddress();
    console.log(`✅ Contract deployed at: ${contractAddress}`);

    // Get signers
    const [owner] = await ethers.getSigners();
    console.log(`👤 Owner address: ${owner.address}`);

    // Simulate file hashing
    console.log('\n🔐 Step 2: Hashing demo contract file...');
    const fileContent = JSON.stringify({
      title: 'Demo Legal Agreement',
      parties: ['Alice Corp', 'Bob Inc'],
      date: '2025-11-13'
    });
    
    const sha256 = createHash('sha256').update(fileContent).digest('hex');
    const contentHash = ethers.keccak256('0x' + sha256);
    console.log(`   SHA-256: 0x${sha256.substring(0, 16)}...`);
    console.log(`   Content Hash: ${contentHash.substring(0, 20)}...`);

    // Create metadata
    const metadata = JSON.stringify({ title: 'Demo Contract', type: 'Legal' });
    const metadataRoot = ethers.keccak256(ethers.toUtf8Bytes(metadata));
    console.log(`   Metadata Root: ${metadataRoot.substring(0, 20)}...`);

    // Set storage details
    const uri = 'ipfs://QmDemoContract123';
    const mimeType = 'application/json';

    // Sign with EIP-712
    console.log('\n✍️  Step 3: Signing registration with EIP-712...');
    const network = await ethers.provider.getNetwork();
    const domain = {
      name: 'MediaRegistry',
      version: '1',
      chainId: network.chainId,
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
      owner: owner.address,
      contentHash,
      metadataRoot,
      uri,
      mimeType
    };

    const signature = await owner.signTypedData(domain, types, value);
    console.log(`   Signature: ${signature.substring(0, 20)}...`);

    // Register on-chain
    console.log('\n📝 Step 4: Submitting registration transaction...');
    const tx = await registry.register(
      owner.address,
      contentHash,
      metadataRoot,
      uri,
      mimeType,
      signature
    );
    const receipt = await tx.wait();
    console.log(`   Transaction Hash: ${tx.hash}`);
    console.log(`   Block Number: ${receipt?.blockNumber}`);
    console.log(`   Gas Used: ${receipt?.gasUsed.toString()}`);

    // Calculate asset ID
    const assetId = ethers.keccak256(
      ethers.concat([contentHash, owner.address, metadataRoot])
    );
    console.log(`   Asset ID: ${assetId}`);

    // Verify registration
    console.log('\n✅ Step 5: Verifying asset on-chain...');
    const asset = await registry.getAsset(assetId);
    console.log(`   Owner: ${asset.owner}`);
    console.log(`   URI: ${asset.uri}`);
    console.log(`   MIME Type: ${asset.mimeType}`);
    console.log(`   Version: ${asset.version}`);
    console.log(`   Content Hash Match: ${asset.contentHash === contentHash}`);

    // Simulate file verification
    console.log('\n🔍 Step 6: Simulating file verification...');
    const recomputedHash = ethers.keccak256('0x' + sha256);
    const isValid = recomputedHash === asset.contentHash;
    console.log(`   Recomputed Hash: ${recomputedHash.substring(0, 20)}...`);
    console.log(`   On-chain Hash: ${asset.contentHash.substring(0, 20)}...`);
    console.log(`   ✅ Verification Result: ${isValid ? 'VALID ✓' : 'INVALID ✗'}`);

    // Update asset (new version)
    console.log('\n🔄 Step 7: Updating asset to new version...');
    const newContent = JSON.stringify({
      title: 'Demo Legal Agreement (Amended)',
      parties: ['Alice Corp', 'Bob Inc'],
      date: '2025-11-13',
      amendment: 'v2'
    });
    
    const newSha256 = createHash('sha256').update(newContent).digest('hex');
    const newContentHash = ethers.keccak256('0x' + newSha256);
    const newMetadataRoot = ethers.keccak256(ethers.toUtf8Bytes('{"version": 2}'));
    const newUri = 'ipfs://QmDemoContractV2';
    
    const updateTypes = {
      Update: [
        { name: 'assetId', type: 'bytes32' },
        { name: 'contentHash', type: 'bytes32' },
        { name: 'metadataRoot', type: 'bytes32' },
        { name: 'uri', type: 'string' },
        { name: 'version', type: 'uint256' }
      ]
    };

    const updateValue = {
      assetId,
      contentHash: newContentHash,
      metadataRoot: newMetadataRoot,
      uri: newUri,
      version: 2n
    };

    const updateSig = await owner.signTypedData(domain, updateTypes, updateValue);
    const updateTx = await registry.update(assetId, newContentHash, newMetadataRoot, newUri, updateSig);
    await updateTx.wait();
    console.log(`   Update Transaction Hash: ${updateTx.hash}`);

    // Verify update
    const updatedAsset = await registry.getAsset(assetId);
    console.log(`   New Version: ${updatedAsset.version}`);
    console.log(`   New URI: ${updatedAsset.uri}`);
    console.log(`   New Content Hash: ${updatedAsset.contentHash.substring(0, 20)}...`);

    // Final assertions
    console.log('\n✅ DEMO COMPLETE - All operations successful!\n');
    
    expect(asset.owner).to.equal(owner.address);
    expect(asset.contentHash).to.equal(contentHash);
    expect(asset.version).to.equal(1n);
    expect(updatedAsset.version).to.equal(2n);
    expect(updatedAsset.contentHash).to.equal(newContentHash);
  });
});
