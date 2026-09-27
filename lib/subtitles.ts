export type SubtitleItem = {
  start: number;
  end: number;
  text: string;
};

function formatTime(seconds: number): string {
  const totalMs = Math.max(0, Math.round(seconds * 1000));
  const hours = Math.floor(totalMs / 3600000);
  const minutes = Math.floor((totalMs % 3600000) / 60000);
  const secs = Math.floor((totalMs % 60000) / 1000);
  const ms = totalMs % 1000;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
}

export function createSrt(items: SubtitleItem[]): string {
  return items
    .map((item, index) => [String(index + 1), `${formatTime(item.start)} --> ${formatTime(item.end)}`, item.text, ""].join("\n"))
    .join("\n");
}
