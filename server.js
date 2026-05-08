import express from "express";
import cors from "cors";
import { createProxyMiddleware } from "http-proxy-middleware";
import dotenv from "dotenv";
import path from "path";
import cron from "node-cron";
import { reminderService } from "./services/reminderService.js";
import { emailService } from "./services/emailService.js";
import Anthropic from "@anthropic-ai/sdk";

// Load .env.local
dotenv.config({ path: ".env" });

const app = express();
const PORT = 3000;
const VITE_PORT = 5173;

app.use(cors());
app.use(express.json());

// --- Cron Jobs for Reminders ---
// Scan every 5 minutes
cron.schedule("*/5 * * * *", () => {
  reminderService.processReminders();
});

// Initial trigger on startup
reminderService.processReminders();

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

if (!PAYSTACK_SECRET_KEY) {
  console.warn(
    "\n>>> WARNING: PAYSTACK_SECRET_KEY is missing from .env.local <<<"
  );
}

// API Routes
app.post("/api/paystack/initialize", async (req, res) => {
  const { email, amount, currency, callback_url } = req.body;

  if (!email || !amount) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  if (!PAYSTACK_SECRET_KEY) {
    return res
      .status(500)
      .json({ message: "Server misconfigured: Missing API Key" });
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
          amount: Math.round(amount * 100), // Paystack expects kobo/cents
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
});

app.get("/api/paystack/verify", async (req, res) => {
  const { reference } = req.query;

  if (!reference) {
    return res.status(400).json({ message: "Missing transaction reference" });
  }

  if (!PAYSTACK_SECRET_KEY) {
    return res
      .status(500)
      .json({ message: "Server misconfigured: Missing API Key" });
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
      const amount = data.data.amount / 100;
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
});

// Manual Email Endpoint
app.post("/api/email/send-manual", async (req, res) => {
  const { to, subject, message } = req.body;

  if (!to || !subject || !message) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const result = await emailService.sendManualEmail(to, subject, message);
    if (result.success) {
      return res
        .status(200)
        .json({ message: "Email transmitted successfully" });
    } else {
      return res
        .status(500)
        .json({ message: "Transmission failed", error: result.error });
    }
  } catch (error) {
    console.error("Manual Email Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Onboarding Email Endpoint
app.post("/api/email/onboarding", async (req, res) => {
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
        message: "Failed to establish onboarding uplink.",
      });
    }
  } catch (error) {
    console.error("Onboarding Email Error:", error);
    return res
      .status(500)
      .json({ error: error.message || "Internal server error" });
  }
});

// Anthropic Proxy Endpoint (Local Development)
app.post("/api/anthropic", async (req, res) => {
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

    const response = await anthropic.messages.create({
      model: model || "claude-3-haiku-20240307",
      max_tokens: max_tokens || 1024,
      system: system,
      messages: messages,
    });

    return res.status(200).json(response);
  } catch (error) {
    console.error("Anthropic Proxy Error:", error);
    return res.status(error.status || 500).json({
      error: "Failed to communicate with AI provider",
      details: error.message,
    });
  }
});

// Proxy all other requests to Vite Dev Server
app.use(
  "/",
  createProxyMiddleware({
    target: `http://localhost:${VITE_PORT}`,
    changeOrigin: true,
    ws: true,
    logLevel: "debug",
  })
);

app.listen(PORT, () => {
  console.log(
    `\n    >>> EXECUTION CABAL PROXY SERVER RUNNING ON PORT ${PORT} <<<`
  );
  console.log(`    API Routes: Enabled`);
  console.log(`    Frontend Proxy: http://localhost:${VITE_PORT}\n`);
});
