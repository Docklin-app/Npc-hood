import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpRight, Crown } from "lucide-react";
import { scanMintRoutes, scanOwners, shortAddress } from "@/lib/hoodData";

type LeaderboardProps = {
  contractAddress: string;
  explorerUrl: string;
  configured: boolean;
  refreshSignal: number | null;
};

type Row = {
  address: string;
  count: number;
};

export default function Leaderboard({ contractAddress, explorerUrl, configured, refreshSignal }: LeaderboardProps) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [paidWallets, setPaidWallets] = useState<string[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState("");
  const loadingRef = useRef(false);

  const load = useCallback(async () => {
    if (!configured || !contractAddress || loadingRef.current) return;
    loadingRef.current = true;
    setError("");
    try {
      const scan = await scanOwners(contractAddress, (done, scanTotal) => {
        setProgress({ done, total: scanTotal });
      });
      setTotal(scan.total);
      const counts = new Map<string, number>();
      for (const owner of scan.owners) {
        if (owner) counts.set(owner, (counts.get(owner) ?? 0) + 1);
      }
      const sorted = [...counts.entries()]
        .map(([address, count]) => ({ address, count }))
        .sort((a, b) => b.count - a.count || a.address.localeCompare(b.address))
        .slice(0, 10);
      setRows(sorted);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The leaderboard scan failed.");
    } finally {
      loadingRef.current = false;
    }
  }, [configured, contractAddress]);

  useEffect(() => {
    void load();
  }, [load, refreshSignal]);

  useEffect(() => {
    if (!configured || !contractAddress) return;
    let cancelled = false;
    scanMintRoutes(contractAddress)
      .then((scan) => {
        if (!cancelled) setPaidWallets(scan.paidWallets);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [configured, contractAddress, refreshSignal]);

  if (!configured) return null;

  const topCount = rows && rows.length > 0 ? rows[0].count : 0;

  return (
    <section className="recent-section board-section" aria-labelledby="board-title">
      <div className="recent-heading">
        <span className="section-kicker">MOST HOODS IN TOWN</span>
        <h2 id="board-title">
          Top <em>minters.</em>
        </h2>
        <p>
          The wallets holding the most NPCs, counted live from the contract. No wallet needed — the board reads the
          chain on its own and refreshes as new mints land.
        </p>
      </div>

      {error && <p className="hood-error">{error}</p>}
      {!rows && !error && (
        <div className="hood-progress" role="status">
          <div className="progress-track">
            <span style={{ width: progress && progress.total > 0 ? `${(progress.done / progress.total) * 100}%` : "8%" }} />
          </div>
          <small>
            {progress
              ? `Counting hoods… ${progress.done.toLocaleString("en-US")} / ${progress.total.toLocaleString("en-US")}`
              : "Counting hoods…"}
          </small>
        </div>
      )}
      {rows && total === 0 && (
        <p className="hood-summary">Mint is open and no one has claimed a hood yet — the first minter takes the crown.</p>
      )}
      {rows && rows.length > 0 && (
        <>
          <p className="board-crown-line">
            The crown falls at {topCount + 1} NPC{topCount + 1 > 1 ? "s" : ""} — any single wallet holding {topCount + 1}{" "}
            takes the board.
          </p>
          <ol className="board-list">
            {rows.map((row, index) => (
              <li className="board-row" key={row.address}>
                <span className="board-rank">
                  {index === 0 ? <Crown size={15} /> : String(index + 1).padStart(2, "0")}
                </span>
                <a href={`${explorerUrl}/address/${row.address}`} target="_blank" rel="noreferrer" className="board-address">
                  {shortAddress(row.address)} <ArrowUpRight size={12} />
                  {paidWallets.includes(row.address) && <span className="patron-badge">PATRON</span>}
                </a>
                <span className="board-bar" aria-hidden="true">
                  <span style={{ width: `${topCount > 0 ? (row.count / topCount) * 100 : 0}%` }} />
                </span>
                <strong className="board-count">
                  {row.count} NPC{row.count > 1 ? "s" : ""}
                  {total ? <small> · {((row.count / total) * 100).toFixed(1)}% of minted</small> : null}
                  {index === 0 && rows.length > 1 ? <small className="board-gap">REIGNING — DEFEND THE CROWN</small> : null}
                  {index > 0 ? <small className="board-gap">{topCount - row.count + 1} TO TAKE THE CROWN</small> : null}
                </strong>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}
