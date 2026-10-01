# 🎬 YouTube Otomatik Video Asistanı

Yapay zeka destekli, otomatik video üretim ve YouTube'a yükleme platformu.

## 📋 Özellikler

- ✅ **AI Senaryo Yazma** (OpenAI GPT-4o-mini)
- ✅ **TTS Ses Üretimi** (OpenAI veya ElevenLabs)
- ✅ **Video Rendering** (FFmpeg)
- ✅ **Otomatik Altyazı** (SRT format)
- ✅ **Thumbnail Üretimi**
- ✅ **YouTube OAuth 2.0** (Güvenli token yönetimi)
- ✅ **Otomatik YouTube Yükleme** (videos.insert API)
- ✅ **Gizlilik Kontrolleri** (Private / Unlisted / Public)
- ✅ **İş Kuyruğu** (Job queue with progress tracking)

## 🚀 Kurulum

### 1. Google Cloud Projesi Oluştur

1. [Google Cloud Console](https://console.cloud.google.com) açın
2. Yeni bir proje oluşturun
3. **YouTube Data API v3**'ü etkinleştirin
4. **OAuth 2.0 Consent Screen** yapılandırın
5. **OAuth 2.0 Client Credentials** oluşturun (Web application)
6. Redirect URI'yi ayarlayın:
   ```
   http://localhost:3000/api/youtube/oauth-callback
   ```

### 2. Ortam Değişkenlerini Yapılandır

`.env.local` dosyası oluşturun:

`.env.example` dosyasındaki tüm değişkenlerin güncel ve doğrulanmış açıklaması için o dosyaya bakın. Özet:

```env
# OpenAI (AI senaryo, görsel ve TTS için)
OPENAI_API_KEY=sk_...

# Google / YouTube OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/api/youtube/oauth-callback

# Token Encryption (ZORUNLU - AES-256-GCM)
TOKEN_ENCRYPTION_KEY=

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Encryption Key Oluştur

TOKEN_ENCRYPTION_KEY için 32 byte hex string gerekli:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Çıktıyı `.env.local`'a kopyalayın.

### 4. Bağımlılıkları Yükle

```bash
npm install
```

### 5. Uygulamayı Başlat

```bash
npm run dev
```

Tarayıcı açın: http://localhost:3000

## 📺 YouTube Bağlantısı

### OAuth Akışı

1. Dashboard'da "YouTube'a Bağlan" butonuna tıklayın
2. Google hesabında oturum açın
3. İzinleri onaylayın
4. Otomatik olarak uygulamaya yönlendirilirsiniz
5. YouTube hesabınız bağlandı ✅

**Güvenlik Notu:** 
- Tokens sunucu tarafında şifrelenmiş olarak saklanır
- Browser'a token gönderilmez
- Oturum kapatıldığında tokens silinir

## 🎥 Video Üretme

### İş Oluştur

```bash
POST /api/video/job
Content-Type: application/json

{
  "topic": "Yapay Zeka ile Para Kazanma",
  "title": "AI ile 5 Kolay Yol",
  "audience": "Girişimciler",
  "tone": "Motivasyonlu",
  "duration": "5-7 dakika",
  "uploadToYouTube": true,
  "privacyStatus": "private"
}
```

### Yanıt

```json
{
  "ok": true,
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Job queued for processing",
  "statusUrl": "/api/video/job/550e8400-e29b-41d4-a716-446655440000"
}
```

### İş Durumunu İzle

```bash
GET /api/video/job/{jobId}
```

### İlerleme Takibi

```
10% - Senaryo üretimi başlıyor
30% - Sahneler hazır
40-95% - Görsel/TTS/video/altyazı/thumbnail adımları
90% - YouTube yükleme başlıyor (uploadToYouTube=true ise)
90-99% - YouTube yükleme ilerlemesi
100% - Tamamlandı
```

## 🔐 Gizlilik Ayarları

### Private (Gizli)
- Sadece siz görebilirsiniz
- YouTube araması içinde görünmez
- Paylaşım linki ile erişim yok

### Unlisted (Listelenmeyen)
- Sadece link ile erişim
- Aramada görünmez
- Paylaşılabilir

### Public (Herkese Açık)
- YouTube aramasında görünür
- Herkese açık
- Kanal sayfasında listelenir

## 🛠️ Teknik Mimarı

### Güvenlik

- **OAuth State Management**: CSRF koruması
- **Token Encryption**: AES-256-GCM
- **HttpOnly Cookies**: XSS koruması
- **Constant-Time Comparison**: Timing attack koruması
- **Secure Token Storage**: Server-side only

### İş Kuyruğu

- In-memory job queue
- Retry mekanizması
- Worker-based processing
- Progress tracking

### API Endpoints

```
GET  /api/youtube/auth-url              - OAuth URL oluştur (state cookie set eder)
GET  /api/youtube/oauth-callback        - OAuth callback handler (state doğrular, token saklar)
GET  /api/youtube/status                - Bağlantı durumu (token'ları ifşa etmez)
POST /api/video/job                     - Video işi oluştur
GET  /api/video/job                     - İşleri listele
GET  /api/video/job/:jobId              - İş durumunu kontrol et
```

## 📦 Teknoloji Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **AI**: OpenAI API
- **TTS**: OpenAI / ElevenLabs
- **Video**: FFmpeg
- **YouTube**: Google APIs (youtube v3)
- **Auth**: OAuth 2.0
- **Encryption**: Node.js crypto (AES-256-GCM)

## ⚠️ Sınırlamalar (Current)

- Single-account token storage (çok kullanıcılı değil)
- Dosya tabanlı job queue (`tmp/` altında; sunucu yeniden başlatılırsa korunur ama tek makineye bağlıdır)
- Video/ses üretimi hâlâ placeholder dosyalar yazıyor (gerçek FFmpeg/TTS render pipeline'ı ayrı bir iş)
- No database persistence

## 🚀 Production Notları

- **HTTPS zorunlu**: `NODE_ENV=production` olduğunda OAuth state cookie'si `secure` bayrağıyla ayarlanır; uygulamayı mutlaka HTTPS arkasında çalıştırın.
- **TOKEN_ENCRYPTION_KEY'i güvenli tutun**: Bu anahtar olmadan şifreli token dosyası çözülemez. Anahtarı bir secret manager'da saklayın ve asla repoya commit etmeyin.
- **Token dosyası**: Şifreli YouTube token'ları `tmp/youtube-token-store/tokens.enc` içinde saklanır; bu dizin `.gitignore` ile hariç tutulmuştur ve konteyner/sunucu yeniden oluşturulduğunda silinir (yeniden bağlanma gerekir).
- **Yatay ölçekleme**: Dosya tabanlı job queue ve token store tek instance için uygundur. Çoklu instance/production ortamında Redis + harici (DB/KMS) bir token deposuna geçilmesi önerilir.
- **Quota**: YouTube Data API v3 günlük kota sınırlarına tabidir; `videos.insert` yüksek maliyetli bir işlemdir.

## 📈 Production Roadmap

- [ ] Supabase/Database integration
- [ ] Multi-user support
- [ ] Redis job queue
- [ ] Real FFmpeg processing
- [ ] Advanced metadata handling
- [ ] Webhook notifications
- [ ] Rate limiting
- [ ] Analytics dashboard

## 🐛 Hata Ayıklama

### TOKEN_ENCRYPTION_KEY hatası

```
Error: TOKEN_ENCRYPTION_KEY ortam değişkeni tanımlı değil.
```

**Çözüm:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Çıktıyı `.env.local`'a ekleyin.

### GOOGLE_CLIENT_ID hatası

```
Error: Google OAuth istemci bilgileri (GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET) eksik.
```

**Çözüm:** Google Cloud Console'dan credentials oluşturun.

### YouTube bağlantı hatası

```
Error: YouTube bağlantısı bulunamadı. Lütfen önce OAuth akışını tamamlayın.
```

**Çözüm:** Önce "YouTube'a Bağlan" butonuna tıklayın.

## 📄 Lisans

MIT

## 👨‍💻 Geliştirici

Yapay Zeka Video Asistanı - Otomatik İçerik Üretim Platformu
