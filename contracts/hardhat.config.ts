import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    hardhat: {
      chainId: 31337
    },
    sepolia: {
      url: process.env.ETHEREUM_SEPOLIA_RPC_URL !== undefined ? process.env.ETHEREUM_SEPOLIA_RPC_URL : '',
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111
    },
    fuji: {
      url: process.env.AVALANCHE_FUJI_RPC_URL !== undefined ? process.env.AVALANCHE_FUJI_RPC_URL : '',
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      chainId: 43113
    },
    snowtrace: {
      url: process.env.AVALANCHE_FUJI_RPC_URL !== undefined ? process.env.AVALANCHE_FUJI_RPC_URL : '',
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : []
    },
  },
  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY || "",
      snowtrace: "snowtrace",
    },
    customChains: [
      {
        network: "snowtrace",
        chainId: 43113,
        urls: {
          apiURL: "https://api.routescan.io/v2/network/testnet/evm/43113/etherscan",
          browserURL: "https://avalanche.testnet.localhost:8080"
        }
      }
    ]
  }
};

export default config;
