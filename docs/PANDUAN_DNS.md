# Panduan Setting DNS (werently.com)

Error `DNS_PROBE_FINISHED_NXDOMAIN` artinya nama domain `werently.com` belum ditemukan di internet. Anda perlu mengarahkan domain ini ke IP Server AA Panel Anda.

## Langkah-langkah:

1.  **Dapatkan IP Public Server**
    -   Buka AA Panel atau cek di dashboard provider VPS Anda.
    -   Catat alamat IP-nya (contoh: `103.111.xxx.xxx`).

2.  **Login ke Provider Domain**
    -   Masuk ke tempat Anda membeli domain `werently.com` (misal: Niagahoster, Godaddy, Namecheap, Cloudflare, dll).
    -   Cari menu **DNS Management** atau **Name Server**.

## Spesifik untuk Cloudflare:

1.  Login ke Dashboard Cloudflare dan pilih domain `werently.com`.
2.  Masuk ke menu **DNS** > **Records**.
3.  Pastikan ada **A Record**:
    -   **Type**: A
    -   **Name**: @ (root)
    -   **Content**: [IP Public Server AA Panel]
    -   **Proxy Status**:
        -   **DNS Only (Awan Abu-abu)**: Gunakan ini dulu untuk awal setup agar SSL Let's Encrypt di AA Panel bisa terverifikasi.
        -   **Proxied (Awan Oranye)**: Bisa diaktifkan NANTI setelah HTTPS di server sudah jalan lancar.
    -   **TTL**: Auto

4.  Pastikan ada **CNAME Record**:
    -   **Type**: CNAME
    -   **Name**: www
    -   **Content**: werently.com
    -   **Proxy Status**: Ikuti setting A Record (DNS Only disarankan di awal).

### SSL Mode (Penting)
Jika Anda menggunakan **Proxied (Awan Oranye)**, pastikan menu **SSL/TLS** di Cloudflare diset ke **Full (Strict)** jika di server sudah install SSL, atau **Flexible** jika di server belum ada SSL.
**Rekomendasi:** Gunakan **DNS Only** dulu -> Install SSL di AA Panel -> Baru ubah ke **Proxied** dan set SSL Cloudflare ke **Full**.

## Verifikasi
Setelah setting disimpan, tunggu proses propagasi (bisa 5 menit sampai 24 jam).
Cek apakah sudah berhasil dengan cara:
-   Buka Command Prompt (CMD) di komputer Anda.
-   Ketik: `ping werently.com`
-   Jika reply dari IP Server Anda, berarti sudah berhasil.

---
**Catatan Penting:** 
Pastikan di AA Panel, menu **Website > werently.com > SSL**, Anda sudah mengaktifkan SSL (Let's Encrypt) setelah DNS berhasil diarahkan.
