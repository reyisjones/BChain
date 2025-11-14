import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "solidity-coverage";
import * as dotenv from "dotenv";

dotenv.config();

const accounts = process.env.DEPLOYER_KEY ? [process.env.DEPLOYER_KEY] : [];

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: { enabled: true, runs: 200 }
    }
  },
  networks: {
    hardhat: {},
    polygonMumbai: {
      url: process.env.POLYGON_MUMBAI_RPC || "",
      accounts
    },
    baseSepolia: {
      url: process.env.BASE_SEPOLIA_RPC || "",
      accounts
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC || "",
      accounts
    }
  },
  etherscan: {
    apiKey: {
      polygonMumbai: process.env.POLYGONSCAN_API_KEY || "",
      baseSepolia: process.env.BASESCAN_API_KEY || "",
      sepolia: process.env.ETHERSCAN_API_KEY || ""
    }
  }
};

export default config;
