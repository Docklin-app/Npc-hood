# NPC HOOD — ToDo

- [x] **Landing page dan identitas:** Sediakan landing page responsif bertema green gold dengan nama NPC HOOD dan logo di kiri atas, serta navigasi menuju area utama halaman. Jadikan gambar karakter pixel-art berjubah hijau, bertopi hijau, berlatar kota senja yang dikirim pengguna sebagai visual hero.
- [ ] **Showcase koleksi:** Sediakan galeri/showcase variasi karakter pixel yang tetap sesuai konsep visual NPC HOOD dan aset gambar yang dilampirkan.
- [x] **Supply dan panel mint:** Tampilkan total supply 10.000, jumlah NFT yang telah di-mint dari kontrak, sisa supply, pemilih jumlah NFT, harga/fee per opsi, dan status transaksi. Jangan mengarang jumlah mint saat kontrak belum dikonfigurasi.
- [x] **Koneksi dan jaringan wallet:** Sediakan koneksi wallet Web3, deteksi jaringan yang dikonfigurasi, permintaan pergantian jaringan yang sesuai, serta tampilan alamat wallet yang terhubung.
- [x] **Opsi free dan paid mint:** Free mint mengenakan 0.0001 native currency per NFT; paid mint mengenakan 0.0003 native currency per NFT. Hitung total berdasarkan kuantitas. Biaya disetor ke saldo smart contract.
- [x] **Kontrak dan penarikan:** Smart contract membatasi total mint 10.000, memvalidasi harga serta kuantitas, menyediakan kontrol owner, dan mengizinkan penarikan saldo kontrak ke wallet owner.
- [x] **Umpan balik transaksi:** Tampilkan status signature/waiting, pending, berhasil, dan gagal, beserta tautan block explorer bila tersedia.
- [x] **Paket siap dikonfigurasi:** Sediakan file website dan kontrak terstruktur, mencakup konfigurasi alamat kontrak, chain ID, ABI, aset pengguna, dan petunjuk menjalankan serta deploy proyek. Tandai konfigurasi blockchain yang belum diberikan sebagai belum disetel; jangan mengaktifkan transaksi live ke alamat fiktif.

Catatan deployment: chain ID dan alamat kontrak belum diberikan, jadi mint live tetap nonaktif sampai konfigurasi nyata diisi. Showcase memakai URL aset pixel-art terpisah dari generasi galeri.
