export async function GET() {
  return Response.json({
    ok: true,
    message: "FFmpeg, subtitle ve upload pipeline scaffold hazır.",
    nextStep: "Gerçek media production ve YouTube OAuth bağlanması",
  });
}
