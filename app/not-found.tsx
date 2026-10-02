import Link from "next/link";

export default function NotFound() {
  return (
    <main className="not-found-page">
      <h1>Sayfa bulunamadı</h1>
      <p>Aradığınız sayfa mevcut değil veya taşınmış olabilir.</p>
      <Link href="/">Ana sayfaya dön</Link>
    </main>
  );
}
