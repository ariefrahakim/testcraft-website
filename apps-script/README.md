# Penerima Pendaftaran → Google Sheets

Menyimpan pendaftaran dari `index.html` ke spreadsheet:
<https://docs.google.com/spreadsheets/d/1yIJ9q-KQmZca_WNGXvPqNkAzLw0qon3GI4sttn_oyR8/edit>

## Struktur yang dihasilkan

```
[ Ringkasan ] [ 2026-07 ] [ 2026-08 ] ...
```

**Tab bulanan** (`2026-07`) — satu baris per pendaftaran, header biru navy dibekukan:

| Waktu | Nama | Email | WhatsApp | Kategori | Program | Catatan | Status | Bahasa | Sumber |
|---|---|---|---|---|---|---|---|---|---|
| 26/07/2026 20:14 | Budi Santoso | budi@contoh.com | 081234567890 | QA Bootcamp | Playwright… | Ingin batch malam | Baru ▾ | ID | testcraft-compro |

- **Kategori** berwarna otomatis: QA Bootcamp (tosca), Corporate (kuning), Konsultasi (ungu), Public Training (hijau)
- **Status** berupa dropdown: Baru · Dihubungi · Menunggu Bayar · Terdaftar · Batal
- **WhatsApp** dinormalkan ke format `08xx` (dari `+62`/`62` sekalipun)
- Tab bulan terbaru selalu dipindah ke depan

**Tab Ringkasan** — rekap otomatis tiap ada pendaftaran masuk:

| Bulan | QA Bootcamp | Corporate | Konsultasi | Public Training | Lainnya | Total |
|---|---|---|---|---|---|---|
| 2026-08 | 12 | 3 | 5 | 9 | 0 | 29 |
| 2026-07 | 8 | 1 | 2 | 6 | 0 | 17 |
| **TOTAL** | **20** | **4** | **7** | **15** | **0** | **46** |

## Cara pasang (±5 menit)

1. Buka spreadsheet → **Extensions → Apps Script**
2. Hapus isi editor, tempel seluruh isi [`Code.gs`](Code.gs), lalu **Save**
3. Pilih fungsi `setup` di dropdown → **Run** → izinkan akses saat diminta
   (muncul peringatan "Google hasn't verified this app" → *Advanced* → *Go to …*).
   Tab **Ringkasan** akan terbentuk.
4. **Deploy → New deployment → ⚙ → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone** ← wajib, kalau "Anyone with Google account" form gagal
   - **Deploy**, lalu salin URL `https://script.google.com/macros/s/.../exec`
5. Tempel URL itu ke `index.html` baris 648:
   ```js
   var FORM_ENDPOINT="https://script.google.com/macros/s/..../exec";
   ```

## Verifikasi

- **Tanpa website:** di editor Apps Script pilih fungsi `testKirimContoh` → **Run**.
  Satu baris uji muncul di tab bulan berjalan (boleh dihapus setelahnya).
- **Lewat website:** buka `index.html`, isi form, submit. Baris baru muncul dalam
  beberapa detik dan angka di tab Ringkasan bertambah.
- **Cek Web App hidup:** buka URL `/exec` langsung di browser — harus menampilkan
  `{"ok":true,"service":"TestCraft registration intake"}`.

## Catatan teknis

Permintaan dikirim sebagai `Content-Type: text/plain` khusus untuk endpoint
`script.google.com`. Apps Script tidak melayani preflight `OPTIONS`, jadi
`application/json` akan diblokir CORS. Penanganannya ada di `submitForm()`
pada `index.html`.

Setiap kali `Code.gs` diubah, jalankan **Deploy → Manage deployments → ✏️ →
Version: New version → Deploy** agar perubahan aktif. URL tidak berubah.

Kalau pengiriman ke Sheets gagal karena alasan apa pun, form tidak kehilangan
lead: peserta tetap diarahkan ke tombol konfirmasi WhatsApp berisi ringkasan data.
