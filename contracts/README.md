# NPC HOOD — Kontrak & Mint

Paket ini berisi kontrak ERC-721 untuk koleksi maksimum **10.000 NFT**, dengan target **BNB Smart Chain Mainnet (Chain ID 56, BNB)**. Untuk pengujian, gunakan BSC Testnet (Chain ID 97, tBNB), bukan kontrak mainnet.

## Status mint dan kontrol owner

Mint **tertutup secara default** setelah kontrak dibuat. Fungsi `freeMint()` dan `paidMint()` akan menolak transaksi sampai owner memanggil `setMintOpen(true)`. Hanya owner yang dapat mengubah status ini; owner juga dapat menutupnya kembali dengan `setMintOpen(false)`. Workflow deployment tidak memanggil fungsi pembuka tersebut.

Setelah deploy, verifikasi source kontrak di BscScan. Mint hanya dibuka saat owner siap dengan menghubungkan wallet owner ke kontrak terverifikasi lalu memanggil `setMintOpen(true)` melalui tab **Write Contract**. Periksa jaringan, alamat kontrak, URI metadata, harga, dan wallet owner sebelum menandatangani transaksi.

## Harga dan alur pembayaran

`freeMint(quantity)` adalah opsi **Free Mint** dengan biaya proyek **0.0001 BNB per NFT**. `paidMint(quantity)` berharga **0.0003 BNB per NFT**. Nilai yang dikirim harus tepat sama dengan unit price dikali kuantitas; gas jaringan dibayar terpisah sesuai estimasi wallet. Untuk menjaga kebutuhan gas tetap praktis, satu transaksi dibatasi hingga 20 NFT; batas supply keseluruhan tetap 10.000. Kedua pembayaran masuk ke saldo kontrak. Fungsi `withdraw()` hanya dapat dipanggil owner dan mentransfer seluruh saldo saat ini ke alamat owner. Pengiriman dana langsung tanpa memanggil fungsi mint ditolak.

## Deploy kontrak

1. Instal Node.js dan jalankan `npm install` dari direktori `contracts/`.
2. Salin `.env.example` menjadi `.env`. Untuk BSC Mainnet, gunakan RPC URL HTTPS resmi/terpercaya dan chain ID `56`; isi private key deployer dan URI prefix metadata HTTPS yang diakhiri `/` (contoh `https://metadata.example/npc/`). Kontrak menambahkan token ID langsung ke prefix, sehingga token #1 meminta `https://metadata.example/npc/1`.
3. Pastikan wallet deployer memang wallet yang akan menerima hak owner dan penarikan fee; sediakan native coin untuk gas.
4. Jalankan `npm run compile` dan `npm test`. Untuk deployment lokal, jalankan `npm run deploy` setelah pengujian testnet; preflight memeriksa field wajib, format, dan chain ID RPC. Simpan alamat kontrak, transaction hash, chain ID, alamat owner, dan tautan explorer.
5. Jangan commit `contracts/.env` atau membagikan private key. Uji pada BSC Testnet dan periksa hasilnya sebelum deployment mainnet.

### Deploy dan kontrol lewat halaman owner

Setelah GitHub Pages selesai dibangun, buka `https://npcshood.xyz/deploy.html` (atau `https://docklin-app.github.io/Npc-hood/deploy.html`), pilih BSC Mainnet atau Testnet, lalu hubungkan wallet. Masukkan Base URI metadata HTTPS yang berakhiran `/`; halaman meminta wallet menandatangani deployment. Halaman tidak meminta atau mengirim private key, dan kontrak yang baru dibuat diverifikasi tetap `mintOpen() == false`. Simpan alamat kontrak dan periksa tautan explorer.

Bagian **Owner Controls** dapat membaca status kontrak dan hanya mengaktifkan tombol buka/tutup mint jika wallet terhubung cocok dengan `owner()` on-chain. Membuka mint memerlukan konfirmasi halaman serta tanda tangan transaksi tersendiri; deployment tidak pernah membuka mint otomatis. Uji dahulu di BSC Testnet dan pastikan URI metadata untuk seluruh item siap sebelum Mainnet.

Artifact browser (`client/src/lib/npcHoodDeployArtifact.ts`) berisi ABI dan bytecode hasil kompilasi source. Workflow GitHub Pages selalu mengompilasi dan mengekspor ulang artifact sebelum build. Setelah mengubah kontrak secara lokal, jalankan `npm ci`, `npm run compile`, dan `npm run export:frontend` dari `contracts/` agar halaman deploy tidak memakai bytecode lama.

### Deploy manual melalui GitHub Actions

Workflow [Deploy NPC HOOD to BNB Mainnet](https://github.com/Docklin-app/Npc-hood/actions/workflows/deploy-npc-hood-mainnet.yml) hanya berjalan ketika owner memilih **Run workflow** pada branch `main` dan mengetik `DEPLOY NPC HOOD TO BNB MAINNET`. Sebelum menjalankannya, siapkan GitHub Environment bernama `bsc-mainnet`, tambahkan approval reviewer yang sesuai, lalu isi environment secrets `NPC_HOOD_RPC_URL`, `NPC_HOOD_DEPLOYER_PRIVATE_KEY`, dan `NPC_HOOD_BASE_URI`. Chain ID dikunci ke `56`. Workflow memeriksa audit dependensi, lalu mengompilasi dan menjalankan tes kontrak sebelum deploy; workflow tidak pernah memanggil `setMintOpen(true)`. Jika audit menemukan advisory high atau critical, workflow berhenti sebelum menggunakan RPC dan private key.

Setelah workflow selesai, ambil alamat kontrak dari log deployment. Verifikasi source kontrak di BscScan, lalu isi variabel frontend untuk Chain ID `56`, `BSC Mainnet`, `BNB`, URL explorer `https://bscscan.com/`, dan alamat kontrak tersebut. Mint tetap tertutup sampai owner secara terpisah memanggil `setMintOpen(true)`.

NFT pertama memiliki token ID 1 dan metadata mengikuti URI prefix + token ID. Sebelum produksi, pastikan jalur metadata dan metadata token tersedia, lalu verifikasi kontrak di block explorer jaringan pilihan. Owner dapat mengganti URI prefix melalui `setCollectionBaseURI`; panggilan ini mengubah URI yang dibentuk untuk seluruh token.

## Aktifkan frontend

1. Salin `.env.example` pada root menjadi `.env.local`.
2. Isi `VITE_NPC_HOOD_CHAIN_ID=56`, `VITE_NPC_HOOD_CHAIN_NAME=BSC Mainnet`, `VITE_NPC_HOOD_CONTRACT_ADDRESS`, `VITE_NPC_HOOD_CURRENCY_SYMBOL=BNB`, dan `VITE_NPC_HOOD_EXPLORER_URL=https://bscscan.com/` dengan nilai yang diverifikasi untuk kontrak hasil deployment. UI hanya mengaktifkan mint setelah fungsi, supply, batch limit, harga, dan status `mintOpen()` cocok.
3. Restart/build website. Frontend membaca `totalMinted()` dan status `mintOpen()` dari kontrak. Tombol mint dan prompt AI tetap terkunci saat `mintOpen()` bernilai `false`. Saat menandatangani, frontend membaca ulang `eth_chainId` dan membatalkan proses jika jaringan berubah; jika wallet belum mengenal jaringan, tambahkan jaringan secara manual memakai chain ID dan RPC URL resmi penyedia, jangan menebak endpoint.

ABI frontend ada pada `client/src/lib/npcHoodAbi.ts`. Alamat kontrak harus disetel setelah deployment. Walaupun konfigurasi alamat sudah diisi, mint tetap nonaktif sampai owner membuka mint on-chain.

## Menjalankan website

Dari root proyek, jalankan `pnpm install` kemudian `pnpm dev:static`. Build statis memakai `pnpm build:static`. Salin `.env.example` menjadi `.env.local` untuk konfigurasi frontend. Untuk package kontrak, gunakan `npm install` terpisah dari folder `contracts/`.
