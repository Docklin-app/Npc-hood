# NPC HOOD — Rencana Implementasi

## Tujuan dan pendekatan
Situs koleksi NFT 10.000 item bergaya orisinal, mengambil pola umum halaman mint referensi—navigasi sederhana, hero koleksi, panel supply/mint, aturan singkat, dan panduan partisipasi—tanpa menyalin merek atau asetnya. Frontend React + TypeScript pada template WebDev statis; koneksi wallet memakai EIP-1193 dan ethers v6. Kontrak ERC-721 Solidity menggunakan OpenZeppelin, memasang batas supply, dua jalur mint dengan biaya native coin berbeda, dan penarikan saldo oleh owner. Jaringan EVM, chain ID, alamat kontrak, dan explorer disimpan dalam `.env` saat deploy; hingga disetel, aplikasi menampilkan status belum dikonfigurasi dan tidak mengirim transaksi.

## Arah desain
- **Gerakan desain:** editorial pixel-art / retro game mint, terinspirasi struktur halaman referensi namun identitas, copywriting, dan visual khas NPC HOOD.
- **Prinsip inti:** karakter pixel sebagai pusat perhatian; mint dan biaya terbaca jelas; indikator supply jujur pada data kontrak; kontrol wallet aman serta responsif.
- **Filosofi warna:** hijau hutan memberi suasana dunia hooded NPC, emas hangat menandai koleksi dan tindakan utama, latar parchment membantu keterbacaan, dan tinta gelap memberi kontras.
- **Paradigma layout:** header tipis, hero split editorial, panel mint kontras menempel di sisi kanan pada desktop, strip langkah, lalu supply, galeri, dan aturan sebagai bagian halaman tunggal.
- **Motif khas:** bingkai pixel bertingkat, garis emas seperti jalur loot, dan pola kotak pixel halus sebagai tekstur latar.
- **Interaksi:** koneksi wallet dan pemilihan mint sederhana; jumlah dapat disesuaikan; transaksi hanya diteruskan setelah konfigurasi kontrak dan jaringan valid; status transaksi selalu terlihat.
- **Animasi:** hover lembut, kilau emas lambat, serta floating pixel kecil; hormati `prefers-reduced-motion`, hindari gerak yang mengganggu.
- **Tipografi:** Space Grotesk untuk judul dan UI; monospace untuk label, angka, dan data rantai.
- **Esensi merek:** koleksi hooded NPC bergaya pixel untuk kolektor on-chain; misterius, hangat, playful.
- **Suara merek:** pendek, berkarakter, dan transparan. Contoh: “Temukan karakter hood-mu.” / “Cek jaringan dan biaya sebelum mint.”
- **Wordmark/logo:** wordmark NPC HOOD dengan emblem pixel berbentuk siluet tudung/daun di dalam kotak sudut tegas.
- **Warna merek:** emerald `#1d563b` dipasangkan dengan gold `#e5b74e`.

## Deployment situs ke browser
Frontend dibangun sebagai situs statis ke `dist/public` dan diterbitkan melalui GitHub Pages menggunakan GitHub Actions. Workflow membangun dari lockfile dan mempertahankan file `CNAME` (`npcshood.xyz`) di artefak tanpa menerbitkan kredensial. GitHub Pages harus memakai source `GitHub Actions`; bila chain ID dan alamat kontrak belum tersedia, variabel mint tetap kosong agar transaksi live tetap nonaktif.

## Struktur proyek
- `client/src/pages/Home.tsx` — landing page, wallet, tampilan supply, mint, dan state transaksi.
- `client/src/index.css` — sistem visual responsif dan motion.
- `client/public/assets/` — gambar karakter lampiran dan varian galeri.
- `contracts/src/NpcHood.sol` — kontrak ERC-721 supply 10.000, biaya mint, dan penarikan owner.
- `contracts/README.md` — persiapan, konfigurasi, dan deploy kontrak.
- `.env.example` — alamat kontrak, chain ID, nama jaringan, dan tautan explorer.
- `public/manus-routes.json` — deklarasi rute halaman.

## Mint lewat Binance AI Agent
Tambahkan pembuat prompt yang mengikuti pola referensi: kolom alamat wallet publik (0x), prompt terpisah untuk Free Mint dan Paid Mint, serta tombol salin. Prompt mengambil chain, chain ID, alamat kontrak, simbol mata uang, jumlah dan jalur dari konfigurasi/aplikasi NPC HOOD sendiri—bukan dari alamat/harga proyek pada gambar. Gunakan fungsi `freeMint(quantity)`/`paidMint(quantity)` dan harga kontrak 0.0001/0.0003 native coin per NFT. Jika chain ID atau alamat kontrak belum disetel, prompt tidak dapat disalin dan UI menjelaskan konfigurasi yang diperlukan. Fitur hanya menyusun teks; tidak menghubungkan API Binance, menandatangani atau mengirim transaksi. Prompt mengharuskan agent memverifikasi kontrak/jaringan/nilai on-chain, menampilkan detail transaksi, dan menunggu persetujuan pengguna di wallet; jangan pernah meminta seed phrase atau private key.

## Alur mint dan batasan penting
Supply on-chain bersama maksimum 10.000. Mint menagih 0.0001 native currency per NFT pada jalur Free Mint dan 0.0003 native currency per NFT pada jalur Paid Mint. Kedua pembayaran dikirim ke kontrak, yang saldonya dapat ditarik pemilik kontrak. Maksimum 20 NFT per transaksi menjaga batch aman terhadap gas; batas supply koleksi tetap 10.000. Kontrak dan UI memakai satu mata uang native pada jaringan EVM yang dipilih ketika dipasang. Status terkini: jaringan dikunci ke BNB Smart Chain Mainnet (chain ID 56) dan kontrak sudah ter-deploy di 0xe986CA162b99B0A3972F37045b83cA15C842b905 dengan Base URI metadata terpasang; mint on-chain masih tertutup (mintOpen=false) sampai owner membukanya dari halaman owner. Mint membaca supply dari kontrak; tanpa konfigurasi, jumlah minted tidak direkayasa.
