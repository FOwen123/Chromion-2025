import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    hardhat: {
      chainId: 31337
    },
    ethereumSepolia: {
      url: process.env.ETHEREUM_SEPOLIA_RPC_URL !== undefined ? process.env.ETHEREUM_SEPOLIA_RPC_URL : '',
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111
    },
    avalancheFuji: {
      url: process.env.AVALANCHE_FUJI_RPC_URL !== undefined ? process.env.AVALANCHE_FUJI_RPC_URL : '',
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      chainId: 43113
    }
  }
};

export default config;
