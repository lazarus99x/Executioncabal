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

const DEFAULT_MODEL = "claude-haiku-4-5-20251001";

async function callAnthropicProxy(payload: any) {
  const res = await fetch("/api/anthropic", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.details || "Anthropic Proxy Error");
  }
  return res.json();
}

// Helper to determine rewards based on Rank
const getRewards = (rank: Rank) => {
  const isHighRank = [Rank.A, Rank.S, Rank.X].includes(rank);
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

// Extraction helper for JSON
const extractJSON = (text: string) => {
  const match = text.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      return JSON.parse(match[0]);
    } catch (e) {
      console.error("Failed to parse extracted JSON", e);
    }
  }
  // Try cleaning up common markdown artifacts
  const cleaned = text.replace(/```json|```/g, "").trim();
  const secondaryMatch = cleaned.match(/\{[\s\S]*\}/);
  if (secondaryMatch) {
    try {
      return JSON.parse(secondaryMatch[0]);
    } catch (e) {
      console.error("Secondary JSON parse failed", e);
    }
  }
  return null;
};

const STAT_KEYS: (keyof PlayerStats)[] = [
  "strength",
  "agility",
  "intelligence",
  "vitality",
  "perception",
];

const normalizeStatIncreases = (
  rawStats?: Partial<PlayerStats>
): Partial<PlayerStats> => {
  const sanitized = STAT_KEYS.reduce((acc, key) => {
    const value = Number(rawStats?.[key] || 0);
    acc[key] = Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
    return acc;
  }, {} as Record<keyof PlayerStats, number>);

  let total = STAT_KEYS.reduce((sum, key) => sum + sanitized[key], 0);
  if (total === 0) {
    sanitized.perception = 5;
    total = 5;
  }

  if (total >= 5 && total <= 7) {
    return sanitized;
  }

  const targetTotal = total > 7 ? 6 : 5;
  const activeKeys = STAT_KEYS.filter((key) => sanitized[key] > 0);
  const distributionKeys = activeKeys.length > 0 ? activeKeys : ["perception"];

  const normalized = STAT_KEYS.reduce((acc, key) => {
    acc[key] = 0;
    return acc;
  }, {} as Record<keyof PlayerStats, number>);

  const sourceTotal =
    distributionKeys.reduce((sum, key) => sum + sanitized[key], 0) ||
    distributionKeys.length;

  let assigned = 0;
  distributionKeys.forEach((key, index) => {
    const remainingSlots = distributionKeys.length - index;
    const remainingPoints = targetTotal - assigned;
    const ratio = sourceTotal === 0 ? 1 / distributionKeys.length : sanitized[key] / sourceTotal;
    const proposed =
      index === distributionKeys.length - 1
        ? remainingPoints
        : Math.max(1, Math.round(ratio * targetTotal));
    const safeValue = Math.min(remainingPoints - (remainingSlots - 1), proposed);
    normalized[key] = Math.max(1, safeValue);
    assigned += normalized[key];
  });

  while (assigned < targetTotal) {
    const key = distributionKeys[assigned % distributionKeys.length];
    normalized[key] += 1;
    assigned += 1;
  }

  while (assigned > targetTotal) {
    const key = distributionKeys.find((candidate) => normalized[candidate] > 1);
    if (!key) break;
    normalized[key] -= 1;
    assigned -= 1;
  }

  return normalized;
};

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
  try {
    const { xpReward, penaltyXP } = getRewards(rank);

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
    const response = await callAnthropicProxy({
      model: DEFAULT_MODEL,
      max_tokens: 1024,
      system: "You are the SYSTEM task generator for EXECUTION CABAL. Tone: Brutal, short, direct. Simple English only. NO BIG GRAMMARS. Output JSON only.",
      messages: [
        {
          role: "user",
          content: `
          Current Local Time for Reference: ${currentTime}
          User Input: "${userInput}". 

          ${contextStr}
          
          Task: Generate a single, simple, clear, and actionable directive based EXACTLY on the user's input.
          - DO NOT overcomplicate it or add complex, long-winded descriptions.
          - Parse any explicitly mentioned start time and deadline from the user input and return them as 'startTime' and 'deadline' using standard ISO 8601 format. If none are specified, omit them.
          - Tone: Brutal, Efficient, Direct.
          
          Rank: ${rank}.
          
          CRITICAL VERIFICATION RULE:
          The 'requirements' array MUST explicitly state the physical proof required. 
          Examples: "Photo of gym equipment", "Screenshot of sent email", "Photo of completed page".
          
          Return ONLY a JSON object with: title, description, type ("MAIN" | "SIDE"), difficulty (E, D, C, B, A, X), durationMinutes (integer), startTime (string/null), deadline (string/null), requirements (string[]).
          `,
        },
      ],
    });

    const textContent = response.content.find(c => c.type === 'text')?.text || "";
    const data = extractJSON(textContent);
    if (!data) return null;

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
    console.error("Claude Generation Error:", error);
    return null;
  }
};

// 2. Chat with System Administrator
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
      ? `USER PERFORMANCE: Rank ${player.rank}, Level ${player.level}. Stats: Discipline ${player.behaviorStats?.discipline}%, Focus ${player.behaviorStats?.focus}%, Consistency ${player.behaviorStats?.consistency}%. Tasks Completed: ${player.totalTasksCompleted}.`
      : "USER PERFORMANCE: Unknown.";

    // Convert history for Anthropic
    const anthropicHistory: any[] = history.map(h => ({
      role: h.role === 'model' ? 'assistant' : 'user',
      content: h.parts[0].text
    }));

    const systemInstruction = `
      You are the SYSTEM ADMINISTRATOR of the EXECUTION CABAL.
      User: Agent (Rank ${player?.rank || "Unknown"}).
      Tone: Ruthless, strict, authoritative, short.
      Language Style: Simple, direct English. NO BIG GRAMMARS. High-impact commands only.
      If the user is slacking, be brutal. Keep it straightforward. So simple a child can understand, but so harsh an agent will tremble.
      
      === SYSTEM STATE (LIVE DATA) ===
      ${goalsContext}
      ${questsContext}
      ${playerContext}
      ================================
      
      CRITICAL PROTOCOL RULES:
      1. The "CURRENT ACTIVE TASKS" list above is the ONLY Source of Truth.
      2. IGNORE tasks missing from the list. 

      KGIS PROTOCOL (SINGLE TASK):
      If adding a SINGLE item: APPEND JSON wrapped in |||JSON_START||| and |||JSON_END|||.
      Structure: { "title": "string", "description": "string", "type": "MAIN" | "SIDE", "difficulty": "E" | "D" | "C" | "B" | "A" | "S", "requirements": ["string"], "durationMinutes": number, "startTime": "YYYY-MM-DDTHH:MM:SS", "deadline": "YYYY-MM-DDTHH:MM:SS" }

      TASK DUMPING PROTOCOL (MULTI-TASK PLAN):
      If user dumps multiple items or messy workloads: Generate a structured plan.
      STRICT OUTPUT RULE: You MUST APPEND the JSON wrapped in |||PLAN_START||| and |||PLAN_END||| at the end of your response. 
      Structure:
      {
        "projects": [
          {
            "name": "Project Name",
            "tasks": [
              {
                "id": "uuid",
                "title": "Title",
                "description": "Blunt desc",
                "priority": "Urgent" | "High" | "Medium" | "Low",
                "difficulty": "E" | "D" | "C" | "B" | "A" | "S",
                "xpCost": 80,
                "startTime": "YYYY-MM-DDTHH:MM:SS",
                "deadline": "YYYY-MM-DDTHH:MM:SS",
                "requirements": ["Proof required"],
                "durationMinutes": number
              }
            ]
          }
        ],
        "totalXpCost": number
      }
    `;

    const response = await callAnthropicProxy({
      model: DEFAULT_MODEL,
      max_tokens: 4096,
      system: systemInstruction,
      messages: [...anthropicHistory, { role: "user", content: newMessage }],
    });

    let text = response.content.find(c => c.type === 'text')?.text || "System Offline.";
    let quest: Quest | undefined;
    let proposedPlan: ProposedTaskPlan | undefined;

    // Parse Single Quest
    const jsonMatch = text.match(/\|\|\|JSON_START\|\|\|([\s\S]*?)\|\|\|JSON_END\|\|\|/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        const data = JSON.parse(jsonMatch[1].trim());
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
        console.error("Claude JSON Parse Error", e);
      }
    }

    // Parse Multi-Task Plan
    const planMatch = text.match(/\|\|\|PLAN_START\|\|\|([\s\S]*?)\|\|\|PLAN_END\|\|\|/);
    if (planMatch && planMatch[1]) {
      try {
        const data = JSON.parse(planMatch[1].trim());
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
        console.error("Claude PLAN JSON Parse Error", e);
      }
    }

    return { text, quest, proposedPlan };
  } catch (err: any) {
    console.error("Claude Chat Error:", err);
    return { text: `[SYSTEM ERROR] Connection interrupted. Verify API configuration.` };
  }
};

// 3. Verify Proof (Vision)
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
  if (!proofImageBase64) return { valid: false, message: "Photographic evidence required." };

  try {
    const base64Data = proofImageBase64.split(",")[1] || proofImageBase64;
    const mediaType = proofImageBase64.match(/data:([^;]+);/)?.[1] || "image/jpeg";

    const response = await callAnthropicProxy({
      model: DEFAULT_MODEL,
      max_tokens: 1024,
      system: "You are a PRACTICAL verifier for EXECUTION CABAL. Trust but verify. Be LENIENT, not strict. If the image plausibly matches the task, ACCEPT it. Simple English. Short responses. Output JSON only.",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType as any,
                data: base64Data,
              },
            },
            {
              type: "text",
              text: `
              TASK: "${taskDescription}"
              USER'S PROOF NOTE: "${proofText}"
              
              VERIFICATION RULES (BE LENIENT):
              - If the image LOOKS LIKE it shows the task being done, ACCEPT IT.
              - DO NOT over-analyze. DO NOT demand timestamps, metadata, or before/after photos.
              - Task: "Access admin dashboard" → Screenshot showing admin dashboard with name visible → ACCEPT, no questions asked.
              - Task: "Call [name]" → Screenshot of call log with that name → ACCEPT.
              - Task: "Send email" → Screenshot of sent folder → ACCEPT.
              - Task: "Go to gym" → Photo at a gym or with equipment → ACCEPT.
              - DO NOT look for watermarks, timestamps, EXIF data, or perfect framing.
              - Only reject if image is TOTALLY UNRELATED or blank.
              - When in doubt, GIVE BENEFIT OF DOUBT and ACCEPT.
              - The user did the work. Just check if image makes sense as proof.
              
              Output JSON:
              {
                "valid": boolean,
                "message": "short explanation (1 sentence)",
                "statIncreases": { "strength": 0, "agility": 0, "intelligence": 0, "vitality": 0, "perception": 0 }
              }
              `,
            },
          ],
        },
      ],
    });

    const textContent = response.content.find(c => c.type === 'text')?.text || "";
    const result = extractJSON(textContent);
    if (!result) throw new Error("Verification response extraction failed");

    return {
      valid: result.valid,
      message: result.message,
      missingCriteria: result.missing_criteria || [],
      statUpdates: result.valid
        ? normalizeStatIncreases(result.statIncreases)
        : result.statIncreases,
    };
  } catch (error) {
    console.error("Claude Verification Failure:", error);
    return { valid: false, message: "System Connection Lost. Action Refunded.", isSystemError: true };
  }
};

// 4. Generate Tasks From Goal — daily tasks from now until deadline
export const generateTasksFromGoal = async (goal: Goal): Promise<Quest[]> => {
  try {
    const deadline = goal.deadline || Date.now() + 7 * 24 * 60 * 60 * 1000;
    const daysRemaining = Math.max(1, Math.ceil((deadline - Date.now()) / (24 * 60 * 60 * 1000)));
    const tasksPerDay = Math.min(3, Math.max(1, Math.ceil((daysRemaining > 7 ? 2 : 3))));

    const response = await callAnthropicProxy({
      model: DEFAULT_MODEL,
      max_tokens: 4096,
      system: `You are a tactical task planner. Break this goal into daily actionable tasks for ${daysRemaining} days (${tasksPerDay} tasks per day). Each task must be concrete, verifiable, and achievable in one day. Output valid JSON only — no markdown, no backticks.`,
      messages: [{
        role: "user",
        content: `Goal: "${goal.title}". Description: "${goal.notes || goal.description}". Deadline: ${new Date(deadline).toLocaleDateString()}. Days remaining: ${daysRemaining}.
Output format: JSON array of objects, each with:
{
  "day": number (1-based),
  "title": string,
  "description": string,
  "difficulty": "E" | "D" | "C" | "B" | "A",
  "requirements": string[],
  "durationMinutes": number (15-180)
}
Tasks should build on each other progressively — earlier days are foundational, later days are advanced.`
      }]
    });
    const textContent = response.content.find(c => c.type === 'text')?.text || "";
    const tasks = extractJSON(textContent) || [];

    if (tasks.length === 0) {
      // Fallback: generate one task per day manually
      for (let d = 1; d <= daysRemaining; d++) {
        tasks.push({
          day: d,
          title: `Day ${d}: Work on "${goal.title}"`,
          description: `Daily progress toward: ${goal.title}`,
          difficulty: 'C' as Rank,
          requirements: ['focus', 'execution'],
          durationMinutes: 60,
        });
      }
    }

    return tasks.map((t: any) => {
      const dayOffset = Math.max(0, (t.day || 1) - 1);
      const taskDeadline = Date.now() + dayOffset * 24 * 60 * 60 * 1000;
      return {
        id: crypto.randomUUID(),
        title: t.title || `Day ${t.day || 1}: Task`,
        description: t.description || `Progress toward: ${goal.title}`,
        type: TaskType.MAIN,
        difficulty: t.difficulty || 'C',
        xpReward: 50,
        penaltyXP: 100,
        status: TaskStatus.IDLE,
        requirements: t.requirements || [],
        durationMinutes: t.durationMinutes || 60,
        deadline: taskDeadline + (t.durationMinutes || 60) * 60 * 1000,
        verificationAttempts: 0,
        isPinned: false,
      };
    });
  } catch (e) {
    console.error(e);
    return [];
  }
};

// 5. Generate Daily Challenge
export const generateDailyChallenge = async (
  player: Player,
  recentTasksCount: number = 5,
  recentFailures: Quest[] = [],
  activeGoals: Goal[] = [],
  clients: any[] = [],
  behaviorStats?: { discipline: number; consistency: number; focus: number }
): Promise<Quest | null> => {
  try {
    const { discipline, consistency, focus } = behaviorStats || player.behaviorStats;
    const failuresContext = recentFailures.length > 0 
      ? `RECENT FAILURES (Loophole Data):\n${recentFailures.map(q => `- ${q.title}: ${q.description}`).join("\n")}` 
      : "None";

    const response = await callAnthropicProxy({
      model: DEFAULT_MODEL,
      max_tokens: 1024,
      system: "Generate Daily Challenge. Output JSON only.",
      messages: [{
        role: "user",
        content: `
          Rank: ${player.rank}. Behavior: D:${discipline}%, C:${consistency}%, F:${focus}%.
          ${failuresContext}
          
          TASK: Analyze user data. Find their weaknesses (loop holes). Are they failing main tasks? Is consistency low? 
          Generate a "Daily System Test" to fix these weaknesses.
          Tone: Brutal recalibration. Simple English. No big grammars. Short.
          
          Generate JSON: {title, description, type: "DAILY", difficulty, requirements: string[], durationMinutes: number}
        `
      }]
    });
    const textContent = response.content.find(c => c.type === 'text')?.text || "";
    const data = extractJSON(textContent);
    if (!data) return null;

    return {
      id: `daily-${new Date().toISOString().split("T")[0]}`,
      title: data.title,
      description: data.description,
      type: TaskType.DAILY,
      difficulty: data.difficulty as Rank,
      xpReward: 50,
      penaltyXP: 100,
      status: TaskStatus.IDLE,
      requirements: data.requirements,
      durationMinutes: data.durationMinutes || 30,
      deadline: Date.now() + 24 * 60 * 60 * 1000,
      verificationAttempts: 0,
      isPinned: false,
    };
  } catch (e) {
    console.error(e);
    return null;
  }
};

// 6. Verify Task Edit
export const verifyQuestEdit = async (
  original: Quest,
  newTitle: string,
  newDescription: string
): Promise<{
  allowed: boolean;
  reason: string;
  corrected?: { title: string; description: string };
}> => {
  try {
    const response = await callAnthropicProxy({
      model: DEFAULT_MODEL,
      max_tokens: 1024,
      system: "You are a strict supervisor. Tone: Brutal, short. Simple English only. Reject if it's too easy. Output JSON only.",
      messages: [{
        role: "user",
        content: `Original: "${original.title}". New: "${newTitle}" - "${newDescription}". Reject if easier. JSON: {allowed: boolean, reason: string, corrected: {title, description}|null}`
      }]
    });
    const textContent = response.content.find(c => c.type === 'text')?.text || "";
    return extractJSON(textContent) || { allowed: true, reason: "Parse failed." };
  } catch (e) {
    return { allowed: false, reason: "System Error." };
  }
};

// 7. Search Archive
export const searchArchiveWithAI = async (
  query: string,
  archivedQuests: Quest[]
): Promise<{ insights: string; taskIds: string[] }> => {
  try {
    const now = new Date();
    const nowMs = now.getTime();
    
    // 1. Calculate REAL metrics in JS to prevent AI hallucinations
    const ms24h = 24 * 60 * 60 * 1000;
    const ms48h = 48 * 60 * 60 * 1000;
    const ms1w = 7 * 24 * 60 * 60 * 1000;

    const stats = {
      failed24h: archivedQuests.filter(q => q.status === TaskStatus.FAILED && (q.completedAt || 0) > nowMs - ms24h).length,
      failed48h: archivedQuests.filter(q => q.status === TaskStatus.FAILED && (q.completedAt || 0) > nowMs - ms48h).length,
      failed1w: archivedQuests.filter(q => q.status === TaskStatus.FAILED && (q.completedAt || 0) > nowMs - ms1w).length,
      completed24h: archivedQuests.filter(q => q.status === TaskStatus.COMPLETED && (q.completedAt || 0) > nowMs - ms24h).length,
      totalCount: archivedQuests.length
    };

    // 2. Sort Newest First & Slice to prevent attention loss
    const sortedArchive = [...archivedQuests].sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));
    const recentArchive = sortedArchive.slice(0, 100);

    const minimalArchive = recentArchive.map(q => ({ 
      id: q.id, 
      title: q.title, 
      status: q.status,
      description: q.description,
      completedAt: q.completedAt ? new Date(q.completedAt).toLocaleString() : null,
      startTime: q.startTime ? new Date(q.startTime).toLocaleString() : null,
      deadline: q.deadline ? new Date(q.deadline).toLocaleString() : null,
      requirements: q.requirements,
      isHidden: (q as any).isVisibleInLog === false
    }));

    const dates = {
      today: now.toLocaleDateString(),
      yesterday: new Date(nowMs - ms24h).toLocaleDateString(),
      twoDaysAgo: new Date(nowMs - ms48h).toLocaleDateString(),
      threeDaysAgo: new Date(nowMs - 3 * ms24h).toLocaleDateString(),
    };

    const response = await callAnthropicProxy({
      model: DEFAULT_MODEL,
      max_tokens: 1024,
      system: `You are the ARCHIVE RETRIEVER. 
      Local Time: ${now.toLocaleString()}. 
      Tone: Direct, efficient. Short sentences. Simple English. 
      
      === REALITY CHECK (JS CALCULATED STATS) ===
      Summary of recent history (Use these EXACT numbers in your reports):
      - FAILED in last 24h: ${stats.failed24h}
      - FAILED in last 48h: ${stats.failed48h}
      - FAILED in last week: ${stats.failed1w}
      - COMPLETED in last 24h: ${stats.completed24h}
      - Total Archive Scan (Last 100): ${minimalArchive.length}
      ===========================================

      MATCHING RULES:
      1. Reference Dates: Today is ${dates.today}. Yesterday was ${dates.yesterday}. 3 days ago was ${dates.threeDaysAgo}.
      2. If query mentions "past 1 day", calculate precisely. Anything before ${dates.yesterday} is OUTSIDE the 1-day range.
      3. BE EXHAUSTIVE. You MUST include ALL task IDs in the 'taskIds' array that meet the search criteria, including those marked 'isHidden: true'. 
      4. If a task title or description matches a keyword, include it.
      
      STRICT OUTPUT FORMAT for 'insights':
      You must use this Markdown structure:
      ### 📋 SUMMARY
      [One sentence brutal overview using stats provided above]
      
      ### 🔍 PATTERNS
      - [Point 1]
      - [Point 2]
      
      ### 📅 TIMELINE
      [List of 2-4 most relevant tasks found that match the query]
      
      KEEP IT MINIMAL. DO NOT EXPLAIN THE SYSTEM. JUST DATA.
      Output JSON only.`,
      messages: [{
        role: "user",
        content: `Query: "${query}". Archive: ${JSON.stringify(minimalArchive)}. Return JSON: {insights: string, taskIds: string[]}. CRITICAL: Ensure 'taskIds' contains every single match found. DO NOT hallucinate counts—use the stats provided.`
      }]
    });
    const textContent = response.content.find(c => c.type === 'text')?.text || "";
    const data = extractJSON(textContent);
    return data || { insights: "Search failed. Refine query.", taskIds: [] };
  } catch (e) {
    return { insights: "Error.", taskIds: [] };
  }
};
