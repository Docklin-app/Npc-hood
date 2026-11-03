import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpRight, Crown } from "lucide-react";
import { scanOwners, shortAddress } from "@/lib/hoodData";

type RaceToChapterProps = {
  contractAddress: string;
  explorerUrl: string;
  configured: boolean;
  refreshSignal: number | null;
};

type Chapter = {
  at: number;
  title: string;
  founderTitle: string;
};

const CHAPTERS: Chapter[] = [
  { at: 1000, title: "The Gate Opens", founderTitle: "Founder of the Gate" },
  { at: 2500, title: "Market Day", founderTitle: "Founder of the Market" },
  { at: 5000, title: "Lantern Square", founderTitle: "Founder of Lantern Square" },
  { at: 7500, title: "The North Quarter", founderTitle: "Founder of the North Quarter" },
  { at: 10000, title: "The Town Is Awake", founderTitle: "Founder of the Awakening" },
];

type FounderRecord = { address: string; count: number };
type Contender = { address: string; count: number };

export default function RaceToChapter({ contractAddress, explorerUrl, configured, refreshSignal }: RaceToChapterProps) {
  const [total, setTotal] = useState<number | null>(null);
  const [contenders, setContenders] = useState<Contender[] | null>(null);
  const [founders, setFounders] = useState<Record<string, FounderRecord>>({});
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState("");
  const loadingRef = useRef(false);

  const load = useCallback(async () => {
    if (!configured || !contractAddress || loadingRef.current) return;
    loadingRef.current = true;
    setError("");
    try {
      const [scan] = await Promise.all([
        scanOwners(contractAddress, (done, scanTotal) => {
          setProgress({ done, total: scanTotal });
        }),
        fetch("/founders.json", { cache: "no-store" })
          .then((res) => (res.ok ? res.json() : {}))
          .then((data) => setFounders(data as Record<string, FounderRecord>))
          .catch(() => undefined),
      ]);
      setTotal(scan.total);
      const counts = new Map<string, number>();
      for (const owner of scan.owners) {
        if (owner) counts.set(owner, (counts.get(owner) ?? 0) + 1);
      }
      const sorted = [...counts.entries()]
        .map(([address, count]) => ({ address, count }))
        .sort((a, b) => b.count - a.count || a.address.localeCompare(b.address))
        .slice(0, 3);
      setContenders(sorted);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The race scan failed.");
    } finally {
      loadingRef.current = false;
    }
  }, [configured, contractAddress]);

  useEffect(() => {
    void load();
  }, [load, refreshSignal]);

  if (!configured) return null;

  const minted = total ?? 0;
  const next = CHAPTERS.find((chapter) => minted < chapter.at) ?? null;
  const leaderCount = contenders && contenders.length > 0 ? contenders[0].count : 0;
  const decidedFounders = CHAPTERS.filter(
    (chapter) => minted >= chapter.at && founders[String(chapter.at)],
  );

  return (
    <section className="recent-section race-section" aria-labelledby="race-title">
      <div className="recent-heading">
        <span className="section-kicker">TOP MINTER RACE · LIVE FROM THE CONTRACT</span>
        <h2 id="race-title">
          {next ? (
            <>
              Race to <em>{next.title}.</em>
            </>
          ) : (
            <>
              The race is <em>complete.</em>
            </>
          )}
        </h2>
        <p>
          {next ? (
            <>
              When mint #{next.at.toLocaleString("en-US")} lands, the wallet holding the most NPCs is crowned{" "}
              <strong>{next.founderTitle}</strong> — a title that stays on this page for good. Every mint until then is
              a move in the race.
            </>
          ) : (
            <>Every chapter is open, and the founders below wrote the town&apos;s history.</>
          )}
        </p>
      </div>

      {error && <p className="hood-error">{error}</p>}
      {!contenders && !error && (
        <div className="hood-progress" role="status">
          <div className="progress-track">
            <span style={{ width: progress && progress.total > 0 ? `${(progress.done / progress.total) * 100}%` : "8%" }} />
          </div>
          <small>
            {progress
              ? `Reading the race… ${progress.done.toLocaleString("en-US")} / ${progress.total.toLocaleString("en-US")}`
              : "Reading the race…"}
          </small>
        </div>
      )}

      {contenders && next && (
        <>
          <div className="hood-progress" role="status">
            <div className="progress-track">
              <span style={{ width: `${Math.min(100, (minted / next.at) * 100)}%` }} />
            </div>
            <small>
              {minted.toLocaleString("en-US")} / {next.at.toLocaleString("en-US")} MINTED ·{" "}
              {(next.at - minted).toLocaleString("en-US")} TO GO — THE TITLE GOES TO THE LEADER AT THE BELL
            </small>
          </div>
          {contenders.length === 0 ? (
            <p className="hood-summary">No contenders yet — the first minter leads the race by default.</p>
          ) : (
            <ol className="board-list">
              {contenders.map((row, index) => (
                <li className="board-row" key={row.address}>
                  <span className="board-rank">
                    {index === 0 ? <Crown size={15} /> : String(index + 1).padStart(2, "0")}
                  </span>
                  <a href={`${explorerUrl}/address/${row.address}`} target="_blank" rel="noreferrer" className="board-address">
                    {shortAddress(row.address)} <ArrowUpRight size={12} />
                  </a>
                  <span className="board-bar" aria-hidden="true">
                    <span style={{ width: `${leaderCount > 0 ? (row.count / leaderCount) * 100 : 0}%` }} />
                  </span>
                  <strong className="board-count">
                    {row.count} NPC{row.count > 1 ? "s" : ""}
                    {index === 0 ? (
                      <small className="board-gap">LEADING THE RACE FOR {next.founderTitle.toUpperCase()}</small>
                    ) : (
                      <small className="board-gap">{leaderCount - row.count + 1} TO TAKE THE LEAD</small>
                    )}
                  </strong>
                </li>
              ))}
            </ol>
          )}
        </>
      )}

      {decidedFounders.length > 0 && (
        <div>
          {decidedFounders.map((chapter) => {
            const record = founders[String(chapter.at)];
            return (
              <p className="founder-line" key={chapter.at}>
                👑 {chapter.founderTitle} —{" "}
                <a href={`${explorerUrl}/address/${record.address}`} target="_blank" rel="noreferrer">
                  {shortAddress(record.address)}
                </a>{" "}
                · {record.count} NPC{record.count > 1 ? "s" : ""} when {chapter.title} opened
              </p>
            );
          })}
        </div>
      )}
    </section>
  );
}
