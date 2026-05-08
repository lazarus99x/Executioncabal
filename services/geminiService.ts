import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import {
  Quest,
  Rank,
  TaskType,
  TaskStatus,
  Goal,
  Player,
  PlayerStats,
  Client,
  ProposedTaskPlan,
} from "../types";

// Safely handle missing API key for build environments
const apiKey =
  (import.meta as any).env?.VITE_GEMINI_API_KEY ||
  process.env.GEMINI_API_KEY ||
  "";
const ai = new GoogleGenAI({ apiKey });

// Helper to determine rewards based on Rank
const getRewards = (rank: Rank) => {
  const isHighRank = [Rank.A, Rank.S, Rank.X].includes(rank);
  // UNIVERSAL XP ECONOMY: Rewards capped.
  // Standard: 50 XP. High Rank Max: 100 XP.
  return {
    xpReward: isHighRank ? 100 : 50,
    penaltyXP: 100,
  };
};

// Retry Helper
async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (retries > 0) {
      await new Promise((res) => setTimeout(res, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw err;
  }
}

// 1. Generate New Quest (Context-Aware)
export const generateQuestFromInput = async (
  userInput: string,
  rank: Rank,
  context?: {
    goals?: Goal[];
    clients?: Client[];
    recentHistory?: Quest[];
  },
  startTimeISO?: string,
  deadlineISO?: string
): Promise<Quest | null> => {
  if (!apiKey) return null;
  try {
    const { xpReward, penaltyXP } = getRewards(rank);

    // Construct Context String
    let contextStr = `Context: "EXECUTION CABAL" system. Ruthless efficiency.`;
    if (context?.goals && context.goals.length > 0) {
      contextStr += `\nHigh-Level Goals: ${context.goals.map((g) => g.title).join(", ")}.`;
    }
    if (context?.clients && context.clients.length > 0) {
      contextStr += `\nKey Clients: ${context.clients.map((c) => c.name).join(", ")}.`;
    }
    if (context?.recentHistory && context.recentHistory.length > 0) {
      contextStr += `\nRecent Activity: ${context.recentHistory
        .slice(0, 3)
        .map((q) => q.title)
        .join(", ")}.`;
    }

    const currentTime = new Date().toISOString();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", // Reverted to 1.5 due to Free Tier 429 limits on 2.0
      contents: `
      Current Local Time for Reference: ${currentTime}
      User Input: "${userInput}". 

      ${contextStr}
      
      Task: Generate a single, simple, clear, and actionable directive based EXACTLY on the user's input.
      - DO NOT overcomplicate it or add complex, long-winded descriptions.
      - DO NOT change what the user assigned. Tell them exactly what they asked to do, just formatted correctly.
      - Parse any explicitly mentioned start time and deadline from the user input and return them as 'startTime' and 'deadline' using standard ISO 8601 format. If none are specified, omit them.
      - If the input is specific, just return it as a direct command without adding extra work.
      - Tone: Brutal, Efficient, Direct.
      
      Rank: ${rank}.
      Language: Simple, direct business English. No jargon.
      
      CRITICAL VERIFICATION RULE:
      The 'requirements' array MUST explicitly state the physical proof required. 
      Examples: "Photo of gym equipment", "Screenshot of sent email", "Photo of completed page".
      Vague requirements like "Do it" are BANNED.
      
      Output JSON only.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            type: { type: Type.STRING, enum: ["MAIN", "SIDE"] },
            difficulty: {
              type: Type.STRING,
              enum: ["E", "D", "C", "B", "A", "X"],
            },
            durationMinutes: {
              type: Type.INTEGER,
              description: "Estimated effort in minutes",
            },
            startTime: {
              type: Type.STRING,
              description: "ISO Date String exactly as Requested Start Time",
            },
            deadline: {
              type: Type.STRING,
              description: "ISO Date String exactly as Requested Deadline",
            },
            requirements: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: [
            "title",
            "description",
            "difficulty",
            "requirements",
            "durationMinutes",
          ],
        },
      },
    });

    if (!response.text) return null;
    const data = JSON.parse(response.text);

    return {
      id: crypto.randomUUID(),
      title: data.title,
      description: data.description,
      type: data.type as TaskType,
      difficulty: data.difficulty as Rank,
      xpReward: xpReward,
      penaltyXP: penaltyXP,
      status: TaskStatus.IDLE,
      requirements: data.requirements,
      durationMinutes: data.durationMinutes,
      startTime: startTimeISO
        ? new Date(startTimeISO).getTime()
        : data.startTime
          ? new Date(data.startTime).getTime()
          : undefined,
      deadline: deadlineISO
        ? new Date(deadlineISO).getTime()
        : data.deadline
          ? new Date(data.deadline).getTime()
          : Date.now() + 24 * 60 * 60 * 1000,
      verificationAttempts: 0,
      isPinned: false,
    };
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    return null;
  }
};

// 2. Chat with System Administrator (Updated for active Quests awareness)
export const chatWithSystem = async (
  history: { role: string; parts: { text: string }[] }[],
  newMessage: string,
  goals: Goal[] = [],
  quests: Quest[] = [],
  player?: Player
): Promise<{
  text: string;
  quest?: Quest;
  proposedPlan?: ProposedTaskPlan;
}> => {
  if (!apiKey)
    return { text: "[SYSTEM ERROR] API Key missing. Check configuration." };

  try {
    const goalsContext =
      goals.length > 0
        ? `CURRENT STRATEGIC GOALS:\n${goals.map((g) => `- ${g.title} (Deadline: ${g.deadline ? new Date(g.deadline).toLocaleDateString() : "None"}): ${g.notes}`).join("\n")}`
        : "NO ACTIVE STRATEGIC GOALS.";

    const questsContext =
      quests.length > 0
        ? `CURRENT ACTIVE TASKS (SOURCE OF TRUTH):\n${quests.map((q) => `- ${q.title} [${q.status}] (${q.difficulty}-Rank) | Deadline: ${q.deadline ? new Date(q.deadline).toLocaleString() : "NONE"}`).join("\n")}`
        : "NO ACTIVE TASKS.";

    const playerContext = player
      ? `USER PERFORMANCE: Rank ${player.rank}, Level ${player.level}. Stats: Discipline ${player.behaviorStats?.discipline}%, Focus ${player.behaviorStats?.focus}%, Consistency ${player.behaviorStats?.consistency}%. Tasks Completed: ${player.totalTasksCompleted}. Use this past performance data to adjust their schedule: If stats are low, space tasks out more. If high, they can handle tighter deadlines.`
      : "USER PERFORMANCE: Unknown.";

    const chat = ai.chats.create({
      model: "gemini-2.5-flash",
      history: history,
      config: {
        systemInstruction: `
          You are the SYSTEM ADMINISTRATOR of the EXECUTION CABAL.
          User: Agent (Rank ${player?.rank || "Unknown"}).
          Tone: Ruthless, strict, authoritative.
          Language Style: Use simple, clear, and direct English. Short sentences. No complex vocabulary, archaic words, or "fantasy" roleplay styles. Be relatable to modern productivity. Be concise.
          
          === SYSTEM STATE (LIVE DATA) ===
          ${goalsContext}
          
          ${questsContext}

          ${playerContext}
          ================================
          
          CRITICAL PROTOCOL RULES:
          1. The "CURRENT ACTIVE TASKS" list above is the **ONLY** valid list of tasks. This is the absolute Source of Truth.
          2. **IGNORE** any tasks mentioned in the chat history if they do not appear in the "CURRENT ACTIVE TASKS" list. Assume they have been **DELETED** or **ARCHIVED**.
          3. DO NOT ask about progress on tasks that are missing from the list.
          4. If the list is empty, say there are no active tasks. Do not hallucinate tasks from previous messages.
          5. If the user refers to a deleted task, inform them it is no longer in the active registry.
          6. Push the user to complete the tasks currently in the list or add new ones if empty.

          KGIS PROTOCOL (SINGLE TASK):
          If the user explicitly asks to "Add a quest" or "Create a task" for a SINGLE item:
          1. Acknowledge in text.
          2. APPEND JSON wrapped in |||JSON_START||| and |||JSON_END|||.
          Structure: { "title": "string", "description": "string", "type": "MAIN" | "SIDE", "difficulty": "E" | "D" | "C" | "B" | "A" | "S", "requirements": ["string"], "durationMinutes": number, "startTime": "YYYY-MM-DDTHH:MM:SS", "deadline": "YYYY-MM-DDTHH:MM:SS" }

          TASK DUMPING PROTOCOL (MULTI-TASK PLAN):
          If the user "dumps" messy workloads, multiple ideas, or verbal rambling (e.g., "I have to do X and Y and Z"), OR if they ask for edits to a previous plan:
          1. MANDATORY ACTION: You MUST generate a structured (or updated) plan.
          2. Extract and categorize by Project.
          3. Prioritize: Urgent, High, Medium, Low (Creata/Cabal > YouTube > Teaching).
          4. Estimate XP Cost (50-200 based on effort).
          5. SCHEDULING RULES (CRITICAL):
             - You MUST STAGGER the deadlines and startTimes linearly based on Priority. 
             - DO NOT give multiple tasks the exact same deadline or startTime (e.g., if user says "finish all before 9pm", space their deadlines out linearly like 5pm, 7pm, 9pm so the countdowns indicate which to do first).
             - The highest priority task gets the earliest deadline.
             - Minimum 2-hour gap between tasks.
             - Factor in the USER PERFORMANCE: If their discipline/consistency is low (<50%), give them more generous deadlines.
             - Space them out across days if necessary based on workload.
          6. STRICT OUTPUT RULE: You MUST APPEND the JSON wrapped in |||PLAN_START||| and |||PLAN_END||| at the end of your response. 
          7. COUPLING RULE: If your text mentions "organized chaos", "processed the mess", or "prepared a plan", the JSON block is NON-NEGOTIABLE.
          Structure:
          {
            "projects": [
              {
                "name": "Project Name",
                "tasks": [
                  {
                    "title": "Title",
                    "description": "Blunt, action-focused desc",
                    "priority": "Urgent" | "High" | "Medium" | "Low",
                    "difficulty": "E" | "D" | "C" | "B" | "A" | "S",
                    "xpCost": 80,
                    "startTime": "YYYY-MM-DDTHH:MM:SS",
                    "deadline": "YYYY-MM-DDTHH:MM:SS",
                    "requirements": ["Exact physical proof required"],
                    "durationMinutes": number,
                    "dependencies": ["Task Name"]
                  }
                ]
              }
            ],
            "totalXpCost": number
          }
          
          NOTE ON START TIMES AND DEADLINES: "YYYY-MM-DDTHH:MM:SS" MUST be a real future ISO Date strictly calculated from the SYSTEM CONTEXT local time. Do not output relative strings like 'Tomorrow' or 'in 2 hours'. If the user requests a 'start time', provide it in 'startTime'. If they request 'deadline', provide it in 'deadline'.
          
          If just chatting without any task-related context, do not output JSON.
        `,
      },
    });

    // Add retry logic for message sending
    const result = await withRetry<GenerateContentResponse>(() =>
      chat.sendMessage({ message: newMessage })
    );

    let text = result.text || "System Offline.";
    let quest: Quest | undefined;

    // Parse for Single Quest
    const jsonMatch = text.match(
      /\|\|\|JSON_START\|\|\|([\s\S]*?)\|\|\|JSON_END\|\|\|/
    );
    if (jsonMatch && jsonMatch[1]) {
      try {
        const data = JSON.parse(jsonMatch[1]);
        quest = {
          id: crypto.randomUUID(),
          title: data.title,
          description: data.description,
          type: data.type || TaskType.MAIN,
          difficulty: data.difficulty || Rank.D,
          xpReward: 50,
          penaltyXP: 100,
          status: TaskStatus.IDLE,
          requirements: data.requirements || [],
          durationMinutes: data.durationMinutes || 60,
          startTime: data.startTime ? new Date(data.startTime).getTime() : undefined,
          deadline: data.deadline ? new Date(data.deadline).getTime() : Date.now() + 24 * 60 * 60 * 1000,
          verificationAttempts: 0,
          isPinned: false,
        };
        text = text.replace(jsonMatch[0], "").trim();
      } catch (e) {
        console.error("KGIS JSON Parse Error", e);
      }
    }

    // Parse for Multi-Task Plan
    let proposedPlan: ProposedTaskPlan | undefined;
    const planMatch = text.match(
      /\|\|\|PLAN_START\|\|\|([\s\S]*?)\|\|\|PLAN_END\|\|\|/
    );
    if (planMatch && planMatch[1]) {
      try {
        const data = JSON.parse(planMatch[1]);
        proposedPlan = {
          id: crypto.randomUUID(),
          projects: data.projects.map((p: any) => ({
            name: p.name,
            tasks: (p.tasks || []).map((t: any) => ({
              ...t,
              id: crypto.randomUUID(),
            })),
          })),
          totalXpCost: data.totalXpCost,
          status: "PENDING",
        };
        text = text.replace(planMatch[0], "").trim();
      } catch (e) {
        console.error("PLAN JSON Parse Error", e);
      }
    }

    return { text, quest, proposedPlan };
  } catch (err: any) {
    console.error("Chat Error Detail:", err);
    let msg = "Connection interrupted. ";
    if (err.message?.includes("API key")) msg = "Invalid API Key. ";
    if (err.message?.includes("fetch")) msg = "Network Unreachable. ";
    return {
      text: `[SYSTEM ERROR] ${msg} Ensure you are online and authorized.`,
    };
  }
};

// 3. Verify Proof (Enhanced with Stat Analysis)
export const verifyProof = async (
  taskDescription: string,
  proofText: string,
  proofImageBase64?: string | null
): Promise<{
  valid: boolean;
  message: string;
  missingCriteria?: string[];
  statUpdates?: Partial<PlayerStats>;
  isSystemError?: boolean;
}> => {
  if (!apiKey)
    return {
      valid: false,
      message: "System Offline (API Key Missing).",
      isSystemError: true,
    };

  // MANDATORY IMAGE CHECK
  if (!proofImageBase64) {
    return {
      valid: false,
      message:
        "VERIFICATION FAILED: Photographic evidence required. Text-only submissions are not accepted by the protocol.",
    };
  }

  const base64Data = proofImageBase64.split(",")[1] || proofImageBase64;
  const parts: any[] = [
    {
      inlineData: {
        mimeType: "image/png",
        data: base64Data,
      },
    },
    {
      text: `
          ROLE: You are the 'EXECUTIONER' System (System Judge). 
          TASK: Verify if the attached image is PROOF of the Mission Objective.
          
          MISSION OBJECTIVE: "${taskDescription}"
          USER NOTES: "${proofText}"
          
          3. STRICT VERIFICATION PROTOCOL:
             - SKEPTICISM REQUIRED: You are a strict auditor. Do not give the benefit of the doubt.
             - EVIDENCE MUST BE CLEAR: The image must clearly verify the task.
             - REJECT GENERIC IMAGES: If the image is too vague, dark, generic (e.g. a random wall, ceiling), or ambiguous, REJECT IT.
             - REJECT UNRELATED IMAGES: If the image does not visibly contain elements directly related to the objective "${taskDescription}", REJECT IT.
             - EXAMPLES:
               - Task: "Read Chapter 1". Image: Open book. -> VALID.
               - Task: "Read Chapter 1". Image: A selfie/face. -> INVALID.
               - Task: "Gym". Image: Gym equipment/weights. -> VALID.
               - Task: "Gym". Image: A bed or laptop. -> INVALID.

          OUTPUT JSON:
          - valid: boolean (true = Verified, false = Rejected)
          - message: A direct, short explanation. 
          - missing_criteria: List of missing elements if invalid.
          - statIncreases: Award 1 point to RELEVANT stat if valid.
        `,
    },
  ];

  // Try Primary Model (Pro)
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts },
      config: {
        // Removed thinkingConfig to reduce latency/timeout errors
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            valid: { type: Type.BOOLEAN },
            message: { type: Type.STRING },
            missing_criteria: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            statIncreases: {
              type: Type.OBJECT,
              properties: {
                strength: { type: Type.INTEGER },
                agility: { type: Type.INTEGER },
                intelligence: { type: Type.INTEGER },
                vitality: { type: Type.INTEGER },
                perception: { type: Type.INTEGER },
              },
            },
          },
          required: ["valid", "message"],
        },
      },
    });

    if (!response.text) throw new Error("Empty Response");
    const result = JSON.parse(response.text);
    return {
      valid: result.valid,
      message: result.message,
      missingCriteria: result.missing_criteria || [],
      statUpdates: result.statIncreases,
    };
  } catch (primaryError) {
    console.warn(
      "Primary Model Verification Failed, attempting fallback...",
      primaryError
    );

    // Fallback Model (Flash) - Faster, more stable
    try {
      const fallbackResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { parts },
        config: { responseMimeType: "application/json" },
      });

      if (!fallbackResponse.text) throw new Error("Fallback Empty");
      const result = JSON.parse(fallbackResponse.text);
      return {
        valid: result.valid,
        message: result.message,
        missingCriteria: result.missing_criteria || [],
        statUpdates: result.statIncreases,
      };
    } catch (finalError) {
      console.error("Verification Critical Failure", finalError);
      return {
        valid: false,
        message: "System Connection Lost. Action Refunded.",
        isSystemError: true,
      };
    }
  }
};

// 4. Generate Tasks From Goal
export const generateTasksFromGoal = async (goal: Goal): Promise<Quest[]> => {
  if (!apiKey) return [];
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
        Break this High-Level Goal into 3 actionable System Tasks.
        Goal: "${goal.title}"
        Notes: "${goal.notes}"
        Context: EXECUTION CABAL.
        Language: Use simple, clear, actionable English. Avoid complex jargon.
        
        Output JSON Array of objects with: title, description, difficulty, requirements.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              difficulty: { type: Type.STRING, enum: ["E", "D", "C"] },
              requirements: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
          },
        },
      },
    });

    if (!response.text) return [];
    const tasks = JSON.parse(response.text);

    return tasks.map((t: any) => ({
      id: crypto.randomUUID(),
      title: t.title,
      description: t.description,
      type: TaskType.MAIN,
      difficulty: t.difficulty,
      xpReward: 50, // Standard Reward
      penaltyXP: 100,
      status: TaskStatus.IDLE,
      requirements: t.requirements,
      durationMinutes: 60,
      deadline: Date.now() + 48 * 60 * 60 * 1000,
      verificationAttempts: 0,
      isPinned: false,
    }));
  } catch (e) {
    console.error(e);
    return [];
  }
};

// 5. Generate Daily Random Challenge (Adaptive & Context Aware)
export const generateDailyChallenge = async (
  player: Player,
  recentTasksCount: number = 5,
  recentFailures: Quest[] = [],
  activeGoals: Goal[] = [],
  clients: any[] = [],
  behaviorStats?: { discipline: number; consistency: number; focus: number }
): Promise<Quest | null> => {
  if (!apiKey) return null;
  try {
    const { discipline, consistency, focus } =
      behaviorStats || player.behaviorStats;

    // Context Construction
    const failuresContext =
      recentFailures.length > 0
        ? `RECENT FAILURES (Analyze & Fix): \n${recentFailures.map((q) => `- ${q.title}: ${q.description}`).join("\n")}`
        : "No recent failures.";

    const goalsContext =
      activeGoals.length > 0
        ? `STRATEGIC GOALS (Align with these): \n${activeGoals.map((g) => `- ${g.title}: ${g.notes}`).join("\n")}`
        : "No specific strategic goals.";

    const clientsContext =
      clients.length > 0
        ? `ACTIVE CLIENTS: \n${clients.map((c) => `- ${c.name} (${c.projects?.length || 0} projects)`).join("\n")}`
        : "No active clients.";

    // Behavioral Adaptability Logic
    let promptDirective = "";
    let difficultyDirective = "";
    let xpOverride = 0;

    // --- HIGH RANK OVERRIDE (RULER LOGIC) ---
    const isHighRank = ["A", "S", "X"].includes(player.rank);

    if (recentFailures.length > 0) {
      // PRIORITY 1: REDEMPTION
      promptDirective = `REDEMPTION PROTOCOL: User has failed recently. Generate a task that directly addresses the root cause of these failures. Provide a specific INSIGHT or STRATEGY in the description on how to overcome this weakness.`;
      if (isHighRank) {
        difficultyDirective =
          "Difficulty A. High-Stakes Redemption. Failure is not an option for a Ruler.";
        xpOverride = 150;
      } else {
        difficultyDirective = "Difficulty C. Rebuild momentum.";
        xpOverride = 50;
      }
    } else if (recentTasksCount < 3) {
      // PRIORITY 2: SLUMP BREAKER
      promptDirective =
        "PUSH TASK: User is slacking (<3 tasks/week). Generate an urgent, low-barrier 'Push Task' to restart momentum (e.g. 'Reply to 3 emails', 'Do 10 pushups'). Short deadline.";
      difficultyDirective = "Difficulty E. Duration 15 min.";
      xpOverride = 20; // Low reward
    } else if (recentTasksCount >= 5 && consistency > 70) {
      // PRIORITY 3: SCALING UP
      promptDirective =
        "STRETCH TASK: User is performing well (High Consistency). Generate a 'Stretch Task'. High difficulty, high reward. Push their limits.";
      difficultyDirective = "Difficulty B or A.";
      xpOverride = 100; // High reward
    } else if (consistency < 30) {
      promptDirective =
        "STREAK SAVER: Player has low consistency. Generate a brutally simple task just to maintain the streak. Focus on Discipline.";
      difficultyDirective = "Difficulty E.";
    } else if (clients.length > 0 && Math.random() > 0.6) {
      // PRIORITY 4: CLIENT OPS (40% chance if clients exist)
      promptDirective =
        "CLIENT OPERATION: Generate a task related to servicing one of the active clients listed. Focus on deliverables or communication.";
      difficultyDirective = "Difficulty C.";
      xpOverride = 75;
    } else {
      promptDirective =
        "STANDARD PROTOCOL: Generate a balanced daily challenge based on stats.";
      difficultyDirective = "Difficulty D or C.";
    }

    if (isHighRank && recentTasksCount >= 3 && recentFailures.length === 0) {
      promptDirective = `ELITE OPERATION: User is a ${player.title} (Rank ${player.rank}). DO NOT generate menial tasks. Generate a complex, high-impact strategic operation aligned with their STRATEGIC GOALS or CLIENTS. Requires significant effort.`;
      difficultyDirective = "Difficulty A or S. Duration 90+ min.";
      xpOverride = 150;
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
                Generate a "Daily System Test" for a player.
                
                USER PROFILE:
                - Rank: ${player.rank} (${player.title})
                - Behavior: Discipline ${discipline}%, Consistency ${consistency}%, Focus ${focus}%
                
                CONTEXT DATA:
                ${goalsContext}
                
                ${failuresContext}
                
                ${clientsContext}
                
                GENERATION DIRECTIVE (EXECUTE THIS):
                ${promptDirective}
                ${difficultyDirective}
                
                User Language Preference: English (Simple, Corporate/Military style).
                
                CRITICAL VERIFICATION RULE:
                The 'requirements' array MUST explicitly state the physical proof required. 
                Examples: "Photo of X", "Screenshot of Y".
                
                Output JSON only.
            `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            type: { type: Type.STRING, enum: ["DAILY"] },
            difficulty: {
              type: Type.STRING,
              enum: ["E", "D", "C", "B", "A", "S", "X"],
            },
            requirements: { type: Type.ARRAY, items: { type: Type.STRING } },
            durationMinutes: { type: Type.INTEGER },
          },
          required: [
            "title",
            "description",
            "difficulty",
            "requirements",
            "durationMinutes",
          ],
        },
      },
    });

    if (!response.text) return null;
    const data = JSON.parse(response.text);

    return {
      id: `daily-${new Date().toISOString().split("T")[0]}`,
      title: data.title,
      description: data.description,
      type: TaskType.DAILY,
      difficulty: data.difficulty as Rank,
      xpReward: xpOverride || getRewards(data.difficulty as Rank).xpReward,
      penaltyXP: 100, // Standard Daily Penalty
      status: TaskStatus.IDLE,
      requirements: data.requirements,
      durationMinutes: data.durationMinutes || 30,
      deadline: Date.now() + 24 * 60 * 60 * 1000,
      verificationAttempts: 0,
      isPinned: false,
    };
  } catch (e) {
    console.error("Daily Gen Error", e);
    return null;
  }
};

// 4. Verify Task Edit (System Guardrail)
export const verifyQuestEdit = async (
  original: Quest,
  newTitle: string,
  newDescription: string
): Promise<{
  allowed: boolean;
  reason: string;
  corrected?: { title: string; description: string };
}> => {
  if (!apiKey) return { allowed: true, reason: "Offline Mode: Edit Allowed." };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
      Original Task: "${original.title}" - "${original.description}"
      New Draft: "${newTitle}" - "${newDescription}"
      
      Role: You are a strict efficiency supervisor. The user is trying to edit a task.
      
      Rules:
      1. ALLOW if the edit fixes typos, adds necessary detail, or clarifies scope.
      2. REJECT if the edit changes the core goal (e.g., "Write report" -> "Watch TV").
      3. REJECT if the edit makes the task significantly easier or vague (e.g., "100 pushups" -> "Do some exercise").
      4. IF REJECTED: Provide a "Corrected" version that incorporates the user's intent (e.g., clarification) but maintains the original difficulty/brutality.
      
      Output JSON only.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            allowed: { type: Type.BOOLEAN },
            reason: { type: Type.STRING },
            corrected: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
              },
              nullable: true,
            },
          },
          required: ["allowed", "reason"],
        },
      },
    });

    if (!response.text) throw new Error("No response");
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Edit Verification Failed:", error);
    // Fail safe: Block if unsure
    return {
      allowed: false,
      reason: "System Offline: Edits locked for security.",
    };
  }
};

// 5. Search Archive with AI
export const searchArchiveWithAI = async (
  query: string,
  archivedQuests: Quest[]
): Promise<{ insights: string; taskIds: string[] }> => {
  if (!apiKey) return { insights: "System Offline. Cannot search archive.", taskIds: [] };

  try {
    // We only send minimal data to Gemini to stay within token limits
    const minimalArchive = archivedQuests.map(q => ({
      id: q.id,
      title: q.title,
      status: q.status,
      date: q.completedAt ? new Date(q.completedAt).toLocaleDateString() : "Unknown",
    }));

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
      User Query: "${query}"
      
      Archive Data:
      ${JSON.stringify(minimalArchive)}
      
      Role: You are the EXECUTION CABAL System Analyst. 
      Task: Analyze the user's query against the Archive Data.
      
      Rules:
      1. Find all tasks that match the user's query (e.g., if they ask for "failed tasks yesterday", find tasks with "FAILED" status matching yesterday's date).
      2. Provide a short, brutal, actionable "insight" based on the findings (e.g. "You failed 3 tasks yesterday. Unacceptable. Focus.").
      3. Return a JSON object with 'insights' (string) and 'taskIds' (array of strings matching the relevant task IDs).
      
      Output JSON only.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            insights: { type: Type.STRING },
            taskIds: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ["insights", "taskIds"],
        },
      },
    });

    if (!response.text) throw new Error("No response");
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Archive Search Failed:", error);
    return {
      insights: "Search failed. System connection error.",
      taskIds: [],
    };
  }
};
