import { useCallback, useEffect, useRef, useState } from "react";
import { fetchTokenMeta, padTokenId, scanOwners, shortAddress } from "@/lib/hoodData";

type LiveTickerProps = {
  contractAddress: string;
  configured: boolean;
  refreshSignal: number | null;
};

export default function LiveTicker({ contractAddress, configured, refreshSignal }: LiveTickerProps) {
  const [items, setItems] = useState<string[]>([]);
  const loadingRef = useRef(false);

  const load = useCallback(async () => {
    if (!configured || !contractAddress || loadingRef.current) return;
    loadingRef.current = true;
    try {
      const scan = await scanOwners(contractAddress);
      const total = scan.total;
      if (total <= 0) {
        setItems(["MINT IS OPEN — THE TOWN IS WAITING FOR ITS FIRST NPC"]);
        return;
      }
      const counts = new Map<string, number>();
      for (const owner of scan.owners) {
        if (owner) counts.set(owner, (counts.get(owner) ?? 0) + 1);
      }
      const leader = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
      const next: string[] = [];
      const latestIds: number[] = [];
      for (let id = total; id >= Math.max(1, total - 5); id--) latestIds.push(id);
      const metas = await Promise.all(latestIds.map((id) => fetchTokenMeta(contractAddress, id)));
      latestIds.forEach((id, i) => {
        const owner = scan.owners[id - 1];
        const label = metas[i]?.character || `NPC HOOD #${padTokenId(id)}`;
        next.push(`#${padTokenId(id)} MINTED · ${label.toUpperCase()}${owner ? ` · BY ${shortAddress(owner)}` : ""}`);
      });
      if (leader) {
        next.push(`CROWN: ${shortAddress(leader[0])} · ${leader[1]} NPC${leader[1] > 1 ? "S" : ""}`);
        next.push(`THE CROWN FALLS AT ${leader[1] + 1} NPCS`);
      }
      next.push(`${total.toLocaleString("en-US")} / 10,000 MINTED`);
      setItems(next);
    } catch {
      // The ticker is decoration on live data; failing silently keeps the header calm.
    } finally {
      loadingRef.current = false;
    }
  }, [configured, contractAddress]);

  useEffect(() => {
    void load();
  }, [load, refreshSignal]);

  useEffect(() => {
    const timer = window.setInterval(() => void load(), 60000);
    return () => window.clearInterval(timer);
  }, [load]);

  if (!configured || items.length === 0) return null;

  const sequence = (ariaHidden: boolean) => (
    <div className="ticker-seq" aria-hidden={ariaHidden || undefined}>
      {items.map((item, i) => (
        <span className="ticker-item" key={`${item}-${i}`}>
          {item} <span className="ticker-sep">✳</span>
        </span>
      ))}
    </div>
  );

  return (
    <div className="live-ticker" role="marquee" aria-label="Live mint activity">
      <div className="ticker-track">
        {sequence(false)}
        {sequence(true)}
      </div>
    </div>
  );
}
