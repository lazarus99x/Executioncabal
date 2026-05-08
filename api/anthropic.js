import Anthropic from "@anthropic-ai/sdk";

export default async function handler(req, res) {
  // 1. Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // 2. Retrieve secure server-side API key (NO VITE_ prefix!)
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return res
      .status(500)
      .json({ error: "System configuration error: API Key missing" });
  }

  const anthropic = new Anthropic({
    apiKey: apiKey,
  });

  try {
    const { model, max_tokens, system, messages } = req.body;

    // 3. Make request to Anthropic from the server
    const response = await anthropic.messages.create({
      model: model,
      max_tokens: max_tokens || 1024,
      system: system,
      messages: messages,
    });

    // 4. Return response to the client
    return res.status(200).json(response);
  } catch (error) {
    console.error("Anthropic Proxy Error:", error);
    return res.status(error.status || 500).json({
      error: "Failed to communicate with AI provider",
      details: error.message,
    });
  }
}
