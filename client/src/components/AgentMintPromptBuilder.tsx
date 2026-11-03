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
  const unitPrice = isFree ? FREE_MINT_FEE : PAID_MINT_PRICE;
  const unitPriceText = formatEther(unitPrice);
  const totalValueText = formatEther(unitPrice * BigInt(quantity));
  const routeName = isFree ? "Free mint" : "Paid mint";
  const headline = isFree ? "free mint only" : "paid mint";

  return [
    `Mint ${quantity} NPC HOOD NFT(s) for me on BNB Chain (${headline}).`,
    `- Collection: NPC HOOD (HOOD), total supply 10,000`,
    `- Contract: ${contractAddress}`,
    `- ${routeName}: ${quantity} NFT(s), ${totalValueText} ${safeLabel(currency)} total (${quantity} × ${unitPriceText} ${safeLabel(currency)}${isFree ? " fee" : ""}, plus gas)`,
    `- Sign with wallet: ${walletAddress}`,
    `- Execute now. Reply with the transaction link when done.`,
  ].join("\n");
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
    if (!mintOpen) return "Mint is still closed by the owner; the prompt is not available yet.";
    if (!canCopy || chainId === null)
      return "The prompt becomes available once the wallet address, network, and contract are configured correctly.";
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
          ? "Enter a valid 0x wallet address and make sure the chain and contract configuration are available."
          : "Mint is still closed by the owner. Prompts become available after the owner opens minting."
      );
      return;
    }

    try {
      await navigator.clipboard.writeText(promptFor(mode));
      setCopiedMode(mode);
      setStatus(
        `${mode === "free" ? "Free Mint" : "Paid Mint"} prompt copied. Review the prompt and the transaction details before approving anything in your wallet.`
      );
    } catch {
      setCopiedMode(null);
      setStatus(
        "Clipboard is not available. You can select and copy the prompt text from the card manually."
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
          {copiedMode === mode ? "PROMPT COPIED" : "COPY PROMPT"}
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
              Paste the Binance AI Agent wallet address, then copy the Free Mint
              or Paid Mint prompt. The quantity follows your choice in the mint card above.
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
              placeholder="0x… paste a public wallet address"
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
                <Wallet size={14} /> CONNECTED WALLET
              </button>
            )}
          </div>
          <p className="agent-wallet-hint">
            {normalizedAddress && !validAddress
              ? "Enter a complete EVM wallet address: 0x followed by 40 hexadecimal characters."
              : "This address is only used in your browser to compose the prompt text; it is never sent to a server."}
          </p>
        </div>

        {!safeConfiguration && (
          <div className="agent-config-alert" role="status">
            <span aria-hidden="true">!</span>
            <p>
              <strong>PROMPT NOT ACTIVE.</strong> Fill in the chain ID, network name,
              native coin symbol, and the deployed NPC HOOD contract address in
              the GitHub Actions Variables. Do not use an address from another
              project.
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
            This is only a prompt builder and copier — not an official Binance
            API connection. The site does not sign or send transactions. Check
            the network, contract, quantity, gas, and total in your wallet
            before approving a transaction.
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
