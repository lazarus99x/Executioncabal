import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { email, amount, currency, callback_url } = req.body;

  if (!email || !amount) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

  if (!PAYSTACK_SECRET_KEY) {
    console.error("Missing PAYSTACK_SECRET_KEY env variable");
    return res.status(500).json({ message: "Server configuration error" });
  }

  try {
    const paystackRes = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          amount: Math.round(amount * 100), // Paystack expects amount in kobo/cents
          currency: currency || "NGN",
          callback_url,
          metadata: {
            cancel_action: callback_url,
          },
        }),
      }
    );

    const data = await paystackRes.json();

    if (!paystackRes.ok) {
      console.error("Paystack Init Error:", data);
      return res
        .status(paystackRes.status)
        .json({ message: data.message || "Paystack initialization failed" });
    }

    return res.status(200).json(data.data);
  } catch (error) {
    console.error("Payment initialization error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
