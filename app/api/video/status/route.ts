export async function GET() {
  return Response.json({
    ok: true,
    status: "video pipeline ready",
    stages: [
      "AI Script",
      "TTS",
      "Visuals",
      "FFmpeg",
      "Subtitles",
      "Thumbnail",
      "YouTube upload",
    ],
  });
}
