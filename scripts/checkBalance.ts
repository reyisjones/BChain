import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const balance = await ethers.provider.getBalance(deployer.address);
  
  console.log("\n💰 Wallet Balance Check");
  console.log("═══════════════════════════════════════");
  console.log("Network:", network.name, `(chainId: ${network.chainId})`);
  console.log("Address:", deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "ETH");
  console.log("Wei:", balance.toString());
  
  if (balance === 0n) {
    console.log("\n⚠️  WARNING: Balance is 0!");
    console.log("Get testnet tokens from:");
    console.log("- Polygon Mumbai: https://faucet.polygon.technology/");
    console.log("- Base Sepolia: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet");
    console.log("- Sepolia: https://sepoliafaucet.com/\n");
  } else {
    console.log("\n✅ Wallet has sufficient balance for deployment\n");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
