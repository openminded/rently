# DOKUMENTASI FITUR TERBARU (V2)

Dokumen ini menjelaskan fitur-fitur terbaru yang telah ditambahkan ke dalam sistem Werently (Rumah Dinar).

---

## 1. SHIFT MANAGEMENT (MANAJEMEN KASIR)

Fitur ini bertujuan untuk mengamankan aliran uang tunai (Cash Flow) di toko dengan mewajibkan kasir membuka dan menutup shift.

### **Alur Kerja:**
1.  **Open Shift (Buka Kasir):**
    *   Saat staff login pertama kali hari itu (atau setelah shift sebelumnya ditutup), sistem akan meminta input **Modal Awal (Start Cash)**.
    *   Staff wajib memasukkan jumlah uang tunai yang ada di laci kasir saat itu.
    *   Tanpa membuka shift, staff **TIDAK BISA** melakukan transaksi apapun.

2.  **Operasional:**
    *   Semua pembayaran tunai (Cash) akan otomatis dicatat oleh sistem ke dalam shift yang sedang aktif.
    *   Pembayaran non-tunai (Transfer/QRIS) tidak mempengaruhi saldo kas laci.

3.  **Close Shift (Tutup Kasir):**
    *   Saat pergantian staff atau tutup toko, staff melakukan **Close Shift**.
    *   Staff menginput **Uang Aktual**, yaitu jumlah fisik uang yang ada di laci.
    *   **Variance Report:** Sistem otomatis menghitung selisih antara *Expected Cash* (Modal Awal + Transaksi Tunai) dengan *Actual Cash*. Selisih (jika ada) akan tercatat untuk audit.

---

## 2. REFERRAL SYSTEM (KEMITRAAN)

Fitur untuk mengelola partner (MUA, Fotografer, WO) yang mereferensikan pelanggan ke Rumah Dinar.

### **Fitur Utama:**
1.  **Manajemen Partner:**
    *   Admin dapat menambah data Partner (Nama, No HP, Info Bank).
    *   Menu: **Master Data > Referral Partners**.

2.  **Kode Referral:**
    *   Setiap partner bisa memiliki banyak kode unik (misal: `MUA_ANA_10`).
    *   **Diskon:** Kode bisa memberikan diskon ke pelanggan (Persen % atau Nominal Rupiah).
    *   **Komisi:** Menentukan berapa % komisi yang didapat partner dari total transaksi.

3.  **Klaim & Pembayaran Komisi:**
    *   Komisi tercatat otomatis saat transaksi berstatus 'PAID'.
    *   Status awal komisi adalah **PENDING**.
    *   Admin bisa melakukan pembayaran komisi (Mark as PAID) secara **Individual** atau **Bulk** (banyak sekaligus) melalui menu Referral.
    *   Tersedia grafik tren komisi dan daftar top partner.

---

## 3. LAUNDRY MANAGEMENT (BATCH COMPLETION)

Peningkatan pada modul laundry untuk kontrol stok yang lebih akurat saat barang kembali dari laundry.

### **Fitur Baru:**
*   **Granular Batch Completion:**
    *   Saat menandai batch laundry selesai, staff tidak harus menerima semua barang sekaligus.
    *   Staff bisa memilih status spesifik untuk setiap item:
        *   **AVAILABLE:** Barang bersih dan siap sewa (Stok kembali).
        *   **NOT READY:** Barang masih perlu perbaikan atau belum layak sewa (Stok belum kembali).
    *   Ini mencegah barang rusak langsung tersedia untuk disewa kembali secara tidak sengaja.

---

## 4. ASSET & DATABASE BACKUP

Fitur keamanan data untuk mencegah kehilangan data dan memudahkan migrasi server.

### **Menu: Settings > Backup & Restore**

1.  **Database Backup:**
    *   **Download:** Mengunduh seluruh data transaksi, produk, dan pelanggan dalam format JSON (`pos_backup_DATE.json`).
    *   **Restore:** Mengembalikan data dari file JSON. Sistem cerdas akan menghapus data lama dan memasukkan data baru sesuai urutan dependensi agar tidak error.
    *   **Reset Data:** Menghapus semua data transaksi (bersih-bersih) tapi **TETAP MENYIMPAN** Master Data (Produk, Kategori, User). Cocok untuk memulai operasional baru tanpa input ulang produk.

2.  **Asset Backup (Foto Produk):**
    *   **Download Assets:** Mengunduh semua foto produk yang ada di server menjadi satu file **ZIP**.
    *   **Restore Assets:** Mengupload file ZIP untuk mengembalikan foto-foto produk ke server.

---

## 5. ATURAN PEMBAYARAN (PAYMENT RULES)

Penerapan aturan ketat pada kasir untuk mencegah kesalahan administrasi.

1.  **Booking Wajib DP:**
    *   Transaksi tipe **BOOKING** (ambil nanti) tidak bisa diproses jika belum ada pembayaran (DP/Lunas). Mininal ada uang masuk.

2.  **Pickup Wajib Lunas:**
    *   Transaksi tipe **DIRECT PICKUP** (langsung bawa) atau pengambilan barang booking wajib **LUNAS (Full Payment)**.
    *   Sistem akan menolak jika kasir mencoba memproses pickup tapi pembayaran belum 100%.

3.  **Integrasi Duitku (QRIS):**
    *   Setiap transaksi Online atau Kasir dengan metode QRIS akan otomatis men-generate **QR Code Statis/Dinamis** dari Duitku.
    *   Sistem otomatis mengecek status pembayaran (Callback) tanpa perlu konfirmasi manual.

---
*Dokumen diperbarui: Februari 2026*
