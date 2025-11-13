import { ethers } from "hardhat";

async function main() {
  const Factory = await ethers.getContractFactory("MediaRegistry");
  const registry = await Factory.deploy();
  await registry.waitForDeployment();
  console.log("MediaRegistry deployed to:", await registry.getAddress());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
