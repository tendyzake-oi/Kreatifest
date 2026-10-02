# Kreatifest Indonesia — Landing Page

React 19 + Vite. Tema terang/gelap, responsif, tanpa library UI tambahan.

## Berita terbaru

Section berita menampilkan dua carousel terpisah: berita Indonesia dari Marketing.co.id dan DailySocial, serta berita internasional dari Search Engine Journal dan Social Media Today. Tiap kartu berganti otomatis, bisa dinavigasi manual, dan memakai gambar HTTPS dari RSS bila tersedia. Jika gambar tidak tersedia atau gagal dimuat, fallback berasal dari `Assets/default-news/default-news-foto.jpeg`. Judul, ringkasan, atribusi, tanggal, dan tautan menuju artikel asli ditampilkan; periksa ketentuan penerbit sebelum memakai ringkasan atau gambar pada website komersial.

Jalankan frontend dan backend di dua terminal:

```bash
# Terminal 1, folder frontend/
npm install
npm run dev

# Terminal 2, folder backend/
npm install
npm run dev
```

Saat development, Vite meneruskan permintaan `/api` ke `http://localhost:3001`. Untuk deployment dengan frontend dan backend pada domain berbeda, atur `VITE_NEWS_API_URL` pada saat build frontend dan `FRONTEND_ORIGINS` pada backend. Jika backend berjalan di balik satu reverse proxy, atur `TRUST_PROXY_HOPS=1`.

## Menjalankan

```bash
npm install
npm run dev      # mode pengembangan
npm run build    # build produksi → folder dist/
npm run lint     # cek kualitas kode
```

## Struktur folder

```
src/
├── main.jsx                  # entry point: memuat font + style global
├── App.jsx                   # susunan halaman (urutan section)
│
├── data/
│   └── content.js            # ⭐ SEMUA teks & data. Ubah konten cukup di sini.
│
├── styles/
│   ├── tokens.css            # ⭐ warna, font, radius, tema terang & gelap
│   └── base.css              # reset, tipografi dasar, .container, .section
│
├── hooks/
│   └── useTheme.js           # logika tema (localStorage + preferensi sistem)
│
└── components/
    ├── ui/                   # potongan kecil yang dipakai berulang
    │   ├── Button, Icon, IconTile, SectionHeading
    ├── layout/               # kerangka halaman
    │   ├── Navbar, ThemeToggle, Footer
    └── sections/             # satu file = satu bagian halaman
        ├── Hero, Highlights, About, Services, Projects
        └── Process, Impact, Testimonial, CallToAction, Contact
```

Setiap komponen punya file `.css` dengan nama sama di sebelahnya.

## Cara kerja tema gelap/terang

- Tema disimpan di atribut `<html data-theme="light|dark">`.
- `index.html` memasang tema sebelum React dimuat (tidak ada kedipan putih).
- Urutan penentuan: pilihan tersimpan → preferensi sistem → terang.
- Warna didefinisikan sebagai variabel di `styles/tokens.css`
  (blok `:root` untuk terang, `:root[data-theme='dark']` untuk gelap).
- **Aturan penting:** di CSS komponen, pakai `var(--color-...)`, jangan kode hex langsung.

## Tugas umum

| Ingin…                         | Edit…                                      |
| ------------------------------ | ------------------------------------------ |
| Ganti teks / nama proyek       | `src/data/content.js`                      |
| Ganti warna / font             | `src/styles/tokens.css`                    |
| Tambah / hapus section         | `src/App.jsx` + file di `sections/`        |
| Tambah ikon                    | `src/components/ui/Icon.jsx`               |
| Hubungkan form kontak ke backend | `handleSubmit` di `sections/Contact.jsx` |
