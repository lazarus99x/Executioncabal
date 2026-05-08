import { Resend } from "resend";

// Initialize Resend safely for both local and serverless/Vercel environments
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

if (!resend) {
  console.warn(
    "[Email Service] Warning: RESEND_API_KEY is missing. Emails will not be sent."
  );
}

/**
 * Enterprise Standard Email Service for Execution Cabal
 */
export const emailService = {
  /**
   * Sends a directive deadline reminder
   */
  sendDeadlineReminder: async (
    email,
    username,
    quest,
    timeLeftMinutes,
    allActiveQuests
  ) => {
    if (!resend) return false;

    const priorityQuest =
      allActiveQuests.sort((a, b) => {
        const priorityMap = { S: 6, A: 5, B: 4, C: 3, D: 2, E: 1 };
        return (
          (priorityMap[b.difficulty] || 0) - (priorityMap[a.difficulty] || 0)
        );
      })[0] || quest;

    const text = `
SYST-ADMIN ALERT: DEADLINE APPROACHING
AGENT: ${username}
DIRECTIVE: ${quest.title}
TIME REMAINING: ${timeLeftMinutes} MINUTES

OPERATIONAL STATUS REPORT:
${allActiveQuests.map((q) => `- [${q.difficulty}-RANK] ${q.title} (${q.status})`).join("\n")}

PRIMARY FOCUS: ${priorityQuest.title}

INTERNAL COMMS / EXECUTION CABAL
Execution Cabal, Lagos, Nigeria.
Unsubscribe or manage directives in your dashboard.
    `;

    const html = `
      <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f7f9; padding: 40px 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e1e8ed; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <!-- Header -->
          <div style="background-color: #000000; padding: 25px; border-bottom: 4px solid #00a2ff;">
            <h1 style="color: #00a2ff; margin: 0; font-size: 18px; text-transform: uppercase; letter-spacing: 2px; font-weight: 800;">SYST-ADMIN ALERT</h1>
          </div>
          
          <!-- Body -->
          <div style="padding: 30px; color: #333333; line-height: 1.6;">
            <p style="margin-top: 0; font-size: 14px; color: #666;">AGENT: <strong style="color: #000;">${username}</strong></p>
            <h2 style="color: #000; font-size: 20px; margin: 20px 0 10px;">Action Required: Directive Deadline Approach</h2>
            <p>The following objective is reaching its operational deadline:</p>
            
            <div style="background-color: #f8f9fa; border-left: 4px solid #ff0000; padding: 15px; margin: 20px 0;">
              <div style="font-weight: bold; font-size: 16px;">${quest.title}</div>
              <div style="color: #ff0000; font-size: 14px; font-weight: bold; margin-top: 5px;">${timeLeftMinutes} MINUTES REMAINING</div>
            </div>

            <div style="text-align: center; margin: 25px 0;">
              <a href="https://executioncabal.com" style="background-color: #000; color: #00a2ff; padding: 12px 24px; text-decoration: none; border: 1px solid #00a2ff; border-radius: 4px; font-weight: bold; font-size: 14px; display: inline-block;">VERIFY STATUS / LOGIN</a>
            </div>

            <h3 style="font-size: 14px; text-transform: uppercase; color: #666; margin-top: 30px; border-bottom: 1px solid #eee; padding-bottom: 8px;">Operational Status Report</h3>
            ${allActiveQuests
              .map(
                (q) => `
              <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f9f9f9; font-size: 13px;">
                <span style="font-weight: 600;">[${q.difficulty}] ${q.title}</span>
                <span style="color: ${q.id === quest.id ? "#ff0000" : "#00a2ff"}">${q.status}</span>
              </div>
            `
              )
              .join("")}

            <div style="margin-top: 30px; padding: 15px; background: #eef9ff; border-radius: 4px; font-size: 13px;">
              <strong style="color: #00a2ff;">PRIMARY FOCUS:</strong> ${priorityQuest.title}
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #fbfcfd; padding: 20px; text-align: center; border-top: 1px solid #e1e8ed; color: #99aab5; font-size: 11px;">
            <p style="margin: 0 0 10px;">EXECUTION CABAL &bull; INTERNAL DATA UPLINK &bull; DO NOT REPLY</p>
            <p style="margin: 0;">Lagos, Nigeria. &bull; <a href="https://executioncabal.com" style="color: #00a2ff; text-decoration: none;">View Dashboard</a></p>
          </div>
        </div>
      </div>
    `;

    try {
      const { data, error } = await resend.emails.send({
        from: "Execution Cabal <administrator@executioncabal.com>",
        to: email,
        subject: `Action Required: Directive "${quest.title}" Deadline Impact`,
        text: text,
        html: html,
        headers: {
          "X-Entity-Ref-ID": `deadline-${quest.id}`,
          "List-Unsubscribe": "<https://executioncabal.com/unsubscribe>",
        },
      });

      if (error) {
        console.error("[Email] Resend Error:", error);
        return false;
      }

      console.log(
        `[Email] Deadline reminder sent to ${email} for quest ${quest.id}`
      );
      return true;
    } catch (error) {
      console.error("[Email] Fatal Send Error:", error);
      return false;
    }
  },

  /**
   * Sends an inactivity reminder
   */
  sendInactivityAlert: async (email, username, allActiveQuests) => {
    if (!resend) return false;

    const text = `
SYST-ADMIN ALERT: INACTIVITY DETECTED
AGENT: ${username}
STATUS: OPERATIONAL SUSPENSION RISK

You have not interacted with the terminal for over 24 hours. 
Failure to execute core directives may impact your standing.

QUEUED DIRECTIVES:
${allActiveQuests.map((q) => `- [${q.difficulty}] ${q.title}`).join("\n")}

DISCIPLINE IS FREEDOM.
Execution Cabal, Lagos, Nigeria.
    `;

    const html = `
      <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f7f9; padding: 40px 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e1e8ed; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <!-- Header -->
          <div style="background-color: #000000; padding: 25px; border-bottom: 4px solid #ff0000;">
            <h1 style="color: #ff0000; margin: 0; font-size: 18px; text-transform: uppercase; letter-spacing: 2px; font-weight: 800;">INACTIVITY DETECTED</h1>
          </div>
          
          <!-- Body -->
          <div style="padding: 30px; color: #333333; line-height: 1.6;">
            <p style="margin-top: 0; font-size: 14px; color: #666;">AGENT: <strong style="color: #000;">${username}</strong></p>
            <h2 style="color: #000; font-size: 20px; margin: 20px 0 10px;">Operational Suspension Risk</h2>
            <p>Our logs indicate you have not interfaced with the system in over <strong style="color: #ff0000;">24 HOURS</strong>.</p>
            
            <p>Failure to maintain directive execution may result in a rank reduction.</p>

            <div style="text-align: center; margin: 25px 0;">
              <a href="https://executioncabal.com" style="background-color: #000; color: #ff0000; padding: 12px 24px; text-decoration: none; border: 1px solid #ff0000; border-radius: 4px; font-weight: bold; font-size: 14px; display: inline-block;">RESUME OPERATIONS</a>
            </div>

            <h3 style="font-size: 14px; text-transform: uppercase; color: #666; margin-top: 30px; border-bottom: 1px solid #eee; padding-bottom: 8px;">Queued Objectives</h3>
            <ul style="padding-left: 20px; font-size: 14px; color: #444;">
              ${allActiveQuests.map((q) => `<li style="margin-bottom: 8px;">[${q.difficulty}-RANK] ${q.title}</li>`).join("")}
            </ul>
          </div>

          <!-- Footer -->
          <div style="background-color: #fbfcfd; padding: 20px; text-align: center; border-top: 1px solid #e1e8ed; color: #99aab5; font-size: 11px;">
            <p style="margin: 0 0 10px;">EXECUTION CABAL &bull; DISCIPLINE IS FREEDOM &bull; DO NOT REPLY</p>
            <p style="margin: 0;">Lagos, Nigeria. &bull; <a href="https://executioncabal.com" style="color: #00a2ff; text-decoration: none;">Resume Operations</a></p>
          </div>
        </div>
      </div>
    `;

    try {
      const { data, error } = await resend.emails.send({
        from: "Execution Cabal <administrator@executioncabal.com>",
        to: email,
        subject: `Status Update: Operational Suspension Risk`,
        text: text,
        html: html,
        headers: {
          "X-Entity-Ref-ID": `inactivity-${username}`,
          "List-Unsubscribe": "<https://executioncabal.com/unsubscribe>",
        },
      });

      if (error) {
        console.error("[Email] Resend Inactivity Error:", error);
        return false;
      }

      console.log(`[Email] Inactivity alert sent to ${email}`);
      return true;
    } catch (error) {
      console.error("[Email] Fatal Inactivity Error:", error);
      return false;
    }
  },

  /**
   * Sends a manual message from Admin
   */
  sendManualEmail: async (to, subject, message) => {
    if (!resend)
      return { success: false, error: "Email provider not initialized" };

    const text = `
SYSTEM DIRECTIVE: MANUAL UPLINK
MESSAGE:
${message}

INTERNAL COMMS / EXECUTION CABAL
Execution Cabal, Lagos, Nigeria.
    `;

    const html = `
      <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f7f9; padding: 40px 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e1e8ed; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <!-- Header -->
          <div style="background-color: #000000; padding: 25px; border-bottom: 4px solid #00a2ff;">
            <h1 style="color: #00a2ff; margin: 0; font-size: 18px; text-transform: uppercase; letter-spacing: 2px; font-weight: 800;">MANUAL UPLINK</h1>
          </div>
          
          <!-- Body -->
          <div style="padding: 30px; color: #333333; line-height: 1.6;">
            <p style="margin-top: 0; font-size: 14px; text-transform: uppercase; color: #666; font-weight: bold;">Priority Message</p>
            <div style="white-space: pre-wrap; margin: 20px 0; color: #000; font-size: 15px;">${message}</div>

            <div style="text-align: center; margin: 25px 0;">
              <a href="https://executioncabal.com" style="background-color: #000; color: #00a2ff; padding: 12px 24px; text-decoration: none; border: 1px solid #00a2ff; border-radius: 4px; font-weight: bold; font-size: 14px; display: inline-block;">ACCESS TERMINAL</a>
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #fbfcfd; padding: 20px; text-align: center; border-top: 1px solid #e1e8ed; color: #99aab5; font-size: 11px;">
            <p style="margin: 0 0 10px;">EXECUTION CABAL &bull; MANUAL OVERRIDE &bull; OFFICIAL BROADCAST</p>
            <p style="margin: 0;">Lagos, Nigeria. &bull; <a href="https://executioncabal.com" style="color: #00a2ff; text-decoration: none;">Access Terminal</a></p>
          </div>
        </div>
      </div>
    `;

    try {
      const { data, error } = await resend.emails.send({
        from: "Execution Cabal <administrator@executioncabal.com>",
        to: to,
        subject: subject,
        text: text,
        html: html,
        headers: {
          "X-Entity-Ref-ID": `manual-${Date.now()}`,
          "List-Unsubscribe": "<https://executioncabal.com/unsubscribe>",
        },
      });

      if (error) {
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      console.error("[Email] Manual send failed:", error);
      return { success: false, error: error.message || error };
    }
  },

  /**
   * Sends a welcome/onboarding email to new agents
   */
  sendOnboardingEmail: async (email, username) => {
    if (!resend) return false;

    const text = `
Welcome to the Execution Cabal, Agent ${username}.

Your identity has been verified and your uplink is now active.
The Cabal is a system of extreme discipline and high-stakes execution.

What to expect:
- Directives: High-priority tasks that must be executed before deadlines.
- Alerts: System notifications 1 hour and 30 minutes before expiration.
- Consequences: Inactivity results in system suspension and XP penalties.

Login to your terminal to begin your first directive.
Execution Cabal, Lagos, Nigeria.
    `;

    const html = `
      <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f7f9; padding: 40px 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e1e8ed; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <!-- Header -->
          <div style="background-color: #000000; padding: 30px; border-bottom: 4px solid #00a2ff; text-align: center;">
            <h1 style="color: #00a2ff; margin: 0; font-size: 22px; text-transform: uppercase; letter-spacing: 4px; font-weight: 900;">WELCOME TO THE CABAL</h1>
          </div>
          
          <!-- Body -->
          <div style="padding: 40px 30px; color: #333333; line-height: 1.8;">
            <p style="margin-top: 0; font-size: 15px;">AGENT IDENTIFIED: <strong style="color: #000;">${username}</strong></p>
            <p>Your credentials have been accepted into the global registry. You are now part of an elite network focused on peak operational execution.</p>
            
            <h3 style="font-size: 14px; text-transform: uppercase; color: #00a2ff; margin-top: 30px; border-bottom: 1px solid #eee; padding-bottom: 8px;">Operational Protocols</h3>
            <div style="margin-top: 15px;">
              <div style="margin-bottom: 15px;">
                <strong style="color: #000; display: block;">01. DIRECTIVE EXECUTION</strong>
                <span style="font-size: 13px; color: #666;">All assigned tasks come with hard deadlines. Failure is not an option.</span>
              </div>
              <div style="margin-bottom: 15px;">
                <strong style="color: #000; display: block;">02. SYSTEM ALERTS</strong>
                <span style="font-size: 13px; color: #666;">You will receive high-priority uplinks 60 and 30 minutes before any directive expires.</span>
              </div>
              <div style="margin-bottom: 15px;">
                <strong style="color: #000; display: block;">03. DISCIPLINE TRACKING</strong>
                <span style="font-size: 13px; color: #666;">Active monitoring for 24-hour inactivity is in effect. Maintain your streak to earn prestige.</span>
              </div>
            </div>

            <div style="margin-top: 40px; text-align: center;">
              <a href="https://executioncabal.com" style="background-color: #000; color: #00a2ff; padding: 15px 30px; text-decoration: none; border: 1px solid #00a2ff; border-radius: 4px; font-weight: bold; font-size: 14px; display: inline-block;">INITIALIZE TERMINAL</a>
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #fbfcfd; padding: 25px; text-align: center; border-top: 1px solid #e1e8ed; color: #99aab5; font-size: 11px;">
            <p style="margin: 0 0 10px;">EXECUTION CABAL &bull; OFFICIAL ONBOARDING &bull; INTERNAL COMMS</p>
            <p style="margin: 0;">Lagos, Nigeria. &bull; <a href="https://executioncabal.com" style="color: #00a2ff; text-decoration: none;">System Status</a></p>
          </div>
        </div>
      </div>
    `;

    try {
      const { data, error } = await resend.emails.send({
        from: "Execution Cabal <administrator@executioncabal.com>",
        to: email,
        subject: `Onboarding: Execution Cabal Access`,
        text: text,
        html: html,
      });

      if (error) {
        console.error("[Email] Onboarding Error:", error);
        return false;
      }
      return true;
    } catch (error) {
      console.error("[Email] Fatal Onboarding Error:", error);
      return false;
    }
  },

  /**
   * Sends the Daily Performance Report
   */
  sendDailyReportEmail: async (
    email,
    username,
    stats,
    achievedTasks,
    failedTasks,
    systemSuggestion,
    formattedDate
  ) => {
    if (!resend) return false;

    const text = `
SYST-ADMIN: DAILY PERFORMANCE REPORT
AGENT: ${username}
DATE: ${formattedDate}

ACHIEVED: ${stats.achieved} DIRECTIVES
FAILED: ${stats.failed} DIRECTIVES
AVG EXECUTION TIME: ${stats.avgSpeedMinutes} MINUTES

BEHAVIORAL MATRICES:
Discipline: ${stats.behavior.discipline}% | Consistency: ${stats.behavior.consistency}% | Focus: ${stats.behavior.focus}%

SYSTEM SUGGESTION & INSIGHTS:
${systemSuggestion}

EXECUTE OR BE EXECUTED.
Execution Cabal, Lagos, Nigeria.
    `;

    const html = `
      <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f7f9; padding: 40px 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e1e8ed; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <!-- Header -->
          <div style="background-color: #000000; padding: 25px; border-bottom: 4px solid #00a2ff;">
            <h1 style="color: #00a2ff; margin: 0; font-size: 18px; text-transform: uppercase; letter-spacing: 2px; font-weight: 800;">DAILY PERFORMANCE REPORT</h1>
            <div style="color: #666; font-size: 12px; margin-top: 5px; font-family: monospace; text-transform: uppercase;">DATE: ${formattedDate}</div>
          </div>
          
          <!-- Body -->
          <div style="padding: 30px; color: #333333; line-height: 1.6;">
            <p style="margin-top: 0; font-size: 14px; color: #666;">AGENT: <strong style="color: #000;">${username}</strong></p>
            
            <div style="display: flex; gap: 10px; margin: 20px 0;">
              <div style="flex: 1; background: #eef9ff; padding: 15px; border-radius: 4px; text-align: center;">
                <div style="font-size: 24px; font-weight: bold; color: #00a2ff;">${stats.achieved}</div>
                <div style="font-size: 11px; text-transform: uppercase;">Achieved</div>
              </div>
              <div style="flex: 1; background: #fff0f0; padding: 15px; border-radius: 4px; text-align: center;">
                <div style="font-size: 24px; font-weight: bold; color: #ff0000;">${stats.failed}</div>
                <div style="font-size: 11px; text-transform: uppercase;">Failed</div>
              </div>
              <div style="flex: 1; background: #f5f5f5; padding: 15px; border-radius: 4px; text-align: center;">
                <div style="font-size: 24px; font-weight: bold; color: #333;">${stats.avgSpeedMinutes}m</div>
                <div style="font-size: 11px; text-transform: uppercase;">Avg Speed</div>
              </div>
            </div>

            <h3 style="font-size: 14px; text-transform: uppercase; color: #666; margin-top: 30px; border-bottom: 1px solid #eee; padding-bottom: 8px;">BEHAVIORAL MATRICES</h3>
            <p style="font-size: 13px;">Discipline: <strong>${stats.behavior.discipline}%</strong> | Consistency: <strong>${stats.behavior.consistency}%</strong> | Focus: <strong>${stats.behavior.focus}%</strong></p>

            <h3 style="font-size: 14px; text-transform: uppercase; color: #00a2ff; margin-top: 30px; border-bottom: 1px solid #eee; padding-bottom: 8px;">SYSTEM SUGGESTION & INSIGHTS</h3>
            <div style="background-color: #f8f9fa; border-left: 4px solid #000; padding: 15px; margin: 15px 0; font-size: 14px;">
              ${systemSuggestion}
            </div>
            
            ${
              achievedTasks.length > 0
                ? `
            <h3 style="font-size: 13px; text-transform: uppercase; color: #666; margin-top: 25px;">Verified Completed</h3>
            <ul style="padding-left: 20px; font-size: 13px; color: #444;">
              ${achievedTasks.map((t) => `<li style="margin-bottom: 5px;">${t.title} (${Math.round((t.completedAt - t.startTime) / 60000) || 0}m)</li>`).join("")}
            </ul>
            `
                : ""
            }
            
            ${
              failedTasks.length > 0
                ? `
            <h3 style="font-size: 13px; text-transform: uppercase; color: #ff0000; margin-top: 25px;">Mission Failures</h3>
            <ul style="padding-left: 20px; font-size: 13px; color: #444;">
              ${failedTasks.map((t) => `<li style="margin-bottom: 5px;">${t.title}</li>`).join("")}
            </ul>
            `
                : ""
            }

            <div style="text-align: center; margin: 30px 0 10px;">
              <a href="https://executioncabal.com" style="background-color: #000; color: #00a2ff; padding: 12px 24px; text-decoration: none; border: 1px solid #00a2ff; border-radius: 4px; font-weight: bold; font-size: 14px; display: inline-block;">REVIEW DASHBOARD</a>
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #fbfcfd; padding: 20px; text-align: center; border-top: 1px solid #e1e8ed; color: #99aab5; font-size: 11px;">
            <p style="margin: 0 0 10px;">EXECUTION CABAL &bull; DAILY DEBRIEF &bull; DO NOT REPLY</p>
            <p style="margin: 0;">Lagos, Nigeria. &bull; <a href="https://executioncabal.com" style="color: #00a2ff; text-decoration: none;">View Dashboard</a></p>
          </div>
        </div>
      </div>
    `;

    try {
      const { data, error } = await resend.emails.send({
        from: "Execution Cabal <administrator@executioncabal.com>",
        to: email,
        subject: `Daily Debrief: Status Report for ${username} - ${formattedDate}`,
        text: text,
        html: html,
        headers: {
          "X-Entity-Ref-ID": `daily-report-${Date.now()}`,
          "List-Unsubscribe": "<https://executioncabal.com/unsubscribe>",
        },
      });

      if (error) {
        console.error("[Email] Daily Report Error:", error);
        return false;
      }

      console.log(`[Email] Daily report sent to ${email}`);
      return true;
    } catch (error) {
      console.error("[Email] Fatal Daily Report Error:", error);
      return false;
    }
  },
};
