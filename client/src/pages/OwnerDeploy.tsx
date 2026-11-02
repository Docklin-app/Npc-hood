import { BrowserProvider, Contract, ContractFactory, formatEther, isAddress, parseEther, type InterfaceAbi } from "ethers";
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

function errorMessage(error: unknown) {
  if (error && typeof error === "object" && "shortMessage" in error) {
    return String((error as { shortMessage: string }).shortMessage);
  }
  if (error && typeof error === "object" && "message" in error) {
    const message = String((error as { message: string }).message);
    if (message.toLowerCase().includes("user rejected")) return "Transaksi dibatalkan di wallet.";
    return message;
  }
  return "Terjadi kesalahan. Periksa wallet dan jaringan, lalu coba lagi.";
}

export default function OwnerDeploy() {
  const [selectedChainId, setSelectedChainId] = useState(56);
  const [walletAddress, setWalletAddress] = useState("");
  const [walletChainId, setWalletChainId] = useState<number | null>(null);
  const [metadataUri, setMetadataUri] = useState("");
  const [contractInput, setContractInput] = useState("");
  const [contractAddress, setContractAddress] = useState("");
  const [contractStatus, setContractStatus] = useState<ContractStatus | null>(null);
  const [statusMessage, setStatusMessage] = useState("Hubungkan wallet untuk memulai. Private key tidak diminta oleh halaman ini.");
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
    if (!window.ethereum) throw new Error("Wallet tidak terdeteksi. Buka halaman ini di browser dApp seperti MetaMask, Trust Wallet, atau Binance Wallet.");
    return new BrowserProvider(window.ethereum as ConstructorParameters<typeof BrowserProvider>[0]);
  };

  const connectWallet = async () => {
    setBusy(true);
    setStatusMessage("Meminta koneksi wallet…");
    try {
      const provider = getProvider();
      const accounts = await provider.send("eth_requestAccounts", []) as string[];
      const chain = await provider.getNetwork();
      setWalletAddress(accounts[0] ?? "");
      setWalletChainId(Number(chain.chainId));
      setStatusMessage(`Wallet terhubung: ${accounts[0] ?? ""}`);
    } catch (error) {
      setStatusMessage(errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const switchNetwork = async () => {
    if (!window.ethereum) {
      setStatusMessage("Wallet tidak terdeteksi. Buka halaman ini di browser dApp.");
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
      setStatusMessage(`Jaringan aktif: ${network.name}.`);
    } catch (error) {
      setStatusMessage(`${errorMessage(error)} Jika jaringan belum tersedia, tambahkan BSC ${selectedChainId === 56 ? "Mainnet (56)" : "Testnet (97)"} di wallet.`);
    } finally {
      setBusy(false);
    }
  };

  const readContract = async (address: string) => {
    if (!isAddress(address)) throw new Error("Alamat kontrak tidak valid.");
    const provider = getProvider();
    const chain = await provider.getNetwork();
    if (Number(chain.chainId) !== selectedChainId) throw new Error(`Wallet harus berada di ${network.name} (Chain ID ${selectedChainId}).`);
    if (await provider.getCode(address) === "0x") throw new Error("Alamat tersebut tidak memiliki kode kontrak pada jaringan terpilih.");
    const contract = new Contract(address, NPC_HOOD_ABI, provider);
    const [name, symbol, owner, mintOpen, minted, maxSupply, maxPerTx, freeFee, paidPrice] = await Promise.all([
      contract.name(), contract.symbol(), contract.owner(), contract.mintOpen(), contract.totalMinted(), contract.MAX_SUPPLY(),
      contract.MAX_PER_TX(), contract.FREE_MINT_FEE(), contract.PAID_MINT_PRICE(),
    ]);
    if (
      name !== "NPC HOOD" || symbol !== "HOOD" || BigInt(maxSupply) !== 10_000n ||
      BigInt(maxPerTx) !== 20n || BigInt(freeFee) !== parseEther("0.0001") ||
      BigInt(paidPrice) !== parseEther("0.0003")
    ) throw new Error("Kontrak tidak cocok dengan identitas atau parameter NPC HOOD yang diharapkan.");
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
      setStatusMessage("Status kontrak berhasil dibaca dari jaringan.");
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
      setStatusMessage("Masukkan Base URI metadata HTTPS yang valid dan diakhiri tanda garis miring /.");
      return;
    }
    if (parsedUri.protocol !== "https:" || !uri.endsWith("/")) {
      setStatusMessage("Base URI metadata harus menggunakan HTTPS dan diakhiri tanda garis miring /.");
      return;
    }
    if (!mainnetAcknowledged) {
      setStatusMessage("Centang konfirmasi risiko deployment sebelum melanjutkan.");
      return;
    }

    setBusy(true);
    setTxHash("");
    setStatusMessage(`Siapkan deployment ke ${network.name}. Tinjau alamat deployer dan gas di wallet.`);
    try {
      const provider = getProvider();
      const chain = await provider.getNetwork();
      if (Number(chain.chainId) !== selectedChainId) throw new Error(`Pilih ${network.name} di wallet sebelum deploy.`);
      const signer = await provider.getSigner();
      const factory = new ContractFactory(
        NPC_HOOD_DEPLOY_ARTIFACT.abi as unknown as InterfaceAbi,
        NPC_HOOD_DEPLOY_ARTIFACT.bytecode,
        signer,
      );
      const collection = await factory.deploy(uri);
      const deployment = collection.deploymentTransaction();
      if (deployment?.hash) setTxHash(deployment.hash);
      setStatusMessage("Permintaan deployment dikirim. Menunggu konfirmasi jaringan…");
      await collection.waitForDeployment();
      const address = await collection.getAddress();
      setContractAddress(address);
      setContractInput(address);
      const status = await readContract(address);
      if (status.mintOpen) throw new Error("Pemeriksaan keamanan gagal: kontrak baru seharusnya masih tertutup.");
      setStatusMessage(`Deployment berhasil. Mint masih TERTUTUP. Owner harus membuka mint secara terpisah saat siap. Kontrak: ${address}`);
      setTxHash(deployment?.hash ?? "");
    } catch (error) {
      setStatusMessage(errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const changeMintState = async (open: boolean) => {
    if (!contractAddress || !contractStatus) {
      setStatusMessage("Muat alamat kontrak terlebih dahulu.");
      return;
    }
    const actionDescription = open
      ? "Membuka mint akan mengizinkan publik melakukan mint dan membayar harga yang tercantum. Pastikan kontrak, metadata, harga, dan tanggal pembukaan sudah benar. Lanjutkan?"
      : "Menutup mint akan menghentikan mint baru. Lanjutkan?";
    if (!window.confirm(actionDescription)) return;

    setBusy(true);
    setTxHash("");
    try {
      const provider = getProvider();
      const chain = await provider.getNetwork();
      if (Number(chain.chainId) !== selectedChainId) throw new Error(`Pilih ${network.name} di wallet sebelum mengubah status mint.`);
      const signer = await provider.getSigner();
      const signerAddress = await signer.getAddress();
      const contract = new Contract(contractAddress, NPC_HOOD_ABI, signer);
      const currentOwner = String(await contract.owner());
      if (signerAddress.toLowerCase() !== currentOwner.toLowerCase()) {
        throw new Error(`Wallet aktif bukan owner kontrak. Owner: ${currentOwner}`);
      }
      const tx = await contract.setMintOpen(open);
      setTxHash(tx.hash as string);
      setStatusMessage(`Permintaan ${open ? "membuka" : "menutup"} mint menunggu persetujuan wallet…`);
      await tx.wait();
      const updated = await readContract(contractAddress);
      setStatusMessage(`Transaksi berhasil. Status mint sekarang ${updated.mintOpen ? "TERBUKA" : "TERTUTUP"}.`);
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
        <a href="./" className="owner-back"><ArrowLeft size={15} /> Kembali ke situs</a>
      </header>

      <div className="owner-deploy-main">
        <div className="owner-deploy-title">
          <span className="owner-kicker">BSC MAINNET / CONTRACT CONTROL</span>
          <h1>Deploy.<br /><em>Stay closed.</em></h1>
          <p>Deploy dan kelola kontrak NFT melalui wallet Anda. Private key tidak dimasukkan ke halaman ini. Kontrak baru selalu dibuat dengan mint tertutup.</p>
        </div>

        <div className="owner-audit-alert" role="note"><ShieldCheck size={15} /><span><strong>Belum diaudit pihak independen.</strong> Tes otomatis bukan audit keamanan. Uji dahulu di BSC Testnet dan pastikan semua metadata siap sebelum deployment Mainnet.</span></div>

        <section className="owner-panel" aria-labelledby="wallet-title">
          <div className="owner-panel-title"><span>01 / WALLET & NETWORK</span><span className={walletAddress && onSelectedNetwork ? "owner-status-dot is-ready" : "owner-status-dot"} /></div>
          <div className="owner-form-grid">
            <label className="owner-field"><span>JARINGAN TARGET</span>
              <select value={selectedChainId} onChange={(event) => {
                setSelectedChainId(Number(event.target.value));
                setContractStatus(null);
                setStatusMessage("Jaringan target berubah. Muat ulang status kontrak sebelum melakukan aksi owner.");
              }} disabled={busy}>
                {NETWORKS.map((item) => <option value={item.chainId} key={item.chainId}>{item.name} ({item.chainId})</option>)}
              </select>
            </label>
            <div className="owner-wallet-actions">
              <button className="owner-button owner-button-secondary" onClick={connectWallet} disabled={busy}><Wallet size={15} /> {walletAddress ? `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}` : "Hubungkan wallet"}</button>
              {walletAddress && !onSelectedNetwork && <button className="owner-button owner-button-quiet" onClick={switchNetwork} disabled={busy}>Ganti jaringan ke {selectedChainId}</button>}
            </div>
          </div>
          <div className="owner-network-note">Chain ID <strong>{selectedChainId}</strong> · Mata uang <strong>{network.symbol}</strong> · <a href={`${network.explorer}/`} target="_blank" rel="noreferrer">Buka explorer <ExternalLink size={12} /></a></div>
        </section>

        <section className="owner-panel" aria-labelledby="deploy-title">
          <div className="owner-panel-title"><span>02 / DEPLOY ERC-721</span><span className="owner-panel-caption">SUPPLY MAX 10,000</span></div>
          <h2 id="deploy-title">Buat kontrak NPC HOOD</h2>
          <p className="owner-panel-copy">Masukkan Base URI metadata HTTPS yang stabil. Token pertama akan memakai ID 1 dan URL metadata akan menjadi Base URI + ID.</p>
          <label className="owner-field"><span>BASE URI METADATA</span><input value={metadataUri} onChange={(event) => setMetadataUri(event.target.value)} placeholder="https://metadata.example/npc/" autoComplete="url" /></label>
          <div className="owner-contract-facts"><span>ERC-721 <b>HOOD</b></span><span>Free Mint fee <b>0.0001 {network.symbol}</b></span><span>Paid Mint <b>0.0003 {network.symbol}</b></span><span>Limit <b>20 / transaksi</b></span></div>
          <label className="owner-confirm"><input type="checkbox" checked={mainnetAcknowledged} onChange={(event) => setMainnetAcknowledged(event.target.checked)} /><span>Saya memahami deployment on-chain tidak dapat dibatalkan dan memerlukan gas. Mint tetap tertutup setelah deploy; owner harus membukanya secara terpisah.</span></label>
          <button className="owner-button owner-button-primary" onClick={deployContract} disabled={busy || !walletAddress || !onSelectedNetwork || !mainnetAcknowledged}>
            {busy ? "MENUNGGU WALLET / JARINGAN…" : `Deploy ke ${network.name}`} <ArrowUpRight size={16} />
          </button>
        </section>

        <section className="owner-panel" aria-labelledby="manage-title">
          <div className="owner-panel-title"><span>03 / OWNER CONTROLS</span><span className="owner-panel-caption">OWNER ONLY</span></div>
          <h2 id="manage-title">Status & kontrol mint</h2>
          <p className="owner-panel-copy">Muat kontrak yang sudah dideploy untuk melihat owner dan statusnya. Hanya wallet owner yang dapat membuka atau menutup mint.</p>
          <div className="owner-load-row">
            <label className="owner-field"><span>ALAMAT KONTRAK</span><input value={contractInput} onChange={(event) => setContractInput(event.target.value)} placeholder="0x..." spellCheck={false} /></label>
            <button className="owner-button owner-button-secondary" onClick={loadContract} disabled={busy || !walletAddress || !onSelectedNetwork}>Muat status</button>
          </div>
          {contractStatus && <>
            <div className="owner-contract-link"><code>{contractAddress}</code><a href={`${network.explorer}/address/${contractAddress}`} target="_blank" rel="noreferrer">Lihat di explorer <ExternalLink size={13} /></a></div>
            <div className="owner-status-grid">
              <div><span>STATUS MINT</span><strong className={contractStatus.mintOpen ? "mint-open" : "mint-closed"}>{contractStatus.mintOpen ? "TERBUKA" : "TERTUTUP"}</strong></div>
              <div><span>SUPPLY</span><strong>{Number(contractStatus.minted).toLocaleString("en-US")} / {Number(contractStatus.maxSupply).toLocaleString("en-US")}</strong></div>
              <div><span>MAX / TX</span><strong>{contractStatus.maxPerTx}</strong></div>
              <div><span>FREE / PAID</span><strong>{contractStatus.freeFee} / {contractStatus.paidPrice} {network.symbol}</strong></div>
            </div>
            <div className="owner-owner-row"><span>OWNER ADDRESS</span><code>{contractStatus.owner}</code>{isOwner ? <span className="owner-badge"><Check size={12} /> WALLET OWNER</span> : <span className="owner-notice">Wallet terhubung bukan owner</span>}</div>
            <div className="owner-control-actions">
              <button className="owner-button owner-button-primary" onClick={() => changeMintState(true)} disabled={busy || !isOwner || !onSelectedNetwork || contractStatus.mintOpen}>Buka mint manual</button>
              <button className="owner-button owner-button-danger" onClick={() => changeMintState(false)} disabled={busy || !isOwner || !onSelectedNetwork || !contractStatus.mintOpen}>Tutup mint</button>
            </div>
            <p className="owner-warning"><ShieldCheck size={14} /> Tombol deploy tidak membuka mint. Tombol “Buka mint manual” meminta konfirmasi lalu tanda tangan wallet owner.</p>
          </>}
        </section>

        <aside className="owner-status-box" role="status" aria-live="polite">
          <span className="owner-status-signal" />
          <div><strong>LOG</strong><p>{statusMessage}</p>{txHash && <a href={`${network.explorer}/tx/${txHash}`} target="_blank" rel="noreferrer">Lihat transaksi <ExternalLink size={12} /></a>}</div>
        </aside>

        <footer className="owner-deploy-footer">NPC HOOD / OWNER TOOLS · Jangan pernah memasukkan seed phrase atau private key ke halaman web.</footer>
      </div>
    </main>
  );
}
