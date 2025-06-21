
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const SEPOLIA_ROUTER = "0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59"
const SEPOLIA_LINK = "0x779877A7B0D9E8603169DdbD7836e478b4624789"
const SEPOLIA_USDC = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"


const SenderModule = buildModule("SenderModule", (m) => {
  const router = m.getParameter("router", SEPOLIA_ROUTER);
  const link = m.getParameter("link", SEPOLIA_LINK);
  const usdc = m.getParameter("usdc", SEPOLIA_USDC);

  const sender = m.contract("Sender", [router, link, usdc]);

  return { sender };
});

export default SenderModule;
