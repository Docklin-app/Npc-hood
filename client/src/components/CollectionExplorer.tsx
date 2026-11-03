import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import {
  FALLBACK_IMAGE_BASE,
  loadRarity,
  padTokenId,
  scanOwners,
  shortAddress,
  type RarityData,
} from "@/lib/hoodData";
import TokenDetail from "@/components/TokenDetail";

type CollectionExplorerProps = {
  contractAddress: string;
  explorerUrl: string;
  configured: boolean;
};

type StatusFilter = "all" | "minted" | "unminted";
type SortMode = "number" | "rarity";

const PAGE = 48;

export default function CollectionExplorer({ contractAddress, explorerUrl, configured }: CollectionExplorerProps) {
  const [rarity, setRarity] = useState<RarityData | null>(null);
  const [owners, setOwners] = useState<string[] | null>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [character, setCharacter] = useState("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortMode>("number");
  const [shown, setShown] = useState(PAGE);
  const [detailId, setDetailId] = useState<number | null>(null);

  useEffect(() => {
    loadRarity()
      .then(setRarity)
      .catch(() => setError("The collection index could not be loaded right now."));
  }, []);

  useEffect(() => {
    if (!configured || !contractAddress) return;
    let active = true;
    scanOwners(contractAddress)
      .then((scan) => {
        if (active) setOwners(scan.owners);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [configured, contractAddress]);

  useEffect(() => {
    setShown(PAGE);
  }, [query, character, status, sort]);

  const charIdx = rarity ? rarity.traits.indexOf("Character") : -1;
  const characters = useMemo(
    () => (rarity && charIdx >= 0 ? rarity.values[charIdx] ?? [] : []),
    [rarity, charIdx],
  );

  const results = useMemo(() => {
    if (!rarity || charIdx < 0) return [] as number[];
    let ids = Array.from({ length: rarity.total }, (_, i) => i + 1);
    const q = query.trim().replace(/^#/, "");
    if (q) {
      const n = Number(q);
      ids = Number.isInteger(n) && n >= 1 ? ids.filter((id) => id === n) : [];
    }
    if (character !== "all") {
      const valueIdx = characters.indexOf(character);
      ids = ids.filter((id) => rarity.tokens[id - 1]?.[charIdx] === valueIdx);
    }
    if (status !== "all" && owners) {
      ids = ids.filter((id) => (status === "minted" ? Boolean(owners[id - 1]) : !owners[id - 1]));
    }
    if (sort === "rarity") {
      ids = [...ids].sort((a, b) => (rarity.ranks[a - 1] ?? 0) - (rarity.ranks[b - 1] ?? 0));
    }
    return ids;
  }, [rarity, charIdx, query, character, characters, status, owners, sort]);

  if (!configured) return null;

  const mintedCount = owners ? owners.filter(Boolean).length : null;

  return (
    <section className="recent-section explorer-section" aria-labelledby="explorer-title">
      <div className="recent-heading">
        <span className="section-kicker">THE FULL COLLECTION · 10,000 NPCS</span>
        <h2 id="explorer-title">
          Explore <em>every hood.</em>
        </h2>
        <p>
          Browse the whole collection before you mint: hunt lucky numbers, chase the rarest ranks, and see which
          hoods are already taken.
          {mintedCount !== null ? ` ${mintedCount.toLocaleString("en-US")} minted so far.` : ""}
        </p>
      </div>

      {error && <p className="hood-error">{error}</p>}
      {!rarity && !error && (
        <div className="hood-progress" role="status">
          <div className="progress-track">
            <span style={{ width: "30%" }} />
          </div>
          <small>Loading the collection index…</small>
        </div>
      )}

      {rarity && (
        <>
          <div className="explorer-controls">
            <label className="explorer-search">
              <Search size={14} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Token number, e.g. 2460"
                aria-label="Search by token number"
                inputMode="numeric"
                spellCheck={false}
              />
            </label>
            <select value={character} onChange={(event) => setCharacter(event.target.value)} aria-label="Filter by character">
              <option value="all">All characters</option>
              {characters.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <select value={status} onChange={(event) => setStatus(event.target.value as StatusFilter)} aria-label="Filter by status">
              <option value="all">Minted + unminted</option>
              <option value="minted">Minted only</option>
              <option value="unminted">Unminted only</option>
            </select>
            <select value={sort} onChange={(event) => setSort(event.target.value as SortMode)} aria-label="Sort order">
              <option value="number">Sort: token number</option>
              <option value="rarity">Sort: rarest first</option>
            </select>
          </div>

          <p className="hood-summary">
            {results.length.toLocaleString("en-US")} NPC{results.length === 1 ? "" : "s"} match
            {owners === null && status !== "all" ? " — ownership is still loading, so status filters apply in a moment." : ""}
          </p>

          <div className="explorer-grid">
            {results.slice(0, shown).map((id) => {
              const owner = owners?.[id - 1];
              const charValue = charIdx >= 0 ? rarity.values[charIdx]?.[rarity.tokens[id - 1]?.[charIdx] ?? 0] ?? "" : "";
              const rank = rarity.ranks[id - 1];
              return (
                <article
                  className={owner ? "explorer-card" : "explorer-card unminted"}
                  key={id}
                  onClick={() => setDetailId(id)}
                  title={`View NPC HOOD #${padTokenId(id)}`}
                >
                  <img src={`${FALLBACK_IMAGE_BASE}${id}.png`} alt={`NPC HOOD #${padTokenId(id)}`} loading="lazy" />
                  <div className="explorer-card-body">
                    <strong>
                      #{padTokenId(id)} {charValue && <span>· {charValue}</span>}
                    </strong>
                    <small className="explorer-rank">RARITY #{typeof rank === "number" ? rank.toLocaleString("en-US") : "—"}</small>
                    <small className="explorer-status">{owner ? `MINTED · ${shortAddress(owner)}` : "UNMINTED"}</small>
                  </div>
                </article>
              );
            })}
          </div>

          {results.length === 0 && <p className="hood-summary">No NPC matches that search.</p>}
          {shown < results.length && (
            <button className="hood-load explorer-more" onClick={() => setShown((value) => value + PAGE)}>
              SHOW MORE ({(results.length - shown).toLocaleString("en-US")} LEFT)
            </button>
          )}
        </>
      )}
      {detailId !== null && (
        <TokenDetail
          tokenId={detailId}
          contractAddress={contractAddress}
          explorerUrl={explorerUrl}
          onClose={() => setDetailId(null)}
        />
      )}
    </section>
  );
}
