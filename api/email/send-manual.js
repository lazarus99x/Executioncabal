import { emailService } from "../../services/emailService.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { to, subject, message } = req.body;

  if (!to || !subject || !message) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const result = await emailService.sendManualEmail(to, subject, message);
    if (result.success) {
      return res
        .status(200)
        .json({ success: true, message: "Email transmitted successfully" });
    } else {
      return res
        .status(500)
        .json({
          success: false,
          message: "Transmission failed",
          error: result.error,
        });
    }
  } catch (error) {
    console.error("Vercel Manual Email Error:", error);
    return res
      .status(500)
      .json({ error: error.message || "Internal server error" });
  }
}
