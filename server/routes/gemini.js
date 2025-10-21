// routes/gemini.js
import express from "express";

const router = express.Router();

// POST /api/gemini/chat
// body: { message: "..." }
router.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: "message required" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Server missing GEMINI_API_KEY" });
    }

    // ✅ Correct Gemini 2.0 Flash endpoint (as per your curl example)
    const MODEL = "gemini-2.0-flash";
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

    // ✅ Request body (same as your curl format)
    const body = {
      contents: [
        {
          parts: [
            { text: message }
          ]
        }
      ]
    };

    // ✅ Make the API request
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-goog-api-key": apiKey,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      return res.status(502).json({
        error: "Gemini API error",
        status: response.status,
        details: errorText,
      });
    }

    const data = await response.json();

    // ✅ Extract reply safely from API response
    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "⚠️ No reply from Gemini API.";

    return res.json({ reply });
  } catch (err) {
    console.error("Server error calling Gemini:", err);
    return res.status(500).json({ error: "Server error", details: err.message });
  }
});

export default router;
