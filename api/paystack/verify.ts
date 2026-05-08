import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { reference } = req.query;

  if (!reference) {
    return res.status(400).json({ message: "Missing transaction reference" });
  }

  const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

  if (!PAYSTACK_SECRET_KEY) {
    console.error("Missing PAYSTACK_SECRET_KEY env variable");
    return res.status(500).json({ message: "Server configuration error" });
  }

  try {
    const paystackRes = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const data = await paystackRes.json();

    if (!paystackRes.ok) {
      return res
        .status(paystackRes.status)
        .json({ message: data.message || "Verification failed" });
    }

    if (data.data.status === "success") {
      const amount = data.data.amount / 100; // Convert back to main unit
      return res.status(200).json({
        success: true,
        message: "Payment verified",
        amount: amount,
        currency: data.data.currency,
        reference: data.data.reference,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Transaction not successful",
        status: data.data.status,
      });
    }
  } catch (error) {
    console.error("Payment verification error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
