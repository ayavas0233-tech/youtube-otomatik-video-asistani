# YouTube Otomatik Video Asistanı

Tam akış video üretim hattı:
- Senaryo: `POST /api/generate/script`
- TTS: `POST /api/generate/tts`
- Görsel: `POST /api/generate/visuals`
- Video bileştirme: `POST /api/generate/video`
- Altyazı: `POST /api/generate/subtitles`
- Thumbnail: `POST /api/generate/thumbnail`
- Uçtan uca: `POST /api/generate/full-video`
- YouTube upload: `POST /api/youtube/upload`

UI sayfaları:
- `/generate` video üretim paneli
- `/oauth` Google OAuth bağlantısı

Güvenlik:
- OAuth CSRF state doğrulaması (`createOAuthState` / `consumeOAuthState`)
- AES-256-GCM ile token şifreleme
- HttpOnly cookie kullanımı
- Refresh token'ın diskte şifreli saklanması
