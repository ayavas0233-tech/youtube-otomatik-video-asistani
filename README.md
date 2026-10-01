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

### 1. Repoyu Clone Edin

```bash
git clone https://github.com/ayavas0233-tech/youtube-otomatik-video-asistani.git
cd youtube-otomatik-video-asistani
```

### 2. Google Cloud Projesi Oluştur

1. [Google Cloud Console](https://console.cloud.google.com) açın
2. Yeni bir proje oluşturun
3. **YouTube Data API v3**'ü etkinleştirin
4. **OAuth 2.0 Consent Screen** yapılandırın
5. **OAuth 2.0 Client Credentials** oluşturun (Web application)
6. Redirect URI'yi ayarlayın:
   ```
   http://localhost:3000/api/youtube/oauth-callback
   ```

### 3. Bağımlılıkları Yükle

```bash
npm install
```

### 4. Encryption Key Oluştur

TOKEN_ENCRYPTION_KEY için 32 byte hex string gerekli:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Çıktıyı not edin, sonra `.env.local`'a kopyalayacaksınız.

### 5. Ortam Değişkenlerini Yapılandır

`.env.local` dosyası oluşturun ve aşağıdaki içeriği yapıştırın:

```env
# OpenAI
OPENAI_API_KEY=sk_...
OPENAI_MODEL=gpt-4o-mini

# TTS Provider (OpenAI veya ElevenLabs)
ELEVENLABS_API_KEY=
ELEVENLABS_MODEL_ID=eleven_multilingual_v2
TTS_PROVIDER=elevenlabs

# Google / YouTube OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/api/youtube/oauth-callback

# Token Storage & Encryption
TOKEN_STORAGE_PROVIDER=env
TOKEN_ENCRYPTION_KEY=<Adım 4'te oluşturduğunuz key>

# Video Processing
FFMPEG_PATH=ffmpeg
FFPROBE_PATH=ffprobe

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 6. Uygulamayı Başlat

```bash
npm run dev
```

Tarayıcı açın: http://localhost:3000

## 🐳 Docker ile Hızlı Başlangıç

Docker ve Docker Compose kurulu olmalıdır. Önce `.env.local` dosyasını oluşturup ortam değişkenlerinizi ayarlayın:

```bash
cp .env.example .env.local
```

Geliştirme sunucusunu hot reload ile başlatmak için:

```bash
docker compose --profile development up --build
```

Üretim imajını çalıştırmak için:

```bash
docker compose --profile production up --build
```

Uygulama [http://localhost:3000](http://localhost:3000) adresinde çalışır. Dockerfile hedefleri, ortam değişkenleri ve sorun giderme hakkında ayrıntılar için [Docker rehberine](DOCKER.md) bakın.

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
POST /api/jobs/create
Content-Type: application/json

{
  "topic": "Yapay Zeka ile Para Kazanma",
  "title": "AI ile 5 Kolay Yol",
  "description": "Yapay zeka kullanarak para kazanmanın 5 etkili yolu",
  "tags": ["AI", "money", "tutorial"],
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
  "status": "PENDING"
}
```

### İş Durumunu İzle

```bash
GET /api/jobs/{jobId}/status
```

### İlerleme Takibi

```
10% - Senaryo üretiliyor
25% - Ses kaydı yapılıyor
45% - Video render ediliyor
75% - Altyazı ekleniyor
90% - Thumbnail oluşturuluyor
100% - YouTube'a yüklendi
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
GET  /api/youtube/auth-url              - OAuth URL oluştur
GET  /api/youtube/oauth-callback        - OAuth callback handler
GET  /api/youtube/status                - Bağlantı durumu
POST /api/jobs/create                   - İş oluştur
GET  /api/jobs/:id/status               - İş durumunu kontrol et
```

## 📦 Teknoloji Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **AI**: OpenAI API
- **TTS**: OpenAI / ElevenLabs
- **Video**: FFmpeg
- **YouTube**: Google APIs (youtube v3)
- **Auth**: OAuth 2.0
- **Encryption**: Node.js crypto (AES-256-GCM)

## ⚠️ Sınırlamalar (Şu Anki)

- Single-account token storage (development)
- In-memory job queue (restarts on deploy)
- Mock video/audio generation (scaffold)
- No database persistence

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
Error: TOKEN_ENCRYPTION_KEY environment variable is not set
```

**Çözüm:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Çıktıyı `.env.local`'a ekleyin.

### GOOGLE_CLIENT_ID hatası

```
Error: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required
```

**Çözüm:** Google Cloud Console'dan credentials oluşturun.

### YouTube bağlantı hatası

```
Error: YouTube account not connected
```

**Çözüm:** Önce "YouTube'a Bağlan" butonuna tıklayın.

## 📄 Lisans

MIT

## 👨‍💻 Geliştirici

Yapay Zeka Video Asistanı - Otomatik İçerik Üretim Platformu
