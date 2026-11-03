import { BrowserProvider, Contract, formatEther, parseEther } from "ethers";
import { useCallback, useEffect, useMemo, useState } from "react";
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
    if (message.toLowerCase().includes("user rejected")) return "Tanda tangan dibatalkan di wallet.";
    return message;
  }
  return "Transaksi gagal. Periksa wallet dan coba lagi.";
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
        setContractWarning("Kontrak tidak cocok dengan supply, batas transaksi, atau harga NPC HOOD.");
      }
    } catch (error) {
      setContractVerified(false);
      setMintOpen(false);
      setContractWarning("Kontrak belum dapat diverifikasi di jaringan ini. Periksa chain ID dan alamat kontrak.");
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

  const connectWallet = async () => {
    setNotice("");
    if (!window.ethereum) {
      setNotice("Wallet Web3 tidak ditemukan. Buka halaman ini dari browser yang memiliki wallet EVM.");
      return;
    }
    try {
      const provider = new BrowserProvider(window.ethereum as ConstructorParameters<typeof BrowserProvider>[0]);
      const accounts = await provider.send("eth_requestAccounts", []) as string[];
      const network = await provider.getNetwork();
      setAccount(accounts[0] ?? null);
      setWalletChain(Number(network.chainId));
      await refreshSupply(provider);
    } catch (error) {
      setNotice(getErrorMessage(error));
    }
  };

  const changeNetwork = async () => {
    if (!window.ethereum || !hasConfig || !CHAIN_ID) return;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${CHAIN_ID.toString(16)}` }],
      });
      setNotice("Permintaan pergantian jaringan dikirim ke wallet.");
    } catch (error) {
      const code = error && typeof error === "object" && "code" in error ? Number((error as { code: unknown }).code) : 0;
      const manualStep = code === 4902
        ? `Jaringan ${CHAIN_NAME} belum dikenal wallet. Tambahkan manual dengan chain ID dan RPC resmi jaringan, lalu coba lagi.`
        : `Pilih ${CHAIN_NAME} di wallet sebelum mint.`;
      setNotice(`Tidak dapat mengganti jaringan otomatis. ${manualStep} ${getErrorMessage(error)}`);
    }
  };

  const submitMint = async () => {
    setNotice("");
    setTxHash(null);
    if (!hasConfig) {
      setNotice("Mint belum aktif: alamat kontrak dan chain ID belum dikonfigurasi.");
      setTxState("error");
      return;
    }
    if (!window.ethereum) {
      setNotice("Hubungkan wallet EVM terlebih dahulu.");
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
      setNotice(contractWarning || "Kontrak harus terverifikasi sebelum transaksi dapat dikirim.");
      return;
    }
    if (!mintOpen) {
      setTxState("error");
      setNotice("Mint masih ditutup. Tunggu sampai owner kontrak membukanya.");
      return;
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_PER_TX || (remaining !== null && quantity > remaining)) {
      setNotice("Jumlah mint tidak valid atau melebihi sisa supply.");
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
          throw new Error(`Wallet berpindah jaringan; mint dibatalkan karena targetnya ${CHAIN_NAME}.`);
        }
      };
      await assertTargetChain();
      const provider = new BrowserProvider(window.ethereum as ConstructorParameters<typeof BrowserProvider>[0]);
      const providerNetwork = await provider.getNetwork();
      if (Number(providerNetwork.chainId) !== CHAIN_ID) {
        setContractVerified(false);
        setMinted(null);
        throw new Error(`Chain provider tidak cocok dengan target ${CHAIN_NAME}. Mint dibatalkan.`);
      }
      const signer = await provider.getSigner();
      await assertTargetChain();
      const contract = new Contract(CONTRACT_ADDRESS, NPC_HOOD_ABI, signer);
      const method = mode === "free" ? "freeMint" : "paidMint";
      setTxState("signature");
      const transaction = await contract[method](BigInt(quantity), { value: perItem * BigInt(quantity) });
      setTxHash(transaction.hash as string);
      setTxState("pending");
      setNotice("Transaksi dikirim. Menunggu konfirmasi jaringan.");
      await transaction.wait();
      setTxState("success");
      setNotice("Mint berhasil. Terima kasih sudah menjadi bagian dari NPC HOOD.");
      await refreshSupply(provider);
    } catch (error) {
      setTxState("error");
      setNotice(getErrorMessage(error));
    }
  };

  const progress = minted === null ? 0 : Math.min(100, (minted / TOTAL_SUPPLY) * 100);
  const mintLabel = !hasConfig ? "MINT BELUM AKTIF" : !account ? "HUBUNGKAN WALLET" : !onTargetNetwork ? "GANTI JARINGAN" : !contractVerified ? "VERIFIKASI KONTRAK" : !mintOpen ? "MINT BELUM DIBUKA OWNER" : txState === "signature" ? "MENUNGGU SIGNATURE" : txState === "pending" ? "TRANSAKSI PENDING" : "MINT NPC HOOD";

  return (
    <div className="site-shell" id="top">
      <header className="site-header">
        <a href="#top" className="brand" aria-label="NPC HOOD home">
          <PixelMark />
          <span className="brand-copy"><strong>NPC<span>HOOD</span></strong><small>PIXEL COLLECTIVE</small></span>
        </a>
        <nav className={mobileNavOpen ? "main-nav is-open" : "main-nav"} aria-label="Navigasi utama">
          <a href="#collection" onClick={() => setMobileNavOpen(false)}>Koleksi</a>
          <a href="#mint" onClick={() => setMobileNavOpen(false)}>Mint</a>
          <a href="#agent-mint" onClick={() => setMobileNavOpen(false)}>AI Agent</a>
          <a href="#lore" onClick={() => setMobileNavOpen(false)}>Cerita</a>
          <a href="#faq" onClick={() => setMobileNavOpen(false)}>FAQ</a>
        </nav>
        <div className="header-actions">
          <span className={hasConfig ? "network-pill network-ready" : "network-pill"} title={hasConfig ? `Chain ID ${CHAIN_ID}` : "Chain belum dikonfigurasi"}>
            <span className="network-dot" /> {hasConfig ? CHAIN_NAME : "NETWORK SETUP"}
          </span>
          <button className="wallet-button" onClick={connectWallet}>
            <Wallet size={15} strokeWidth={2.2} /> {account ? shortAddress(account) : "CONNECT WALLET"}
          </button>
          <button className="nav-toggle" aria-label={mobileNavOpen ? "Tutup menu" : "Buka menu"} onClick={() => setMobileNavOpen(!mobileNavOpen)}>
            {mobileNavOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      <main>
        <section className="hero-section" aria-labelledby="hero-title">
          <div className="hero-copy">
            <h1 id="hero-title">EVERY TOWN<br /><span>HAS ITS</span> <em>HOOD.</em></h1>
            <p className="hero-lede">Karakter kecil. Cerita besar. Temui para NPC berjubah yang menjaga sudut-sudut kota pixel kami.</p>
            <div className="hero-facts">
              <div><span className="fact-number">10K</span><span className="fact-label">TOTAL SUPPLY</span></div>
            </div>
            <div className="hero-ctas">
              <a href="#mint" className="button-primary">JELAJAHI MINT <ArrowDown size={16} /></a>
              <a href="#collection" className="button-text">LIHAT KOLEKSI <ArrowRight size={15} /></a>
            </div>
          </div>

          <div className="hero-art-wrap">
            <div className="hero-art-frame">
              <img src={HERO_IMAGE} alt="Karakter pixel-art berjubah hijau, memakai topi hijau, di kota saat senja" className="hero-art" />
              <div className="art-corner art-corner-tl" /><div className="art-corner art-corner-br" />
            </div>
          </div>
        </section>

        <section className="mint-section" id="mint" aria-labelledby="mint-title">
          <div className="mint-intro">
            <div className="section-kicker">YOUR NEXT CHARACTER <span>↘</span></div>
            <h2 id="mint-title">Pick your<br /><em>hood.</em></h2>
            <p>Setiap mint jadi bagian dari cerita. Pilih jalurmu dan konfirmasi langsung di wallet.</p>
          </div>

          <div className="mint-card">
            <div className="mint-card-top"><span><span className="live-dot" /> MINT WINDOW</span><span className="card-code">NH / 10.000</span></div>
            <div className="mint-card-title-row"><h3>Choose your route</h3><span className="card-spark">✳</span></div>
            <div className="mint-modes" role="tablist" aria-label="Pilih jenis mint">
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
                <button aria-label="Kurangi jumlah" onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1}><Minus size={14} /></button>
                <span>{String(quantity).padStart(2, "0")}</span>
                <button aria-label="Tambah jumlah" onClick={() => setQuantity(Math.min(quantity + 1, remaining ?? MAX_PER_TX, MAX_PER_TX))} disabled={quantity >= Math.min(remaining ?? MAX_PER_TX, MAX_PER_TX)}><Plus size={14} /></button>
              </div>
            </div>
            <div className="total-row"><span>TOTAL DUE <small>{quantity} × {mode === "free" ? "0.0001" : "0.0003"} {CURRENCY}</small></span><strong>{amountText} <small>{CURRENCY}</small></strong></div>
            <div className="mint-progress" aria-label="Progress mint">
              <div className="progress-label"><span>{minted === null ? "SUPPLY CHECK" : "MINTED"}</span><strong>{minted === null ? "CONNECT TO READ" : `${minted.toLocaleString("en-US")} / 10,000`}</strong></div>
              <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
              <div className="progress-legend"><span>{remaining === null ? "On-chain count appears after connection" : `${remaining.toLocaleString("en-US")} REMAINING`}</span><Layers3 size={14} /></div>
            </div>
            <button className={hasConfig && mintOpen ? "mint-submit" : "mint-submit disabled"} onClick={submitMint} disabled={!hasConfig || !account || !onTargetNetwork || !contractVerified || !mintOpen || txState === "signature" || txState === "pending"}>
              {txState === "signature" || txState === "pending" ? <span className="button-spinner" /> : <span className="mint-submit-mark">✳</span>}
              {mintLabel}<ArrowUpRight size={17} />
            </button>
            {!hasConfig && <div className="config-alert"><span className="config-alert-dot" /><span><strong>CONTRACT NOT CONFIGURED</strong> — isi chain ID dan alamat kontrak sebelum mint live.</span></div>}
            {hasConfig && contractWarning && <div className="config-alert"><span className="config-alert-dot" /><span><strong>CONTRACT CHECK</strong> — {contractWarning}</span></div>}
            {hasConfig && contractVerified && !mintOpen && <div className="config-alert"><span className="config-alert-dot" /><span><strong>MINT DITUTUP</strong> — menunggu owner membuka mint dari kontrak.</span></div>}
            {account && hasConfig && !onTargetNetwork && <button className="network-alert" onClick={changeNetwork}>Wallet berada di jaringan lain. Beralih ke {CHAIN_NAME}? <ChevronDown size={14} /></button>}
            {notice && <div className={`tx-message ${txState}`} role="status" aria-live="polite">{txState === "success" && <Check size={15} />}{notice}{txHash && <a href={EXPLORER_URL ? `${EXPLORER_URL}/tx/${txHash}` : undefined} target="_blank" rel="noreferrer" className={EXPLORER_URL ? "tx-link" : "tx-hash"}>{EXPLORER_URL ? <> VIEW TX <ExternalLink size={12} /></> : shortAddress(txHash)}</a>}</div>}
            <p className="mint-disclaimer"><ShieldCheck size={12} /> Review network, amount, and gas in your wallet. Never share your recovery phrase.</p>
          </div>
        </section>

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
            <p>Mereka mungkin NPC di dunia lain.<br />Di sini, setiap karakter punya tempat.</p>
          </div>
          <div className="gallery-grid">
            <article className="gallery-card gallery-card-one"><div className="gallery-art"><img src="/assets/npc-hood-gallery-1.webp" alt="Penjaga hutan dengan jubah hijau gelap" loading="lazy" /></div><div className="gallery-meta"><span>FILE 0002 / THE WATCHER</span><span>01 <ArrowUpRight size={13} /></span></div></article>
            <article className="gallery-card gallery-card-two"><div className="gallery-art"><img src="/assets/npc-hood-gallery-2.webp" alt="NPC jalanan berjubah hijau dengan kacamata pixel" loading="lazy" /></div><div className="gallery-meta"><span>FILE 0047 / NIGHT SHIFT</span><span>02 <ArrowUpRight size={13} /></span></div></article>
            <article className="gallery-card gallery-card-three"><div className="gallery-art"><img src="/assets/npc-hood-gallery-3.webp" alt="Penjelajah bertudung hijau dengan topeng bertrim emas" loading="lazy" /></div><div className="gallery-meta"><span>FILE 1028 / GOLDEN HOUR</span><span>03 <ArrowUpRight size={13} /></span></div></article>
          </div>
        </section>

        <section className="lore-section" id="lore">
          <div className="lore-ornament"><PixelMark /><span>THE HOOD CHRONICLES</span></div>
          <div className="lore-copy"><span className="section-kicker">A NOTE FROM THE ALLEY</span><h2>Not the hero.<br /><em>Still the story.</em></h2><p>Di sela lampu kota, ada yang berjaga ketika yang lain lewat. NPC HOOD merayakan karakter yang biasanya cuma jadi latar—pixel demi pixel, jubah demi jubah.</p><a href="#mint" className="lore-link">TEMUKAN SATU <ArrowUpRight size={15} /></a></div>
        </section>

        <section className="faq-section" id="faq">
          <div className="faq-title"><span className="section-kicker">GOOD TO KNOW</span><h2>Before you<br /><em>step in.</em></h2></div>
          <div className="faq-list">
            {[
              { q: "Apa bedanya Free Mint dan Paid Mint?", a: "Free Mint dikenai fee proyek sebesar 0.0001 native currency per NFT. Paid Mint dikenai 0.0003 native currency per NFT. Gas jaringan ditampilkan terpisah oleh wallet Anda sebelum transaksi disetujui." },
              { q: "Ke mana fee mint dikirim?", a: "Pembayaran masuk ke saldo smart contract NPC HOOD. Pemilik kontrak dapat menarik saldo melalui fungsi withdraw(). Alamat owner mengikuti wallet yang men-deploy kontrak." },
              { q: "Jaringan apa yang dipakai?", a: "NPC HOOD berjalan di BNB Smart Chain (chain ID 56). Pastikan wallet Anda berada di jaringan itu sebelum mint — situs akan menawarkan perpindahan jaringan bila wallet Anda masih di jaringan lain." },
            ].map((item, index) => (
              <article className={faqOpen === index ? "faq-item open" : "faq-item"} key={item.q}>
                <button onClick={() => setFaqOpen(faqOpen === index ? null : index)} aria-expanded={faqOpen === index}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item.q}</strong><Plus size={17} /></button>
                {faqOpen === index && <p>{item.a}</p>}
              </article>
            ))}
          </div>
        </section>

      </main>

    </div>
  );
}
