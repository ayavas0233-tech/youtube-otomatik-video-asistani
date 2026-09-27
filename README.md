# YouTube Otomatik Video Asistanı

Türkçe, mobil uyumlu ve Next.js + TypeScript tabanlı otomatik video üretim dashboard'ı.

## Özellikler

- Türkçe arayüz
- Mobil uyumlu dashboard
- "Yeni Video Oluştur" formu
- Demo modu
- AI → TTS → Görseller → FFmpeg → Altyazı → Thumbnail → YouTube pipeline görünümü
- Demo API endpoint'i ile örnek video planı üretimi
- YouTube OAuth scaffold hazırlanmış

## Başlatma

```bash
npm install
cp .env.example .env.local
npm run dev
```

Ardından tarayıcıda `http://localhost:3000` adresini açın.

## Google YouTube OAuth kurulumu

1. Google Cloud Console'da yeni proje oluştur.
2. "APIs & Services > Library" bölümünden "YouTube Data API v3" etkinleştir.
3. "APIs & Services > Credentials" bölümüne geç.
4. OAuth 2.0 Client ID oluştur.
5. Authorized redirect URI olarak şu adresi ekle:

```text
http://localhost:3000/api/youtube/oauth-callback
```

6. Client ID ve Client Secret değerlerini `.env.local` içinde şu alanlara yaz:

```env
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:3000/api/youtube/oauth-callback
```

7. `http://localhost:3000/oauth` sayfasını açarak bağlantıyı başlat.

## Demo API

`POST /api/generate` yönlendirmesi, video üretim planını JSON olarak döndürür.

## Gelecek Aşama

1. Google OAuth doğrulama anketi ve token saklama
2. YouTube kanal bağlama ve upload akışı
3. FFmpeg video montajı
4. Altyazı ve thumbnail üretimi
5. Gerçek API anahtarlarıyla production sürüm

## Hedef Mimari

- Frontend: Next.js + TypeScript
- AI: OpenAI / Azure OpenAI
- TTS: OpenAI / üçüncü taraf TTS
- Görsel üretimi: image generation API
- Video montaj: FFmpeg
- Altyazı: subtitle engine
- Yükleme: YouTube Data API v3

## Aşama planı

- Aşama 1: Dashboard + demo pipeline ✅
- Aşama 2: Google OAuth + YouTube bağlama 🔄
- Aşama 3: YouTube upload pipeline
- Aşama 4: Production API key integration

## Not

Bu repo ayrı bir GitHub hesabında kurulu ve openai-fm repo'sundan bağımsızdır.

## Katmanlar

- app/page.tsx: ana dashboard
- app/oauth/page.tsx: Google OAuth başlatma ekranı
- app/api/generate/route.ts: AI üretim akışı
- app/api/youtube/*: YouTube OAuth akışları
- .env.example: gerekli ortam değişkenleri
