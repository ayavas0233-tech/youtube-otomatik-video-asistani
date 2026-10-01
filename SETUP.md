# Kurulum ve yapılandırma

## Gereksinimler

- Node.js 18 veya üzeri
- npm 9 veya üzeri
- Google Cloud projesi (YouTube OAuth özellikleri için)
- OpenAI API anahtarı (gerçek AI senaryo ve TTS üretimi için)

## 1. Projeyi hazırlayın

Depoyu klonlayıp proje klasörüne geçin ve bağımlılıkları yükleyin:

```bash
git clone https://github.com/ayavas0233-tech/youtube-otomatik-video-asistani.git
cd youtube-otomatik-video-asistani
npm install
```

## 2. Yerel ortam dosyasını oluşturun

Örnek dosyayı kopyalayın:

```bash
cp .env.local.example .env.local
```

`.env.local` içindeki değerleri yapılandırın:

| Değişken | Gerekli mi? | Açıklama |
| --- | --- | --- |
| `OPENAI_API_KEY` | AI özellikleri için evet | OpenAI API anahtarı. Boş bırakılırsa senaryo üretimi örnek içerik kullanır; TTS çalışmaz. |
| `GOOGLE_CLIENT_ID` | YouTube OAuth için evet | Google Cloud'da oluşturulan OAuth 2.0 istemci kimliği. |
| `GOOGLE_CLIENT_SECRET` | YouTube OAuth için evet | OAuth 2.0 istemci gizli anahtarı. |
| `GOOGLE_REDIRECT_URI` | Varsayılanı kullanılabilir | Google OAuth yönlendirme adresi; Google Cloud'daki URI ile aynı olmalıdır. |
| `NEXT_PUBLIC_APP_URL` | Yerelde varsayılanı kullanılabilir | Uygulama adresi; varsayılan `http://localhost:3000`. |
| `TOKEN_ENCRYPTION_KEY` | Üretin ve yerelde saklayın | 32-byte (64 hex karakter) anahtar. Uygulamanın mevcut kodu bu değişkeni henüz kullanmıyor. |
| `VIDEO_OUTPUT_DIR` | Hayır | Video işleme çıktı klasörü; varsayılan `/tmp/videos`. |
| `YOUTUBE_MOCK_BASE_URL` | Hayır | İş kuyruğundaki mock yükleme adresi. Gerçek YouTube'a video yüklemez. |

Şifreleme anahtarı oluşturmak için:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Üretilen değeri `.env.local` içindeki `TOKEN_ENCRYPTION_KEY` satırına yapıştırın. Anahtarı kaynak koda, örnek dosyaya veya herkese açık bir depoya eklemeyin. `.env.local` Git tarafından yok sayılır.

## 3. Google Cloud ve YouTube OAuth

1. [Google Cloud Console](https://console.cloud.google.com/) içinde proje oluşturun veya mevcut bir projeyi seçin.
2. **YouTube Data API v3** hizmetini etkinleştirin.
3. OAuth consent screen / Google Auth Platform ayarlarını yapılandırın. Yerel test için test kullanıcıları arasına Google hesabınızı ekleyin.
4. **OAuth 2.0 Client ID** oluşturun ve uygulama türü olarak **Web application** seçin.
5. Authorized redirect URI listesine tam olarak şu adresi ekleyin:

   ```text
   http://localhost:3000/api/youtube/oauth-callback
   ```

6. İstemci kimliğini ve gizli anahtarını `.env.local` dosyasındaki `GOOGLE_CLIENT_ID` ve `GOOGLE_CLIENT_SECRET` değerlerine girin. Redirect URI'yi değiştirdiyseniz `GOOGLE_REDIRECT_URI` değerini de eşleştirin.

## 4. OpenAI API

1. [OpenAI Platform](https://platform.openai.com/) üzerinden API anahtarı oluşturun.
2. Gerekli faturalandırma ve API kullanım limitlerini hesabınızda yapılandırın.
3. Anahtarı `.env.local` içindeki `OPENAI_API_KEY` değerine girin.

Uygulama OpenAI senaryo ve TTS çağrılarında API anahtarı kullanır. Anahtar yoksa senaryo özelliği örnek içerik döndürür; TTS uç noktası ise hata verir.

## 5. ElevenLabs (isteğe bağlı)

ElevenLabs anahtarı için [ElevenLabs](https://elevenlabs.io/) hesabınızda API key oluşturabilirsiniz. Ancak mevcut uygulama kodu ElevenLabs API'sini veya `ELEVENLABS_API_KEY` değişkenini kullanmıyor; TTS şu anda OpenAI üzerinden çalışır. Bu nedenle ElevenLabs anahtarı kurulum için gerekli değildir.

## 6. Uygulamayı çalıştırın

```bash
npm run dev
```

Uygulamayı [http://localhost:3000](http://localhost:3000) adresinde açın. Derleme kontrolü için `npm run build` komutunu kullanabilirsiniz.

## Sorun giderme

- **`npm install` bağımlılık/engine hatası:** Node.js 18+ ve npm 9+ kullanıldığını `node --version` ve `npm --version` ile doğrulayın.
- **Google `redirect_uri_mismatch`:** Google Cloud'daki Authorized redirect URI ile `GOOGLE_REDIRECT_URI` değerinin karakter karakter aynı olduğuna bakın.
- **OAuth yapılandırması eksik:** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` ve yönlendirme adresini kontrol edin; OAuth consent ekranına hesabınızı test kullanıcısı olarak ekleyin.
- **OpenAI çağrısı çalışmıyor:** API anahtarının doğru olduğunu, hesabın API kullanımına açık olduğunu ve `.env.local` değişikliğinden sonra geliştirme sunucusunu yeniden başlattığınızı doğrulayın.
- **Gerçek YouTube yüklemesi bekleniyor:** Bu sürümde iş kuyruğu yalnızca `YOUTUBE_MOCK_BASE_URL` sağlandığında mock yükleme sonucu üretir; gerçek yükleme uygulaması henüz mevcut değildir.
- **FFmpeg hatası:** Gerçek video işleme kullanıyorsanız FFmpeg'in kurulu olduğunu ve çalıştırılabilir dosyanın `PATH` içinde bulunduğunu doğrulayın.
