"use client";

import { useMemo, useState } from "react";

const initialForm = {
  title: "Yapay Zeka ile Kâr Edin",
  topic: "Güncel AI iş fırsatları",
  audience: "Yeni başlayan girişimciler",
  tone: "Motivasyonlu ve net",
  duration: "6 dakika",
  voice: "Turkish Female 01",
};

const pipelineStages = [
  { name: "AI Senaryo", status: "Hazır" },
  { name: "TTS", status: "Demo" },
  { name: "Görseller", status: "Planlandı" },
  { name: "FFmpeg", status: "Bekliyor" },
  { name: "Altyazı", status: "Bekliyor" },
  { name: "Thumbnail", status: "Bekliyor" },
  { name: "YouTube Yükleme", status: "Sonraki adım" },
];

const statCards = [
  { label: "Video üretim", value: "24", hint: "Bu hafta" },
  { label: "Ortalama süre", value: "6 dk", hint: "Maksimum 10 dk" },
  { label: "Yükleme başarısı", value: "86%", hint: "Demo akışı" },
  { label: "Iş akışı", value: "7 adım", hint: "Otomatik" },
];

export default function Home() {
  const [form, setForm] = useState(initialForm);
  const [demoMode, setDemoMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [script, setScript] = useState<string[]>([]);

  const summary = useMemo(() => {
    return {
      headline: `${form.title} için otomatik üretim başlatıldı`,
      subtitle: `Tema: ${form.topic} · Hedef: ${form.audience}`,
    };
  }, [form]);

  const handleChange = (field: keyof typeof initialForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleGenerateScript = async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (data.ok) {
        setScript(data.script);
      } else {
        setScript([
          "Giriş: İzleyici için çarpıcı bir açılış cümlesi hazırlandı.",
          "Eksik veya başarısız üretim nedeniyle fallback metin kullanıldı.",
        ]);
      }
    } catch (error) {
      console.error(error);
      setScript([
        "Giriş: İzleyici için çarpıcı bir açılış cümlesi hazırlandı.",
        "Üretim sırasında hata oluştu; yedek içerik gösteriliyor.",
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page-shell">
      <aside className="sidebar">
        <div className="brand-row">
          <div className="brand-mark">YT</div>
          <div>
            <p className="eyebrow">Dashboard</p>
            <h1>Video Asistanı</h1>
          </div>
        </div>

        <nav className="nav">
          <button className="nav-item active">📊 Genel bakış</button>
          <button className="nav-item">🎬 Yeni Video Oluştur</button>
          <button className="nav-item">🧪 Demo Modu</button>
          <button className="nav-item">⚙️ Ayarlar</button>
        </nav>

        <div className="sidebar-card">
          <p className="eyebrow">Açık iş akışı</p>
          <ul className="mini-list">
            <li>AI → TTS → Görseller</li>
            <li>FFmpeg → Altyazı</li>
            <li>Thumbnail → YouTube</li>
          </ul>
        </div>
      </aside>

      <section className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Türkçe üretim paneli</p>
            <h2>Otomatik video üretim merkezi</h2>
          </div>
          <button
            className={`demo-toggle ${demoMode ? "on" : ""}`}
            onClick={() => setDemoMode((previous) => !previous)}
          >
            {demoMode ? "Demo açık" : "Demo kapalı"}
          </button>
        </header>

        <div className="stats-grid">
          {statCards.map((card) => (
            <div key={card.label} className="stat-card">
              <span>{card.label}</span>
              <strong>{card.value}</strong>
              <small>{card.hint}</small>
            </div>
          ))}
        </div>

        <div className="hero-panel">
          <div>
            <p className="eyebrow">Sonraki üretim</p>
            <h3>{summary.headline}</h3>
            <p>{summary.subtitle}</p>
          </div>
          <button className="primary-button" onClick={handleGenerateScript} disabled={loading}>
            {loading ? "Üretiliyor..." : "Video üretimini başlat"}
          </button>
        </div>

        <div className="workspace-grid">
          <div className="editor-card">
            <div className="section-header">
              <h3>Yeni Video Oluştur</h3>
              <span className="badge">Açık</span>
            </div>

            <div className="form-grid">
              <label>
                Video başlığı
                <input
                  value={form.title}
                  onChange={(event) => handleChange("title", event.target.value)}
                />
              </label>
              <label>
                Konu
                <input
                  value={form.topic}
                  onChange={(event) => handleChange("topic", event.target.value)}
                />
              </label>
              <label>
                Hedef kitle
                <input
                  value={form.audience}
                  onChange={(event) => handleChange("audience", event.target.value)}
                />
              </label>
              <label>
                Ton / Stil
                <input
                  value={form.tone}
                  onChange={(event) => handleChange("tone", event.target.value)}
                />
              </label>
              <label>
                Süre
                <select
                  value={form.duration}
                  onChange={(event) => handleChange("duration", event.target.value)}
                >
                  <option>3 dakika</option>
                  <option>6 dakika</option>
                  <option>8 dakika</option>
                  <option>12 dakika</option>
                </select>
              </label>
              <label>
                Ses / TTS
                <select
                  value={form.voice}
                  onChange={(event) => handleChange("voice", event.target.value)}
                >
                  <option>Turkish Female 01</option>
                  <option>Turkish Male 02</option>
                  <option>Neutral Narrator</option>
                </select>
              </label>
            </div>

            <div className="actions-row">
              <button className="primary-button" onClick={handleGenerateScript} disabled={loading}>
                {loading ? "Üretiliyor..." : "Önizleme oluştur"}
              </button>
              <button className="secondary-button">Taslağı kaydet</button>
            </div>

            <div className="script-output" style={{ marginTop: 20 }}>
              {script.length > 0 ? (
                script.map((line, index) => (
                  <p key={index} style={{ marginBottom: 8, lineHeight: 1.7 }}>
                    {line}
                  </p>
                ))
              ) : (
                <p className="muted-text">Henüz senaryo üretilmedi.</p>
              )}
            </div>
          </div>

          <div className="pipeline-card">
            <div className="section-header">
              <h3>İş Akışı</h3>
              <span className="badge muted">Pipeline</span>
            </div>

            <div className="pipeline-list">
              {pipelineStages.map((stage, index) => (
                <div key={stage.name} className="pipeline-item">
                  <div className="step-index">{index + 1}</div>
                  <div>
                    <strong>{stage.name}</strong>
                    <small>{stage.status}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
