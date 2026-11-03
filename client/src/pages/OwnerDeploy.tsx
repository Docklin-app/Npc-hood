import { BrowserProvider, Contract, ContractFactory, formatEther, isAddress, parseEther, type InterfaceAbi, type Log, type LogDescription } from "ethers";
import { useState } from "react";
import { ArrowLeft, ArrowUpRight, Check, ExternalLink, ShieldCheck, Wallet } from "lucide-react";
import { NPC_HOOD_ABI } from "@/lib/npcHoodAbi";
import { NPC_HOOD_DEPLOY_ARTIFACT } from "@/lib/npcHoodDeployArtifact";

type Network = {
  chainId: number;
  name: string;
  symbol: string;
  explorer: string;
};

type ContractStatus = {
  owner: string;
  mintOpen: boolean;
  minted: string;
  maxSupply: string;
  maxPerTx: string;
  freeFee: string;
  paidPrice: string;
};

const NETWORKS: Network[] = [
  { chainId: 56, name: "BNB Smart Chain Mainnet", symbol: "BNB", explorer: "https://bscscan.com" },
  { chainId: 97, name: "BNB Smart Chain Testnet", symbol: "tBNB", explorer: "https://testnet.bscscan.com" },
];

const DEFAULT_COLLECTION_BASE_URI = "https://raw.githubusercontent.com/Docklin-app/Npc-hood/1289970d7ee7629ce8e546a0ec33fab2dcaad56b/nft-collection/collection/metadata/";

function errorMessage(error: unknown) {
  if (error && typeof error === "object" && "shortMessage" in error) {
    return String((error as { shortMessage: string }).shortMessage);
  }
  if (error && typeof error === "object" && "message" in error) {
    const message = String((error as { message: string }).message);
    if (message.toLowerCase().includes("user rejected")) return "Transaction cancelled in the wallet.";
    return message;
  }
  return "Something went wrong. Check your wallet and network, then try again.";
}

export default function OwnerDeploy() {
  const [selectedChainId, setSelectedChainId] = useState(56);
  const [walletAddress, setWalletAddress] = useState("");
  const [walletChainId, setWalletChainId] = useState<number | null>(null);
  const [metadataUri, setMetadataUri] = useState("");
  const [updatedBaseUri, setUpdatedBaseUri] = useState(DEFAULT_COLLECTION_BASE_URI);
  const [contractInput, setContractInput] = useState("");
  const [contractAddress, setContractAddress] = useState("");
  const [contractStatus, setContractStatus] = useState<ContractStatus | null>(null);
  const [statusMessage, setStatusMessage] = useState("Connect your wallet to begin. This page never asks for a private key.");
  const [txHash, setTxHash] = useState("");
  const [busy, setBusy] = useState(false);
  const [mainnetAcknowledged, setMainnetAcknowledged] = useState(false);

  const network = NETWORKS.find((item) => item.chainId === selectedChainId) ?? NETWORKS[0];
  const onSelectedNetwork = walletChainId === selectedChainId;
  const isOwner = Boolean(
    walletAddress && contractStatus?.owner &&
    walletAddress.toLowerCase() === contractStatus.owner.toLowerCase(),
  );

  const getProvider = () => {
    if (!window.ethereum) throw new Error("No wallet detected. Open this page in a dApp browser such as MetaMask, Trust Wallet, or Binance Wallet.");
    return new BrowserProvider(window.ethereum as ConstructorParameters<typeof BrowserProvider>[0]);
  };

  const connectWallet = async () => {
    setBusy(true);
    setStatusMessage("Requesting wallet connection…");
    try {
      const provider = getProvider();
      const accounts = await provider.send("eth_requestAccounts", []) as string[];
      const chain = await provider.getNetwork();
      setWalletAddress(accounts[0] ?? "");
      setWalletChainId(Number(chain.chainId));
      setStatusMessage(`Wallet connected: ${accounts[0] ?? ""}`);
    } catch (error) {
      setStatusMessage(errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const switchNetwork = async () => {
    if (!window.ethereum) {
      setStatusMessage("No wallet detected. Open this page in a dApp browser.");
      return;
    }
    setBusy(true);
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${selectedChainId.toString(16)}` }],
      });
      const provider = getProvider();
      const chain = await provider.getNetwork();
      setWalletChainId(Number(chain.chainId));
      setStatusMessage(`Active network: ${network.name}.`);
    } catch (error) {
      setStatusMessage(`${errorMessage(error)} If the network is not available yet, add BSC ${selectedChainId === 56 ? "Mainnet (56)" : "Testnet (97)"} in your wallet.`);
    } finally {
      setBusy(false);
    }
  };

  const readContract = async (address: string) => {
    if (!isAddress(address)) throw new Error("Invalid contract address.");
    const provider = getProvider();
    const chain = await provider.getNetwork();
    if (Number(chain.chainId) !== selectedChainId) throw new Error(`Your wallet must be on ${network.name} (Chain ID ${selectedChainId}).`);
    if (await provider.getCode(address) === "0x") throw new Error("That address has no contract code on the selected network.");
    const contract = new Contract(address, NPC_HOOD_ABI, provider);
    const [name, symbol, owner, mintOpen, minted, maxSupply, maxPerTx, freeFee, paidPrice] = await Promise.all([
      contract.name(), contract.symbol(), contract.owner(), contract.mintOpen(), contract.totalMinted(), contract.MAX_SUPPLY(),
      contract.MAX_PER_TX(), contract.FREE_MINT_FEE(), contract.PAID_MINT_PRICE(),
    ]);
    if (
      name !== "NPC HOOD" || symbol !== "HOOD" || BigInt(maxSupply) !== 10_000n ||
      BigInt(maxPerTx) !== 20n || BigInt(freeFee) !== parseEther("0.0001") ||
      BigInt(paidPrice) !== parseEther("0.0003")
    ) throw new Error("The contract does not match the expected NPC HOOD identity or parameters.");
    const result: ContractStatus = {
      owner: String(owner),
      mintOpen: Boolean(mintOpen),
      minted: String(minted),
      maxSupply: String(maxSupply),
      maxPerTx: String(maxPerTx),
      freeFee: formatEther(freeFee),
      paidPrice: formatEther(paidPrice),
    };
    setContractStatus(result);
    setContractAddress(address);
    setContractInput(address);
    return result;
  };

  const loadContract = async () => {
    setBusy(true);
    setTxHash("");
    try {
      await readContract(contractInput.trim());
      setStatusMessage("Contract status loaded from the network.");
    } catch (error) {
      setContractStatus(null);
      setStatusMessage(errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const deployContract = async () => {
    const uri = metadataUri.trim();
    let parsedUri: URL;
    try {
      parsedUri = new URL(uri);
    } catch {
      setStatusMessage("Enter a valid HTTPS metadata Base URI ending with a slash /.");
      return;
    }
    if (parsedUri.protocol !== "https:" || !uri.endsWith("/")) {
      setStatusMessage("The metadata Base URI must use HTTPS and end with a slash /.");
      return;
    }
    if (!mainnetAcknowledged) {
      setStatusMessage("Tick the deployment risk confirmation before continuing.");
      return;
    }

    setBusy(true);
    setTxHash("");
    setStatusMessage(`Prepare the deployment to ${network.name}. Review the deployer address and gas in your wallet.`);
    try {
      const provider = getProvider();
      const chain = await provider.getNetwork();
      if (Number(chain.chainId) !== selectedChainId) throw new Error(`Select ${network.name} in your wallet before deploying.`);
      const signer = await provider.getSigner();
      const factory = new ContractFactory(
        NPC_HOOD_DEPLOY_ARTIFACT.abi as unknown as InterfaceAbi,
        NPC_HOOD_DEPLOY_ARTIFACT.bytecode,
        signer,
      );
      const collection = await factory.deploy(uri);
      const deployment = collection.deploymentTransaction();
      if (deployment?.hash) setTxHash(deployment.hash);
      setStatusMessage("Deployment request sent. Waiting for network confirmation…");
      await collection.waitForDeployment();
      const address = await collection.getAddress();
      setContractAddress(address);
      setContractInput(address);
      const status = await readContract(address);
      if (status.mintOpen) throw new Error("Safety check failed: a new contract must still be closed.");
      setStatusMessage(`Deployment successful. Mint is still CLOSED. The owner must open minting separately when ready. Contract: ${address}`);
      setTxHash(deployment?.hash ?? "");
    } catch (error) {
      setStatusMessage(errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const changeMintState = async (open: boolean) => {
    if (!contractAddress || !contractStatus) {
      setStatusMessage("Load a contract address first.");
      return;
    }
    const actionDescription = open
      ? "Opening mint will let the public mint and pay the listed prices. Make sure the contract, metadata, prices, and opening date are correct. Continue?"
      : "Closing mint will stop new mints. Continue?";
    if (!window.confirm(actionDescription)) return;

    setBusy(true);
    setTxHash("");
    try {
      const provider = getProvider();
      const chain = await provider.getNetwork();
      if (Number(chain.chainId) !== selectedChainId) throw new Error(`Select ${network.name} in your wallet before changing the mint status.`);
      const signer = await provider.getSigner();
      const signerAddress = await signer.getAddress();
      const contract = new Contract(contractAddress, NPC_HOOD_ABI, signer);
      const currentOwner = String(await contract.owner());
      if (signerAddress.toLowerCase() !== currentOwner.toLowerCase()) {
        throw new Error(`The active wallet is not the contract owner. Owner: ${currentOwner}`);
      }
      const tx = await contract.setMintOpen(open);
      setTxHash(tx.hash as string);
      setStatusMessage(`Request to ${open ? "open" : "close"} mint is waiting for wallet approval…`);
      await tx.wait();
      const updated = await readContract(contractAddress);
      setStatusMessage(`Transaction successful. Mint status is now ${updated.mintOpen ? "OPEN" : "CLOSED"}.`);
    } catch (error) {
      setStatusMessage(errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const updateCollectionBaseUri = async () => {
    if (!contractAddress || !contractStatus) {
      setStatusMessage("Load a contract address first.");
      return;
    }

    const uri = updatedBaseUri.trim();
    let parsedUri: URL;
    try {
      parsedUri = new URL(uri);
    } catch {
      setStatusMessage("Enter a valid HTTPS Base URI ending with a slash /.");
      return;
    }
    if (parsedUri.protocol !== "https:" || !parsedUri.hostname || !uri.endsWith("/") || parsedUri.search || parsedUri.hash || parsedUri.username || parsedUri.password) {
      setStatusMessage("The Base URI must be a valid HTTPS URL, without a query or fragment, and end with /.");
      return;
    }

    const confirmed = window.confirm(
      `Update this NPC HOOD contract's Base URI?\n\nNew URI:\n${uri}\n\nThis change applies to the metadata of the whole collection. Your wallet will ask for approval and gas. Continue?`,
    );
    if (!confirmed) return;

    setBusy(true);
    setTxHash("");
    try {
      const provider = getProvider();
      const chain = await provider.getNetwork();
      if (Number(chain.chainId) !== selectedChainId) throw new Error(`Select ${network.name} in your wallet before changing the Base URI.`);

      const signer = await provider.getSigner();
      const signerAddress = await signer.getAddress();
      const contract = new Contract(contractAddress, NPC_HOOD_ABI, signer);
      const currentOwner = String(await contract.owner());
      if (signerAddress.toLowerCase() !== currentOwner.toLowerCase()) {
        throw new Error(`The active wallet is not the contract owner. Owner: ${currentOwner}`);
      }

      await contract.setCollectionBaseURI.staticCall(uri);
      const tx = await contract.setCollectionBaseURI(uri);
      setTxHash(tx.hash as string);
      setStatusMessage("Base URI change request sent. Review and approve the transaction in your wallet…");
      const receipt = await tx.wait();
      if (!receipt || receipt.status !== 1) throw new Error("The Base URI change transaction was not confirmed successfully.");

      const changedEvent = receipt.logs
        .map((log: Log) => {
          try {
            return contract.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find((event: LogDescription | null) => event?.name === "CollectionBaseURIChanged");
      if (!changedEvent || changedEvent.args.newBaseURI !== uri) {
        throw new Error("The transaction was confirmed, but the expected Base URI event was not found.");
      }

      setStatusMessage(`Base URI updated for the collection. URI: ${uri}`);
    } catch (error) {
      setStatusMessage(errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="owner-deploy-page">
      <header className="owner-deploy-header">
        <a href="./" className="owner-brand"><span className="owner-brand-mark">N</span><span>NPC HOOD <small>OWNER CONSOLE</small></span></a>
        <a href="./" className="owner-back"><ArrowLeft size={15} /> Back to site</a>
      </header>

      <div className="owner-deploy-main">
        <div className="owner-deploy-title">
          <span className="owner-kicker">BSC MAINNET / CONTRACT CONTROL</span>
          <h1>Deploy.<br /><em>Stay closed.</em></h1>
          <p>Deploy and manage the NFT contract through your wallet. No private key is ever entered on this page. New contracts are always created with mint closed.</p>
        </div>

        <div className="owner-audit-alert" role="note"><ShieldCheck size={15} /><span><strong>Not independently audited.</strong> Automated tests are not a security audit. Test on BSC Testnet first and make sure all metadata is ready before a Mainnet deployment.</span></div>

        <section className="owner-panel" aria-labelledby="wallet-title">
          <div className="owner-panel-title"><span>01 / WALLET & NETWORK</span><span className={walletAddress && onSelectedNetwork ? "owner-status-dot is-ready" : "owner-status-dot"} /></div>
          <div className="owner-form-grid">
            <label className="owner-field"><span>TARGET NETWORK</span>
              <select value={selectedChainId} onChange={(event) => {
                setSelectedChainId(Number(event.target.value));
                setContractStatus(null);
                setStatusMessage("Target network changed. Reload the contract status before any owner action.");
              }} disabled={busy}>
                {NETWORKS.map((item) => <option value={item.chainId} key={item.chainId}>{item.name} ({item.chainId})</option>)}
              </select>
            </label>
            <div className="owner-wallet-actions">
              <button className="owner-button owner-button-secondary" onClick={connectWallet} disabled={busy}><Wallet size={15} /> {walletAddress ? `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}` : "Connect wallet"}</button>
              {walletAddress && !onSelectedNetwork && <button className="owner-button owner-button-quiet" onClick={switchNetwork} disabled={busy}>Switch network to {selectedChainId}</button>}
            </div>
          </div>
          <div className="owner-network-note">Chain ID <strong>{selectedChainId}</strong> · Currency <strong>{network.symbol}</strong> · <a href={`${network.explorer}/`} target="_blank" rel="noreferrer">Open explorer <ExternalLink size={12} /></a></div>
        </section>

        <section className="owner-panel" aria-labelledby="deploy-title">
          <div className="owner-panel-title"><span>02 / DEPLOY ERC-721</span><span className="owner-panel-caption">SUPPLY MAX 10,000</span></div>
          <h2 id="deploy-title">Create the NPC HOOD contract</h2>
          <p className="owner-panel-copy">Enter a stable HTTPS metadata Base URI. The first token will use ID 1 and metadata URLs will be Base URI + ID.</p>
          <label className="owner-field"><span>BASE URI METADATA</span><input value={metadataUri} onChange={(event) => setMetadataUri(event.target.value)} placeholder="https://metadata.example/npc/" autoComplete="url" /></label>
          <div className="owner-contract-facts"><span>ERC-721 <b>HOOD</b></span><span>Free Mint fee <b>0.0001 {network.symbol}</b></span><span>Paid Mint <b>0.0003 {network.symbol}</b></span><span>Limit <b>20 / transaction</b></span></div>
          <label className="owner-confirm"><input type="checkbox" checked={mainnetAcknowledged} onChange={(event) => setMainnetAcknowledged(event.target.checked)} /><span>I understand that an on-chain deployment cannot be undone and requires gas. Mint stays closed after deployment; the owner must open it separately.</span></label>
          <button className="owner-button owner-button-primary" onClick={deployContract} disabled={busy || !walletAddress || !onSelectedNetwork || !mainnetAcknowledged}>
            {busy ? "WAITING FOR WALLET / NETWORK…" : `Deploy to ${network.name}`} <ArrowUpRight size={16} />
          </button>
        </section>

        <section className="owner-panel" aria-labelledby="manage-title">
          <div className="owner-panel-title"><span>03 / OWNER CONTROLS</span><span className="owner-panel-caption">OWNER ONLY</span></div>
          <h2 id="manage-title">Contract status & controls</h2>
          <p className="owner-panel-copy">Load a deployed contract to see its status. The owner wallet can change the Base URI and manage minting.</p>
          <div className="owner-load-row">
            <label className="owner-field"><span>CONTRACT ADDRESS</span><input value={contractInput} onChange={(event) => setContractInput(event.target.value)} placeholder="0x..." spellCheck={false} /></label>
            <button className="owner-button owner-button-secondary" onClick={loadContract} disabled={busy || !walletAddress || !onSelectedNetwork}>Load status</button>
          </div>
          {contractStatus && <>
            <div className="owner-contract-link"><code>{contractAddress}</code><a href={`${network.explorer}/address/${contractAddress}`} target="_blank" rel="noreferrer">View in explorer <ExternalLink size={13} /></a></div>
            <div className="owner-status-grid">
              <div><span>STATUS MINT</span><strong className={contractStatus.mintOpen ? "mint-open" : "mint-closed"}>{contractStatus.mintOpen ? "OPEN" : "CLOSED"}</strong></div>
              <div><span>SUPPLY</span><strong>{Number(contractStatus.minted).toLocaleString("en-US")} / {Number(contractStatus.maxSupply).toLocaleString("en-US")}</strong></div>
              <div><span>MAX / TX</span><strong>{contractStatus.maxPerTx}</strong></div>
              <div><span>FREE / PAID</span><strong>{contractStatus.freeFee} / {contractStatus.paidPrice} {network.symbol}</strong></div>
            </div>
            <div className="owner-owner-row"><span>OWNER ADDRESS</span><code>{contractStatus.owner}</code>{isOwner ? <span className="owner-badge"><Check size={12} /> WALLET OWNER</span> : <span className="owner-notice">The connected wallet is not the owner</span>}</div>
            <div className="owner-base-uri-update">
              <label className="owner-field"><span>NEW BASE URI — METADATA</span><input value={updatedBaseUri} onChange={(event) => setUpdatedBaseUri(event.target.value)} placeholder="https://.../metadata/" autoComplete="url" spellCheck={false} /></label>
              <p className="owner-warning"><ShieldCheck size={14} /> Changing the Base URI will point the whole collection's metadata to this URL. Do not use the Deploy button for an existing contract.</p>
              <button className="owner-button owner-button-secondary" onClick={updateCollectionBaseUri} disabled={busy || !isOwner || !onSelectedNetwork}>
                {busy ? "WAITING FOR WALLET / NETWORK…" : "Update Base URI"}
              </button>
            </div>
            <div className="owner-control-actions">
              <button className="owner-button owner-button-primary" onClick={() => changeMintState(true)} disabled={busy || !isOwner || !onSelectedNetwork || contractStatus.mintOpen}>Open mint manually</button>
              <button className="owner-button owner-button-danger" onClick={() => changeMintState(false)} disabled={busy || !isOwner || !onSelectedNetwork || !contractStatus.mintOpen}>Close mint</button>
            </div>
            <p className="owner-warning"><ShieldCheck size={14} /> The deploy button does not open mint. The “Open mint manually” button asks for confirmation and then the owner wallet's signature.</p>
          </>}
        </section>

        <aside className="owner-status-box" role="status" aria-live="polite">
          <span className="owner-status-signal" />
          <div><strong>LOG</strong><p>{statusMessage}</p>{txHash && <a href={`${network.explorer}/tx/${txHash}`} target="_blank" rel="noreferrer">View transaction <ExternalLink size={12} /></a>}</div>
        </aside>

        <footer className="owner-deploy-footer">NPC HOOD / OWNER TOOLS · Never enter a seed phrase or private key into a web page.</footer>
      </div>
    </main>
  );
}
