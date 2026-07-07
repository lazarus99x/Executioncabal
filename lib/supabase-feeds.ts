import { supabase } from "./supabase";
import { ExecutionActivity, Squad } from "../types";

// --- FEED ACTIVITIES (Persisted to Supabase) ---

export const saveFeedActivityToDB = async (activity: ExecutionActivity) => {
  try {
    const { error } = await supabase.from("feed_activities").insert({
      id: activity.id,
      action_type: activity.actionType,
      message: activity.message,
      username: activity.username,
      rank: activity.rank || 'E',
      timestamp: activity.timestamp,
      squad_id: activity.squadId || null,
      task_title: activity.taskTitle || null,
      image_url: activity.imageUrl || null,
    });
    if (error) console.warn("Feed save error:", error.message);
  } catch (e: any) {
    console.warn("Feed save failed (network):", e.message);
  }
};

export const deleteFeedActivityFromDB = async (id: string) => {
  try {
    await supabase.from("feed_activities").delete().eq("id", id);
  } catch (e: any) {
    console.warn("Feed delete failed:", e.message);
  }
};

export const loadFeedFromDB = async (): Promise<ExecutionActivity[]> => {
  try {
    const { data, error } = await supabase
      .from("feed_activities")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(200);
    if (error || !data) return [];
    return (data as any[]).map((r: any) => ({
      id: r.id,
      actionType: r.action_type,
      message: r.message,
      username: r.username,
      rank: r.rank || 'E',
      timestamp: r.timestamp,
      squadId: r.squad_id,
      taskTitle: r.task_title,
      imageUrl: r.image_url,
    }));
  } catch {
    return [];
  }
};

// --- SQUADS (Teams) Persisted to Supabase ---

export const saveSquadsToDB = async (squads: Squad[]) => {
  try {
    const rows = squads.map((s) => ({
      id: s.id,
      squad_data: s,
      updated_at: new Date().toISOString(),
    }));
    if (rows.length > 0) {
      await supabase.from("squads").upsert(rows);
    }
  } catch (e: any) {
    console.warn("Squads save failed:", e.message);
  }
};

export const loadSquadsFromDB = async (): Promise<Squad[]> => {
  try {
    const { data } = await supabase.from("squads").select("*");
    return ((data || []) as any[]).map((r: any) => r.squad_data as Squad);
  } catch {
    return [];
  }
};

// --- SUPPORT TICKETS Persisted to Supabase ---

export const saveTicketsToDB = async (tickets: any[]) => {
  try {
    const rows = tickets.map((t: any) => ({
      id: t.id,
      ticket_data: t,
      updated_at: new Date().toISOString(),
    }));
    if (rows.length > 0) {
      await supabase.from("support_tickets").upsert(rows);
    }
  } catch (e: any) {
    console.warn("Tickets save failed:", e.message);
  }
};

export const loadTicketsFromDB = async (): Promise<any[]> => {
  try {
    const { data } = await supabase.from("support_tickets").select("*");
    return ((data || []) as any[]).map((r: any) => r.ticket_data);
  } catch {
    return [];
  }
};

export const clearFeedForUser = async (username: string) => {
  try {
    await supabase.from("feed_activities").delete().eq("username", username);
  } catch (e: any) {
    console.warn("clearFeedForUser failed:", e.message);
  }
};

export const clearSquadsForUser = async (username: string) => {
  try {
    await supabase
      .from("squads")
      .delete()
      .filter("squad_data->>adminName", "eq", username);
  } catch (e: any) {
    console.warn("clearSquadsForUser failed:", e.message);
  }
};

export const clearTicketsForUser = async (username: string) => {
  try {
    await supabase
      .from("support_tickets")
      .delete()
      .filter("ticket_data->>username", "eq", username);
  } catch (e: any) {
    console.warn("clearTicketsForUser failed:", e.message);
  }
};

// --- KANBAN BOARD Persisted to Supabase ---

export const saveKanbanCardsToDB = async (cards: any[], username: string) => {
  try {
    const rows = cards.map((c: any) => ({
      id: c.id,
      username,
      card_data: c,
      updated_at: new Date().toISOString(),
    }));
    if (rows.length > 0) {
      await supabase.from("kanban_cards").upsert(rows, { onConflict: "id" });
    }
  } catch (e: any) {
    console.warn("Kanban save failed:", e.message);
  }
};

export const loadKanbanCardsFromDB = async (username: string): Promise<any[]> => {
  try {
    const { data } = await supabase
      .from("kanban_cards")
      .select("*")
      .eq("username", username);
    return ((data || []) as any[]).map((r: any) => r.card_data);
  } catch {
    return [];
  }
};