import { Resend } from "resend";

export default async function handler(req, res) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      status: "error",
      message: "RESEND_API_KEY environment variable is missing",
    });
  }

  const resend = new Resend(apiKey);

  try {
    const { data, error } = await resend.emails.send({
      from: "Execution Cabal <administrator@executioncabal.com>",
      to: ["delivered@resend.dev"], // Safe test address
      subject: "Execution Cabal: System Test",
      html: "<p>Uplink established. Resend configuration is active.</p>",
    });

    if (error) {
      return res.status(500).json({
        status: "error",
        message: "Resend API returned an error",
        details: error,
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Test email sent successfully to delivered@resend.dev",
      data: data,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error during email dispatch",
      details: error.message,
    });
  }
}
