# Npc-hood

## NPC HOOD — Pixel Mint

React / Express / tRPC / Drizzle starter, adapted from the Sandbox web-db-user template.

- `pnpm dev`: development server; honors `PORT` (default 3000).
- `pnpm build` / `pnpm start`: build and serve `dist/index.js` and `dist/public/`.
- `pnpm db:migrate`: apply checked-in migrations. `pnpm db:push`: generate and apply new schema changes.
- `pnpm check` / `pnpm test`: types and application tests.

Start with the Webdev skill's default-template guide. Platform login, storage, payments and service contracts live in its shared references; read the relevant capability before extending its helper.

`server/_core/publicConfig.ts` exposes only named public runtime values. Private keys stay server-side. The platform serves managed `/manus-storage/` assets; the application does not register a second proxy.

Platform configuration is readable and editable through `webdev.config`. Default settings are initial values, not enforced constraints. The agent may modify the files, commands and configuration or follow the flexible guide for another stack.

## GitHub Pages deployment

The workflow in `.github/workflows/deploy-pages.yml` builds the static frontend into `dist/public/` and deploys it to GitHub Pages after pushes to `main`. In the repository, set **Settings → Pages → Build and deployment → Source** to **GitHub Actions**. The workflow copies the root `CNAME` into the artifact so the configured custom domain `npcshood.xyz` is retained.

After a real contract is deployed, set `VITE_NPC_HOOD_CHAIN_ID`, `VITE_NPC_HOOD_CHAIN_NAME`, `VITE_NPC_HOOD_CONTRACT_ADDRESS`, `VITE_NPC_HOOD_CURRENCY_SYMBOL`, and `VITE_NPC_HOOD_EXPLORER_URL` as GitHub Actions repository **Variables**. These values are public because Vite embeds them in browser code; never put private keys or deployer credentials there. If chain ID or contract address is absent, mint stays disabled.

## Binance AI Agent prompt builder

The **AI Agent** section creates copy-only prompts for `freeMint(quantity)` or `paidMint(quantity)` using the configured NPC HOOD chain, contract, public wallet address, selected quantity, and the contract's 0.0001/0.0003 native-coin unit prices. It does not connect to a Binance API, sign, or submit transactions. Prompts stay disabled until the chain ID, chain name, native currency symbol, and deployed contract address are configured. The prompt asks the agent to verify the contract constants and supply on-chain, show the exact transaction details, and wait for explicit wallet approval. The NFT is minted to the signing wallet (`msg.sender`); never share a seed phrase or private key.

## NPC HOOD — Website mint

Situs mint ERC-721 ini menyediakan koleksi pixel-art hingga **10.000 NFT**. Salinan GitHub menyertakan aset hero dan showcase di `client/public/assets/` agar build tidak bergantung pada storage Preview. Dari root, jalankan `pnpm install --frozen-lockfile` lalu `pnpm dev:static`; build produksi memakai `pnpm build:static` dengan output ke `dist/public/`. Type check frontend: `pnpm check`.

Kontrak ada di `contracts/src/NpcHood.sol`. `freeMint()` mengenakan 0.0001 native currency per NFT dan `paidMint()` 0.0003 native currency per NFT; biaya gas dibayar terpisah. Maksimum 20 NFT per transaksi membantu menghindari transaksi out-of-gas, sementara supply koleksi tetap 10.000. Dana mint masuk ke kontrak dan `withdraw()` hanya dapat dipanggil owner, yang ditetapkan sebagai wallet deployer.

Sebelum deploy, baca `contracts/README.md`, siapkan metadata HTTPS dengan prefix berakhiran `/`, isi `contracts/.env` dari contoh, instal dependensi dengan `npm install` di dalam `contracts/`, lalu jalankan `npm run compile` dan `npm run deploy`. Preflight memeriksa field jaringan dan mencocokkan chain ID dari RPC. Uji testnet dan verifikasi owner sebelum produksi. Jangan commit private key atau deployer wallet.

Setelah alamat kontrak tersedia, isi `.env.local` dari `.env.example` pada root dengan `VITE_NPC_HOOD_CHAIN_ID` desimal, `VITE_NPC_HOOD_CHAIN_NAME`, `VITE_NPC_HOOD_CONTRACT_ADDRESS`, `VITE_NPC_HOOD_CURRENCY_SYMBOL`, dan `VITE_NPC_HOOD_EXPLORER_URL`; lalu restart/build frontend. Tanpa chain ID dan alamat kontrak valid, mint live dinonaktifkan. Supply dibaca dari kontrak dan frontend memeriksa supply, kuantitas maksimum per transaksi, dan harga on-chain. Chain dicek ulang sebelum signature; jika wallet tidak mengenal jaringan, tambahkan manual menggunakan RPC resmi dari penyedianya.
