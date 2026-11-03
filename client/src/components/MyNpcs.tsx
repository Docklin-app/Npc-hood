import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpRight, Download, Search, Wallet } from "lucide-react";
import {
  fetchTokenMeta,
  loadRarity,
  padTokenId,
  rarityForToken,
  scanMintRoutes,
  scanOwners,
  shortAddress,
  type RarityData,
  type TokenMeta,
} from "@/lib/hoodData";
import { buildRankCardBlob, buildShareCardBlob, downloadBlob, rankShareText, shareOnXUrl } from "@/lib/shareCard";

type MyNpcsProps = {
  account: string | null;
  contractAddress: string;
  explorerUrl: string;
  configured: boolean;
  onConnect: () => void;
};

type OwnedToken = {
  meta: TokenMeta;
  rank: number | null;
  traits: { type: string; value: string; pct: number }[];
};

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

function formatPct(pct: number) {
  if (pct < 0.1) return "<0.1%";
  if (pct < 10) return `${pct.toFixed(1)}%`;
  return `${Math.round(pct)}%`;
}

export default function MyNpcs({ account, contractAddress, explorerUrl, configured, onConnect }: MyNpcsProps) {
  const [input, setInput] = useState("");
  const [target, setTarget] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [tokens, setTokens] = useState<OwnedToken[] | null>(null);
  const [error, setError] = useState("");
  const [sharingId, setSharingId] = useState<number | null>(null);
  const [sharingRank, setSharingRank] = useState(false);
  const [race, setRace] = useState<{
    rank: number;
    count: number;
    leaderCount: number;
    leaderAddress: string;
    holders: number;
    patron: boolean;
  } | null>(null);
  const runRef = useRef(0);

  const load = useCallback(
    async (address: string) => {
      const run = ++runRef.current;
      setError("");
      setTokens(null);
      setRace(null);
      setScanning(true);
      setProgress(null);
      try {
        const [scan, rarity, routeScan] = await Promise.all([
          scanOwners(contractAddress, (done, total) => {
            if (runRef.current === run) setProgress({ done, total });
          }),
          loadRarity().catch((): RarityData | null => null),
          scanMintRoutes(contractAddress).catch(() => null),
        ]);
        if (runRef.current !== run) return;
        const wanted = address.toLowerCase();
        const ids: number[] = [];
        scan.owners.forEach((owner, index) => {
          if (owner === wanted) ids.push(index + 1);
        });
        const holderCounts = new Map<string, number>();
        for (const owner of scan.owners) {
          if (owner) holderCounts.set(owner, (holderCounts.get(owner) ?? 0) + 1);
        }
        let raceInfo: {
          rank: number;
          count: number;
          leaderCount: number;
          leaderAddress: string;
          holders: number;
          patron: boolean;
        } | null = null;
        if (holderCounts.size > 0) {
          const leaderEntry = [...holderCounts.entries()].sort(
            (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
          )[0];
          const rank = 1 + [...holderCounts.values()].filter((count) => count > ids.length).length;
          raceInfo = {
            rank,
            count: ids.length,
            leaderCount: leaderEntry[1],
            leaderAddress: leaderEntry[0],
            holders: holderCounts.size,
            patron: routeScan ? routeScan.paidWallets.includes(wanted) : false,
          };
        }
        const owned: OwnedToken[] = [];
        for (const id of ids) {
          const meta = await fetchTokenMeta(contractAddress, id);
          const tokenRarity = rarity ? rarityForToken(rarity, id) : null;
          owned.push({ meta, rank: tokenRarity?.rank ?? null, traits: tokenRarity?.traits ?? [] });
        }
        if (runRef.current !== run) return;
        owned.sort((a, b) => (a.rank ?? Number.MAX_SAFE_INTEGER) - (b.rank ?? Number.MAX_SAFE_INTEGER));
        setRace(raceInfo);
        setTokens(owned);
      } catch (err) {
        if (runRef.current === run) {
          setError(err instanceof Error ? err.message : "The scan failed. Please try again.");
        }
      } finally {
        if (runRef.current === run) setScanning(false);
      }
    },
    [contractAddress],
  );

  useEffect(() => {
    if (account && !target) {
      setTarget(account);
      setInput(account);
      void load(account);
    }
  }, [account, target, load]);

  const submit = () => {
    const value = input.trim();
    if (!ADDRESS_RE.test(value)) {
      setError("Enter a valid 0x wallet address.");
      return;
    }
    setTarget(value);
    void load(value);
  };

  const share = async (token: OwnedToken) => {
    setSharingId(token.meta.id);
    try {
      const blob = await buildShareCardBlob({
        id: token.meta.id,
        name: token.meta.name,
        character: token.meta.character,
        image: token.meta.image,
      });
      downloadBlob(blob, `npc-hood-${padTokenId(token.meta.id)}-share.png`);
    } catch {
      // The card is a bonus; failing silently keeps the page calm.
    } finally {
      setSharingId(null);
    }
  };

  const shareRank = async () => {
    if (!race || !target) return;
    setSharingRank(true);
    try {
      const blob = await buildRankCardBlob({
        rank: race.rank,
        holders: race.holders,
        count: race.count,
        gap: race.leaderCount - race.count + 1,
        isLeader: race.rank === 1,
        address: target,
        image: tokens && tokens.length > 0 ? tokens[0].meta.image : undefined,
      });
      downloadBlob(blob, `npc-hood-rank-${race.rank}.png`);
    } catch {
      // The card is a bonus; failing silently keeps the page calm.
    } finally {
      setSharingRank(false);
    }
  };

  if (!configured) return null;

  const best = tokens && tokens.length > 0 ? tokens[0] : null;
  const crownGap = race ? race.leaderCount - race.count + 1 : 0;

  return (
    <section className="recent-section hood-section" id="my-npcs" aria-labelledby="my-npcs-title">
      <div className="recent-heading">
        <span className="section-kicker">YOUR CORNER OF TOWN</span>
        <h2 id="my-npcs-title">
          My <em>Hood.</em>
        </h2>
        <p>
          Look up any wallet to see its NPCs with trait rarity across all 10,000. Ownership is read straight from the
          contract — the first scan can take a moment, later visits reuse it.
        </p>
      </div>

      <div className="hood-lookup">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="0x… wallet address"
          aria-label="Wallet address"
          spellCheck={false}
        />
        <button className="hood-load" onClick={submit} disabled={scanning}>
          <Search size={14} /> {scanning ? "SCANNING…" : "LOAD NPCS"}
        </button>
        {!account && (
          <button className="hood-connect" onClick={onConnect}>
            <Wallet size={14} /> CONNECT WALLET
          </button>
        )}
        {account && target && target.toLowerCase() !== account.toLowerCase() && (
          <button
            className="hood-connect"
            onClick={() => {
              setInput(account);
              setTarget(account);
              void load(account);
            }}
          >
            <Wallet size={14} /> MY WALLET ({shortAddress(account)})
          </button>
        )}
      </div>

      {scanning && (
        <div className="hood-progress" role="status">
          <div className="progress-track">
            <span style={{ width: progress && progress.total > 0 ? `${(progress.done / progress.total) * 100}%` : "8%" }} />
          </div>
          <small>
            {progress
              ? `Reading owners from the chain… ${progress.done.toLocaleString("en-US")} / ${progress.total.toLocaleString("en-US")}`
              : "Reading owners from the chain…"}
          </small>
        </div>
      )}
      {error && <p className="hood-error">{error}</p>}

      {tokens && !scanning && (
        <>
          <p className="hood-summary">
            {tokens.length === 0
              ? `No NPCs found for ${target ? shortAddress(target) : "this address"} yet.`
              : `${tokens.length} NPC${tokens.length > 1 ? "s" : ""} held by ${target ? shortAddress(target) : ""}${
                  best && best.rank !== null ? ` · Rarest: #${padTokenId(best.meta.id)} at rarity rank #${best.rank.toLocaleString("en-US")}` : ""
                }`}
          </p>
          {race && race.count > 0 && (
            <div className="rank-banner">
              <p>
                {race.rank === 1 ? (
                  <>
                    👑 <strong>#{race.rank} of {race.holders} holders — REIGNING TOP MINTER</strong> with {race.count}{" "}
                    NPC{race.count > 1 ? "s" : ""}. The crown is yours to lose.
                  </>
                ) : (
                  <>
                    🏁 <strong>
                      #{race.rank} of {race.holders} holders
                    </strong>{" "}
                    with {race.count} NPC{race.count > 1 ? "s" : ""} — {crownGap} more to take the crown from{" "}
                    {shortAddress(race.leaderAddress)}.
                  </>
                )}
                {race.patron && <span className="patron-badge">PATRON</span>}
              </p>
              <div className="hood-actions">
                <button className="share-button" onClick={() => void shareRank()} disabled={sharingRank}>
                  <Download size={12} /> {sharingRank ? "RENDERING…" : "SHARE MY RANK"}
                </button>
                <a
                  className="share-button"
                  href={shareOnXUrl(
                    rankShareText({ rank: race.rank, count: race.count, gap: crownGap, isLeader: race.rank === 1 }),
                    "https://npcshood.xyz",
                  )}
                  target="_blank"
                  rel="noreferrer"
                >
                  POST ON X <ArrowUpRight size={12} />
                </a>
              </div>
            </div>
          )}
          <div className="hood-grid">
            {tokens.map((token) => {
              const rarest = token.traits.reduce(
                (min, trait) => (min === null || trait.pct < min.pct ? trait : min),
                null as { type: string; value: string; pct: number } | null,
              );
              return (
                <article className="hood-card" key={token.meta.id}>
                  <div className="recent-art">
                    <img src={token.meta.image} alt={token.meta.name} loading="lazy" />
                  </div>
                  <div className="hood-card-body">
                    <div className="hood-card-top">
                      <strong>
                        #{padTokenId(token.meta.id)} {token.meta.character && <span>· {token.meta.character}</span>}
                      </strong>
                      {token.rank !== null && <span className="hood-rank">RARITY #{token.rank.toLocaleString("en-US")}</span>}
                    </div>
                    <ul className="hood-traits">
                      {token.traits.map((trait) => (
                        <li key={trait.type} className={rarest && trait.type === rarest.type ? "is-rare" : undefined}>
                          <span>{trait.type}</span>
                          <strong>{trait.value}</strong>
                          <em>{formatPct(trait.pct)}</em>
                        </li>
                      ))}
                    </ul>
                    <div className="hood-actions">
                      <a
                        className="share-button"
                        href={`${explorerUrl}/token/${contractAddress}?a=${token.meta.id}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        BSCSCAN <ArrowUpRight size={12} />
                      </a>
                      <button className="share-button" onClick={() => void share(token)} disabled={sharingId === token.meta.id}>
                        <Download size={12} /> {sharingId === token.meta.id ? "RENDERING…" : "SHARE CARD"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
