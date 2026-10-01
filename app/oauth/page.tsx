import Link from "next/link";

type OAuthPageProps = {
  searchParams: Promise<{
    [key: string]: string | string[] | undefined;
  }>;
};

const errorMessages: Record<string, string> = {
  missing_code: "Google yetkilendirme kodu bulunamadı.",
  missing_env: "Google OAuth ortam değişkenleri yapılandırılmamış.",
  token_exchange_failed: "Google hesabı bağlanırken bir hata oluştu.",
};

export default async function OAuthPage({ searchParams }: OAuthPageProps) {
  const query = await searchParams;
  const status = typeof query.status === "string" ? query.status : undefined;
  const error = typeof query.error === "string" ? query.error : undefined;

  return (
    <main className="oauth-page">
      <section className="oauth-card" aria-labelledby="oauth-heading">
        <h1 id="oauth-heading">YouTube hesabı bağlantısı</h1>
        {status === "success" ? (
          <p role="status">YouTube hesabınız başarıyla bağlandı.</p>
        ) : error ? (
          <p role="alert">{errorMessages[error] ?? "YouTube hesabı bağlanamadı."}</p>
        ) : (
          <p>Google OAuth bağlantı işleminin durumu burada görüntülenir.</p>
        )}
        <Link href="/">Panele dön</Link>
      </section>
    </main>
  );
}
