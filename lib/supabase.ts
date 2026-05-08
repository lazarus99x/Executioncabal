import { createClient } from "@supabase/supabase-js";
import {
  Player,
  Quest,
  Goal,
  Client,
  ChatMessage,
  SystemLog,
  Transaction,
  StoreItem,
  StoreCategory,
} from "../types";
import { INITIAL_PLAYER } from "../constants";

// Hardcoded keys as requested for direct connection
const SUPABASE_URL = "https://tufltrankwmsxbuljosq.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1Zmx0cmFua3dtc3hidWxqb3NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyODU5ODEsImV4cCI6MjA4Mjg2MTk4MX0.aILV6q03nMdIBorL1p-DRXRW12TvkNXlN2t8LJ8ONlk";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- Multi-Table Syncing Logic ---

export interface GameState {
  player: Player;
  quests: Quest[];
  goals: Goal[];
  clients: Client[];
  chatMessages: ChatMessage[];
  transactions: Transaction[];
}

/**
 * Loads the full game state by fetching from all 5 relational tables.
 * Returns null ONLY if the user does not exist (New User).
 * Throws error if network/DB fails (Safe Mode).
 */
export const loadGameState = async (
  username: string
): Promise<GameState | null> => {
  // 1. Fetch Profile (Including Email Column)
  // Use select('*') to be robust against missing columns in the DB schema
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .maybeSingle();

  if (profileError) {
    // DETECT NETWORK ERROR or FETCH FAILURE
    if (
      profileError.message &&
      (profileError.message.includes("fetch") ||
        profileError.message.includes("network") ||
        profileError.message.includes("connection"))
    ) {
      console.warn(
        "[Supabase] Network error detected. Proceeding to offline mode."
      );
      // Throw a specific error that App.tsx can recognize as "Network Issue" rather than "Crash"
      throw new Error("Network Error");
    }
    console.error("Profile Load Error:", profileError.message || profileError);
    throw new Error(
      `Failed to load profile: ${profileError.message || "Unknown DB Error"}`
    );
  }

  if (!profile) return null; // User doesn't exist yet

  try {
    // 2. Fetch Related Entities in Parallel
    const [questsRes, goalsRes, clientsRes, chatsRes, txRes] =
      await Promise.all([
        supabase
          .from("user_quests")
          .select("quest_data")
          .eq("username", username),
        supabase
          .from("user_goals")
          .select("goal_data")
          .eq("username", username),
        supabase
          .from("user_clients")
          .select("client_data")
          .eq("username", username),
        supabase
          .from("user_chats")
          .select("message_data")
          .eq("username", username),
        supabase
          .from("transactions")
          .select("*")
          .eq("username", username)
          .order("created_at", { ascending: false }),
      ]);

    const quests = questsRes.data?.map((r: any) => r.quest_data) || [];
    const goals = goalsRes.data?.map((r: any) => r.goal_data) || [];
    const clients = clientsRes.data?.map((r: any) => r.client_data) || [];
    const chats = chatsRes.data?.map((r: any) => r.message_data) || [];
    const transactions = txRes.data || [];

    const rawPlayer = profile.player_data || {};

    // Merge with defaults to handle new schema fields (like activeEffects, boughtXp)
    // This ensures old users get new fields initialized automatically
    const playerWithEmail = {
      ...INITIAL_PLAYER, // Start with complete defaults
      ...rawPlayer, // Override with stored data
      name: username, // FORCE NAME TO MATCH USERNAME (Single Source of Truth)
      email: profile.email || rawPlayer.email || "",
      // Explicitly ensure arrays are initialized
      activeEffects: rawPlayer.activeEffects || [],
      inventory: rawPlayer.inventory || [], // NEW: Ensure inventory is array
      // Ensure deeply nested stats exist if partial
      stats: { ...INITIAL_PLAYER.stats, ...(rawPlayer.stats || {}) },
    };

    return {
      player: playerWithEmail,
      quests: quests,
      goals: goals,
      clients: clients,
      chatMessages: chats,
      transactions: transactions,
    };
  } catch (error) {
    console.error("Load Game Detail Error:", error);
    throw error; // Propagate error to prevent partial state save
  }
};

/**
 * Saves the game state by upserting into respective tables.
 * This handles the "Syncing" process.
 */
export const saveGameState = async (username: string, state: GameState) => {
  const timestamp = new Date().toISOString();

  // Safety check: Don't save if player data is critically missing
  if (!state.player || !state.player.name) {
    console.warn("Attempted to save empty player state. Aborted.");
    return;
  }

  // 1. Update Profile (Player Stats)
  const profilePromise = supabase
    .from("profiles")
    .update({
      player_data: state.player,
      updated_at: timestamp,
    })
    .eq("username", username);

  // 2. Upsert Quests (Bulk)
  const questRows = state.quests.map((q) => ({
    id: q.id,
    username: username,
    quest_data: q,
    updated_at: timestamp,
  }));
  const questsPromise =
    questRows.length > 0
      ? supabase.from("user_quests").upsert(questRows)
      : Promise.resolve();

  // 3. Upsert Goals (Bulk)
  const goalRows = state.goals.map((g) => ({
    id: g.id,
    username: username,
    goal_data: g,
    updated_at: timestamp,
  }));
  const goalsPromise =
    goalRows.length > 0
      ? supabase.from("user_goals").upsert(goalRows)
      : Promise.resolve();

  // 4. Upsert Clients (Bulk)
  const clientRows = state.clients.map((c) => ({
    id: c.id,
    username: username,
    client_data: c,
    updated_at: timestamp,
  }));
  const clientsPromise =
    clientRows.length > 0
      ? supabase.from("user_clients").upsert(clientRows)
      : Promise.resolve();

  // 5. Upsert Chats (Bulk)
  const chatRows = state.chatMessages.slice(-50).map((m) => ({
    id: m.id,
    username: username,
    message_data: m,
    updated_at: timestamp,
  }));
  const chatsPromise =
    chatRows.length > 0
      ? supabase.from("user_chats").upsert(chatRows)
      : Promise.resolve();

  // Execute all operations
  try {
    await Promise.all([
      profilePromise,
      questsPromise,
      goalsPromise,
      clientsPromise,
      chatsPromise,
    ]);
  } catch (e) {
    console.warn("Save Game State Partial Failure (Ignored for offline mode)");
  }
};

// --- ATOMIC OPERATIONS (Fixes for Deletion/Updates) ---

export const savePlayerData = async (username: string, player: Player) => {
  // Ensure name inside JSON matches username key to prevent drift
  const syncedPlayer = { ...player, name: username };
  try {
    await supabase
      .from("profiles")
      .update({
        player_data: syncedPlayer,
        // Removed is_banned column update
        updated_at: new Date().toISOString(),
      })
      .eq("username", username);
  } catch (e: any) {
    // Silently log warning, do not crash app flow
    console.warn("Save Player Data Failed (Network?):", e.message);
  }
};

export const updateUserEmail = async (username: string, email: string) => {
  const { error } = await supabase
    .from("profiles")
    .update({
      email: email,
      updated_at: new Date().toISOString(),
    })
    .eq("username", username);

  if (error) throw error;
};

// --- FULL IDENTITY MIGRATION ---
export const renameUser = async (
  oldUsername: string,
  newUsername: string,
  onProgress?: (step: string) => void
) => {
  const log = (msg: string) => {
    console.log(`[Migration] ${msg}`);
    if (onProgress) onProgress(msg);
  };

  log(`Initializing Identity Transfer: ${oldUsername} -> ${newUsername}`);

  // 1. Check Availability
  log("Checking Codename Availability...");
  const { data: existing } = await supabase
    .from("profiles")
    .select("username")
    .eq("username", newUsername)
    .maybeSingle();
  if (existing) throw new Error(`Codename '${newUsername}' is already taken.`);

  // 2. Fetch Old Profile Data
  log("Acquiring Source Data...");
  const { data: oldProfile, error: fetchError } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", oldUsername)
    .single();
  if (fetchError || !oldProfile)
    throw new Error("Could not locate source identity.");

  // 3. Create NEW Profile (Clone)
  log("Forging New Identity...");
  const newPlayerData = { ...oldProfile.player_data, name: newUsername };

  // CONSTRUCT PAYLOAD - MINIMAL SAFE SET
  const insertPayload: any = {
    username: newUsername,
    password: oldProfile.password,
    player_data: newPlayerData,
    // created_at is omitted (DB Auto)
  };

  // Safely add email if exists
  if (oldProfile.email) {
    insertPayload.email = oldProfile.email;
  }

  const { error: createError } = await supabase
    .from("profiles")
    .insert([insertPayload]);

  if (createError) throw new Error(`Migration Failed: ${createError.message}`);

  // 4. Migrate Related Records (Update Foreign Keys)
  const tables = [
    { name: "user_quests", label: "Directives" },
    { name: "user_goals", label: "Objectives" },
    { name: "user_clients", label: "Clients" },
    { name: "user_chats", label: "Logs" },
    { name: "transactions", label: "Financials" },
    { name: "system_logs", label: "History" },
  ];

  for (const table of tables) {
    log(`Migrating ${table.label}...`);
    const { error: migrateError } = await supabase
      .from(table.name)
      .update({ username: newUsername })
      .eq("username", oldUsername);

    if (migrateError) {
      console.error(`Error migrating table ${table.name}:`, migrateError);
      log(`WARNING: Failed to migrate ${table.label}. Continuing...`);
    }
  }

  // 5. Delete OLD Profile
  log("Deleting Old Identity...");
  const { error: deleteError } = await supabase
    .from("profiles")
    .delete()
    .eq("username", oldUsername);
  if (deleteError) {
    console.error("Warning: Old profile ghost remains.", deleteError);
    log("Warning: Source data residue remains.");
  }

  log("Identity Transfer Complete.");
};

export const upsertQuest = async (quest: Quest, username: string) => {
  try {
    await supabase.from("user_quests").upsert({
      id: quest.id,
      username: username,
      quest_data: quest,
      updated_at: new Date().toISOString(),
    });
  } catch (e) {
    console.warn("Quest Sync Failed");
  }
};

export const deleteQuest = async (id: string) => {
  try {
    await supabase.from("user_quests").delete().eq("id", id);
  } catch (e) {
    console.warn("Quest Delete Failed");
  }
};

export const upsertGoal = async (goal: Goal, username: string) => {
  try {
    await supabase.from("user_goals").upsert({
      id: goal.id,
      username: username,
      goal_data: goal,
      updated_at: new Date().toISOString(),
    });
  } catch (e) {
    console.warn("Goal Sync Failed");
  }
};

export const deleteGoal = async (id: string) => {
  try {
    await supabase.from("user_goals").delete().eq("id", id);
  } catch (e) {
    console.warn("Goal Delete Failed");
  }
};

export const upsertClient = async (client: Client, username: string) => {
  try {
    await supabase.from("user_clients").upsert({
      id: client.id,
      username: username,
      client_data: client,
      updated_at: new Date().toISOString(),
    });
  } catch (e) {
    console.warn("Client Sync Failed");
  }
};

export const deleteClient = async (id: string) => {
  try {
    await supabase.from("user_clients").delete().eq("id", id);
  } catch (e) {
    console.warn("Client Delete Failed");
  }
};

// --- ADMIN & LOGGING FUNCTIONS ---

export const fetchAllProfiles = async () => {
  // Use select('*') to be robust against missing columns.
  const { data, error } = await supabase.from("profiles").select("*");

  if (error) {
    console.error("Error fetching profiles:", error.message || error);
    return [];
  }

  // Sort by XP (High to Low)
  const sortedData = (data || []).sort((a: any, b: any) => {
    const xpA = a.player_data?.currentXp || 0;
    const xpB = b.player_data?.currentXp || 0;
    return xpB - xpA;
  });

  // Map rows
  return sortedData.map((row: any) => {
    const playerData = row.player_data || {};
    // Robust Ban Check: Check ONLY JSON since column is unreliable
    const isBanned = playerData.isBanned === true;

    return {
      id: row.username,
      username: row.username || playerData.name || "Unknown",
      email: row.email || "", // Include Email
      rank: playerData.rank || "E",
      currentXp:
        typeof playerData.currentXp === "number" ? playerData.currentXp : 0,
      isBanned: isBanned,
      level: playerData.level || 1,
      joinedAt: row.created_at || new Date().toISOString(),
      lastActiveTimestamp: playerData.lastActiveTimestamp || 0, // Ensure timestamp exists
      ...playerData,
    };
  });
};

/**
 * Updates a user's status using their Username.
 * Enhanced to handle fetch errors gracefully.
 */
export const updateUserStatus = async (
  username: string,
  updates: Partial<Player>
) => {
  if (!username) {
    console.warn("Skipping update: No username provided");
    return null;
  }

  try {
    // 1. Fetch current data first to ensure we don't wipe existing fields
    const { data: currentData, error: fetchError } = await supabase
      .from("profiles")
      .select("player_data")
      .eq("username", username)
      .single();

    if (fetchError) {
      // If network failure (FetchError), throw to outer catch for silent handling
      // We intentionally do NOT log fetch errors here to avoid console spam during network blips
      if (
        fetchError.message?.includes("fetch") ||
        fetchError.message?.includes("network")
      ) {
        return null;
      }
      console.warn("Fetch Error during update (Ignored):", fetchError.message);
      return null;
    }

    if (!currentData) {
      return null;
    }

    // 2. Merge Updates
    const existingPlayer = currentData.player_data || {};
    const mergedPlayer = { ...existingPlayer, ...updates };

    // Prepare columns to update
    const dbUpdates: any = {
      player_data: mergedPlayer,
      updated_at: new Date().toISOString(),
    };

    if ("email" in updates) {
      dbUpdates.email = updates.email;
    }

    // 3. Perform Update
    const { error: updateError } = await supabase
      .from("profiles")
      .update(dbUpdates)
      .eq("username", username);

    if (updateError) {
      if (
        updateError.message?.includes("fetch") ||
        updateError.message?.includes("network")
      ) {
        return null;
      }
      console.warn("Update Write Error (Ignored):", updateError.message);
      return null;
    }

    return mergedPlayer;
  } catch (err: any) {
    // Catch all remaining errors silently
    return null;
  }
};

// --- LOGS ---
export const logSystemEvent = async (
  log: Omit<SystemLog, "id" | "created_at">
) => {
  try {
    await supabase.from("system_logs").insert([log]);
  } catch (e) {
    // Silent fail for logs
  }
};

export const fetchSystemLogs = async (): Promise<SystemLog[]> => {
  const { data } = await supabase
    .from("system_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  return data || [];
};

// --- TRANSACTIONS ---
export const createTransaction = async (
  tx: Omit<Transaction, "id" | "created_at">
) => {
  try {
    const { metadata, ...dbTx } = tx; // Strip metadata to avoid schema mismatch 400 error
    await supabase.from("transactions").insert([dbTx]);
  } catch (e) {
    console.warn("Transaction log failed", e);
  }
};

export const fetchTransactions = async (
  username?: string
): Promise<Transaction[]> => {
  let query = supabase
    .from("transactions")
    .select("*")
    .order("created_at", { ascending: false });
  if (username) {
    query = query.eq("username", username);
  }
  const { data } = await query;
  return data || [];
};

export const updateTransactionStatus = async (
  id: string,
  status: "APPROVED" | "REJECTED"
) => {
  try {
    await supabase.from("transactions").update({ status }).eq("id", id);
  } catch (e) {
    console.warn("Transaction Update Failed");
  }
};

// --- STORE & CATEGORIES ---
export const fetchStoreCategories = async (): Promise<StoreCategory[]> => {
  try {
    const { data, error } = await supabase.from("store_categories").select("*");
    if (error) throw error;
    return data || [];
  } catch (e) {
    // Fallback defaults
    return [
      { id: "CONSUMABLE", name: "Consumables" },
      { id: "EQUIPMENT", name: "Equipment" },
      { id: "SPECIAL", name: "Special" },
      { id: "KNOWLEDGE", name: "Knowledge" },
    ];
  }
};

export const createStoreCategory = async (category: StoreCategory) => {
  try {
    await supabase.from("store_categories").upsert(category);
  } catch (e) {}
};

export const deleteStoreCategory = async (id: string) => {
  try {
    await supabase.from("store_categories").delete().eq("id", id);
  } catch (e) {}
};

export const fetchSystemStoreItems = async (): Promise<StoreItem[]> => {
  try {
    const { data } = await supabase
      .from("system_store")
      .select("*")
      .eq("is_active", true);
    return (
      data?.map((d) => ({
        id: d.id,
        name: d.name,
        description: d.description,
        cost: d.cost,
        type: d.type,
        image_url: d.image_url,
        content_link: d.content_link,
      })) || []
    );
  } catch (e) {
    return [];
  }
};

export const upsertStoreItem = async (item: StoreItem) => {
  try {
    const { id, name, description, cost, type, image_url, content_link } = item;
    await supabase.from("system_store").upsert({
      id,
      name,
      description,
      cost,
      type,
      image_url,
      content_link,
      is_active: true,
    });
  } catch (e) {}
};

export const deleteStoreItem = async (id: string) => {
  try {
    await supabase
      .from("system_store")
      .update({ is_active: false })
      .eq("id", id);
  } catch (e) {}
};
