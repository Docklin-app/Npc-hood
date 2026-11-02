require("dotenv").config();

const required = [
  "NPC_HOOD_RPC_URL",
  "NPC_HOOD_CHAIN_ID",
  "NPC_HOOD_DEPLOYER_PRIVATE_KEY",
  "NPC_HOOD_BASE_URI",
];
const missing = required.filter((key) => !process.env[key]?.trim());
const errors = [];

if (missing.length) errors.push(`Missing required values: ${missing.join(", ")}`);

const chainId = process.env.NPC_HOOD_CHAIN_ID?.trim();
if (chainId && (!/^\d+$/.test(chainId) || !Number.isSafeInteger(Number(chainId)) || Number(chainId) <= 0)) {
  errors.push("NPC_HOOD_CHAIN_ID must be a positive decimal integer, matching the target network.");
}

const rpc = process.env.NPC_HOOD_RPC_URL?.trim();
if (rpc) {
  try {
    const url = new URL(rpc);
    if (!new Set(["https:", "http:"]).has(url.protocol)) errors.push("NPC_HOOD_RPC_URL must use HTTP or HTTPS.");
  } catch {
    errors.push("NPC_HOOD_RPC_URL must be a valid HTTP(S) endpoint.");
  }
}

const privateKey = process.env.NPC_HOOD_DEPLOYER_PRIVATE_KEY?.trim();
if (privateKey && !/^0x[0-9a-fA-F]{64}$/.test(privateKey)) {
  errors.push("NPC_HOOD_DEPLOYER_PRIVATE_KEY must be a 32-byte hex key prefixed by 0x; keep it secret.");
}

const baseURI = process.env.NPC_HOOD_BASE_URI?.trim();
if (baseURI && !/^https:\/\//i.test(baseURI)) errors.push("NPC_HOOD_BASE_URI must start with https://.");
if (baseURI && !baseURI.endsWith("/")) errors.push("NPC_HOOD_BASE_URI must end with / because token IDs are appended directly.");

if (errors.length) {
  console.error("NPC HOOD deployment preflight failed:");
  for (const error of errors) console.error(`- ${error}`);
  console.error("Review contracts/.env.example and contracts/README.md. Nothing was deployed.");
  process.exit(1);
}

console.log("NPC HOOD deployment variables are present and formatted. Confirm the owner wallet and target chain before proceeding.");
