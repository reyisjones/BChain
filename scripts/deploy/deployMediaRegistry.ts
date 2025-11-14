import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log("\n🚀 Deploying MediaRegistry Contract");
  console.log("═══════════════════════════════════════");
  console.log("Network:", network.name, `(chainId: ${network.chainId})`);
  console.log("Deployer:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  const Factory = await ethers.getContractFactory("MediaRegistry");
  console.log("⏳ Deploying contract...");
  
  const registry = await Factory.deploy();
  await registry.waitForDeployment();
  
  const address = await registry.getAddress();
  console.log("✅ MediaRegistry deployed to:", address);
  
  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId.toString(),
    contractAddress: address,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    blockNumber: (await ethers.provider.getBlock('latest'))?.number
  };
  
  const deploymentsDir = path.join(__dirname, "../../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  const filename = path.join(deploymentsDir, `${network.name}-${Date.now()}.json`);
  fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));
  console.log("📝 Deployment info saved to:", filename);
  
  console.log("\n📋 Next Steps:");
  console.log("1. Verify contract: npx hardhat verify --network", network.name, address);
  console.log("2. Update .env with CONTRACT_ADDRESS=" + address);
  console.log("3. Test with CLI: node cli hash test.txt && node cli register <hash> <owner> <sig>\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
