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
        ? "YouTube hesabı bağlanamadı."
        : "YouTube hesap bağlantısı bekleniyor.";

  return (
    <main>
      <h1>YouTube bağlantısı</h1>
      <p role="status">{message}</p>
      <a href="/">Ana sayfaya dön</a>
    </main>
  );
}
