import { BrowserProvider, Contract, formatEther, parseEther } from "ethers";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  ExternalLink,
  Layers3,
  Menu,
  Minus,
  Plus,
  ShieldCheck,
  Wallet,
  X,
} from "lucide-react";
import { NPC_HOOD_ABI } from "@/lib/npcHoodAbi";
import AgentMintPromptBuilder from "@/components/AgentMintPromptBuilder";
import RecentMints from "@/components/RecentMints";
import ShareMint from "@/components/ShareMint";
import MyNpcs from "@/components/MyNpcs";
import Leaderboard from "@/components/Leaderboard";
import RaceToChapter from "@/components/RaceToChapter";
import CollectionExplorer from "@/components/CollectionExplorer";
import { fetchTokenMeta, padTokenId, readTokenOwner, readTotalMinted } from "@/lib/hoodData";
import TownAwakening from "@/components/TownAwakening";

type InjectedWallet = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, listener: (...args: unknown[]) => void) => void;
};

declare global {
  interface Window {
    ethereum?: InjectedWallet;
  }
}

type MintMode = "free" | "paid";
type TxState = "idle" | "signature" | "pending" | "success" | "error";

const TOTAL_SUPPLY = 10_000;
const MAX_PER_TX = 20;
const FREE_FEE = parseEther("0.0001");
const PAID_PRICE = parseEther("0.0003");
const CONTRACT_ADDRESS = import.meta.env.VITE_NPC_HOOD_CONTRACT_ADDRESS?.trim() || "0xe986CA162b99B0A3972F37045b83cA15C842b905";
const CHAIN_ID_RAW = import.meta.env.VITE_NPC_HOOD_CHAIN_ID?.trim() || "56";
const CHAIN_ID = /^\d+$/.test(CHAIN_ID_RAW) ? Number(CHAIN_ID_RAW) : null;
const CHAIN_NAME = import.meta.env.VITE_NPC_HOOD_CHAIN_NAME?.trim() || "BNB Smart Chain";
const CURRENCY = import.meta.env.VITE_NPC_HOOD_CURRENCY_SYMBOL?.trim() || "BNB";
const EXPLORER_URL = import.meta.env.VITE_NPC_HOOD_EXPLORER_URL?.trim().replace(/\/$/, "") || "https://bscscan.com";
const HERO_IMAGE = "/assets/npc-hood-hero.png";

const isAddress = /^0x[a-fA-F0-9]{40}$/.test(CONTRACT_ADDRESS);
const hasConfig = Boolean(isAddress && CHAIN_ID !== null && Number.isSafeInteger(CHAIN_ID) && CHAIN_ID > 0);

function shortAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function getErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "shortMessage" in error) {
    return String((error as { shortMessage: string }).shortMessage);
  }
  if (error && typeof error === "object" && "message" in error) {
    const message = String((error as { message: string }).message);
    if (message.toLowerCase().includes("user rejected")) return "Signature cancelled in the wallet.";
    return message;
  }
  return "Transaction failed. Check your wallet and try again.";
}

function PixelMark() {
  return (
    <span className="pixel-mark" aria-hidden="true">
      <i /><i /><i /><i /><i /><i /><i /><i /><i />
    </span>
  );
}

export default function Home() {
  const [account, setAccount] = useState<string | null>(null);
  const [walletChain, setWalletChain] = useState<number | null>(null);
  const [minted, setMinted] = useState<number | null>(null);
  const [contractVerified, setContractVerified] = useState(false);
  const [mintOpen, setMintOpen] = useState(false);
  const [contractWarning, setContractWarning] = useState("");
  const [mode, setMode] = useState<MintMode>("free");
  const [quantity, setQuantity] = useState(1);
  const [txState, setTxState] = useState<TxState>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(0);
  const [lastMintIds, setLastMintIds] = useState<number[]>([]);
  const [connecting, setConnecting] = useState(false);
  const [liveToast, setLiveToast] = useState<{ id: number; owner: string; label: string; image: string; extra: number } | null>(null);
  const [celebrating, setCelebrating] = useState(false);
  const prevTotalRef = useRef<number | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const remaining = minted === null ? null : Math.max(0, TOTAL_SUPPLY - minted);
  const perItem = mode === "free" ? FREE_FEE : PAID_PRICE;
  const totalCost = perItem * BigInt(quantity);
  const amountText = useMemo(() => Number(formatEther(totalCost)).toFixed(4), [totalCost]);
  const onTargetNetwork = hasConfig && walletChain === CHAIN_ID;

  const refreshSupply = useCallback(async (provider: BrowserProvider) => {
    if (!hasConfig) return;
    try {
      const network = await provider.getNetwork();
      if (Number(network.chainId) !== CHAIN_ID) {
        setContractVerified(false);
        setMintOpen(false);
        return;
      }
      const contract = new Contract(CONTRACT_ADDRESS, NPC_HOOD_ABI, provider);
      const [total, cap, perTx, freeFee, paidPrice, onChainMintOpen] = await Promise.all([
        contract.totalMinted(), contract.MAX_SUPPLY(), contract.MAX_PER_TX(), contract.FREE_MINT_FEE(), contract.PAID_MINT_PRICE(), contract.mintOpen(),
      ]);
      const onChainCap = Number(cap);
      const onChainPerTx = Number(perTx);
      const totalCount = Number(total);
      if (Number.isSafeInteger(onChainCap) && Number.isSafeInteger(onChainPerTx) && Number.isSafeInteger(totalCount) && onChainCap === TOTAL_SUPPLY && onChainPerTx === MAX_PER_TX && freeFee === FREE_FEE && paidPrice === PAID_PRICE) {
        setMinted(totalCount);
        setContractVerified(true);
        setMintOpen(Boolean(onChainMintOpen));
        setContractWarning("");
      } else {
        setContractVerified(false);
        setMintOpen(false);
        setContractWarning("The contract does not match NPC HOOD's supply, per-transaction limit, or prices.");
      }
    } catch (error) {
      setContractVerified(false);
      setMintOpen(false);
      setContractWarning("The contract could not be verified on this network. Check the chain ID and contract address.");
      console.warn("Could not read NPC HOOD contract state", error);
    }
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;
    const injected = window.ethereum;
    const provider = new BrowserProvider(injected as ConstructorParameters<typeof BrowserProvider>[0]);
    const sync = async () => {
      try {
        const accounts = await injected.request({ method: "eth_accounts" }) as string[];
        const chainHex = await injected.request({ method: "eth_chainId" }) as string;
        setAccount(accounts?.[0] ?? null);
        setWalletChain(Number.parseInt(chainHex, 16));
        await refreshSupply(provider);
      } catch {
        // Wallet is optional until a visitor explicitly connects.
      }
    };
    const handleAccounts = (...args: unknown[]) => {
      const accounts = args[0] as string[] | undefined;
      setAccount(accounts?.[0] ?? null);
    };
    const handleChain = (...args: unknown[]) => {
      const chainHex = String(args[0] ?? "0x0");
      setWalletChain(Number.parseInt(chainHex, 16));
      setMinted(null);
      setContractVerified(false);
      void sync();
    };
    injected.on?.("accountsChanged", handleAccounts);
    injected.on?.("chainChanged", handleChain);
    void sync();
    return () => {
      injected.removeListener?.("accountsChanged", handleAccounts);
      injected.removeListener?.("chainChanged", handleChain);
    };
  }, [refreshSupply]);

  // Live mint watcher: polls the public mint counter so a mint landing
  // anywhere in the world pops a toast here and refreshes the boards,
  // even for visitors without a wallet connected.
  useEffect(() => {
    if (!hasConfig) return;
    let cancelled = false;
    const tick = async () => {
      const total = await readTotalMinted(CONTRACT_ADDRESS);
      if (cancelled || total === null) return;
      const prev = prevTotalRef.current;
      prevTotalRef.current = total;
      setMinted((current) => (current === total ? current : total));
      if (prev !== null && total > prev) {
        const [owner, meta] = await Promise.all([
          readTokenOwner(CONTRACT_ADDRESS, total),
          fetchTokenMeta(CONTRACT_ADDRESS, total),
        ]);
        if (cancelled) return;
        setLiveToast({
          id: total,
          owner: owner ?? "",
          label: meta.character || meta.name,
          image: meta.image,
          extra: total - prev - 1,
        });
        if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
        toastTimerRef.current = window.setTimeout(() => setLiveToast(null), 9000);
      }
    };
    void tick();
    const timer = window.setInterval(() => void tick(), 30000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const connectWallet = async () => {
    setNotice("");
    if (!window.ethereum) {
      setNotice("No Web3 wallet found in this browser. Open npcshood.xyz inside your wallet app's browser (MetaMask, Trust Wallet, or Binance Wallet) — a regular browser tab cannot connect a wallet.");
      return;
    }
    setConnecting(true);
    try {
      const provider = new BrowserProvider(window.ethereum as ConstructorParameters<typeof BrowserProvider>[0]);
      let accounts: string[];
      try {
        accounts = await provider.send("eth_requestAccounts", []) as string[];
      } catch {
        accounts = await window.ethereum.request({ method: "eth_requestAccounts" }) as string[];
      }
      const network = await provider.getNetwork();
      setAccount(accounts[0] ?? null);
      setWalletChain(Number(network.chainId));
      await refreshSupply(provider);
    } catch (error) {
      setNotice(getErrorMessage(error));
    } finally {
      setConnecting(false);
    }
  };

  const changeNetwork = async () => {
    if (!window.ethereum || !hasConfig || !CHAIN_ID) return;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${CHAIN_ID.toString(16)}` }],
      });
      setNotice("Network switch request sent to your wallet.");
    } catch (error) {
      const code = error && typeof error === "object" && "code" in error ? Number((error as { code: unknown }).code) : 0;
      const manualStep = code === 4902
        ? `The ${CHAIN_NAME} network is not known to your wallet. Add it manually with the chain ID and the network's official RPC, then try again.`
        : `Select ${CHAIN_NAME} in your wallet before minting.`;
      setNotice(`Could not switch the network automatically. ${manualStep} ${getErrorMessage(error)}`);
    }
  };

  const submitMint = async () => {
    setNotice("");
    setTxHash(null);
    if (!hasConfig) {
      setNotice("Mint is not active yet: the contract address and chain ID are not configured.");
      setTxState("error");
      return;
    }
    if (!window.ethereum) {
      setNotice("Connect an EVM wallet first.");
      setTxState("error");
      return;
    }
    if (!account) {
      await connectWallet();
      return;
    }
    if (!onTargetNetwork) {
      await changeNetwork();
      return;
    }
    if (!contractVerified) {
      setTxState("error");
      setNotice(contractWarning || "The contract must be verified before a transaction can be sent.");
      return;
    }
    if (!mintOpen) {
      setTxState("error");
      setNotice("Mint is still closed. Wait until the contract owner opens it.");
      return;
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_PER_TX || (remaining !== null && quantity > remaining)) {
      setNotice("Invalid mint quantity, or it exceeds the remaining supply.");
      setTxState("error");
      return;
    }
    try {
      const assertTargetChain = async () => {
        const rawChainId = await window.ethereum!.request({ method: "eth_chainId" });
        const activeChainId = Number.parseInt(String(rawChainId), 16);
        setWalletChain(activeChainId);
        if (!Number.isSafeInteger(activeChainId) || activeChainId !== CHAIN_ID) {
          setContractVerified(false);
          setMinted(null);
          throw new Error(`Your wallet switched networks; the mint was cancelled because the target is ${CHAIN_NAME}.`);
        }
      };
      await assertTargetChain();
      const provider = new BrowserProvider(window.ethereum as ConstructorParameters<typeof BrowserProvider>[0]);
      const providerNetwork = await provider.getNetwork();
      if (Number(providerNetwork.chainId) !== CHAIN_ID) {
        setContractVerified(false);
        setMinted(null);
        throw new Error(`The provider chain does not match the ${CHAIN_NAME} target. Mint cancelled.`);
      }
      const signer = await provider.getSigner();
      await assertTargetChain();
      const contract = new Contract(CONTRACT_ADDRESS, NPC_HOOD_ABI, signer);
      const method = mode === "free" ? "freeMint" : "paidMint";
      setTxState("signature");
      const transaction = await contract[method](BigInt(quantity), { value: perItem * BigInt(quantity) });
      setTxHash(transaction.hash as string);
      setTxState("pending");
      setNotice("Transaction sent. Waiting for network confirmation.");
      const receipt = await transaction.wait();
      const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
      const mintedIds: number[] = [];
      if (receipt && account) {
        const meTopic = `0x${account.toLowerCase().replace("0x", "").padStart(64, "0")}`;
        const zeroTopic = `0x${"0".repeat(64)}`;
        for (const log of receipt.logs) {
          const topics = (log as { topics?: readonly string[] }).topics ?? [];
          if (
            topics[0]?.toLowerCase() === TRANSFER_TOPIC &&
            topics[1]?.toLowerCase() === zeroTopic &&
            topics[2]?.toLowerCase() === meTopic &&
            topics[3]
          ) {
            mintedIds.push(Number(BigInt(topics[3])));
          }
        }
      }
      if (mintedIds.length > 0) setLastMintIds(mintedIds);
      setTxState("success");
      setCelebrating(true);
      window.setTimeout(() => setCelebrating(false), 2400);
      setNotice("Mint successful. Thank you for being part of NPC HOOD.");
      await refreshSupply(provider);
    } catch (error) {
      setTxState("error");
      setNotice(getErrorMessage(error));
    }
  };

  const progress = minted === null ? 0 : Math.min(100, (minted / TOTAL_SUPPLY) * 100);
  const mintLabel = !hasConfig ? "MINT NOT ACTIVE" : !account ? "CONNECT WALLET" : !onTargetNetwork ? "SWITCH NETWORK" : !contractVerified ? "VERIFYING CONTRACT" : !mintOpen ? "MINT NOT OPEN YET" : txState === "signature" ? "AWAITING SIGNATURE" : txState === "pending" ? "TRANSACTION PENDING" : "MINT NPC HOOD";

  return (
    <div className="site-shell" id="top">
      <header className="site-header">
        <a href="#top" className="brand" aria-label="NPC HOOD home">
          <PixelMark />
          <span className="brand-copy"><strong>NPC<span>HOOD</span></strong><small>PIXEL COLLECTIVE</small></span>
        </a>
        <nav className={mobileNavOpen ? "main-nav is-open" : "main-nav"} aria-label="Main navigation">
          <a href="#collection" onClick={() => setMobileNavOpen(false)}>Collection</a>
          <a href="#mint" onClick={() => setMobileNavOpen(false)}>Mint</a>
          <a href="#agent-mint" onClick={() => setMobileNavOpen(false)}>AI Agent</a>
          <a href="#my-npcs" onClick={() => setMobileNavOpen(false)}>My Hood</a>
          <a href="#town" onClick={() => setMobileNavOpen(false)}>Town</a>
          <a href="#lore" onClick={() => setMobileNavOpen(false)}>Story</a>
          <a href="#faq" onClick={() => setMobileNavOpen(false)}>FAQ</a>
        </nav>
        <div className="header-actions">
          <span className={hasConfig ? "network-pill network-ready" : "network-pill"} title={hasConfig ? `Chain ID ${CHAIN_ID}` : "Chain not configured"}>
            <span className="network-dot" /> {hasConfig ? CHAIN_NAME : "NETWORK SETUP"}
          </span>
          <button className="wallet-button" onClick={connectWallet} disabled={connecting}>
            {connecting ? <span className="button-spinner" /> : <Wallet size={15} strokeWidth={2.2} />} {account ? shortAddress(account) : connecting ? "CONNECTING…" : "CONNECT WALLET"}
          </button>
          <button className="nav-toggle" aria-label={mobileNavOpen ? "Close menu" : "Open menu"} onClick={() => setMobileNavOpen(!mobileNavOpen)}>
            {mobileNavOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {notice && txState === "idle" && (
        <div className="wallet-banner" role="status" aria-live="polite">{notice}</div>
      )}

      {celebrating && (
        <div className="pixel-burst" aria-hidden="true">
          {Array.from({ length: 42 }).map((_, i) => (
            <span
              key={i}
              style={{
                left: `${(i * 37) % 100}%`,
                animationDelay: `${(i % 14) * 0.11}s`,
                background: ["#e4b848", "#f0ce74", "#7fb069", "#f4f1e8"][i % 4],
                width: 5 + (i % 3) * 3,
                height: 5 + (i % 3) * 3,
              }}
            />
          ))}
        </div>
      )}

      {liveToast && (
        <div className="mint-toast" role="status">
          <img src={liveToast.image} alt="" />
          <div>
            <strong>JUST MINTED · #{padTokenId(liveToast.id)}</strong>
            <span>
              {liveToast.label}
              {liveToast.owner ? ` — by ${shortAddress(liveToast.owner)}` : ""}
              {liveToast.extra > 0 ? ` · +${liveToast.extra} more` : ""}
            </span>
          </div>
          <button onClick={() => setLiveToast(null)} aria-label="Dismiss notification">
            <X size={14} />
          </button>
        </div>
      )}

      <main>
        <section className="hero-section" aria-labelledby="hero-title">
          <div className="hero-copy">
            <h1 id="hero-title">EVERY TOWN<br /><span>HAS ITS</span> <em>HOOD.</em></h1>
            <p className="hero-lede">Small characters. Big stories. Meet the hooded NPCs who keep watch over the corners of our pixel town.</p>
            <div className="hero-facts">
              <div><span className="fact-number">10K</span><span className="fact-label">TOTAL SUPPLY</span></div>
            </div>
            <div className="hero-ctas">
              <a href="#mint" className="button-primary">EXPLORE MINT <ArrowDown size={16} /></a>
              <a href="#collection" className="button-text">VIEW COLLECTION <ArrowRight size={15} /></a>
            </div>
          </div>

          <div className="hero-art-wrap">
            <div className="hero-art-frame">
              <img src={HERO_IMAGE} alt="Pixel-art character in a green hood and green hat, in a town at dusk" className="hero-art" />
              <span className="sparkle" style={{ top: "12%", left: "18%", animationDelay: "0.2s" }} />
              <span className="sparkle" style={{ top: "22%", left: "74%", animationDelay: "1.1s" }} />
              <span className="sparkle" style={{ top: "8%", left: "52%", animationDelay: "1.8s" }} />
              <span className="sparkle" style={{ top: "38%", left: "88%", animationDelay: "0.6s" }} />
              <span className="sparkle" style={{ top: "16%", left: "36%", animationDelay: "2.3s" }} />
              <span className="sparkle" style={{ top: "30%", left: "8%", animationDelay: "1.5s" }} />
              <div className="art-corner art-corner-tl" /><div className="art-corner art-corner-br" />
            </div>
          </div>
        </section>

        <section className="mint-section" id="mint" aria-labelledby="mint-title">
          <div className="mint-intro">
            <div className="section-kicker">YOUR NEXT CHARACTER <span>↘</span></div>
            <h2 id="mint-title">Pick your<br /><em>hood.</em></h2>
            <p>Every mint becomes part of the story. Pick your route and confirm right in your wallet.</p>
          </div>

          <div className="mint-card">
            <div className="mint-card-top"><span><span className="live-dot" /> MINT WINDOW</span><span className="card-code">NH / 10.000</span></div>
            <div className="mint-card-title-row"><h3>Choose your route</h3><span className="card-spark">✳</span></div>
            <div className="mint-modes" role="tablist" aria-label="Choose mint type">
              <button className={mode === "free" ? "mint-mode selected" : "mint-mode"} onClick={() => setMode("free")} role="tab" aria-selected={mode === "free"}>
                <span className="mode-head"><span>01 / FREE MINT</span><Check size={14} /></span>
                <strong>0.0001 <small>{CURRENCY}</small></strong>
                <span className="mode-foot">FEE PER NFT · NATIVE COIN</span>
              </button>
              <button className={mode === "paid" ? "mint-mode selected" : "mint-mode"} onClick={() => setMode("paid")} role="tab" aria-selected={mode === "paid"}>
                <span className="mode-head"><span>02 / PAID MINT</span><Check size={14} /></span>
                <strong>0.0003 <small>{CURRENCY}</small></strong>
                <span className="mode-foot">PRICE PER NFT · NATIVE COIN</span>
              </button>
            </div>
            <div className="quantity-row">
              <div><span className="quantity-label">QUANTITY</span><small>Up to {Math.min(remaining ?? MAX_PER_TX, MAX_PER_TX)} / tx</small></div>
              <div className="quantity-control">
                <button aria-label="Decrease quantity" onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1}><Minus size={14} /></button>
                <span>{String(quantity).padStart(2, "0")}</span>
                <button aria-label="Increase quantity" onClick={() => setQuantity(Math.min(quantity + 1, remaining ?? MAX_PER_TX, MAX_PER_TX))} disabled={quantity >= Math.min(remaining ?? MAX_PER_TX, MAX_PER_TX)}><Plus size={14} /></button>
              </div>
            </div>
            <div className="total-row"><span>TOTAL DUE <small>{quantity} × {mode === "free" ? "0.0001" : "0.0003"} {CURRENCY}</small></span><strong>{amountText} <small>{CURRENCY}</small></strong></div>
            <div className="mint-progress" aria-label="Mint progress">
              <div className="progress-label"><span>{minted === null ? "SUPPLY CHECK" : "MINTED"}</span><strong>{minted === null ? "CONNECT TO READ" : `${minted.toLocaleString("en-US")} / 10,000`}</strong></div>
              <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
              <div className="progress-legend"><span>{remaining === null ? "On-chain count appears after connection" : `${remaining.toLocaleString("en-US")} REMAINING`}</span><Layers3 size={14} /></div>
            </div>
            <button className={hasConfig && mintOpen ? "mint-submit" : "mint-submit disabled"} onClick={submitMint} disabled={!hasConfig || txState === "signature" || txState === "pending"}>
              {txState === "signature" || txState === "pending" ? <span className="button-spinner" /> : <span className="mint-submit-mark">✳</span>}
              {mintLabel}<ArrowUpRight size={17} />
            </button>
            {!hasConfig && <div className="config-alert"><span className="config-alert-dot" /><span><strong>CONTRACT NOT CONFIGURED</strong> — set the chain ID and contract address before live minting.</span></div>}
            {hasConfig && contractWarning && <div className="config-alert"><span className="config-alert-dot" /><span><strong>CONTRACT CHECK</strong> — {contractWarning}</span></div>}
            {hasConfig && contractVerified && !mintOpen && <div className="config-alert"><span className="config-alert-dot" /><span><strong>MINT CLOSED</strong> — waiting for the owner to open minting from the contract.</span></div>}
            {account && hasConfig && !onTargetNetwork && <button className="network-alert" onClick={changeNetwork}>Your wallet is on another network. Switch to {CHAIN_NAME}? <ChevronDown size={14} /></button>}
            {notice && <div className={`tx-message ${txState}`} role="status" aria-live="polite">{txState === "success" && <Check size={15} />}{notice}{txHash && <a href={EXPLORER_URL ? `${EXPLORER_URL}/tx/${txHash}` : undefined} target="_blank" rel="noreferrer" className={EXPLORER_URL ? "tx-link" : "tx-hash"}>{EXPLORER_URL ? <> VIEW TX <ExternalLink size={12} /></> : shortAddress(txHash)}</a>}</div>}
            <p className="mint-disclaimer"><ShieldCheck size={12} /> Review network, amount, and gas in your wallet. Never share your recovery phrase.</p>
          </div>
        </section>

        {lastMintIds.length > 0 && (
          <ShareMint
            tokenIds={lastMintIds}
            contractAddress={CONTRACT_ADDRESS}
            explorerUrl={EXPLORER_URL}
            onClose={() => setLastMintIds([])}
          />
        )}

        <RecentMints
          contractAddress={CONTRACT_ADDRESS}
          explorerUrl={EXPLORER_URL}
          configured={hasConfig}
          refreshSignal={minted}
        />

        <MyNpcs
          account={account}
          contractAddress={CONTRACT_ADDRESS}
          explorerUrl={EXPLORER_URL}
          configured={hasConfig}
          onConnect={connectWallet}
        />

        <Leaderboard
          contractAddress={CONTRACT_ADDRESS}
          explorerUrl={EXPLORER_URL}
          configured={hasConfig}
          refreshSignal={minted}
        />

        <RaceToChapter
          contractAddress={CONTRACT_ADDRESS}
          explorerUrl={EXPLORER_URL}
          configured={hasConfig}
          refreshSignal={minted}
        />

        <AgentMintPromptBuilder
          account={account}
          chainId={CHAIN_ID}
          chainName={CHAIN_NAME}
          contractAddress={CONTRACT_ADDRESS}
          currency={CURRENCY}
          configured={hasConfig}
          mintOpen={mintOpen}
          quantity={quantity}
        />


        <section className="collection-section" id="collection">
          <div className="collection-heading">
            <p>They may be NPCs in another world.<br />Here, every character has a place.</p>
          </div>
          <div className="gallery-grid">
            <article className="gallery-card gallery-card-one"><div className="gallery-art"><img src="/assets/npc-hood-gallery-1.webp" alt="Forest keeper in a dark green hood" loading="lazy" /></div><div className="gallery-meta"><span>FILE 0002 / THE WATCHER</span><span>01 <ArrowUpRight size={13} /></span></div></article>
            <article className="gallery-card gallery-card-two"><div className="gallery-art"><img src="/assets/npc-hood-gallery-2.webp" alt="Street NPC in a green hood with pixel glasses" loading="lazy" /></div><div className="gallery-meta"><span>FILE 0047 / NIGHT SHIFT</span><span>02 <ArrowUpRight size={13} /></span></div></article>
            <article className="gallery-card gallery-card-three"><div className="gallery-art"><img src="/assets/npc-hood-gallery-3.webp" alt="Explorer in a green hood with a gold-trimmed mask" loading="lazy" /></div><div className="gallery-meta"><span>FILE 1028 / GOLDEN HOUR</span><span>03 <ArrowUpRight size={13} /></span></div></article>
          </div>
        </section>

        <TownAwakening
          contractAddress={CONTRACT_ADDRESS}
          configured={hasConfig}
          refreshSignal={minted}
        />

        <CollectionExplorer contractAddress={CONTRACT_ADDRESS} configured={hasConfig} />

        <section className="lore-section" id="lore">
          <div className="lore-ornament"><PixelMark /><span>THE HOOD CHRONICLES</span></div>
          <div className="lore-copy"><span className="section-kicker">A NOTE FROM THE ALLEY</span><h2>Not the hero.<br /><em>Still the story.</em></h2><p>Between the city lights, someone keeps watch while the others pass by. NPC HOOD celebrates the characters who are usually just part of the background — pixel by pixel, hood by hood.</p><a href="#mint" className="lore-link">FIND YOURS <ArrowUpRight size={15} /></a></div>
        </section>

        <section className="faq-section" id="faq">
          <div className="faq-title"><span className="section-kicker">GOOD TO KNOW</span><h2>Before you<br /><em>step in.</em></h2></div>
          <div className="faq-list">
            {[
              { q: "What is the difference between Free Mint and Paid Mint?", a: "Free Mint charges a project fee of 0.0001 native currency per NFT. Paid Mint costs 0.0003 native currency per NFT. Network gas is shown separately by your wallet before you approve the transaction." },
              { q: "Which network does NPC HOOD use?", a: "NPC HOOD runs on BNB Smart Chain (chain ID 56). Make sure your wallet is on that network before minting — the site will offer to switch networks if your wallet is still on another one." },
            ].map((item, index) => (
              <article className={faqOpen === index ? "faq-item open" : "faq-item"} key={item.q}>
                <button onClick={() => setFaqOpen(faqOpen === index ? null : index)} aria-expanded={faqOpen === index}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item.q}</strong><Plus size={17} /></button>
                {faqOpen === index && <p>{item.a}</p>}
              </article>
            ))}
          </div>
        </section>

      </main>

      <footer className="site-footer"><a href="#top" className="footer-brand"><PixelMark /> NPC HOOD</a><span>Built by <a href="https://x.com/NPChood_xyz" target="_blank" rel="noreferrer">@NPChood_xyz</a></span><a href="#top" className="back-top">BACK TO TOP ↑</a></footer>
    </div>
  );
}
