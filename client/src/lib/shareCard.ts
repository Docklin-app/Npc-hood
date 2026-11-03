import { padTokenId, shortAddress } from "@/lib/hoodData";

export type ShareCardInput = {
  id: number;
  name: string;
  character: string;
  image: string;
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image failed to load."));
    img.src = src;
  });
}

export async function buildShareCardBlob(input: ShareCardInput): Promise<Blob> {
  const W = 1200;
  const H = 630;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available in this browser.");

  // Background: deep pine with a subtle dot grid and a gold top rule.
  ctx.fillStyle = "#0c271b";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "rgba(244, 241, 232, 0.05)";
  for (let x = 26; x < W; x += 34) {
    for (let y = 30; y < H; y += 34) {
      ctx.fillRect(x, y, 3, 3);
    }
  }
  ctx.fillStyle = "#e4b848";
  ctx.fillRect(0, 0, W, 8);

  // Token art on the right, pixelated, with a gold frame.
  const art = await loadImage(input.image);
  const artSize = 430;
  const artX = W - artSize - 70;
  const artY = (H - artSize) / 2;
  ctx.fillStyle = "#e4b848";
  ctx.fillRect(artX - 6, artY - 6, artSize + 12, artSize + 12);
  ctx.fillStyle = "#163c2a";
  ctx.fillRect(artX - 3, artY - 3, artSize + 6, artSize + 6);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(art, artX, artY, artSize, artSize);

  // Copy on the left.
  const X = 72;
  ctx.fillStyle = "#e4b848";
  ctx.font = "500 25px 'DM Mono', monospace";
  ctx.fillText("N P C   H O O D", X, 138);
  ctx.fillStyle = "#f4f1e8";
  ctx.font = "700 74px 'Space Grotesk', sans-serif";
  ctx.fillText("I JUST", X, 232);
  ctx.fillText("MINTED", X, 312);
  ctx.fillStyle = "#e4b848";
  ctx.font = "700 92px 'Space Grotesk', sans-serif";
  ctx.fillText(`#${padTokenId(input.id)}`, X, 424);
  ctx.fillStyle = "#f4f1e8";
  ctx.font = "500 34px 'Space Grotesk', sans-serif";
  const label = input.character || input.name;
  ctx.fillText(label.slice(0, 26), X, 478);
  ctx.fillStyle = "rgba(244, 241, 232, 0.65)";
  ctx.font = "500 24px 'DM Mono', monospace";
  ctx.fillText("npcshood.xyz · BNB Chain", X, 556);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Could not render the share card."));
    }, "image/png");
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function shareOnXUrl(text: string, url?: string) {
  const params = new URLSearchParams({ text });
  if (url) params.set("url", url);
  return `https://twitter.com/intent/tweet?${params.toString()}`;
}

export function mintShareText(id: number, character: string) {
  const who = character ? ` — ${character}` : "";
  return `I just minted NPC HOOD #${padTokenId(id)}${who} 🎮\nA hooded little pixel universe on BNB Chain.\nMint yours 👇 @NPChood_xyz`;
}

export type RankCardInput = {
  rank: number;
  holders: number;
  count: number;
  gap: number;
  isLeader: boolean;
  address: string;
  image?: string;
};

export async function buildRankCardBlob(input: RankCardInput): Promise<Blob> {
  const W = 1200;
  const H = 630;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available in this browser.");

  ctx.fillStyle = "#0c271b";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "rgba(244, 241, 232, 0.05)";
  for (let x = 26; x < W; x += 34) {
    for (let y = 30; y < H; y += 34) {
      ctx.fillRect(x, y, 3, 3);
    }
  }
  ctx.fillStyle = "#e4b848";
  ctx.fillRect(0, 0, W, 8);

  if (input.image) {
    try {
      const art = await loadImage(input.image);
      const artSize = 430;
      const artX = W - artSize - 70;
      const artY = (H - artSize) / 2;
      ctx.fillStyle = "#e4b848";
      ctx.fillRect(artX - 6, artY - 6, artSize + 12, artSize + 12);
      ctx.fillStyle = "#163c2a";
      ctx.fillRect(artX - 3, artY - 3, artSize + 6, artSize + 6);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(art, artX, artY, artSize, artSize);
    } catch {
      // Art is decoration on this card; the rank copy carries it on its own.
    }
  }

  const X = 72;
  ctx.fillStyle = "#e4b848";
  ctx.font = "500 25px 'DM Mono', monospace";
  ctx.fillText("N P C   H O O D   ·   T O P   M I N T E R S", X, 128);
  ctx.fillStyle = "#f4f1e8";
  ctx.font = "700 46px 'Space Grotesk', sans-serif";
  ctx.fillText("MY RANK", X, 208);
  ctx.fillStyle = "#e4b848";
  ctx.font = "700 120px 'Space Grotesk', sans-serif";
  ctx.fillText(`#${input.rank}`, X, 336);
  ctx.fillStyle = "#f4f1e8";
  ctx.font = "700 38px 'Space Grotesk', sans-serif";
  ctx.fillText(
    input.isLeader ? "REIGNING TOP MINTER" : `${input.count} NPC${input.count > 1 ? "S" : ""} · ${input.gap} FROM THE CROWN`,
    X,
    410,
  );
  ctx.fillStyle = "rgba(244, 241, 232, 0.65)";
  ctx.font = "500 24px 'DM Mono', monospace";
  ctx.fillText(
    input.isLeader
      ? `${input.count} NPC${input.count > 1 ? "S" : ""} · ${shortAddress(input.address)} · ${input.holders} HOLDERS RACING`
      : `OF ${input.holders} HOLDERS · ${shortAddress(input.address)}`,
    X,
    462,
  );
  ctx.fillText("npcshood.xyz · BNB Chain", X, 556);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Could not render the rank card."));
    }, "image/png");
  });
}

export type WallpaperInput = {
  address: string;
  rank: number | null;
  holders: number;
  count: number;
  tokens: { id: number; image: string; character: string }[];
};

export async function buildWallpaperBlob(input: WallpaperInput): Promise<Blob> {
  const W = 1080;
  const H = 1920;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available in this browser.");

  ctx.fillStyle = "#0c271b";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "rgba(244, 241, 232, 0.05)";
  for (let x = 30; x < W; x += 40) {
    for (let y = 36; y < H; y += 40) {
      ctx.fillRect(x, y, 4, 4);
    }
  }
  ctx.fillStyle = "#e4b848";
  ctx.fillRect(0, 0, W, 14);

  ctx.textAlign = "center";
  ctx.fillStyle = "#e4b848";
  ctx.font = "500 40px 'DM Mono', monospace";
  ctx.fillText("N P C   H O O D", W / 2, 190);
  ctx.fillStyle = "#f4f1e8";
  ctx.font = "700 130px 'Space Grotesk', sans-serif";
  ctx.fillText("MY HOOD", W / 2, 340);
  ctx.fillStyle = "rgba(244, 241, 232, 0.75)";
  ctx.font = "500 38px 'DM Mono', monospace";
  const rankLine =
    input.rank !== null
      ? `RANK #${input.rank} OF ${input.holders} HOLDERS · ${input.count} NPC${input.count > 1 ? "S" : ""}`
      : `${input.count} NPC${input.count > 1 ? "S" : ""} IN THE HOOD`;
  ctx.fillText(rankLine.slice(0, 44), W / 2, 420);

  // Up to nine rarest NPCs in a 3x3 grid with gold frames.
  const shown = input.tokens.slice(0, 9);
  const cell = 296;
  const gap = 26;
  const gridW = cell * 3 + gap * 2;
  const startX = (W - gridW) / 2;
  const startY = 520;
  for (let i = 0; i < shown.length; i++) {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = startX + col * (cell + gap);
    const y = startY + row * (cell + gap);
    ctx.fillStyle = "#e4b848";
    ctx.fillRect(x - 5, y - 5, cell + 10, cell + 10);
    ctx.fillStyle = "#163c2a";
    ctx.fillRect(x, y, cell, cell);
    try {
      const art = await loadImage(shown[i].image);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(art, x, y, cell, cell);
    } catch {
      ctx.fillStyle = "#f4f1e8";
      ctx.font = "700 44px 'Space Grotesk', sans-serif";
      ctx.fillText(`#${padTokenId(shown[i].id)}`, x + cell / 2, y + cell / 2 + 14);
    }
  }

  ctx.fillStyle = "#e4b848";
  ctx.font = "500 36px 'DM Mono', monospace";
  ctx.fillText(shortAddress(input.address), W / 2, H - 190);
  ctx.fillStyle = "rgba(244, 241, 232, 0.65)";
  ctx.font = "500 32px 'DM Mono', monospace";
  ctx.fillText("npcshood.xyz · @NPChood_xyz", W / 2, H - 120);
  ctx.textAlign = "left";

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Could not render the wallpaper."));
    }, "image/png");
  });
}

export function rankShareText(input: { rank: number; count: number; gap: number; isLeader: boolean }) {
  if (input.isLeader) {
    return `I'm the reigning Top Minter on NPC HOOD with ${input.count} NPC${input.count > 1 ? "s" : ""} 👑\nThink you can take the crown?\n@NPChood_xyz`;
  }
  return `I'm #${input.rank} on the NPC HOOD Top Minters board with ${input.count} NPC${input.count > 1 ? "s" : ""} — ${input.gap} away from the crown 👑\n@NPChood_xyz`;
}
