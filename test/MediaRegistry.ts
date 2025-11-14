import { expect } from 'chai';
import { ethers } from 'hardhat';

function keccak256(data: string | Uint8Array): string {
  return ethers.keccak256(typeof data === 'string' ? ethers.toUtf8Bytes(data) : data);
}

describe('MediaRegistry', () => {
  async function deploy() {
    const Factory = await ethers.getContractFactory('MediaRegistry');
    const registry = await Factory.deploy();
    await registry.waitForDeployment();
    const [owner, other] = await ethers.getSigners();
    return { registry, owner, other };
  }

  it('registers an asset with valid signature', async () => {
    const { registry, owner } = await deploy();
    const contentHash = keccak256('file-bytes');
    const metadataRoot = keccak256('{"name":"demo"}');
    const uri = 'ipfs://CID123';
    const mimeType = 'image/png';
      // sign typed data using ethers helper
      const network = await ethers.provider.getNetwork();
      const domain = { name: 'MediaRegistry', version: '1', chainId: network.chainId, verifyingContract: await registry.getAddress() };
      const types = {
        Register: [
          { name: 'owner', type: 'address' },
          { name: 'contentHash', type: 'bytes32' },
          { name: 'metadataRoot', type: 'bytes32' },
          { name: 'uri', type: 'string' },
          { name: 'mimeType', type: 'string' }
        ]
      };
      const value = { owner: owner.address, contentHash, metadataRoot, uri, mimeType };
      const signature = await owner.signTypedData(domain, types, value);
    const tx = await registry.register(owner.address, contentHash, metadataRoot, uri, mimeType, signature);
    await tx.wait();
    const assetId = ethers.keccak256(ethers.concat([contentHash, owner.address, metadataRoot]));
    const asset = await registry.getAsset(assetId);
    expect(asset.owner).to.equal(owner.address);
    expect(asset.version).to.equal(1n);
  });

  it('updates asset with valid signature and version bump', async () => {
    const { registry, owner } = await deploy();
    const contentHash = keccak256('file-bytes');
    const metadataRoot = keccak256('{"name":"demo"}');
    const uri = 'ipfs://CID123';
    const mimeType = 'image/png';
      const network = await ethers.provider.getNetwork();
      const domain = { name: 'MediaRegistry', version: '1', chainId: network.chainId, verifyingContract: await registry.getAddress() };
      const regTypes = { Register: [
        { name: 'owner', type: 'address' },
        { name: 'contentHash', type: 'bytes32' },
        { name: 'metadataRoot', type: 'bytes32' },
        { name: 'uri', type: 'string' },
        { name: 'mimeType', type: 'string' }
      ]};
      const regValue = { owner: owner.address, contentHash, metadataRoot, uri, mimeType };
      const regSig = await owner.signTypedData(domain, regTypes, regValue);
    await registry.register(owner.address, contentHash, metadataRoot, uri, mimeType, regSig);
    const assetId = ethers.keccak256(ethers.concat([contentHash, owner.address, metadataRoot]));
    // update
    const newContentHash = keccak256('new-file');
    const newMetadataRoot = keccak256('{"name":"demo2"}');
    const newUri = 'ipfs://CID456';
    const nextVersion = 2n;
      const updTypes = { Update: [
        { name: 'assetId', type: 'bytes32' },
        { name: 'contentHash', type: 'bytes32' },
        { name: 'metadataRoot', type: 'bytes32' },
        { name: 'uri', type: 'string' },
        { name: 'version', type: 'uint256' }
      ]};
      const updValue = { assetId, contentHash: newContentHash, metadataRoot: newMetadataRoot, uri: newUri, version: nextVersion };
      const updSig = await owner.signTypedData(domain, updTypes, updValue);
    await registry.update(assetId, newContentHash, newMetadataRoot, newUri, updSig);
    const asset = await registry.getAsset(assetId);
    expect(asset.version).to.equal(2n);
  });

  it('rejects update from non-owner (bad signature)', async () => {
    const { registry, owner, other } = await deploy();
    const contentHash = keccak256('file');
    const metadataRoot = keccak256('{"x":1}');
    const uri = 'ipfs://CID';
    const mimeType = 'text/plain';
    const network = await ethers.provider.getNetwork();
    const domain = { name: 'MediaRegistry', version: '1', chainId: network.chainId, verifyingContract: await registry.getAddress() };
    const regTypes = { Register: [
      { name: 'owner', type: 'address' },
      { name: 'contentHash', type: 'bytes32' },
      { name: 'metadataRoot', type: 'bytes32' },
      { name: 'uri', type: 'string' },
      { name: 'mimeType', type: 'string' }
    ]};
    const regVal = { owner: owner.address, contentHash, metadataRoot, uri, mimeType };
    const regSig = await owner.signTypedData(domain, regTypes, regVal);
    await registry.register(owner.address, contentHash, metadataRoot, uri, mimeType, regSig);
    const assetId = ethers.keccak256(ethers.concat([contentHash, owner.address, metadataRoot]));
    // Non-owner signs update
      const newContentHash = keccak256('new');
      const newMetadataRoot = keccak256('{"x":2}');
      const newUri = 'ipfs://NEW';
      const nextVersion = 2n;
    const updTypes = { Update: [
        { name: 'assetId', type: 'bytes32' },
        { name: 'contentHash', type: 'bytes32' },
        { name: 'metadataRoot', type: 'bytes32' },
        { name: 'uri', type: 'string' },
        { name: 'version', type: 'uint256' }
      ]};
    const updVal = { assetId, contentHash: newContentHash, metadataRoot: newMetadataRoot, uri: newUri, version: nextVersion };
    const updSig = await other.signTypedData(domain, updTypes, updVal);
    await expect(registry.update(assetId, newContentHash, newMetadataRoot, newUri, updSig)).to.be.rejectedWith('BAD_SIGNATURE');
  });

  it('rejects registration with zero address owner', async () => {
    const { registry, owner } = await deploy();
    const contentHash = keccak256('file');
    const metadataRoot = keccak256('{}');
    const uri = 'ipfs://test';
    const mimeType = 'text/plain';
    const network = await ethers.provider.getNetwork();
    const domain = { name: 'MediaRegistry', version: '1', chainId: network.chainId, verifyingContract: await registry.getAddress() };
    const types = { Register: [
      { name: 'owner', type: 'address' },
      { name: 'contentHash', type: 'bytes32' },
      { name: 'metadataRoot', type: 'bytes32' },
      { name: 'uri', type: 'string' },
      { name: 'mimeType', type: 'string' }
    ]};
    const value = { owner: ethers.ZeroAddress, contentHash, metadataRoot, uri, mimeType };
    const signature = await owner.signTypedData(domain, types, value);
    await expect(registry.register(ethers.ZeroAddress, contentHash, metadataRoot, uri, mimeType, signature))
      .to.be.revertedWith('ZERO_OWNER');
  });

  it('rejects duplicate asset registration', async () => {
    const { registry, owner } = await deploy();
    const contentHash = keccak256('file');
    const metadataRoot = keccak256('{}');
    const uri = 'ipfs://test';
    const mimeType = 'text/plain';
    const network = await ethers.provider.getNetwork();
    const domain = { name: 'MediaRegistry', version: '1', chainId: network.chainId, verifyingContract: await registry.getAddress() };
    const types = { Register: [
      { name: 'owner', type: 'address' },
      { name: 'contentHash', type: 'bytes32' },
      { name: 'metadataRoot', type: 'bytes32' },
      { name: 'uri', type: 'string' },
      { name: 'mimeType', type: 'string' }
    ]};
    const value = { owner: owner.address, contentHash, metadataRoot, uri, mimeType };
    const signature = await owner.signTypedData(domain, types, value);
    
    await registry.register(owner.address, contentHash, metadataRoot, uri, mimeType, signature);
    await expect(registry.register(owner.address, contentHash, metadataRoot, uri, mimeType, signature))
      .to.be.revertedWith('EXISTS');
  });

  it('transfers ownership successfully', async () => {
    const { registry, owner, other } = await deploy();
    const contentHash = keccak256('file');
    const metadataRoot = keccak256('{}');
    const uri = 'ipfs://test';
    const mimeType = 'text/plain';
    const network = await ethers.provider.getNetwork();
    const domain = { name: 'MediaRegistry', version: '1', chainId: network.chainId, verifyingContract: await registry.getAddress() };
    const types = { Register: [
      { name: 'owner', type: 'address' },
      { name: 'contentHash', type: 'bytes32' },
      { name: 'metadataRoot', type: 'bytes32' },
      { name: 'uri', type: 'string' },
      { name: 'mimeType', type: 'string' }
    ]};
    const value = { owner: owner.address, contentHash, metadataRoot, uri, mimeType };
    const signature = await owner.signTypedData(domain, types, value);
    
    await registry.register(owner.address, contentHash, metadataRoot, uri, mimeType, signature);
    const assetId = ethers.keccak256(ethers.concat([contentHash, owner.address, metadataRoot]));
    
    await expect(registry.transferOwnership(assetId, other.address))
      .to.emit(registry, 'OwnershipTransferred')
      .withArgs(assetId, owner.address, other.address);
    
    const asset = await registry.getAsset(assetId);
    expect(asset.owner).to.equal(other.address);
  });

  it('rejects ownership transfer to zero address', async () => {
    const { registry, owner } = await deploy();
    const contentHash = keccak256('file');
    const metadataRoot = keccak256('{}');
    const uri = 'ipfs://test';
    const mimeType = 'text/plain';
    const network = await ethers.provider.getNetwork();
    const domain = { name: 'MediaRegistry', version: '1', chainId: network.chainId, verifyingContract: await registry.getAddress() };
    const types = { Register: [
      { name: 'owner', type: 'address' },
      { name: 'contentHash', type: 'bytes32' },
      { name: 'metadataRoot', type: 'bytes32' },
      { name: 'uri', type: 'string' },
      { name: 'mimeType', type: 'string' }
    ]};
    const value = { owner: owner.address, contentHash, metadataRoot, uri, mimeType };
    const signature = await owner.signTypedData(domain, types, value);
    
    await registry.register(owner.address, contentHash, metadataRoot, uri, mimeType, signature);
    const assetId = ethers.keccak256(ethers.concat([contentHash, owner.address, metadataRoot]));
    
    await expect(registry.transferOwnership(assetId, ethers.ZeroAddress))
      .to.be.revertedWith('ZERO_OWNER');
  });

  it('rejects ownership transfer from non-owner', async () => {
    const { registry, owner, other } = await deploy();
    const contentHash = keccak256('file');
    const metadataRoot = keccak256('{}');
    const uri = 'ipfs://test';
    const mimeType = 'text/plain';
    const network = await ethers.provider.getNetwork();
    const domain = { name: 'MediaRegistry', version: '1', chainId: network.chainId, verifyingContract: await registry.getAddress() };
    const types = { Register: [
      { name: 'owner', type: 'address' },
      { name: 'contentHash', type: 'bytes32' },
      { name: 'metadataRoot', type: 'bytes32' },
      { name: 'uri', type: 'string' },
      { name: 'mimeType', type: 'string' }
    ]};
    const value = { owner: owner.address, contentHash, metadataRoot, uri, mimeType };
    const signature = await owner.signTypedData(domain, types, value);
    
    await registry.register(owner.address, contentHash, metadataRoot, uri, mimeType, signature);
    const assetId = ethers.keccak256(ethers.concat([contentHash, owner.address, metadataRoot]));
    
    const otherRegistry = registry.connect(other);
    await expect(otherRegistry.transferOwnership(assetId, other.address))
      .to.be.revertedWith('NOT_OWNER');
  });

  it('links contract hash successfully', async () => {
    const { registry, owner } = await deploy();
    const contentHash = keccak256('file');
    const metadataRoot = keccak256('{}');
    const uri = 'ipfs://test';
    const mimeType = 'text/plain';
    const contractRefHash = keccak256('legal-contract-pdf');
    
    const network = await ethers.provider.getNetwork();
    const domain = { name: 'MediaRegistry', version: '1', chainId: network.chainId, verifyingContract: await registry.getAddress() };
    const types = { Register: [
      { name: 'owner', type: 'address' },
      { name: 'contentHash', type: 'bytes32' },
      { name: 'metadataRoot', type: 'bytes32' },
      { name: 'uri', type: 'string' },
      { name: 'mimeType', type: 'string' }
    ]};
    const value = { owner: owner.address, contentHash, metadataRoot, uri, mimeType };
    const signature = await owner.signTypedData(domain, types, value);
    
    await registry.register(owner.address, contentHash, metadataRoot, uri, mimeType, signature);
    const assetId = ethers.keccak256(ethers.concat([contentHash, owner.address, metadataRoot]));
    
    await expect(registry.linkContract(assetId, contractRefHash))
      .to.emit(registry, 'ContractLinked')
      .withArgs(assetId, contractRefHash);
    
    const asset = await registry.getAsset(assetId);
    expect(asset.contractRefHash).to.equal(contractRefHash);
  });

  it('rejects contract linking from non-owner', async () => {
    const { registry, owner, other } = await deploy();
    const contentHash = keccak256('file');
    const metadataRoot = keccak256('{}');
    const uri = 'ipfs://test';
    const mimeType = 'text/plain';
    const contractRefHash = keccak256('legal-contract');
    
    const network = await ethers.provider.getNetwork();
    const domain = { name: 'MediaRegistry', version: '1', chainId: network.chainId, verifyingContract: await registry.getAddress() };
    const types = { Register: [
      { name: 'owner', type: 'address' },
      { name: 'contentHash', type: 'bytes32' },
      { name: 'metadataRoot', type: 'bytes32' },
      { name: 'uri', type: 'string' },
      { name: 'mimeType', type: 'string' }
    ]};
    const value = { owner: owner.address, contentHash, metadataRoot, uri, mimeType };
    const signature = await owner.signTypedData(domain, types, value);
    
    await registry.register(owner.address, contentHash, metadataRoot, uri, mimeType, signature);
    const assetId = ethers.keccak256(ethers.concat([contentHash, owner.address, metadataRoot]));
    
    const otherRegistry = registry.connect(other);
    await expect(otherRegistry.linkContract(assetId, contractRefHash))
      .to.be.revertedWith('NOT_OWNER');
  });

  it('rejects getting non-existent asset', async () => {
    const { registry } = await deploy();
    const fakeAssetId = keccak256('non-existent');
    await expect(registry.getAsset(fakeAssetId))
      .to.be.revertedWith('NOT_FOUND');
  });

  it('emits AssetRegistered event with correct parameters', async () => {
    const { registry, owner } = await deploy();
    const contentHash = keccak256('file');
    const metadataRoot = keccak256('{}');
    const uri = 'ipfs://test';
    const mimeType = 'text/plain';
    
    const network = await ethers.provider.getNetwork();
    const domain = { name: 'MediaRegistry', version: '1', chainId: network.chainId, verifyingContract: await registry.getAddress() };
    const types = { Register: [
      { name: 'owner', type: 'address' },
      { name: 'contentHash', type: 'bytes32' },
      { name: 'metadataRoot', type: 'bytes32' },
      { name: 'uri', type: 'string' },
      { name: 'mimeType', type: 'string' }
    ]};
    const value = { owner: owner.address, contentHash, metadataRoot, uri, mimeType };
    const signature = await owner.signTypedData(domain, types, value);
    
    const assetId = ethers.keccak256(ethers.concat([contentHash, owner.address, metadataRoot]));
    
    await expect(registry.register(owner.address, contentHash, metadataRoot, uri, mimeType, signature))
      .to.emit(registry, 'AssetRegistered')
      .withArgs(assetId, owner.address, contentHash, metadataRoot, uri, mimeType);
  });

  it('emits AssetUpdated event with correct parameters', async () => {
    const { registry, owner } = await deploy();
    const contentHash = keccak256('file');
    const metadataRoot = keccak256('{}');
    const uri = 'ipfs://test';
    const mimeType = 'text/plain';
    
    const network = await ethers.provider.getNetwork();
    const domain = { name: 'MediaRegistry', version: '1', chainId: network.chainId, verifyingContract: await registry.getAddress() };
    const regTypes = { Register: [
      { name: 'owner', type: 'address' },
      { name: 'contentHash', type: 'bytes32' },
      { name: 'metadataRoot', type: 'bytes32' },
      { name: 'uri', type: 'string' },
      { name: 'mimeType', type: 'string' }
    ]};
    const regValue = { owner: owner.address, contentHash, metadataRoot, uri, mimeType };
    const regSig = await owner.signTypedData(domain, regTypes, regValue);
    
    await registry.register(owner.address, contentHash, metadataRoot, uri, mimeType, regSig);
    const assetId = ethers.keccak256(ethers.concat([contentHash, owner.address, metadataRoot]));
    
    const newContentHash = keccak256('new-file');
    const newMetadataRoot = keccak256('{"v":2}');
    const newUri = 'ipfs://new';
    const nextVersion = 2n;
    
    const updTypes = { Update: [
      { name: 'assetId', type: 'bytes32' },
      { name: 'contentHash', type: 'bytes32' },
      { name: 'metadataRoot', type: 'bytes32' },
      { name: 'uri', type: 'string' },
      { name: 'version', type: 'uint256' }
    ]};
    const updValue = { assetId, contentHash: newContentHash, metadataRoot: newMetadataRoot, uri: newUri, version: nextVersion };
    const updSig = await owner.signTypedData(domain, updTypes, updValue);
    
    await expect(registry.update(assetId, newContentHash, newMetadataRoot, newUri, updSig))
      .to.emit(registry, 'AssetUpdated')
      .withArgs(assetId, nextVersion, newContentHash, newMetadataRoot, newUri);
  });

  it('returns correct domain separator', async () => {
    const { registry } = await deploy();
    const domainSeparator = await registry.domainSeparator();
    expect(domainSeparator).to.be.properHex(64); // 32 bytes = 64 hex chars
    expect(domainSeparator).to.match(/^0x[0-9a-f]{64}$/i);
  });
});
