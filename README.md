# TestCraft Indonesia — Company Website

> Quality Software. Confident Delivery.

Website profil perusahaan TestCraft Indonesia (terpisah dari LMS): layanan, program, QA Bootcamp (kurikulum detail, biaya & cicilan 0%, persiapan karier hingga latihan interview), FAQ, dan formulir pendaftaran + WhatsApp.

Buka `index.html` langsung di browser, atau aktifkan GitHub Pages.

## Halaman

| Berkas | Isi |
| --- | --- |
| `index.html` | Halaman utama (ID/EN, tema terang/gelap) |
| `privacy.html` | Kebijakan Privasi |
| `terms.html` | Syarat & Ketentuan |

## Ke mana pendaftaran masuk?

Formulir di bagian **Kontak** memvalidasi input, lalu mengirim data ke dua jalur:

1. **Google Sheets** — pool utama, satu tab per bulan + tab Ringkasan.
   Skrip dan panduan pasangnya ada di [`apps-script/`](apps-script/README.md).
   Setelah di-deploy, tempel URL Web App ke `var FORM_ENDPOINT` di `index.html`.

   Alternatif kalau tidak mau pakai Sheets — isi `FORM_ENDPOINT` dengan:
   [Formspree](https://formspree.io) (`https://formspree.io/f/xxxxxxxx`) atau
   [Web3Forms](https://web3forms.com) (`https://api.web3forms.com/submit`).

   Selama masih kosong (`""`), pengiriman otomatis dilewati dan form jatuh ke jalur 2.

2. **WhatsApp (selalu aktif)** — setelah submit, peserta mendapat tombol
   *"Konfirmasi via WhatsApp"* berisi ringkasan data (nama, email, no. WA, jenis
   pendaftaran, program, catatan) yang langsung terkirim ke nomor Admission.

Nomor dan email penerima diatur lewat `ADMISSION_WA` dan `ADMISSION_EMAIL` di berkas yang sama.
Perlindungan spam: honeypot tersembunyi — submit dari bot diabaikan tanpa notifikasi.

LMS (terpisah): https://github.com/ariefrahakim/testcraft-lms

**Kontak:** WhatsApp [+62 823-9556-8743](https://wa.me/6282395568743) · testcraftindonesia@gmail.com
