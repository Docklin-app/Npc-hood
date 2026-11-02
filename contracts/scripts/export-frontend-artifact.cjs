const fs = require("node:fs");
const path = require("node:path");

const artifactPath = path.join(__dirname, "..", "artifacts", "src", "NpcHood.sol", "NpcHood.json");
const outputPath = path.join(__dirname, "..", "..", "client", "src", "lib", "npcHoodDeployArtifact.ts");

if (!fs.existsSync(artifactPath)) {
  throw new Error("Compiled NpcHood artifact not found. Run npm run compile first.");
}

const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
if (!Array.isArray(artifact.abi) || typeof artifact.bytecode !== "string" || !artifact.bytecode.startsWith("0x")) {
  throw new Error("Compiled NpcHood artifact is missing ABI or deployment bytecode.");
}

const deployArtifact = { abi: artifact.abi, bytecode: artifact.bytecode };
fs.writeFileSync(
  outputPath,
  `export const NPC_HOOD_DEPLOY_ARTIFACT = ${JSON.stringify(deployArtifact, null, 2)} as const;\n`,
);
console.log(`Updated frontend deployment artifact: ${path.relative(path.join(__dirname, "..", ".."), outputPath)}`);
