const hre = require("hardhat");

async function main() {
  const baseURI = process.env.NPC_HOOD_BASE_URI;
  if (!baseURI || !baseURI.startsWith("https://") || !baseURI.endsWith("/")) {
    throw new Error("Set NPC_HOOD_BASE_URI to an HTTPS metadata URI prefix ending with / before deployment.");
  }
  if (!process.env.NPC_HOOD_RPC_URL || !process.env.NPC_HOOD_CHAIN_ID || !process.env.NPC_HOOD_DEPLOYER_PRIVATE_KEY) {
    throw new Error("Set RPC URL, chain ID, and deployer private key in contracts/.env. Never commit that file.");
  }

  const configuredChainId = BigInt(process.env.NPC_HOOD_CHAIN_ID);
  const network = await hre.ethers.provider.getNetwork();
  if (network.chainId !== configuredChainId) {
    throw new Error(`RPC chain ID ${network.chainId} does not match NPC_HOOD_CHAIN_ID ${configuredChainId}; nothing was deployed.`);
  }

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying NPC HOOD from:", await deployer.getAddress());
  const NpcHood = await hre.ethers.getContractFactory("NpcHood");
  const collection = await NpcHood.deploy(baseURI);
  await collection.waitForDeployment();
  console.log("NPC HOOD contract:", await collection.getAddress());
  console.log("Owner / proceeds recipient:", await collection.owner());
  console.log("Configured chain ID:", process.env.NPC_HOOD_CHAIN_ID);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
