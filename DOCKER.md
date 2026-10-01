# Docker ile Çalıştırma

Bu proje, Node.js 20 Alpine tabanlı çok aşamalı bir Dockerfile kullanır. `development` hedefi hot reload ile geliştirme sunucusunu çalıştırır; `production` hedefi Next.js standalone çıktısını kullanarak daha küçük bir imaj oluşturur. Her iki hedefte de uygulama `node` kullanıcısı olarak çalışır ve Docker health check'i uygulamayı HTTP üzerinden denetler.

## Ortam değişkenleri

Önce `.env.example` dosyasını `.env.local` olarak kopyalayın ve kendi API anahtarlarınızı ekleyin:

```bash
cp .env.example .env.local
```

`.env.local` Docker build bağlamının dışında tutulur ve imaja kopyalanmaz. Compose, bu dosyayı konteynere çalışma zamanında aktarır. Dosyayı repoya veya Docker imajına eklemeyin.

## İmaj oluşturma ve çalıştırma

Üretim imajını oluşturun:

```bash
docker build --target production -t youtube-otomatik-video-asistani .
```

`.env.local` içindeki değişkenlerle çalıştırın:

```bash
docker run --env-file .env.local -p 3000:3000 youtube-otomatik-video-asistani
```

Uygulamaya [http://localhost:3000](http://localhost:3000) adresinden erişebilirsiniz.

## Docker Compose

Geliştirme profilinde hot reload ile başlatın:

```bash
docker compose --profile development up --build
```

Üretim profilinde başlatın:

```bash
docker compose --profile production up --build
```

Her iki profil de host üzerindeki `3000` portunu konteynerin `3000` portuna yönlendirir. Geliştirme profili kaynak kodunu `/app` konumuna bağlar ve `node_modules` ile `.next` klasörlerini konteyner içinde ayrı tutar. Üretim profili host dosyalarını bağlamaz. Tek seferde bir profil kullanın.

Durdurmak için `Ctrl+C` kullanın veya başka bir terminalde `docker compose --profile development down` (üretimde `production` profilini kullanın) çalıştırın.

## Sorun giderme

- Compose `.env.local` dosyasını bulamıyorsa `.env.example` dosyasını kopyalayıp gerekli değişkenleri doldurun.
- Port `3000` kullanımda hatası alırsanız host tarafındaki portu değiştirin; örneğin Compose dosyasındaki `"3000:3000"` değerini `"3001:3000"` yapın.
- Kaynak kod değişiklikleri görünmüyorsa development profilinin çalıştığını doğrulayın ve konteyneri `docker compose --profile development up --build` ile yeniden oluşturun.
- Sağlık kontrolü başarısızsa uygulama günlüklerini `docker compose --profile production logs app-production` komutuyla inceleyin ve uygulamanın `3000` portunda başladığını doğrulayın.
