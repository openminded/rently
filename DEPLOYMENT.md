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

## 4. Deploy Backend & Frontend
Jalankan script berikut secara berurutan.

### Deploy Backend
Script ini akan mengambil kode terbaru dari Git, install dependency backend, dan restart server Node.js.

```bash
./deploy.sh
```

### Deploy Frontend
Script ini akan mem-build aplikasi React/Vite dan menyalin hasilnya ke folder publik server.

```bash
./deploy_frontend.sh
```

## Catatan Tambahan
- **Images/Uploads**: Folder `server/uploads` digunakan untuk menyimpan gambar. Pastikan folder ini ada. Jika deploy pertama kali, Anda mungkin perlu upload ulang gambar via menu **App Config**.
- **Logs**: Jika terjadi error, cek log menggunakan perintah:
  ```bash
  pm2 logs
  ```
