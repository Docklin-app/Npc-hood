import { Contract, JsonRpcProvider } from "ethers";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { NPC_HOOD_ABI } from "@/lib/npcHoodAbi";

type RecentMintsProps = {
  contractAddress: string;
  explorerUrl: string;
  configured: boolean;
  refreshSignal: number | null;
};

type MintedToken = {
  id: number;
  name: string;
  character: string;
  image: string;
  owner: string;
};

const RPC_URLS = [
  "https://bsc-dataseed.binance.org",
  "https://bsc.publicnode.com",
  "https://bsc-mainnet.public.blastapi.io",
];
const MAX_SHOWN = 8;
const FALLBACK_IMAGE_BASE =
  "https://raw.githubusercontent.com/Docklin-app/Npc-hood/50ec59243a7479bc69249331c39daeedb83405c3/nft-collection/collection/images/";

function shortAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export default function RecentMints({
  contractAddress,
  explorerUrl,
  configured,
  refreshSignal,
}: RecentMintsProps) {
  const [total, setTotal] = useState<number | null>(null);
  const [tokens, setTokens] = useState<MintedToken[]>([]);
  const loadingRef = useRef(false);

  const load = useCallback(async () => {
    if (!configured || !contractAddress || loadingRef.current) return;
    loadingRef.current = true;
    try {
      let contract: Contract | null = null;
      let mintedTotal: number | null = null;
      for (const url of RPC_URLS) {
        try {
          const provider = new JsonRpcProvider(url);
          const candidate = new Contract(contractAddress, NPC_HOOD_ABI, provider);
          mintedTotal = Number(await candidate.totalMinted());
          contract = candidate;
          break;
        } catch {
          // Try the next public RPC endpoint.
        }
      }
      if (!contract || mintedTotal === null || !Number.isSafeInteger(mintedTotal)) return;
      setTotal(mintedTotal);
      if (mintedTotal === 0) {
        setTokens([]);
        return;
      }
      const ids: number[] = [];
      for (let id = mintedTotal; id >= Math.max(1, mintedTotal - MAX_SHOWN + 1); id--) {
        ids.push(id);
      }
      const items = await Promise.all(
        ids.map(async (id) => {
          let uri = "";
          let owner = "";
          try {
            uri = String(await contract.tokenURI(id));
          } catch {
            // Metadata stays on the fallback below.
          }
          try {
            owner = String(await contract.ownerOf(id));
          } catch {
            // Owner line stays empty if the read fails.
          }
          let name = `NPC HOOD #${id}`;
          let character = "";
          let image = `${FALLBACK_IMAGE_BASE}${id}.png`;
          if (uri) {
            try {
              const response = await fetch(uri);
              if (response.ok) {
                const meta = (await response.json()) as {
                  name?: unknown;
                  image?: unknown;
                  attributes?: unknown;
                };
                if (typeof meta.name === "string" && meta.name) name = meta.name;
                if (typeof meta.image === "string" && meta.image) image = meta.image;
                if (Array.isArray(meta.attributes)) {
                  const trait = meta.attributes.find(
                    (item): item is { trait_type: string; value: string } =>
                      Boolean(
                        item &&
                          typeof item === "object" &&
                          (item as { trait_type?: unknown }).trait_type === "Character" &&
                          typeof (item as { value?: unknown }).value === "string",
                      ),
                  );
                  if (trait) character = trait.value;
                }
              }
            } catch {
              // Keep the fallback name and image.
            }
          }
          return { id, name, character, image, owner };
        }),
      );
      setTokens(items);
    } finally {
      loadingRef.current = false;
    }
  }, [configured, contractAddress]);

  useEffect(() => {
    void load();
  }, [load, refreshSignal]);

  useEffect(() => {
    const timer = window.setInterval(() => void load(), 45000);
    return () => window.clearInterval(timer);
  }, [load]);

  if (!configured) return null;

  return (
    <section className="recent-section" aria-labelledby="recent-title">
      <div className="recent-heading">
        <span className="section-kicker">LIVE FROM THE CONTRACT</span>
        <h2 id="recent-title">
          Minted
          <br />
          <em>so far.</em>
        </h2>
        <p>
          {total === null
            ? "Reading the contract…"
            : total === 0
              ? "0 of 10,000 minted so far. The latest mints will appear here as soon as minting opens."
              : `${total.toLocaleString("en-US")} of 10,000 minted so far. The latest ${tokens.length} are shown below, read live from the contract.`}
        </p>
      </div>
      {tokens.length > 0 && (
        <div className="recent-grid">
          {tokens.map((token) => (
            <a
              key={token.id}
              className="recent-card"
              href={`${explorerUrl}/token/${contractAddress}?a=${token.id}`}
              target="_blank"
              rel="noreferrer"
            >
              <div className="recent-card-top">
                <span>NPC HOOD</span>
                <span>#{String(token.id).padStart(4, "0")}</span>
              </div>
              <div className="recent-art">
                <img src={token.image} alt={token.name} loading="lazy" />
              </div>
              <div className="recent-meta">
                <span>{(token.character || token.name).toUpperCase()}</span>
                <span>
                  {token.owner ? shortAddress(token.owner) : ""} <ArrowUpRight size={12} />
                </span>
              </div>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
