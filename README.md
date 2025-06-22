# LinkFi: The Future of E-Commerce — AI x Crypto

**LinkFi** is a next-generation e-commerce infrastructure that combines the power of **AI automation**, **crypto payments**, and **cross-chain compatibility** powered by **Chainlink CCIP**. Think of it as **Stripe 2.0**—fully decentralized, intelligent, and chain-agnostic.

## 🔗 Key Features

- **🚀 Crypto-Native Payments**  
  Accept and send payments using crypto (e.g., USDC, ETH) across EVM-compatible blockchains, with seamless user experience.

- **🌉 Chainlink CCIP Integration**  
  Eliminate chain fragmentation. Our smart contracts are interoperable across chains using Chainlink’s Cross-Chain Interoperability Protocol (CCIP).

- **🧠 AI-Powered Refund System (ReLink)**  
  No more disputes with sellers. LinkFi introduces **ReLink**, an AI refund resolution agent that automatically evaluates refund claims based on uploaded evidence (images, videos, or metadata).

- **📦 Escrow System**  
  Built-in smart contract-based escrow ensures secure, trustless transactions for both buyers and sellers.

🛠 Tech Stack
Smart Contracts: Solidity (EVM), Chainlink CCIP

AI Agent: ElizaOS + Anthropic

Frontend: Tanstack Router

Backend: Node.js, TypeScript

Storage: Supabase 

Wallet: MetaMask, Thirdweb (for Web3 login)

🔗 Deployed Contracts (MVP)
This is the Minimum Viable Product (MVP) version of LinkFi, built to demonstrate the power of Chainlink CCIP in enabling seamless cross-chain transactions.

Contract	Network	Address
Sender	Sepolia (L1)	0x05Bc05725AE7dF7BfDd94891F138Aae0f0a2C689
Escrow	Fuji (L2)	0x435F8F1dd271Ce2741CCb859cf588705a99929A8

In this MVP, we simulate a real-world cross-chain refund scenario:

The Sender contract on Sepolia initiates a transaction via CCIP.

The Escrow contract on Fuji receives and processes the message, managing fund flow securely.

💡 Why Fuji?
In our full-scale version, we plan to deploy the core escrow system on Avalanche Fuji as the central coordination layer for managing payments, disputes, and AI-powered refunds. Fuji provides low-cost testing, scalability, and is EVM-compatible.
