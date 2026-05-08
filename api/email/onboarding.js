import { emailService } from "../../services/emailService.js";

export default async function handler(req, res) {
  // CORS check (optional but good for Vercel functions)
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { email, username } = req.body;

  if (!email || !username) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const success = await emailService.sendOnboardingEmail(email, username);
    if (success) {
      return res
        .status(200)
        .json({ success: true, message: "Onboarding uplink established" });
    } else {
      return res.status(500).json({
        success: false,
        message:
          "Failed to establish onboarding uplink. Check Resend configuration.",
      });
    }
  } catch (error) {
    console.error("Vercel Onboarding Email Error:", error);
    return res
      .status(500)
      .json({ error: error.message || "Internal server error" });
  }
}
