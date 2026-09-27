export type SubtitleFormat = "srt" | "vtt" | "ass";

export type SubtitleScene = {
  text: string;
  durationSec: number;
};

function formatSrtTime(timeSec: number) {
  const ms = Math.floor((timeSec % 1) * 1000);
  const totalSeconds = Math.floor(timeSec);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
}

function formatVttTime(timeSec: number) {
  return formatSrtTime(timeSec).replace(",", ".");
}

function formatAssTime(timeSec: number) {
  const total = Math.max(0, timeSec);
  const totalSeconds = Math.floor(total);
  const cs = Math.floor((total - totalSeconds) * 100);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}

function escapeAssText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/{/g, "\\{").replace(/}/g, "\\}").replace(/,/g, "\\,");
}

export function generateSubtitles(scenes: SubtitleScene[], format: SubtitleFormat = "srt") {
  let cursor = 0;

  if (format === "vtt") {
    const body = scenes
      .map((scene, index) => {
        const start = cursor;
        const end = cursor + Math.max(1, scene.durationSec);
        cursor = end;
        return `${index + 1}\n${formatVttTime(start)} --> ${formatVttTime(end)}\n${scene.text}`;
      })
      .join("\n\n");

    return `WEBVTT\n\n${body}\n`;
  }

  if (format === "ass") {
    const header = `[Script Info]\nScriptType: v4.00+\n\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\nStyle: Default,Arial,42,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,1,0,0,0,100,100,0,0,1,2,1,2,40,40,40,1\n\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text`;

    const lines = scenes
      .map((scene) => {
        const start = cursor;
        const end = cursor + Math.max(1, scene.durationSec);
        cursor = end;
        return `Dialogue: 0,${formatAssTime(start)},${formatAssTime(end)},Default,,0,0,0,,${escapeAssText(scene.text)}`;
      })
      .join("\n");

    return `${header}\n${lines}\n`;
  }

  return `${scenes
    .map((scene, index) => {
      const start = cursor;
      const end = cursor + Math.max(1, scene.durationSec);
      cursor = end;

      return `${index + 1}\n${formatSrtTime(start)} --> ${formatSrtTime(end)}\n${scene.text}`;
    })
    .join("\n\n")}\n`;
}
