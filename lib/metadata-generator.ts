export interface VideoMetadata {
  title: string;
  description: string;
  tags: string[];
  categoryId: string;
}

export function generateMetadata(
  title: string,
  topic: string,
  scenes: number,
): VideoMetadata {
  const description = generateDescription(title, topic, scenes);
  const tags = generateTags(topic);

  return {
    title: generateTitle(title, topic),
    description,
    tags,
    categoryId: "22", // People & Blogs
  };
}

function generateTitle(title: string, topic: string): string {
  // Ensure title is under 100 characters (YouTube limit)
  if (title && title.length > 0) {
    return title.substring(0, 100);
  }

  // Generate title from topic
  const generated = `${topic} - Otomatik Video`;
  return generated.substring(0, 100);
}

function generateDescription(title: string, topic: string, scenes: number): string {
  const timestamp = new Date().toLocaleString("tr-TR");

  const description = `${title || topic}

Bu video yapay zeka tarafından otomatik olarak oluşturulmuştur.

📊 Video Detayları:
- Konu: ${topic}
- Sahneler: ${scenes}
- Oluşturulma Tarihi: ${timestamp}

🎬 Video üretim süreci:
1. AI senaryo yazarı
2. Yapay seslendir (TTS)
3. Otomatik video oluşturma
4. Dinamik altyazılar
5. Thumbnail tasarımı

💡 İçerik Notları:
Bu içerik eğitim ve bilgilendirme amaçlı hazırlanmıştır.

#AI #VideoOtomasyon #YouTube`;

  // YouTube description limit is 5000 characters
  return description.substring(0, 5000);
}

function generateTags(topic: string): string[] {
  const baseTags = [
    "AI",
    "Video Automation",
    "YouTube",
    "Artificial Intelligence",
    "Auto Generated",
    "Turkish Content",
  ];

  // Add topic-specific tags
  const topicWords = topic
    .split(" ")
    .filter((word) => word.length > 3)
    .slice(0, 3);

  return [...baseTags, ...topicWords].slice(0, 30); // YouTube max 30 tags
}

export function validateMetadata(metadata: VideoMetadata): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!metadata.title || metadata.title.length === 0) {
    errors.push("Title is required");
  }

  if (metadata.title && metadata.title.length > 100) {
    errors.push("Title must be 100 characters or less");
  }

  if (!metadata.description || metadata.description.length === 0) {
    errors.push("Description is required");
  }

  if (metadata.description && metadata.description.length > 5000) {
    errors.push("Description must be 5000 characters or less");
  }

  if (!metadata.tags || metadata.tags.length === 0) {
    errors.push("At least one tag is required");
  }

  if (metadata.tags && metadata.tags.length > 30) {
    errors.push("Maximum 30 tags allowed");
  }

  if (!metadata.categoryId) {
    errors.push("Category ID is required");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
