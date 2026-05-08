import { createClient } from "@supabase/supabase-js";
import { emailService } from "./emailService.js";

// Initialize Supabase safely for both local and serverless/Vercel environments
const SUPABASE_URL =
  process.env.SUPABASE_URL || "https://tufltrankwmsxbuljosq.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

let supabase = null;
if (SUPABASE_ANON_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
  console.warn(
    "[Reminder Service] Warning: SUPABASE_ANON_KEY is missing. Database operations will fail."
  );
}

export const reminderService = {
  /**
   * Scans all profiles and quests to send reminders
   */
  processReminders: async () => {
    console.log("[ReminderService] Starting operation scan...");

    if (!supabase) {
      console.error(
        "[ReminderService] Aborting: Supabase client not initialized (Missing API Keys)."
      );
      return;
    }

    try {
      // 1. Fetch all profiles
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("*");

      if (profileError) throw profileError;
      if (!profiles || profiles.length === 0) {
        console.log("[ReminderService] No profiles found to scan.");
        return;
      }

      for (const profile of profiles) {
        const username = profile.username;
        const player = profile.player_data || {};
        const email = profile.email || player.email;

        if (!email) continue;

        // --- Inactivity Check (> 24h) ---
        const lastActive = player.lastActiveTimestamp || 0;
        const hoursInactive = (Date.now() - lastActive) / (1000 * 60 * 60);

        if (hoursInactive > 24 && !player.inactivityReminderSent) {
          // Fetch their quests for the report
          const { data: qData } = await supabase
            .from("user_quests")
            .select("quest_data")
            .eq("username", username);

          const activeQuests =
            qData
              ?.map((r) => r.quest_data)
              .filter((q) => q.status === "IDLE" || q.status === "RUNNING") ||
            [];

          const success = await emailService.sendInactivityAlert(
            email,
            username,
            activeQuests
          );
          if (success) {
            // Update player record to mark as sent
            await supabase
              .from("profiles")
              .update({
                player_data: { ...player, inactivityReminderSent: true },
              })
              .eq("username", username);
          }
        } else if (hoursInactive <= 24 && player.inactivityReminderSent) {
          // Reset if they came back
          await supabase
            .from("profiles")
            .update({
              player_data: { ...player, inactivityReminderSent: false },
            })
            .eq("username", username);
        }

        // --- Deadline Reminders ---
        const { data: quests, error: questError } = await supabase
          .from("user_quests")
          .select("*")
          .eq("username", username);

        if (questError || !quests) continue;

        const allUserQuests = quests.map((r) => r.quest_data);
        const activeQuestsReport = allUserQuests.filter(
          (q) => q.status === "IDLE" || q.status === "RUNNING"
        );

        for (const qRow of quests) {
          const quest = qRow.quest_data;

          if (quest.status !== "IDLE" && quest.status !== "RUNNING") continue;
          if (!quest.deadline) continue;

          const timeLeftMs = quest.deadline - Date.now();
          const timeLeftMins = Math.floor(timeLeftMs / (1000 * 60));

          // 1 Hour Reminder
          if (
            timeLeftMins <= 60 &&
            timeLeftMins > 30 &&
            !quest.oneHourReminderSent
          ) {
            const success = await emailService.sendDeadlineReminder(
              email,
              username,
              quest,
              timeLeftMins,
              activeQuestsReport
            );
            if (success) {
              await supabase
                .from("user_quests")
                .update({
                  quest_data: { ...quest, oneHourReminderSent: true },
                })
                .eq("id", qRow.id);
            }
          }

          // 30 Min Reminder
          if (
            timeLeftMins <= 30 &&
            timeLeftMins > 0 &&
            !quest.thirtyMinReminderSent
          ) {
            const success = await emailService.sendDeadlineReminder(
              email,
              username,
              quest,
              timeLeftMins,
              activeQuestsReport
            );
            if (success) {
              await supabase
                .from("user_quests")
                .update({
                  quest_data: { ...quest, thirtyMinReminderSent: true },
                })
                .eq("id", qRow.id);
            }
          }
        }
      }
      console.log("[ReminderService] Operation scan complete.");
    } catch (error) {
      console.error("[ReminderService] Fatal Error during scan:", error);
      throw error; // Rethrow so the API route can catch it
    }
  },
};
