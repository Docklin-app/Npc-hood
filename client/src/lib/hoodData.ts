import { Contract, JsonRpcProvider } from "ethers";
import { NPC_HOOD_ABI } from "@/lib/npcHoodAbi";

export const RPC_URLS = [
  "https://bsc-dataseed.binance.org",
  "https://bsc.publicnode.com",
  "https://bsc-mainnet.public.blastapi.io",
];

export const FALLBACK_IMAGE_BASE =
  "https://raw.githubusercontent.com/Docklin-app/Npc-hood/50ec59243a7479bc69249331c39daeedb83405c3/nft-collection/collection/images/";

export function shortAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function padTokenId(id: number) {
  return String(id).padStart(4, "0");
}

async function connectReadContract(contractAddress: string) {
  for (const url of RPC_URLS) {
    try {
      const provider = new JsonRpcProvider(url);
      const contract = new Contract(contractAddress, NPC_HOOD_ABI, provider);
      // Probe with a cheap read so a dead endpoint is skipped early.
      await contract.totalMinted();
      return contract;
    } catch {
      // Try the next public RPC endpoint.
    }
  }
  return null;
}

export async function readTotalMinted(contractAddress: string): Promise<number | null> {
  const contract = await connectReadContract(contractAddress);
  if (!contract) return null;
  try {
    const total = Number(await contract.totalMinted());
    return Number.isSafeInteger(total) ? total : null;
  } catch {
    return null;
  }
}

export type ScanResult = {
  total: number;
  owners: string[];
};

const CACHE_PREFIX = "npchood:owners:v1:";
const CHUNK = 40;
const inflight = new Map<string, Promise<ScanResult>>();

function readCache(contractAddress: string, total: number): string[] {
  try {
    const raw = window.localStorage.getItem(CACHE_PREFIX + contractAddress);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { total?: unknown; owners?: unknown };
    if (typeof parsed.total !== "number" || !Array.isArray(parsed.owners)) return [];
    if (parsed.total > total) return [];
    const owners = parsed.owners.filter((item): item is string => typeof item === "string");
    return owners.slice(0, parsed.total);
  } catch {
    return [];
  }
}

function writeCache(contractAddress: string, owners: string[]) {
  try {
    window.localStorage.setItem(
      CACHE_PREFIX + contractAddress,
      JSON.stringify({ total: owners.length, owners }),
    );
  } catch {
    // Cache is an optimisation only; scanning still works without it.
  }
}

async function runScan(
  contractAddress: string,
  onProgress?: (done: number, total: number) => void,
): Promise<ScanResult> {
  const contract = await connectReadContract(contractAddress);
  if (!contract) throw new Error("Could not reach the BNB Chain RPC endpoints.");
  const total = Number(await contract.totalMinted());
  if (!Number.isSafeInteger(total) || total < 0) throw new Error("Unexpected totalMinted value.");
  const owners = readCache(contractAddress, total);
  onProgress?.(owners.length, total);
  let cursor = owners.length;
  while (cursor < total) {
    const end = Math.min(total, cursor + CHUNK);
    const ids: number[] = [];
    for (let id = cursor + 1; id <= end; id++) ids.push(id);
    const batch = await Promise.all(
      ids.map(async (id) => String(await contract.ownerOf(id)).toLowerCase()),
    );
    owners.push(...batch);
    cursor = end;
    writeCache(contractAddress, owners);
    onProgress?.(cursor, total);
  }
  return { total, owners };
}

export function scanOwners(
  contractAddress: string,
  onProgress?: (done: number, total: number) => void,
): Promise<ScanResult> {
  const existing = inflight.get(contractAddress);
  if (existing) return existing;
  const promise = runScan(contractAddress, onProgress).finally(() => {
    inflight.delete(contractAddress);
  });
  inflight.set(contractAddress, promise);
  return promise;
}

export type TokenMeta = {
  id: number;
  name: string;
  character: string;
  image: string;
};

const metaCache = new Map<number, TokenMeta>();

export async function fetchTokenMeta(contractAddress: string, id: number): Promise<TokenMeta> {
  const cached = metaCache.get(id);
  if (cached) return cached;
  const fallback: TokenMeta = {
    id,
    name: `NPC HOOD #${padTokenId(id)}`,
    character: "",
    image: `${FALLBACK_IMAGE_BASE}${id}.png`,
  };
  try {
    const contract = await connectReadContract(contractAddress);
    if (!contract) return fallback;
    const uri = String(await contract.tokenURI(id));
    if (!uri) return fallback;
    const response = await fetch(uri);
    if (!response.ok) return fallback;
    const meta = (await response.json()) as {
      name?: unknown;
      image?: unknown;
      attributes?: unknown;
    };
    const result: TokenMeta = { ...fallback };
    if (typeof meta.name === "string" && meta.name) result.name = meta.name;
    if (typeof meta.image === "string" && meta.image) result.image = meta.image;
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
      if (trait) result.character = trait.value;
    }
    metaCache.set(id, result);
    return result;
  } catch {
    return fallback;
  }
}

export type RarityData = {
  total: number;
  traits: string[];
  scoredTraits: string[];
  values: string[][];
  counts: number[][];
  tokens: number[][];
  ranks: number[];
};

let rarityPromise: Promise<RarityData> | null = null;

export function loadRarity(): Promise<RarityData> {
  if (!rarityPromise) {
    rarityPromise = fetch("/rarity.json").then(async (response) => {
      if (!response.ok) throw new Error("Rarity data is unavailable.");
      return (await response.json()) as RarityData;
    });
  }
  return rarityPromise;
}

export type TraitRarity = {
  type: string;
  value: string;
  pct: number;
};

export function rarityForToken(
  data: RarityData,
  id: number,
): { rank: number; traits: TraitRarity[] } | null {
  const row = data.tokens[id - 1];
  const rank = data.ranks[id - 1];
  if (!row || typeof rank !== "number") return null;
  const traits = data.traits.map((type, index) => {
    const valueIndex = row[index];
    const value = data.values[index]?.[valueIndex] ?? "";
    const count = data.counts[index]?.[valueIndex] ?? data.total;
    return { type, value, pct: (count / data.total) * 100 };
  });
  return { rank, traits };
}
