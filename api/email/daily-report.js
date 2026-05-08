import { reportService } from "../../services/reportService.js";

/**
 * Vercel Cron Job Entry Point for Daily Reports
 * Scans user activity from the past 24 hours and sends a performance email.
 */
export default async function handler(req, res) {
  const timestamp = new Date().toISOString();
  console.log(`[Daily Report Cron] [${timestamp}] Initializing...`);

  try {
    // 1. Authorization Check (Secure External or Vercel Trigger)
    const authHeader = req.headers.authorization;
    if (
      req.headers["x-vercel-cron"] !== "1" &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      console.warn("[Daily Report Cron] Unauthorized execution attempt.");
      return res.status(401).json({ error: "Unauthorized access" });
    }

    // 2. Secret Verification
    if (!process.env.SUPABASE_ANON_KEY || !process.env.RESEND_API_KEY) {
      console.error("[Daily Report Cron] Missing required API keys.");
      return res.status(500).json({ error: "Configuration Incomplete" });
    }

    const result = await reportService.generateAndSendDailyReports();

    if (result.success) {
      return res.status(200).json({ success: true, timestamp });
    } else {
      return res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error(`[Daily Report Cron] [${timestamp}] CRITICAL ERROR:`, error);
    return res.status(500).json({
      success: false,
      error: error.message || "Internal Protocol Failure",
    });
  }
}
