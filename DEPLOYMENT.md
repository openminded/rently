# Deployment Guide - Werently

Berikut adalah panduan langkah demi langkah untuk melakukan deployment aplikasi Werently ke server production (AA Panel).

## Prasyarat
- Akses SSH ke server atau Terminal di AA Panel.
- Repository Git sudah tersambung (`origin` mengarah ke repo yang benar).

## 1. Push Perubahan Terbaru (Lokal)
Pastikan kode di komputer lokal Anda sudah di-commit dan di-push ke main branch.

```bash
git add .
git commit -m "Deskripsi perubahan Anda"
git push origin main
```

## 2. Masuk ke Server
Buka terminal server (SSH atau fitur Terminal di AA Panel).
Pindah ke direktori project server:

```bash
cd /www/wwwroot/werently.telaju.com/server
```

## 3. Persiapan Izin Eksekusi (PENTING)
Sebelum menjalankan script deployment untuk pertama kalinya (atau jika script diubah), Anda **wajib** memberikan izin eksekusi agar tidak muncul error "Permission denied".

```bash
chmod +x deploy.sh deploy_frontend.sh
```

## 4. Proses Deployment (Pilih Salah Satu)

### A. STAGING (`werently.telaju.com`)
Gunakan ini untuk testing sebelum masuk ke production.

1.  **Masuk ke Server**:
    ```bash
    cd /www/wwwroot/werently.telaju.com/server
    ```

2.  **Deploy Backend (Staging)**:
    ```bash
    ./deploy.sh
    ```

3.  **Deploy Frontend (Staging)**:
    ```bash
    ./deploy_frontend.sh
    ```

---

### B. PRODUCTION (`werently.com`)
Gunakan ini untuk update live website utama.

1.  **Masuk ke Server**:
    ```bash
    cd /www/wwwroot/werently.com/server
    ```

2.  **Deploy Backend (Production)**:
    ```bash
    ./deploy_prod.sh
    ```

3.  **Deploy Frontend (Production)**:
    ```bash
    ./deploy_frontend_prod.sh
    ```

## Catatan Tambahan
- **Images/Uploads**: Folder `server/uploads` digunakan untuk menyimpan gambar.
    - **PENTING**: Gunakan fitur **Asset Backup** di menu Settings sebelum melakukan migrasi atau update besar untuk mengamankan foto produk. Anda bisa restore kembali file ZIP-nya setelah deployment selesai jika diperlukan.
- **Logs**: Jika terjadi error, cek log menggunakan perintah:
  ```bash
  pm2 logs
  ```
