import dotenv from "dotenv";
dotenv.config({ path: ".env" });

async function testEmail() {
  const { reportService } = await import("./services/reportService.js");

  console.log(
    `[Testing] Triggering the actual Daily Report Service for a single target...`
  );

  // Target exclusively lazarus99x@gmail.com so we don't spam users
  const result = await reportService.generateAndSendDailyReports(
    "lazarus99x@gmail.com"
  );

  if (result.success) {
    console.log(
      "[Testing] Status: UPLINK SUCCESSFUL. The actual database reports have been dispatched. Please check your inbox (and spam folder) for the Daily Debrief."
    );
  } else {
    console.log(
      "[Testing] Status: TRANSMISSION FAILED.",
      result.error || result.message
    );
  }
}

testEmail();
