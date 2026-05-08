import { createClient } from "@supabase/supabase-js";
import { emailService } from "./emailService.js";
import { GoogleGenAI } from "@google/genai";

const SUPABASE_URL =
  process.env.SUPABASE_URL || "https://tufltrankwmsxbuljosq.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const GEMINI_API_KEY =
  process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

let supabase = null;
if (SUPABASE_ANON_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

const ai = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

export const reportService = {
  /**
   * Generates and sends daily reports to all users (or a specific test email).
   * Scheduled via cron job (vercel.json) or manual trigger.
   * @param {string} testEmail - Optional email to restrict sending for testing.
   */
  generateAndSendDailyReports: async (testEmail = null) => {
    console.log("[ReportService] Starting daily report generation...");
    if (!supabase) {
      console.error(
        "[ReportService] Aborting: Supabase client not initialized."
      );
      return { success: false, error: "Database not initialized" };
    }

    try {
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("*");
      if (profileError) throw profileError;

      // Filter profiles if testEmail is provided
      const filteredProfiles = testEmail
        ? profiles.filter(
            (p) =>
              p.email === testEmail ||
              (p.player_data && p.player_data.email === testEmail)
          )
        : profiles;

      if (!filteredProfiles || filteredProfiles.length === 0) {
        console.log(
          "[ReportService] No profiles found matching criteria. Stopping."
        );
        return { success: true, message: "No profiles" };
      }

      // Get today's local date string in YYYY-MM-DD format (to match frontend logic)
      const todayDateObj = new Date();
      // Adjust to the user's timezone implicitly by using local Date methods
      const tzOffset = todayDateObj.getTimezoneOffset() * 60000;
      const localISOTime = new Date(todayDateObj.getTime() - tzOffset)
        .toISOString()
        .split("T")[0];

      const formattedDate = todayDateObj.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });

      for (const profile of filteredProfiles) {
        const username = profile.username;
        const player = profile.player_data || {};
        const email = profile.email || player.email;

        if (!email) continue;

        const { data: quests, error: questError } = await supabase
          .from("user_quests")
          .select("quest_data")
          .eq("username", username);

        const { data: goalsRes, error: goalsError } = await supabase
          .from("user_goals")
          .select("goal_data")
          .eq("username", username);

        if (questError || !quests) continue;

        const allUserQuests = quests.map((q) => q.quest_data);
        const allUserGoals = goalsRes ? goalsRes.map((g) => g.goal_data) : [];

        const achievedTasks = [];
        const failedTasks = [];
        let totalSpeedMs = 0;
        let validSpeedCount = 0;

        for (const quest of allUserQuests) {
          // Exactly matching how Analytics.tsx parses the date for completions
          if (quest.status === "COMPLETED" && quest.completedAt) {
            const completedDateStr = new Date(quest.completedAt - tzOffset)
              .toISOString()
              .split("T")[0];
            if (completedDateStr === localISOTime) {
              achievedTasks.push(quest);
              if (quest.startTime) {
                const speed = quest.completedAt - quest.startTime;
                if (speed > 0) {
                  totalSpeedMs += speed;
                  validSpeedCount++;
                }
              }
            }
          }
          // Exactly matching how Analytics.tsx parses the date for failures
          else if (quest.status === "FAILED") {
            const failureTime =
              quest.completedAt || quest.startTime || quest.deadline;
            if (failureTime) {
              const failedDateStr = new Date(failureTime - tzOffset)
                .toISOString()
                .split("T")[0];
              if (failedDateStr === localISOTime) {
                failedTasks.push(quest);
              }
            }
          }
        }

        const stats = {
          achieved: achievedTasks.length,
          failed: failedTasks.length,
          avgSpeedMinutes:
            validSpeedCount > 0
              ? Math.round(totalSpeedMs / validSpeedCount / 60000)
              : 0,
          behavior: player.behaviorStats || {
            discipline: 50,
            consistency: 50,
            focus: 50,
          },
        };

        const unattendedGoals = allUserGoals.filter((g) => !g.completed);
        const achievedGoals = allUserGoals.filter((g) => g.completed);

        let systemSuggestion =
          "Maintain discipline and tackle pending directives.";
        if (ai) {
          try {
            const prompt = `
             You are the SYSTEM LOGIC ENGINE for the EXECUTION CABAL.
             (Do NOT refer to yourself as an AI. You are the System.)
             Today's Date: ${formattedDate}
             Agent: ${username}
             
             Analyze this user's daily performance exactly based on this real-time data:
             Tasks Completed Today (${localISOTime}): ${stats.achieved}
             Tasks Failed Today (${localISOTime}): ${stats.failed}
             Average Time to Complete (Minutes): ${stats.avgSpeedMinutes}
             
             Crucially, correlate their performance today with their current RPG Behavioral Stats:
             Discipline: ${stats.behavior.discipline}/100
             Consistency: ${stats.behavior.consistency}/100
             Focus: ${stats.behavior.focus}/100
             
             Tasks Completed Titles: ${achievedTasks.map((t) => t.title).join(", ") || "None"}
             Tasks Failed Titles: ${failedTasks.map((t) => t.title).join(", ") || "None"}

             Agent's Actively Pending (Unattended) Strategic Goals: ${unattendedGoals.map((g) => g.title).join(", ") || "None"}
             
             Instructions for the report (3-5 sentences max, brutal corporate-military style):
             1. Explicitly mention how their RPG Behavioral Stats (Discipline/Consistency/Focus) are directly causing their current completion/failure ratio.
             2. Assess if the tasks they completed today were actually connected/relevant to achieving their Pending Goals. Call them out if they are busy but not moving closer to their Strategic Goals.
             3. If they are doing well (high completion, low failure), don't just say they are productive—tell them exactly how they can become *even more* productive and push harder.
             4. If they verified a lot of tasks today, provide a "Wisdom Nugget" or "Knowledge Nugget" at the end to help them set and program their next day effectively.
             `;
            const response = await ai.models.generateContent({
              model: "gemini-2.5-flash",
              contents: prompt,
            });
            if (response.text) {
              systemSuggestion = response.text;
              console.log(
                `[ReportService] Generated Suggestion for ${username}:\n${systemSuggestion}`
              );
            }
          } catch (e) {
            console.error("[ReportService] AI Suggestion Failed:", e);
          }
        }

        await emailService.sendDailyReportEmail(
          email,
          username,
          stats,
          achievedTasks,
          failedTasks,
          systemSuggestion,
          formattedDate
        );

        // Add 2000ms delay to prevent Gemini API Rate Limits (429) when looping past multiple profiles
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      console.log("[ReportService] Finished daily report generation.");
      return { success: true, message: "Reports sent successfully" };
    } catch (error) {
      console.error("[ReportService] Fatal Error generating reports:", error);
      return { success: false, error: error.message };
    }
  },
};
