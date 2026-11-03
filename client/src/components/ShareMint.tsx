import { useEffect, useState } from "react";
import { Check, Download, Share2, X } from "lucide-react";
import { fetchTokenMeta, padTokenId, type TokenMeta } from "@/lib/hoodData";
import { buildShareCardBlob, downloadBlob, mintShareText, shareOnXUrl } from "@/lib/shareCard";

type ShareMintProps = {
  tokenIds: number[];
  contractAddress: string;
  explorerUrl: string;
  onClose: () => void;
};

type CardState = {
  meta: TokenMeta;
  cardUrl: string | null;
  busy: boolean;
  done: boolean;
};

export default function ShareMint({ tokenIds, contractAddress, explorerUrl, onClose }: ShareMintProps) {
  const [cards, setCards] = useState<CardState[]>([]);
  const shown = tokenIds.slice(0, 4);

  useEffect(() => {
    let active = true;
    void (async () => {
      const states: CardState[] = [];
      for (const id of shown) {
        const meta = await fetchTokenMeta(contractAddress, id);
        states.push({ meta, cardUrl: null, busy: false, done: false });
      }
      if (active) setCards(states);
    })();
    return () => {
      active = false;
    };
    // shown derives from tokenIds; rebuild when the minted set changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contractAddress, tokenIds]);

  const makeCard = async (index: number) => {
    const card = cards[index];
    if (!card || card.busy) return;
    setCards((prev) => prev.map((c, i) => (i === index ? { ...c, busy: true } : c)));
    try {
      const blob = await buildShareCardBlob({
        id: card.meta.id,
        name: card.meta.name,
        character: card.meta.character,
        image: card.meta.image,
      });
      downloadBlob(blob, `npc-hood-${padTokenId(card.meta.id)}-share.png`);
      setCards((prev) => prev.map((c, i) => (i === index ? { ...c, busy: false, done: true } : c)));
    } catch {
      setCards((prev) => prev.map((c, i) => (i === index ? { ...c, busy: false } : c)));
    }
  };

  if (tokenIds.length === 0) return null;

  return (
    <section className="recent-section share-section" aria-labelledby="share-title">
      <div className="recent-heading">
        <span className="section-kicker">MINT CONFIRMED</span>
        <h2 id="share-title">
          You minted. <em>Show it.</em>
        </h2>
        <p>
          Your newest NPC{tokenIds.length > 1 ? "s are" : " is"} ready. Download the share card, post it on X, and let the
          town grow — every post brings the next neighbour in.
        </p>
      </div>
      <button className="share-close" onClick={onClose} aria-label="Dismiss the share panel">
        <X size={15} /> DISMISS
      </button>
      <div className="share-grid">
        {cards.map((card, index) => {
          const tokenUrl = `${explorerUrl}/token/${contractAddress}?a=${card.meta.id}`;
          const text = mintShareText(card.meta.id, card.meta.character);
          return (
            <article className="share-card" key={card.meta.id}>
              <div className="recent-art">
                <img src={card.meta.image} alt={card.meta.name} />
              </div>
              <div className="share-card-meta">
                <strong>
                  #{padTokenId(card.meta.id)} {card.meta.character && <span>· {card.meta.character}</span>}
                </strong>
                <div className="share-actions">
                  <button className="share-button" onClick={() => void makeCard(index)} disabled={card.busy}>
                    {card.done ? <Check size={13} /> : <Download size={13} />}
                    {card.busy ? "RENDERING…" : card.done ? "SAVED" : "CARD"}
                  </button>
                  <a
                    className="share-button share-button-x"
                    href={shareOnXUrl(text, tokenUrl)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Share2 size={13} /> POST ON X
                  </a>
                </div>
                <small>Tip: attach the downloaded card to your post — X cannot attach it automatically.</small>
              </div>
            </article>
          );
        })}
      </div>
      {tokenIds.length > shown.length && (
        <p className="share-more">+ {tokenIds.length - shown.length} more in this mint — find every card under “My Hood” below.</p>
      )}
    </section>
  );
}
