# NEXA AI — proyek awal APK Android

## Isi
- `www/`: aplikasi chat JavaScript.
- `worker/index.js`: backend Cloudflare Worker yang menyimpan rahasia API.
- `.github/workflows/android.yml`: build APK otomatis dengan GitHub Actions.

## Konfigurasi
1. Deploy isi `worker/index.js` sebagai Cloudflare Worker.
2. Tambahkan Worker Secret bernama `GEMINI_API_KEY` dengan kunci Gemini milikmu.
3. Salin URL Worker, lalu ganti `API_URL` di `www/app.js`.
4. Push seluruh proyek ke branch `main` repositori GitHub.
5. Buka tab Actions dan jalankan workflow `Build NEXA AI APK`.
6. Unduh artifact `NEXA-AI-APK`, ekstrak, lalu pasang `app-debug.apk`.

Jangan masukkan kunci Gemini ke `www/app.js` atau ke repositori GitHub.
Model yang dipakai pada contoh ini: `gemini-3.8-flash`. Ketersediaan model, kuota, dan biaya mengikuti akun serta kebijakan Google.
