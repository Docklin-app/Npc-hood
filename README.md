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

The target network is BNB Smart Chain Mainnet (chain ID `56`, currency `BNB`). After a real contract is deployed, set `VITE_NPC_HOOD_CHAIN_ID`, `VITE_NPC_HOOD_CHAIN_NAME`, `VITE_NPC_HOOD_CONTRACT_ADDRESS`, `VITE_NPC_HOOD_CURRENCY_SYMBOL`, and `VITE_NPC_HOOD_EXPLORER_URL` as GitHub Actions repository **Variables**. These values are public because Vite embeds them in browser code; never put private keys or deployer credentials there. Mint remains disabled until the contract is configured and the owner manually opens it on-chain.

## Binance AI Agent prompt builder

The **AI Agent** section creates copy-only prompts for `freeMint(quantity)` or `paidMint(quantity)` using the configured NPC HOOD chain, contract, public wallet address, selected quantity, and the contract's 0.0001/0.0003 BNB unit prices. It does not connect to a Binance API, sign, or submit transactions. Prompts stay disabled until the owner opens mint on-chain as well as the chain and contract being configured. The prompt asks the agent to verify `mintOpen()` and the contract constants and supply, show the exact transaction details, and wait for explicit wallet approval. The NFT is minted to the signing wallet (`msg.sender`); never share a seed phrase or private key.

## NPC HOOD — Website mint

Situs mint ERC-721 ini menyediakan koleksi pixel-art hingga **10.000 NFT**. Salinan GitHub menyertakan aset hero dan showcase di `client/public/assets/` agar build tidak bergantung pada storage Preview. Halaman owner ada di [npcshood.xyz/deploy.html](https://npcshood.xyz/deploy.html) dan menawarkan fallback di [GitHub Pages](https://docklin-app.github.io/Npc-hood/deploy.html). Dari root, jalankan `pnpm install --frozen-lockfile` lalu `pnpm dev:static`; build produksi memakai `pnpm build:static` dengan output ke `dist/public/`. Type check frontend: `pnpm check`.

Kontrak ada di `contracts/src/NpcHood.sol` dan ditargetkan untuk BNB Smart Chain Mainnet (chain ID 56). `freeMint()` mengenakan 0.0001 BNB per NFT dan `paidMint()` 0.0003 BNB per NFT; biaya gas dibayar terpisah. Maksimum 20 NFT per transaksi, dengan supply maksimum 10.000. Mint tertutup setelah deploy; hanya owner kontrak dapat memanggil `setMintOpen(true)` untuk membukanya, dan dapat menutupnya lagi dengan `setMintOpen(false)`. Dana mint masuk ke kontrak dan `withdraw()` hanya dapat dipanggil owner.

Untuk deploy lewat halaman, hubungkan wallet, pilih jaringan, masukkan Base URI metadata, dan setujui transaksi deploy di wallet. Halaman tidak meminta private key, tidak menjalankan mint, dan menampilkan kontrol owner yang memerlukan konfirmasi dan tanda tangan terpisah untuk membuka mint. Alternatifnya, baca `contracts/README.md` dan gunakan [workflow GitHub Actions Deploy NPC HOOD to BNB Mainnet](https://github.com/Docklin-app/Npc-hood/actions/workflows/deploy-npc-hood-mainnet.yml); workflow ini juga tidak membuka mint otomatis. Uji testnet terlebih dahulu dan verifikasi alamat kontrak di explorer.

Setelah alamat kontrak tersedia, isi `.env.local` dari `.env.example` pada root dengan `VITE_NPC_HOOD_CHAIN_ID` desimal, `VITE_NPC_HOOD_CHAIN_NAME`, `VITE_NPC_HOOD_CONTRACT_ADDRESS`, `VITE_NPC_HOOD_CURRENCY_SYMBOL`, dan `VITE_NPC_HOOD_EXPLORER_URL`; lalu restart/build frontend. Tanpa chain ID dan alamat kontrak valid, mint live dinonaktifkan. Supply dibaca dari kontrak dan frontend memeriksa supply, kuantitas maksimum per transaksi, dan harga on-chain. Chain dicek ulang sebelum signature; jika wallet tidak mengenal jaringan, tambahkan manual menggunakan RPC resmi dari penyedianya.

## NPC HOOD — 10,000 NFT assets

The generated collection is in `nft-collection/`: `collection/images/` contains 10,000 pixel-art PNGs, `collection/metadata/` contains matching token metadata files for IDs 1–10,000, and `collection/manifest.csv` lists their traits. The bundle ZIP, reproducible generator, and upload instructions are alongside the assets. Metadata filenames intentionally have no extension to match `tokenURI = base URI + token ID`.


**Status hosting metadata saat ini:** 10.000 metadata telah diatur ke URL gambar HTTPS publik yang merujuk ke commit aset tetap `50ec59243a7479bc69249331c39daeedb83405c3`. Ini adalah fallback GitHub Raw, **bukan IPFS** dan tidak menghasilkan CID. Base URI metadata untuk file di branch `main` adalah `https://raw.githubusercontent.com/Docklin-app/Npc-hood/main/nft-collection/collection/metadata/`; kontrak menambahkan ID token tanpa ekstensi. Untuk IPFS, pin folder gambar dan metadata dengan layanan pinning, lalu jalankan generator dengan `--image-base ipfs://<IMAGE_CID>`.
