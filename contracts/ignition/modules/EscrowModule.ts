
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const FUJI_ROUTER = "0xF694E193200268f9a4868e4Aa017A0118C9a8177"
const FUJI_LINK = "0x0b9d5D9136855f6FEc3c0993feE6E9CE8a297846"
const FUJI_USDC = "0x5425890298aed601595a70AB815c96711a31Bc65"
const FeeRecipient = "0xe328217347865Ed09179b3dCa98b3faEFcd39E9A"

const EscrowModule = buildModule("EscrowModule", (m) => {
  const router = m.getParameter("router", FUJI_ROUTER);
  const link = m.getParameter("link", FUJI_LINK);
  const usdc = m.getParameter("usdc", FUJI_USDC);
  const recipient = m.getParameter("recipient", FeeRecipient);

  const escrow = m.contract("Escrow", [router, link, usdc, recipient]);

  return { escrow };
});

export default EscrowModule;
