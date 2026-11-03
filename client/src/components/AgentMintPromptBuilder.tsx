import { formatEther, parseEther } from "ethers";
import { useEffect, useState } from "react";
import { Check, Copy, ShieldCheck, Wallet } from "lucide-react";

type MintMode = "free" | "paid";

type AgentMintPromptBuilderProps = {
  account: string | null;
  chainId: number | null;
  chainName: string;
  contractAddress: string;
  currency: string;
  configured: boolean;
  mintOpen: boolean;
  quantity: number;
};

const FREE_MINT_FEE = parseEther("0.0001");
const PAID_MINT_PRICE = parseEther("0.0003");
const ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;

function safeLabel(value: string) {
  return value
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

function makePrompt({
  mode,
  quantity,
  walletAddress,
  chainId,
  chainName,
  contractAddress,
  currency,
}: {
  mode: MintMode;
  quantity: number;
  walletAddress: string;
  chainId: number;
  chainName: string;
  contractAddress: string;
  currency: string;
}) {
  const isFree = mode === "free";
  const method = isFree ? "freeMint" : "paidMint";
  const unitPrice = isFree ? FREE_MINT_FEE : PAID_MINT_PRICE;
  const unitPriceText = formatEther(unitPrice);
  const totalValueText = formatEther(unitPrice * BigInt(quantity));
  const routeName = isFree ? "Free Mint" : "Paid Mint";

  return [
    `Prepare an NPC HOOD ${routeName} for me.`,
    `Network: ${safeLabel(chainName)} (chain ID ${chainId}). Use exactly this chain.`,
    `NPC HOOD contract: ${contractAddress}. Do not use another contract, token, treasury, or recipient address.`,
    `Signing wallet: ${walletAddress}. The contract mints to msg.sender; only proceed if the active wallet is exactly this address.`,
    `Mint call: ${method}(${quantity}) with msg.value exactly ${totalValueText} ${safeLabel(currency)} (${unitPriceText} ${safeLabel(currency)} per NFT × ${quantity}). Network gas is separate.`,
    "Before preparing the transaction, read the contract on the specified chain and verify mintOpen() is true, MAX_SUPPLY() is 10000, MAX_PER_TX() is 20, FREE_MINT_FEE() is 0.0001 native coin, PAID_MINT_PRICE() is 0.0003 native coin, and totalMinted() + quantity does not exceed MAX_SUPPLY(). Stop if mintOpen() is false or any value, network, or contract does not match.",
    "Show me the complete unsigned transaction details first: chain and chain ID, contract, method, quantity, value, signing wallet, estimated gas, and total cost. Wait for my explicit approval in the wallet before signing or sending exactly this mint call. Do not submit, broadcast, or approve anything else.",
    "Never ask for, display, or transmit a seed phrase or private key. Do not call owner-only functions such as withdraw(), setCollectionBaseURI(), or setMintOpen(). If you cannot use the specified wallet or verify the contract, stop and explain why.",
  ].join("\n\n");
}

export default function AgentMintPromptBuilder({
  account,
  chainId,
  chainName,
  contractAddress,
  currency,
  configured,
  mintOpen,
  quantity,
}: AgentMintPromptBuilderProps) {
  const [walletAddress, setWalletAddress] = useState("");
  const [copiedMode, setCopiedMode] = useState<MintMode | null>(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!walletAddress && account) setWalletAddress(account);
  }, [account, walletAddress]);

  const normalizedAddress = walletAddress.trim();
  const validAddress = ADDRESS_PATTERN.test(normalizedAddress);
  const safeConfiguration =
    configured &&
    chainId !== null &&
    chainName.trim() !== "" &&
    chainName !== "NETWORK NOT SET" &&
    currency.trim() !== "" &&
    currency !== "NATIVE";
  const canCopy =
    safeConfiguration && mintOpen && validAddress && quantity >= 1 && quantity <= 20;

  const promptFor = (mode: MintMode) => {
    if (!mintOpen) return "Mint masih ditutup oleh owner; prompt belum tersedia.";
    if (!canCopy || chainId === null)
      return "Prompt tersedia setelah alamat wallet, jaringan, dan kontrak terkonfigurasi dengan benar.";
    return makePrompt({
      mode,
      quantity,
      walletAddress: normalizedAddress,
      chainId,
      chainName,
      contractAddress,
      currency,
    });
  };

  const copyPrompt = async (mode: MintMode) => {
    if (!canCopy) {
      setStatus(
        mintOpen
          ? "Isi alamat wallet 0x yang valid dan pastikan konfigurasi chain serta kontrak sudah tersedia."
          : "Mint masih ditutup oleh owner. Prompt akan tersedia setelah owner membuka mint."
      );
      return;
    }

    try {
      await navigator.clipboard.writeText(promptFor(mode));
      setCopiedMode(mode);
      setStatus(
        `${mode === "free" ? "Free Mint" : "Paid Mint"} prompt disalin. Tinjau prompt dan detail transaksi sebelum menyetujui apa pun di wallet.`
      );
    } catch {
      setCopiedMode(null);
      setStatus(
        "Clipboard tidak tersedia. Anda dapat memilih dan menyalin teks prompt dari kartu secara manual."
      );
    }
  };

  const renderPromptCard = (mode: MintMode) => {
    const isFree = mode === "free";
    const unitPrice = isFree ? FREE_MINT_FEE : PAID_MINT_PRICE;
    const totalValue = formatEther(unitPrice * BigInt(quantity));
    const promptLabel = isFree ? "Free Mint" : "Paid Mint";

    return (
      <article className="agent-prompt-card" key={mode}>
        <header className="agent-prompt-card-header">
          <div>
            <span className="agent-card-kicker">
              PROMPT / {isFree ? "01" : "02"}
            </span>
            <h3>{promptLabel}</h3>
          </div>
          <span className="agent-card-total">
            {totalValue} {currency}
          </span>
        </header>
        <pre className="agent-prompt-text" aria-label={`${promptLabel} prompt`}>
          {promptFor(mode)}
        </pre>
        <button
          type="button"
          className="agent-copy-button"
          onClick={() => void copyPrompt(mode)}
          disabled={!canCopy}
        >
          {copiedMode === mode ? <Check size={15} /> : <Copy size={15} />}
          {copiedMode === mode ? "PROMPT DISALIN" : "SALIN PROMPT"}
        </button>
      </article>
    );
  };

  return (
    <section
      className="agent-mint-section"
      id="agent-mint"
      aria-labelledby="agent-mint-title"
    >
      <div className="agent-mint-inner">
        <header className="agent-mint-header">
          <div>
            <span className="agent-section-kicker">
              MINT VIA AI AGENT / PROMPT BUILDER
            </span>
            <h2 id="agent-mint-title">
              Let an AI agent
              <br />
              <em>prepare your mint.</em>
            </h2>
            <p>
              Tempel alamat wallet Binance AI Agent, lalu salin prompt Free Mint
              atau Paid Mint. Jumlah mengikuti pilihan di kartu mint di atas.
            </p>
          </div>
          <span className="agent-safety-badge">
            <ShieldCheck size={15} /> PROMPT ONLY · NO AUTO-SIGN
          </span>
        </header>

        <div className="agent-wallet-panel">
          <label className="agent-wallet-label" htmlFor="agent-wallet-address">
            WALLET ADDRESS · BINANCE AI AGENT
          </label>
          <div className="agent-wallet-row">
            <input
              id="agent-wallet-address"
              className={
                normalizedAddress && !validAddress
                  ? "agent-wallet-input invalid"
                  : "agent-wallet-input"
              }
              type="text"
              inputMode="text"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              maxLength={42}
              placeholder="0x… tempel alamat wallet publik"
              value={walletAddress}
              aria-invalid={Boolean(normalizedAddress) && !validAddress}
              onChange={event => {
                setWalletAddress(event.target.value.trimStart());
                setCopiedMode(null);
                setStatus("");
              }}
            />
            {account && (
              <button
                type="button"
                className="agent-use-wallet"
                onClick={() => {
                  setWalletAddress(account);
                  setCopiedMode(null);
                  setStatus("");
                }}
              >
                <Wallet size={14} /> WALLET TERHUBUNG
              </button>
            )}
          </div>
          <p className="agent-wallet-hint">
            {normalizedAddress && !validAddress
              ? "Masukkan alamat wallet EVM lengkap: 0x diikuti 40 karakter heksadesimal."
              : "Alamat ini hanya dipakai di browser untuk menyusun teks prompt; tidak dikirim ke server."}
          </p>
        </div>

        {!safeConfiguration && (
          <div className="agent-config-alert" role="status">
            <span aria-hidden="true">!</span>
            <p>
              <strong>PROMPT BELUM AKTIF.</strong> Isi chain ID, nama jaringan,
              simbol native coin, dan alamat kontrak NPC HOOD yang sudah
              dideploy pada GitHub Actions Variables. Jangan gunakan alamat dari
              proyek lain.
            </p>
          </div>
        )}

        <div className="agent-prompt-grid">
          {renderPromptCard("free")}
          {renderPromptCard("paid")}
        </div>

        <div className="agent-notice" role="note">
          <ShieldCheck size={15} />
          <p>
            Ini hanya pembuat dan penyalin prompt—bukan koneksi API resmi
            Binance. Situs tidak menandatangani atau mengirim transaksi. Periksa
            jaringan, kontrak, jumlah, gas, dan total di wallet sebelum
            menyetujui transaksi.
          </p>
        </div>
        {status && (
          <p className="agent-copy-status" role="status" aria-live="polite">
            {status}
          </p>
        )}
      </div>
    </section>
  );
}
