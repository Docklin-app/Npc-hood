require("dotenv").config();
require("@nomicfoundation/hardhat-ethers");

const rpcUrl = process.env.NPC_HOOD_RPC_URL;
const chainId = process.env.NPC_HOOD_CHAIN_ID ? Number(process.env.NPC_HOOD_CHAIN_ID) : undefined;
const privateKey = process.env.NPC_HOOD_DEPLOYER_PRIVATE_KEY;

const networks = {};
if (rpcUrl && chainId && privateKey) {
  networks.npcHood = {
    url: rpcUrl,
    chainId,
    accounts: [privateKey],
  };
}

module.exports = {
  solidity: "0.8.24",
  paths: {
    sources: "./src",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  networks,
};
