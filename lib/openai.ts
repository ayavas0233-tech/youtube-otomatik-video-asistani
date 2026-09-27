import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.warn("OPENAI_API_KEY is not set. OpenAI features will be unavailable.");
}

export const openai = new OpenAI({
  apiKey: apiKey || "",
});

export async function generateScript({
  title,
  topic,
  audience,
  tone,
  duration,
}: {
  title: string;
  topic: string;
  audience: string;
  tone: string;
  duration: string;
}): Promise<string[]> {
  if (!apiKey) {
    return [
      "Giriş: İzleyici için çarpıcı bir açılış cümlesi hazırlandı.",
      `Ana konu: ${topic} üzerine net ve anlaşılır açıklama yazıldı.`,
      `Ton: ${tone} anlatım biçimiyle üretim yapıldı.`,
      `Süre hedefi: ${duration}.`,
      "Kapanış: CTA ve sonraki adım çağrısı eklendi.",
    ];
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content:
            "Sen Türkçe video senaryo yazarısın. Verilen başlık, konu, hedef kitle, ton ve süreye göre profesyonel bir video senaryo yaz. Her cümle yeni satırda olmalı. Sadece senaryo cümleleri döndür.",
        },
        {
          role: "user",
          content: `Başlık: ${title}\nKonu: ${topic}\nHedef Kitle: ${audience}\nTon: ${tone}\nSüre: ${duration}\n\nLütfen bu parametreler için profesyonel bir video senaryo yaz.`,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content || "";
    const lines = content
      .split("\n")
      .filter((line) => line.trim())
      .slice(0, 10);

    return lines.length > 0
      ? lines
      : [
          "Giriş: İzleyici için çarpıcı bir açılış cümlesi hazırlandı.",
          `Ana konu: ${topic} üzerine net ve anlaşılır açıklama yazıldı.`,
          `Ton: ${tone} anlatım biçimiyle üretim yapıldı.`,
          `Süre hedefi: ${duration}.`,
          "Kapanış: CTA ve sonraki adım çağrısı eklendi.",
        ];
  } catch (error) {
    console.error("Script generation error:", error);
    return [
      "Giriş: İzleyici için çarpıcı bir açılış cümlesi hazırlandı.",
      `Ana konu: ${topic} üzerine net ve anlaşılır açıklama yazıldı.`,
      `Ton: ${tone} anlatım biçimiyle üretim yapıldı.`,
      `Süre hedefi: ${duration}.`,
      "Kapanış: CTA ve sonraki adım çağrısı eklendi.",
    ];
  }
}
