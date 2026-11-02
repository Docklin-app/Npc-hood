const hre = require("hardhat");

const ABI = [
  "function owner() view returns (address)",
  "function totalMinted() view returns (uint256)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function setCollectionBaseURI(string newBaseURI)",
  "event CollectionBaseURIChanged(string newBaseURI)",
];

const EXPLORERS = {
  56: "https://bscscan.com/tx/",
  97: "https://testnet.bscscan.com/tx/",
};

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}; set it in contracts/.env. Nothing was sent.`);
  return value;
}

function validateBaseUri(value) {
  if (/\s/.test(value) || !value.endsWith("/") || value.includes("?") || value.includes("#")) {
    throw new Error("NPC_HOOD_BASE_URI must have no whitespace/query/fragment and must end with '/'.");
  }

  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error("NPC_HOOD_BASE_URI must be a valid https:// or ipfs:// URI.");
  }

  if (parsed.protocol === "https:") {
    if (!parsed.hostname || parsed.username || parsed.password) {
      throw new Error("HTTPS Base URI must have a hostname and must not contain credentials.");
    }
    return;
  }

  if (parsed.protocol === "ipfs:") {
    if (!parsed.hostname || parsed.username || parsed.password) {
      throw new Error("IPFS Base URI must include a CID host, for example ipfs://<CID>/.");
    }
    return;
  }

  throw new Error("Only https:// and ipfs:// Base URIs are accepted.");
}

async function main() {
  if (hre.network.name !== "npcHood") {
    throw new Error("Run with --network npcHood. No transaction was sent.");
  }

  const contractAddress = requiredEnv("NPC_HOOD_CONTRACT_ADDRESS");
  const baseUri = requiredEnv("NPC_HOOD_BASE_URI");
  const configuredChainId = BigInt(requiredEnv("NPC_HOOD_CHAIN_ID"));
  validateBaseUri(baseUri);

  if (!hre.ethers.isAddress(contractAddress)) {
    throw new Error("NPC_HOOD_CONTRACT_ADDRESS is not a valid EVM address.");
  }

  const network = await hre.ethers.provider.getNetwork();
  if (network.chainId !== configuredChainId) {
    throw new Error(
      `RPC chain ID ${network.chainId} does not match NPC_HOOD_CHAIN_ID ${configuredChainId}. Nothing was sent.`,
    );
  }
  if (![56n, 97n].includes(network.chainId)) {
    throw new Error(`Unexpected chain ID ${network.chainId}; this project allows BSC Mainnet (56) or Testnet (97) only.`);
  }

  if ((await hre.ethers.provider.getCode(contractAddress)) === "0x") {
    throw new Error(`No contract bytecode found at ${contractAddress} on chain ${network.chainId}. Nothing was sent.`);
  }

  const [signer] = await hre.ethers.getSigners();
  if (!signer) throw new Error("No signer is configured in Hardhat. Nothing was sent.");

  const signerAddress = await signer.getAddress();
  const contract = new hre.ethers.Contract(contractAddress, ABI, signer);
  const ownerAddress = await contract.owner();
  if (ownerAddress.toLowerCase() !== signerAddress.toLowerCase()) {
    throw new Error(
      `Signer ${signerAddress} is not the on-chain owner ${ownerAddress}. Use the owner key; nothing was sent.`,
    );
  }

  const totalMinted = await contract.totalMinted();
  let currentTokenOneUri = "Token #1 has not been minted yet.";
  if (totalMinted > 0n) currentTokenOneUri = await contract.tokenURI(1n);

  console.log("NPC HOOD Base URI update");
  console.log("Mode:", process.env.NPC_HOOD_EXECUTE === "1" ? "EXECUTE" : "DRY RUN");
  console.log("Chain ID:", network.chainId.toString());
  console.log("Contract:", contractAddress);
  console.log("Owner / signer:", ownerAddress);
  console.log("Minted supply:", totalMinted.toString());
  console.log("Current token #1 URI:", currentTokenOneUri);
  console.log("New Base URI:", baseUri);

  // Simulate the owner-only call before either returning from dry-run or sending a transaction.
  await contract.setCollectionBaseURI.staticCall(baseUri);
  const gasEstimate = await contract.setCollectionBaseURI.estimateGas(baseUri);
  console.log("Owner-call simulation: passed");
  console.log("Estimated gas:", gasEstimate.toString());

  const execute = process.env.NPC_HOOD_EXECUTE === "1";
  if (!execute) {
    console.log("Dry run only; no transaction was sent.");
    console.log("To send on testnet, set NPC_HOOD_EXECUTE=1 and rerun.");
    if (network.chainId === 56n) {
      console.log("For mainnet, also set NPC_HOOD_CONFIRM_MAINNET=1 after verifying every value.");
    }
    return;
  }

  if (network.chainId === 56n && process.env.NPC_HOOD_CONFIRM_MAINNET !== "1") {
    throw new Error("Mainnet execution blocked. Set NPC_HOOD_CONFIRM_MAINNET=1 only after reviewing the summary above.");
  }

  const tx = await contract.setCollectionBaseURI(baseUri);
  console.log("Transaction submitted:", tx.hash);
  const receipt = await tx.wait(1);
  if (!receipt || receipt.status !== 1) throw new Error("Transaction was not confirmed successfully.");

  const iface = new hre.ethers.Interface(ABI);
  const updateEvent = receipt.logs
    .map((log) => {
      try {
        return iface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find((event) => event?.name === "CollectionBaseURIChanged");

  if (!updateEvent || updateEvent.args.newBaseURI !== baseUri) {
    throw new Error("Transaction confirmed, but the expected CollectionBaseURIChanged event was not found.");
  }

  console.log("Confirmed in block:", receipt.blockNumber);
  console.log("Verified new Base URI:", updateEvent.args.newBaseURI);
  const explorer = EXPLORERS[Number(network.chainId)];
  if (explorer) console.log("Explorer:", `${explorer}${tx.hash}`);
}

main().catch((error) => {
  console.error("Base URI update stopped:", error.message || error);
  process.exitCode = 1;
});
