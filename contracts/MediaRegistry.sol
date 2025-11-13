// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/**
 * @title MediaRegistry
 * @notice Registers media assets with integrity data and supports updates & ownership transfer.
 * @dev Initial MVP implementation with EIP-712 typed data verification for registration & update.
 */
contract MediaRegistry is EIP712 {
    // -----------------------------
    // Events
    // -----------------------------
    event AssetRegistered(bytes32 indexed assetId, address indexed owner, bytes32 contentHash, bytes32 metadataRoot, string uri, string mimeType);
    event AssetUpdated(bytes32 indexed assetId, uint256 version, bytes32 contentHash, bytes32 metadataRoot, string uri);
    event OwnershipTransferred(bytes32 indexed assetId, address indexed oldOwner, address indexed newOwner);
    event ContractLinked(bytes32 indexed assetId, bytes32 contractRefHash);

    // -----------------------------
    // Data Structures
    // -----------------------------
    struct Asset {
        address owner;               // current owner
        bytes32 assetId;             // deterministic id: keccak(contentHash, owner, metadataRoot)
        bytes32 contentHash;         // canonical content hash (keccak or keccak(sha256))
        bytes32 metadataRoot;        // merkle root or keccak(JSON)
        bytes32 contractRefHash;     // optional linked contract/document
        string  uri;                 // storage pointer
        string  mimeType;            // MIME type
        uint256 registeredAt;        // initial registration time
        uint256 updatedAt;           // last update time
        uint256 version;             // starts at 1, increments per update
    }

    // assetId => Asset
    mapping(bytes32 => Asset) private assets;

    // -----------------------------
    // EIP-712 Domain & Types
    // -----------------------------
    // We rely on OpenZeppelin's EIP712 implementation for domain separator & typed data digest.

    // Typehashes computed per EIP-712 specification
    bytes32 private constant _REGISTER_TYPEHASH = keccak256("Register(address owner,bytes32 contentHash,bytes32 metadataRoot,string uri,string mimeType)");
    bytes32 private constant _UPDATE_TYPEHASH = keccak256("Update(bytes32 assetId,bytes32 contentHash,bytes32 metadataRoot,string uri,uint256 version)");

    string public constant NAME = "MediaRegistry";
    string public constant VERSION = "1";

    // -----------------------------
    // Constructor
    // -----------------------------
    constructor() EIP712(NAME, VERSION) {}

    function domainSeparator() external view returns (bytes32) {
        return _domainSeparatorV4();
    }

    // -----------------------------
    // Modifiers
    // -----------------------------
    modifier onlyOwner(bytes32 assetId) {
        require(assets[assetId].owner == msg.sender, "NOT_OWNER");
        _;
    }

    // -----------------------------
    // View Functions
    // -----------------------------
    function getAsset(bytes32 assetId) external view returns (Asset memory) {
        require(assets[assetId].owner != address(0), "NOT_FOUND");
        return assets[assetId];
    }

    // -----------------------------
    // Registration Logic
    // -----------------------------
    function register(
        address owner,
        bytes32 contentHash,
        bytes32 metadataRoot,
        string calldata uri,
        string calldata mimeType,
        bytes calldata signature
    ) external returns (bytes32 assetId) {
        require(owner != address(0), "ZERO_OWNER");
        assetId = keccak256(abi.encodePacked(contentHash, owner, metadataRoot));
        require(assets[assetId].owner == address(0), "EXISTS");

        // Verify EIP-712 signature
    bytes32 digest = _hashTypedDataV4(_registerStructHash(owner, contentHash, metadataRoot, uri, mimeType));
        address signer = _recover(digest, signature);
        require(signer == owner, "BAD_SIGNATURE");

        assets[assetId] = Asset({
            owner: owner,
            assetId: assetId,
            contentHash: contentHash,
            metadataRoot: metadataRoot,
            contractRefHash: bytes32(0),
            uri: uri,
            mimeType: mimeType,
            registeredAt: block.timestamp,
            updatedAt: block.timestamp,
            version: 1
        });

        emit AssetRegistered(assetId, owner, contentHash, metadataRoot, uri, mimeType);
    }

    function update(
        bytes32 assetId,
        bytes32 newContentHash,
        bytes32 newMetadataRoot,
        string calldata newUri,
        bytes calldata signature
    ) external onlyOwner(assetId) {
        Asset storage a = assets[assetId];
        require(a.owner != address(0), "NOT_FOUND");
        uint256 nextVersion = a.version + 1;

        // Verify signature from owner referencing current version (prevents replay)
    bytes32 digest = _hashTypedDataV4(_updateStructHash(assetId, newContentHash, newMetadataRoot, newUri, nextVersion));
        address signer = _recover(digest, signature);
        require(signer == a.owner, "BAD_SIGNATURE");

        a.contentHash = newContentHash;
        a.metadataRoot = newMetadataRoot;
        a.uri = newUri;
        a.updatedAt = block.timestamp;
        a.version = nextVersion;

        emit AssetUpdated(assetId, nextVersion, newContentHash, newMetadataRoot, newUri);
    }

    function transferOwnership(bytes32 assetId, address newOwner) external onlyOwner(assetId) {
        require(newOwner != address(0), "ZERO_OWNER");
        Asset storage a = assets[assetId];
        address old = a.owner;
        a.owner = newOwner;
        emit OwnershipTransferred(assetId, old, newOwner);
    }

    function linkContract(bytes32 assetId, bytes32 contractRefHash) external onlyOwner(assetId) {
        Asset storage a = assets[assetId];
        require(a.owner != address(0), "NOT_FOUND");
        a.contractRefHash = contractRefHash;
        emit ContractLinked(assetId, contractRefHash);
    }

    // -----------------------------
    // Internal: EIP-712 hashing
    // -----------------------------
    function _registerStructHash(
        address owner,
        bytes32 contentHash,
        bytes32 metadataRoot,
        string calldata uri,
        string calldata mimeType
    ) internal pure returns (bytes32) {
        return keccak256(abi.encode(
            _REGISTER_TYPEHASH,
            owner,
            contentHash,
            metadataRoot,
            keccak256(bytes(uri)),
            keccak256(bytes(mimeType))
        ));
    }

    function _updateStructHash(
        bytes32 assetId,
        bytes32 contentHash,
        bytes32 metadataRoot,
        string calldata uri,
        uint256 version
    ) internal pure returns (bytes32) {
        return keccak256(abi.encode(
            _UPDATE_TYPEHASH,
            assetId,
            contentHash,
            metadataRoot,
            keccak256(bytes(uri)),
            version
        ));
    }

    // ---------------------------------
    // Debug utilities (can be removed in prod)
    // ---------------------------------
    function debugRecoverRegister(
        address owner,
        bytes32 contentHash,
        bytes32 metadataRoot,
        string calldata uri,
        string calldata mimeType,
        bytes calldata signature
    ) external view returns (address) {
        bytes32 digest = _hashTypedDataV4(_registerStructHash(owner, contentHash, metadataRoot, uri, mimeType));
        return _recover(digest, signature);
    }

    // -----------------------------
    // Internal: Signature recovery
    // -----------------------------
    function _recover(bytes32 digest, bytes calldata signature) internal pure returns (address) {
        require(signature.length == 65, "BAD_SIG_LENGTH");
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := calldataload(signature.offset)
            s := calldataload(add(signature.offset, 32))
            v := byte(0, calldataload(add(signature.offset, 64)))
        }
        if (v < 27) {
            v += 27; // transform 0/1 to 27/28
        }
        require(v == 27 || v == 28, "BAD_V");
        return ecrecover(digest, v, r, s);
    }
}
