import Link from "next/link";

export default async function OAuthPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; error?: string }>;
}) {
  const { status, error } = await searchParams;
  const message = error
    ? "Google hesabı bağlanırken bir hata oluştu."
    : status === "success"
      ? "Google hesabınız başarıyla bağlandı."
      : "YouTube hesabınızı bağlama durumu burada görüntülenir.";

  return (
    <main>
      <h1>YouTube hesabı bağlantısı</h1>
      <p>{message}</p>
      <Link href="/">Ana sayfaya dön</Link>
    </main>
  );
}
