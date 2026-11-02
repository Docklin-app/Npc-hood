export const NPC_HOOD_ABI = [
  "function MAX_SUPPLY() view returns (uint256)",
  "function MAX_PER_TX() view returns (uint256)",
  "function FREE_MINT_FEE() view returns (uint256)",
  "function PAID_MINT_PRICE() view returns (uint256)",
  "function totalMinted() view returns (uint256)",
  "function freeMint(uint256 quantity) payable",
  "function paidMint(uint256 quantity) payable",
  "function withdraw()",
  "function owner() view returns (address)",
  "event NpcHoodMinted(address indexed minter, uint256 quantity, bool paid, uint256 amountPaid)",
  "event ProceedsWithdrawn(address indexed recipient, uint256 amount)",
] as const;
