type OAuthPageProps = {
  searchParams: Promise<{
    status?: string;
    error?: string;
  }>;
};

export default async function OAuthPage({ searchParams }: OAuthPageProps) {
  const { status, error } = await searchParams;
  const message =
    status === "success"
      ? "YouTube hesabınız başarıyla bağlandı."
      : error
        ? `YouTube hesabı bağlanamadı: ${error}`
        : "YouTube hesabı bağlantı durumunuzu buradan kontrol edebilirsiniz.";

  return (
    <main className="oauth-page">
      <section className="oauth-panel">
        <p className="eyebrow">YouTube OAuth</p>
        <h1>Hesap bağlantısı</h1>
        <p>{message}</p>
        <a href="/">Dashboard’a dön</a>
      </section>
    </main>
  );
}
