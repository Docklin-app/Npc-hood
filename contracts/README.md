# NPC HOOD — Kontrak & Mint

Paket ini berisi kontrak ERC-721 untuk koleksi maksimum **10.000 NFT**. Jaringan tidak dipatok; pemilik koleksi harus memilih chain EVM dan menyetel alamat RPC, chain ID, wallet deployer, serta metadata URI sebelum deployment. Website sengaja tidak mengirim transaksi hingga chain ID dan alamat kontrak diisi.

## Harga dan alur pembayaran

`freeMint(quantity)` adalah opsi **Free Mint** dengan biaya proyek **0.0001 native currency per NFT**. `paidMint(quantity)` berharga **0.0003 native currency per NFT**. Nilai yang dikirim harus tepat sama dengan unit price dikali kuantitas; gas jaringan dibayar terpisah sesuai estimasi wallet. Untuk menjaga kebutuhan gas tetap praktis, satu transaksi dibatasi hingga 20 NFT; batas supply keseluruhan tetap 10.000. Kedua pembayaran masuk ke saldo kontrak. Fungsi `withdraw()` hanya dapat dipanggil owner dan mentransfer seluruh saldo saat ini ke alamat owner. Pengiriman dana langsung tanpa memanggil fungsi mint ditolak.

## Deploy kontrak

1. Instal Node.js dan jalankan `npm install` dari direktori `contracts/`.
2. Salin `.env.example` menjadi `.env`. Isi RPC URL HTTP(S), chain ID desimal positif yang sama dengan jaringan target, private key deployer, dan URI prefix metadata HTTPS yang diakhiri `/` (contoh `https://metadata.example/npc/`). Kontrak menambahkan token ID langsung ke prefix, sehingga token #1 meminta `https://metadata.example/npc/1`.
3. Pastikan wallet deployer memang wallet yang akan menerima hak owner dan penarikan fee; sediakan native coin untuk gas.
4. Jalankan `npm run compile`, lalu `npm run deploy`. Perintah deploy memeriksa field wajib, format, dan chain ID yang dilaporkan RPC sebelum membuat transaksi; simpan alamat kontrak, transaction hash, chain ID, alamat owner, dan tautan explorer yang benar.
5. Jangan commit `contracts/.env` atau membagikan private key. Jangan men-deploy sebelum audit dan uji pada testnet yang sesuai.

NFT pertama memiliki token ID 1 dan metadata mengikuti URI prefix + token ID. Sebelum produksi, pastikan jalur metadata dan metadata token tersedia, lalu verifikasi kontrak di block explorer jaringan pilihan. Owner dapat mengganti URI prefix melalui `setCollectionBaseURI`; panggilan ini mengubah URI yang dibentuk untuk seluruh token.

## Aktifkan frontend

1. Salin `.env.example` pada root menjadi `.env.local`.
2. Isi `VITE_NPC_HOOD_CHAIN_ID` memakai angka desimal, `VITE_NPC_HOOD_CHAIN_NAME`, `VITE_NPC_HOOD_CONTRACT_ADDRESS`, `VITE_NPC_HOOD_CURRENCY_SYMBOL`, dan `VITE_NPC_HOOD_EXPLORER_URL` dengan nilai yang diverifikasi untuk kontrak hasil deployment. UI hanya mengaktifkan mint setelah fungsi, supply, batch limit, dan harga kontrak cocok.
3. Restart/build website. Frontend hanya menampilkan jumlah minted setelah membaca `totalMinted()` dan memeriksa `MAX_SUPPLY()` pada chain yang cocok. Saat menandatangani, frontend membaca ulang `eth_chainId` dan membatalkan proses jika jaringan berubah; jika wallet belum mengenal jaringan, tambahkan jaringan secara manual memakai chain ID dan RPC URL resmi penyedia, jangan menebak endpoint.

ABI frontend ada pada `client/src/lib/npcHoodAbi.ts`. Alamat kontrak dan chain ID belum disetel dalam paket awal, sehingga tombol mint nyata tetap nonaktif sampai owner memasukkan konfigurasi yang benar.

## Menjalankan website

Dari root proyek, jalankan `pnpm install` kemudian `pnpm dev:static`. Build statis memakai `pnpm build:static`. Salin `.env.example` menjadi `.env.local` untuk konfigurasi frontend. Untuk package kontrak, gunakan `npm install` terpisah dari folder `contracts/`.
