import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS;
  
  if (!contractAddress) {
    console.error("❌ Error: CONTRACT_ADDRESS not set in .env");
    process.exit(1);
  }

  const [signer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log("\n🔍 Testing Deployed Contract");
  console.log("═══════════════════════════════════════");
  console.log("Network:", network.name, `(chainId: ${network.chainId})`);
  console.log("Contract:", contractAddress);
  console.log("Caller:", signer.address);
  console.log();

  try {
    // Attach to deployed contract
    const MediaRegistry = await ethers.getContractFactory("MediaRegistry");
    const registry = MediaRegistry.attach(contractAddress);
    
    console.log("✅ Contract attached successfully\n");
    
    // Test 1: Get domain separator
    console.log("📋 Test 1: Reading domain separator...");
    const domainSep = await registry.domainSeparator();
    console.log("   Domain Separator:", domainSep);
    console.log("   ✅ Pass\n");
    
    // Test 2: Test registration (requires signature)
    console.log("📋 Test 2: Preparing test registration...");
    const contentHash = ethers.keccak256(ethers.toUtf8Bytes("test-file-content"));
    const metadataRoot = ethers.keccak256(ethers.toUtf8Bytes("{}"));
    const uri = "ipfs://QmTestDeployment";
    const mimeType = "text/plain";
    
    const domain = {
      name: "MediaRegistry",
      version: "1",
      chainId: network.chainId,
      verifyingContract: contractAddress
    };
    
    const types = {
      Register: [
        { name: "owner", type: "address" },
        { name: "contentHash", type: "bytes32" },
        { name: "metadataRoot", type: "bytes32" },
        { name: "uri", type: "string" },
        { name: "mimeType", type: "string" }
      ]
    };
    
    const value = {
      owner: signer.address,
      contentHash,
      metadataRoot,
      uri,
      mimeType
    };
    
    const signature = await signer.signTypedData(domain, types, value);
    console.log("   Signature:", signature.slice(0, 20) + "...");
    
    // Execute registration
    console.log("   Submitting transaction...");
    const tx = await registry.register(
      signer.address,
      contentHash,
      metadataRoot,
      uri,
      mimeType,
      signature
    );
    
    console.log("   TX Hash:", tx.hash);
    console.log("   Waiting for confirmation...");
    const receipt = await tx.wait();
    console.log("   Block:", receipt?.blockNumber);
    console.log("   Gas Used:", receipt?.gasUsed.toString());
    console.log("   ✅ Registration successful\n");
    
    // Test 3: Retrieve asset
    const assetId = ethers.keccak256(
      ethers.concat([contentHash, signer.address, metadataRoot])
    );
    
    console.log("📋 Test 3: Retrieving asset...");
    console.log("   Asset ID:", assetId);
    const asset = await registry.getAsset(assetId);
    
    console.log("   Owner:", asset.owner);
    console.log("   Content Hash:", asset.contentHash);
    console.log("   Metadata Root:", asset.metadataRoot);
    console.log("   URI:", asset.uri);
    console.log("   MIME Type:", asset.mimeType);
    console.log("   Version:", asset.version.toString());
    console.log("   Timestamp:", new Date(Number(asset.timestamp) * 1000).toISOString());
    console.log("   ✅ Retrieval successful\n");
    
    console.log("🎉 All tests passed!");
    console.log("\n📊 Deployment Summary:");
    console.log("• Contract is operational");
    console.log("• EIP-712 signatures working");
    console.log("• Asset registration functional");
    console.log("• Asset retrieval functional");
    console.log("\n✅ Contract ready for production use\n");
    
  } catch (error: any) {
    console.error("\n❌ Test failed:", error.message);
    if (error.data) {
      console.error("Error data:", error.data);
    }
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
