const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json; charset=utf-8"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders });
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }
    if (request.method !== "POST") return json({ error: "Gunakan metode POST." }, 405);
    if (!env.GEMINI_API_KEY) return json({ error: "Kunci Gemini belum dipasang di Cloudflare." }, 500);

    try {
      const body = await request.json();
      if (!Array.isArray(body.messages) || body.messages.length === 0) {
        return json({ error: "Pesan belum diisi." }, 400);
      }
      const messages = body.messages.slice(-20);
      const contents = [];
      for (const item of messages) {
        if (!item || !["user", "model"].includes(item.role) || typeof item.text !== "string") continue;
        const text = item.text.trim().slice(0, 4000);
        if (text) contents.push({ role: item.role, parts: [{ text }] });
      }
      if (!contents.length || contents[contents.length - 1].role !== "user") {
        return json({ error: "Pesan pengguna tidak valid." }, 400);
      }

      const apiResponse = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": env.GEMINI_API_KEY
          },
          body: JSON.stringify({
            system_instruction: {
              parts: [{ text: "Kamu adalah NEXA AI, asisten yang ramah, jelas, jujur, dan membantu. Jawab dalam bahasa yang digunakan pengguna. Jika tidak yakin, katakan dengan jujur. Berikan jawaban yang aman dan sesuai usia." }]
            },
            contents,
            generationConfig: { temperature: 0.7, maxOutputTokens: 1200 }
          })
        }
      );

      const result = await apiResponse.json().catch(() => ({}));
      if (!apiResponse.ok) {
        const message = result?.error?.message || "Permintaan ke layanan AI gagal.";
        return json({ error: message }, apiResponse.status);
      }
      const reply = result?.candidates?.[0]?.content?.parts
        ?.map(part => part.text || "").join("").trim();
      if (!reply) return json({ error: "AI tidak menghasilkan teks. Coba kirim pesan lain." }, 502);
      return json({ reply });
    } catch (error) {
      return json({ error: "Permintaan tidak dapat diproses. Periksa format pesan dan koneksi." }, 500);
    }
  }
};