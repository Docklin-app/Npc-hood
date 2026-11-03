import { useEffect, useState } from "react";
import { ArrowUpRight, Download, X } from "lucide-react";
import {
  fetchTokenMeta,
  loadRarity,
  padTokenId,
  rarityForToken,
  readTokenOwner,
  readTotalMinted,
  shortAddress,
  type TokenMeta,
  type TraitRarity,
} from "@/lib/hoodData";
import { downloadBlob, shareOnXUrl } from "@/lib/shareCard";

type TokenDetailProps = {
  tokenId: number;
  contractAddress: string;
  explorerUrl: string;
  onClose: () => void;
};

function formatPct(pct: number) {
  if (pct < 0.1) return "<0.1%";
  if (pct < 10) return `${pct.toFixed(1)}%`;
  return `${Math.round(pct)}%`;
}

export default function TokenDetail({ tokenId, contractAddress, explorerUrl, onClose }: TokenDetailProps) {
  const [meta, setMeta] = useState<TokenMeta | null>(null);
  const [traits, setTraits] = useState<TraitRarity[] | null>(null);
  const [rank, setRank] = useState<number | null>(null);
  const [owner, setOwner] = useState<string | null>(null);
  const [minted, setMinted] = useState<boolean | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  useEffect(() => {
    let active = true;
    void (async () => {
      const [loadedMeta, total] = await Promise.all([
        fetchTokenMeta(contractAddress, tokenId),
        readTotalMinted(contractAddress),
      ]);
      if (!active) return;
      setMeta(loadedMeta);
      const isMinted = total !== null && tokenId <= total;
      setMinted(isMinted);
      if (isMinted) {
        const tokenOwner = await readTokenOwner(contractAddress, tokenId);
        if (active) setOwner(tokenOwner);
      }
      try {
        const data = await loadRarity();
        if (!active) return;
        const rarity = rarityForToken(data, tokenId);
        if (rarity) {
          setRank(rarity.rank);
          setTraits(rarity.traits);
        }
      } catch {
        // Traits are a bonus; the panel works without them.
      }
    })();
    return () => {
      active = false;
    };
  }, [contractAddress, tokenId]);

  const downloadImage = async () => {
    if (!meta) return;
    setDownloading(true);
    try {
      const response = await fetch(meta.image);
      if (!response.ok) throw new Error("Image fetch failed.");
      const blob = await response.blob();
      downloadBlob(blob, `npc-hood-${padTokenId(tokenId)}.png`);
    } catch {
      window.open(meta.image, "_blank", "noreferrer");
    } finally {
      setDownloading(false);
    }
  };

  const rarest = traits
    ? traits.reduce((min, trait) => (min === null || trait.pct < min.pct ? trait : min), null as TraitRarity | null)
    : null;

  return (
    <div className="token-modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="token-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`NPC HOOD #${padTokenId(tokenId)} details`}
        onClick={(event) => event.stopPropagation()}
      >
        <button className="token-modal-close" onClick={onClose} aria-label="Close details">
          <X size={16} />
        </button>
        <div className="token-modal-art">
          {meta ? (
            <img src={meta.image} alt={meta.name} />
          ) : (
            <div className="token-modal-loading">LOADING…</div>
          )}
        </div>
        <div className="token-modal-body">
          <span className="section-kicker">NPC HOOD · TOKEN #{padTokenId(tokenId)}</span>
          <h3>{meta ? meta.character || meta.name : "…"}</h3>
          <p className="token-modal-status">
            {rank !== null && (
              <span className="hood-rank">RARITY #{rank.toLocaleString("en-US")} / 10,000</span>
            )}
            {minted === null ? (
              <span>READING THE CONTRACT…</span>
            ) : minted ? (
              <span>
                MINTED{owner ? (
                  <>
                    {" · OWNED BY "}
                    <a href={`${explorerUrl}/address/${owner}`} target="_blank" rel="noreferrer">
                      {shortAddress(owner)}
                    </a>
                  </>
                ) : ""}
              </span>
            ) : (
              <span>NOT MINTED YET — NPC HOOD MINTS IN ORDER, ONE BY ONE</span>
            )}
          </p>
          {traits ? (
            <ul className="hood-traits">
              {traits.map((trait) => (
                <li key={trait.type} className={rarest && trait.type === rarest.type ? "is-rare" : undefined}>
                  <span>{trait.type}</span>
                  <strong>{trait.value}</strong>
                  <em>{formatPct(trait.pct)}</em>
                </li>
              ))}
            </ul>
          ) : (
            <p className="token-modal-status">Loading traits…</p>
          )}
          <div className="hood-actions token-modal-actions">
            <button className="share-button" onClick={() => void downloadImage()} disabled={downloading || !meta}>
              <Download size={12} /> {downloading ? "SAVING…" : "DOWNLOAD ART"}
            </button>
            <a
              className="share-button"
              href={shareOnXUrl(
                `NPC HOOD #${padTokenId(tokenId)}${meta?.character ? ` — ${meta.character}` : ""}${rank !== null ? ` · Rarity rank #${rank.toLocaleString("en-US")} of 10,000` : ""} 🎮 @NPChood_xyz`,
                "https://npcshood.xyz",
              )}
              target="_blank"
              rel="noreferrer"
            >
              POST ON X <ArrowUpRight size={12} />
            </a>
            <a
              className="share-button"
              href={`${explorerUrl}/token/${contractAddress}?a=${tokenId}`}
              target="_blank"
              rel="noreferrer"
            >
              BSCSCAN <ArrowUpRight size={12} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
