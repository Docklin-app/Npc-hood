import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Lock } from "lucide-react";
import { readTotalMinted } from "@/lib/hoodData";

type TownAwakeningProps = {
  contractAddress: string;
  configured: boolean;
  refreshSignal: number | null;
};

const TOTAL_SUPPLY = 10_000;

type Milestone = {
  at: number;
  title: string;
  teaser: string;
  chapter: string;
};

const MILESTONES: Milestone[] = [
  {
    at: 1000,
    title: "The Gate Opens",
    teaser: "Something stirs at the old gate.",
    chapter:
      "The old gate had not moved in a hundred quiet years, and the town had learned to walk around it. Then one dusk, with no hand on its iron, it opened — just wide enough for one hooded figure to slip through, and to look back, once, as if counting who would follow.",
  },
  {
    at: 2500,
    title: "Market Day",
    teaser: "Shutters rattle somewhere down the lane.",
    chapter:
      "Stalls first, then voices. Crates of copper flasks, bolts of green cloth, lanterns that had not burned since anyone could remember. The market does not ask who reopened it. It simply starts the way it always started — at dawn, with somebody arguing about plums.",
  },
  {
    at: 5000,
    title: "Lantern Square",
    teaser: "A single lantern flickers at the square.",
    chapter:
      "Half the town is awake the night the square lights up, and the other half pretends it was never asleep. Lanterns hang from every post, and the watchers on the corners say nothing — they have said nothing for a hundred years. But these days, they take the tea that is left out for them.",
  },
  {
    at: 7500,
    title: "The North Quarter",
    teaser: "Footsteps, where there were none.",
    chapter:
      "The north quarter was the first place to go quiet, and the last anyone expected back. Its windows light one by one, like a sentence being remembered. In the tallest house, someone opens a window and leaves it open. The whole street understands: nobody is just passing through anymore. They are staying.",
  },
  {
    at: 10000,
    title: "The Town Is Awake",
    teaser: "Every window is dark. For now.",
    chapter:
      "Ten thousand hoods, and not one of them the hero. That was always the point. The gate stands open, the market is loud, the lanterns burn past midnight — and at every corner, keeping the whole thing running, an NPC who was never background at all. Welcome home.",
  },
];

type HouseSpec = { x: number; w: number; h: number };
const HOUSES: HouseSpec[] = [
  { x: 18, w: 74, h: 96 },
  { x: 104, w: 62, h: 132 },
  { x: 178, w: 84, h: 84 },
  { x: 274, w: 66, h: 118 },
  { x: 352, w: 78, h: 92 },
  { x: 442, w: 62, h: 140 },
  { x: 516, w: 84, h: 88 },
  { x: 612, w: 66, h: 124 },
  { x: 690, w: 76, h: 98 },
  { x: 778, w: 48, h: 112 },
];
const GROUND_Y = 262;

function houseWindows(house: HouseSpec) {
  const top = GROUND_Y - house.h;
  const points: { x: number; y: number }[] = [];
  const cols = house.w >= 70 ? [16, house.w - 28] : [house.w / 2 - 6];
  const rows = house.h >= 120 ? [26, 58, 90] : house.h >= 100 ? [26, 58] : [24, 54];
  for (const dy of rows) {
    for (const dx of cols) {
      points.push({ x: house.x + dx, y: top + dy });
    }
  }
  return points;
}

const ALL_WINDOWS = HOUSES.flatMap(houseWindows);
const LANTERNS = [140, 330, 520, 716];

export default function TownAwakening({ contractAddress, configured, refreshSignal }: TownAwakeningProps) {
  const [total, setTotal] = useState<number | null>(null);
  const loadingRef = useRef(false);

  const load = useCallback(async () => {
    if (!configured || !contractAddress || loadingRef.current) return;
    loadingRef.current = true;
    try {
      const minted = await readTotalMinted(contractAddress);
      if (minted !== null) setTotal(minted);
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

  if (!configured) return null;

  const minted = total ?? 0;
  const progress = Math.min(1, minted / TOTAL_SUPPLY);
  const litWindows = Math.round(progress * ALL_WINDOWS.length);
  let windowIndex = -1;

  return (
    <section className="recent-section town-section" id="town" aria-labelledby="town-title">
      <div className="recent-heading">
        <span className="section-kicker">THE HOOD CHRONICLES · LIVE PROGRESS</span>
        <h2 id="town-title">
          The town <em>wakes up.</em>
        </h2>
        <p>
          Every mint lights another window. As the collection fills, the town opens chapter by chapter — the story is
          written by the mint counter itself.
        </p>
      </div>

      <div className="town-scene" role="img" aria-label={`Pixel town scene, ${Math.round(progress * 100)} percent awake`}>
        <svg viewBox="0 0 840 300" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
          <rect x="0" y="0" width="840" height="300" fill="#0c271b" />
          {[
            [40, 30], [120, 58], [210, 24], [300, 46], [392, 28], [470, 60], [560, 22], [648, 44], [730, 26], [800, 56], [66, 84], [770, 92],
          ].map(([sx, sy], i) => (
            <rect key={i} x={sx} y={sy} width="3" height="3" fill="rgba(244,241,232,0.5)" />
          ))}
          <circle cx="788" cy="42" r="17" fill="#f0ce74" opacity="0.9" />
          <circle cx="781" cy="37" r="15" fill="#0c271b" opacity="0.25" />
          {HOUSES.map((house) => {
            const top = GROUND_Y - house.h;
            return (
              <g key={house.x}>
                <polygon
                  points={`${house.x - 5},${top} ${house.x + house.w / 2},${top - 20} ${house.x + house.w + 5},${top}`}
                  fill="#20503a"
                />
                <rect x={house.x} y={top} width={house.w} height={house.h} fill="#123526" stroke="rgba(244,241,232,0.14)" />
              </g>
            );
          })}
          {HOUSES.map((house) =>
            houseWindows(house).map((win) => {
              windowIndex += 1;
              const lit = windowIndex < litWindows;
              return (
                <g key={`${win.x}-${win.y}`}>
                  {lit && <rect x={win.x - 3} y={win.y - 3} width="18" height="22" fill="rgba(228,184,72,0.22)" />}
                  <rect x={win.x} y={win.y} width="12" height="16" fill={lit ? "#e4b848" : "rgba(244,241,232,0.13)"} />
                </g>
              );
            }),
          )}
          {LANTERNS.map((lx, i) => {
            const lit = progress >= (i + 1) / (LANTERNS.length + 1);
            return (
              <g key={lx}>
                <rect x={lx} y={GROUND_Y - 64} width="3" height="64" fill="#20503a" />
                {lit && <circle cx={lx + 1.5} cy={GROUND_Y - 70} r="11" fill="rgba(228,184,72,0.25)" />}
                <circle cx={lx + 1.5} cy={GROUND_Y - 70} r="5" fill={lit ? "#f0ce74" : "rgba(244,241,232,0.2)"} />
              </g>
            );
          })}
          <rect x="0" y={GROUND_Y} width="840" height="38" fill="#081c12" />
          <rect x="0" y={GROUND_Y} width="840" height="2" fill="rgba(228,184,72,0.35)" />
        </svg>
        <div className="town-scene-foot">
          <span>
            {total === null
              ? "READING THE MINT COUNTER…"
              : `${minted.toLocaleString("en-US")} / 10,000 MINTED — THE TOWN IS ${Math.round(progress * 100)}% AWAKE`}
          </span>
          <span>{litWindows} WINDOWS LIT</span>
        </div>
      </div>

      <div className="town-chapters">
        {MILESTONES.map((stone, index) => {
          const unlocked = minted >= stone.at;
          return (
            <article className={unlocked ? "town-chapter unlocked" : "town-chapter"} key={stone.at}>
              <div className="town-chapter-head">
                <span className="town-chapter-no">{String(index + 1).padStart(2, "0")}</span>
                <strong>{stone.title}</strong>
                <span className="town-chapter-state">
                  {unlocked ? (
                    <>
                      <Check size={12} /> UNLOCKED
                    </>
                  ) : (
                    <>
                      <Lock size={12} /> AT {stone.at.toLocaleString("en-US")} MINTED
                    </>
                  )}
                </span>
              </div>
              <p>{unlocked ? stone.chapter : stone.teaser}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
