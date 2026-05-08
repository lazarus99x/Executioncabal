import { reminderService } from "../../services/reminderService.js";

/**
 * Vercel Cron Job Entry Point
 * Designed for High-Performance Production Scans
 */
export default async function handler(req, res) {
  // 1. Identify Source
  const timestamp = new Date().toISOString();
  console.log(`[Vercel Cron] [${timestamp}] Initializing system scan...`);

  // 2. Execution logic
  try {
    // Check if configuration is present
    if (!process.env.SUPABASE_ANON_KEY || !process.env.RESEND_API_KEY) {
      console.error(
        "[Vercel Cron] Critical Failure: Environment variables missing in Vercel Dashboard."
      );
      return res.status(500).json({
        error: "Configuration Incomplete",
        details:
          "Ensure SUPABASE_ANON_KEY and RESEND_API_KEY are set in Vercel settings.",
      });
    }

    await reminderService.processReminders();

    console.log(
      `[Vercel Cron] [${timestamp}] System scan completed successfully.`
    );
    return res.status(200).json({
      success: true,
      status: "Uplink Secure",
      timestamp: timestamp,
    });
  } catch (error) {
    console.error(`[Vercel Cron] [${timestamp}] CRITICAL ERROR:`, error);
    return res.status(500).json({
      success: false,
      error: error.message || "Internal Protocol Failure",
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
}
