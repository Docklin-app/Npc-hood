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


## NPC HOOD — Website mint

Situs mint ERC-721 ini menyediakan koleksi pixel-art hingga **10.000 NFT**. Salinan GitHub menyertakan aset hero dan showcase di `client/public/assets/` agar build tidak bergantung pada storage Preview. Dari root, jalankan `pnpm install --frozen-lockfile` lalu `pnpm dev:static`; build produksi memakai `pnpm build:static` dengan output ke `dist/public/`. Type check frontend: `pnpm check`.

Kontrak ada di `contracts/src/NpcHood.sol`. `freeMint()` mengenakan 0.0001 native currency per NFT dan `paidMint()` 0.0003 native currency per NFT; biaya gas dibayar terpisah. Maksimum 20 NFT per transaksi membantu menghindari transaksi out-of-gas, sementara supply koleksi tetap 10.000. Dana mint masuk ke kontrak dan `withdraw()` hanya dapat dipanggil owner, yang ditetapkan sebagai wallet deployer.

Sebelum deploy, baca `contracts/README.md`, siapkan metadata HTTPS dengan prefix berakhiran `/`, isi `contracts/.env` dari contoh, instal dependensi dengan `npm install` di dalam `contracts/`, lalu jalankan `npm run compile` dan `npm run deploy`. Preflight memeriksa field jaringan dan mencocokkan chain ID dari RPC. Uji testnet dan verifikasi owner sebelum produksi. Jangan commit private key atau deployer wallet.

Setelah alamat kontrak tersedia, isi `.env.local` dari `.env.example` pada root dengan `VITE_NPC_HOOD_CHAIN_ID` desimal, `VITE_NPC_HOOD_CHAIN_NAME`, `VITE_NPC_HOOD_CONTRACT_ADDRESS`, `VITE_NPC_HOOD_CURRENCY_SYMBOL`, dan `VITE_NPC_HOOD_EXPLORER_URL`; lalu restart/build frontend. Tanpa chain ID dan alamat kontrak valid, mint live dinonaktifkan. Supply dibaca dari kontrak dan frontend memeriksa supply, kuantitas maksimum per transaksi, dan harga on-chain. Chain dicek ulang sebelum signature; jika wallet tidak mengenal jaringan, tambahkan manual menggunakan RPC resmi dari penyedianya.
