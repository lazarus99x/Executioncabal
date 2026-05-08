import React, { useState, useEffect, useRef } from "react";
import {
  StoreItem,
  Transaction,
  SystemLog,
  Player,
  StoreCategory,
  Rank,
} from "../types";
import {
  fetchAllProfiles,
  updateUserStatus,
  fetchSystemLogs,
  fetchTransactions,
  updateTransactionStatus,
  upsertStoreItem,
  deleteStoreItem,
  createTransaction,
  logSystemEvent,
  fetchStoreCategories,
  createStoreCategory,
  deleteStoreCategory,
} from "../lib/supabase";
import {
  ShoppingBag,
  Activity,
  Search,
  ShieldAlert,
  Edit2,
  Trash2,
  Plus,
  X,
  DollarSign,
  Check,
  Ban,
  Globe,
  ExternalLink,
  Image,
  Gift,
  RefreshCw,
  Loader2,
  Crown,
  Layers,
  Upload,
  Clock,
  HeartPulse,
  Unlock,
  ChevronLeft,
  ChevronRight,
  User,
  Send,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ... existing imports and interfaces ...

interface AdminDashboardProps {
  currentUser: string;
  storeItems: StoreItem[];
  onUpdateStoreItems: (items: StoreItem[]) => void;
  onSyncPlayer?: (updatedPlayer: Partial<Player>) => void;
}

type ActionType =
  | "GIFT"
  | "SET_XP"
  | "BAN"
  | "FORCE_UNBAN"
  | "EDIT_USER"
  | null;

// --- 3D ACTIVITY GLOBE COMPONENT ---
const ActivityGlobe: React.FC<{
  users: any[];
  onUserClick: (user: any) => void;
}> = ({ users, onUserClick }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotationRef = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const pointsRef = useRef<any[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Auto-Resize
    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.offsetWidth * 2;
        canvas.height = parent.offsetHeight * 2;
        ctx.scale(2, 2);
      }
    };
    resize();
    window.addEventListener("resize", resize);

    // Filter active users
    const now = Date.now();
    const activeThreshold = 15 * 60 * 1000;

    pointsRef.current = [];
    const numPoints = 200; // Grid dots

    // Add random background dots
    for (let i = 0; i < numPoints; i++) {
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 100;
      pointsRef.current.push({
        x: r * Math.sin(phi) * Math.cos(theta),
        y: r * Math.sin(phi) * Math.sin(theta),
        z: r * Math.cos(phi),
        color: "#333333",
        size: 1,
        type: "bg",
      });
    }

    // Add User Dots
    users.forEach((u, i) => {
      const isActive = now - u.lastActiveTimestamp < activeThreshold;
      const phi = Math.acos(1 - (2 * (i + 0.5)) / users.length);
      const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);

      const r = 100;

      pointsRef.current.push({
        x: r * Math.sin(phi) * Math.cos(theta),
        y: r * Math.sin(phi) * Math.sin(theta),
        z: r * Math.cos(phi),
        color: isActive ? "#00A2FF" : "#FF4444",
        size: isActive ? 4 : 2.5,
        glow: isActive,
        type: "user",
        userData: u,
      });
    });

    let animationFrameId: number;

    const render = () => {
      if (!ctx || !canvas) return;
      const width = canvas.width / 2;
      const height = canvas.height / 2;

      ctx.clearRect(0, 0, width, height);

      // Center
      const cx = width / 2;
      const cy = height / 2;

      if (!isDragging.current) {
        rotationRef.current.x += 0.002;
      }

      pointsRef.current.forEach((p) => {
        let x1 =
          p.x * Math.cos(rotationRef.current.x) -
          p.z * Math.sin(rotationRef.current.x);
        let z1 =
          p.z * Math.cos(rotationRef.current.x) +
          p.x * Math.sin(rotationRef.current.x);

        let y1 =
          p.y * Math.cos(rotationRef.current.y) -
          z1 * Math.sin(rotationRef.current.y);
        let z2 =
          z1 * Math.cos(rotationRef.current.y) +
          p.y * Math.sin(rotationRef.current.y);

        // Store projected coordinates
        const scale = 300 / (300 + z2);
        p.px = cx + x1 * scale;
        p.py = cy + y1 * scale;
        p.pz = z2;
        p.scale = scale;

        const alpha = (z2 + 100) / 200;

        if (z2 > -150) {
          ctx.beginPath();
          ctx.arc(p.px, p.py, p.size * scale, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(0.1, Math.min(1, alpha));
          ctx.fill();

          if (p.glow) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = p.color;
            ctx.fill();
            ctx.shadowBlur = 0;
          }
          ctx.globalAlpha = 1;
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resize);
    };
  }, [users]);

  // --- INTERACTION HANDLERS ---
  const handleStart = (x: number, y: number) => {
    isDragging.current = true;
    lastMouse.current = { x, y };
  };

  const handleMove = (x: number, y: number) => {
    if (isDragging.current) {
      const dx = x - lastMouse.current.x;
      const dy = y - lastMouse.current.y;
      rotationRef.current.x += dx * 0.01;
      rotationRef.current.y += dy * 0.01;
      lastMouse.current = { x, y };
    }
  };

  const handleEnd = () => {
    isDragging.current = false;
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    // Adjust for canvas scale
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Sort by Z (closest first)
    const sortedPoints = [...pointsRef.current].sort((a, b) => b.pz - a.pz);

    for (const p of sortedPoints) {
      if (p.type === "user" && p.pz > -50) {
        const dist = Math.sqrt(
          Math.pow(mouseX - p.px, 2) + Math.pow(mouseY - p.py, 2)
        );
        // Hit radius scales with perspective
        if (dist < 15 * p.scale) {
          onUserClick(p.userData);
          break;
        }
      }
    }
  };

  return (
    <div className="w-full h-72 md:h-80 bg-black border border-gray-800 rounded-xl relative overflow-hidden flex items-center justify-center touch-none">
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <h3 className="text-white font-bold text-xs uppercase tracking-widest flex items-center gap-2">
          <Globe size={14} className="text-system-blue animate-pulse" /> Global
          Live View
        </h3>
        <div className="text-[10px] text-gray-500 mt-1 font-mono">
          <span className="text-system-blue">●</span> ACTIVE
          <span className="text-system-red ml-2">●</span> IDLE
        </div>
      </div>

      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
        onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
        onMouseUp={(e) => {
          handleEnd();
          handleClick(e);
        }}
        onMouseLeave={handleEnd}
        onTouchStart={(e) =>
          handleStart(e.touches[0].clientX, e.touches[0].clientY)
        }
        onTouchMove={(e) =>
          handleMove(e.touches[0].clientX, e.touches[0].clientY)
        }
        onTouchEnd={handleEnd}
      />
    </div>
  );
};

// --- PAGINATION CONTROLS ---
const PaginationControls: React.FC<{
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}> = ({ page, totalPages, onPageChange }) => (
  <div className="flex items-center justify-between p-4 border-t border-gray-800 bg-gray-900/90 relative z-[100]">
    <span className="text-xs text-gray-500 font-mono">
      Page {page} of {totalPages}
    </span>
    <div className="flex gap-2">
      <button
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="p-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronLeft size={16} />
      </button>
      <button
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="p-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  </div>
);

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  storeItems,
  onUpdateStoreItems,
  onSyncPlayer,
}) => {
  // ... rest of the component implementation ...
  const [activeTab, setActiveTab] = useState<
    "OVERVIEW" | "USERS" | "STORE" | "LOGS" | "FINANCE" | "COMMS"
  >("OVERVIEW");
  const [users, setUsers] = useState<any[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<StoreCategory[]>([]);

  // Pagination States
  const [userPage, setUserPage] = useState(1);
  const [logPage, setLogPage] = useState(1);
  const [financePage, setFinancePage] = useState(1);
  const PAGE_SIZE = 10;

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [search, setSearch] = useState("");

  // Store Editing State
  const [editingItem, setEditingItem] = useState<Partial<StoreItem> | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Category Management State
  const [showCatModal, setShowCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");

  // --- ADMIN ACTION MODAL STATE ---
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    type: ActionType;
    targetUsername: string | null;
    userData?: any;
  }>({ isOpen: false, type: null, targetUsername: null });

  // Edit User State
  const [editForm, setEditForm] = useState({
    rank: "E",
    level: 1,
    totalTasks: 0,
    xp: 0,
  });

  const [actionInputValue, setActionInputValue] = useState("");

  // Manual Email State
  const [manualEmail, setManualEmail] = useState({
    to: "",
    subject: "",
    message: "",
  });
  const [emailStatus, setEmailStatus] = useState<
    "idle" | "sending" | "success" | "error"
  >("idle");

  // Initial Load & Tab Switch Load
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      if (!isMounted) return;
      setLoading(true);
      try {
        // Parallel Fetching for Overview
        if (activeTab === "OVERVIEW") {
          const [u, l, t, c] = await Promise.all([
            fetchAllProfiles(),
            fetchSystemLogs(),
            fetchTransactions(),
            fetchStoreCategories(),
          ]);
          if (isMounted) {
            setUsers(u);
            setLogs(l);
            setTransactions(t);
            setCategories(c);
          }
        } else if (activeTab === "USERS") {
          const u = await fetchAllProfiles();
          if (isMounted) setUsers(u);
        } else if (activeTab === "LOGS") {
          const l = await fetchSystemLogs();
          if (isMounted) setLogs(l);
        } else if (activeTab === "FINANCE") {
          const t = await fetchTransactions();
          if (isMounted) setTransactions(t);
        } else if (activeTab === "STORE") {
          const c = await fetchStoreCategories();
          if (isMounted) setCategories(c);
        }
      } catch (e) {
        console.error("Admin Fetch Error:", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [activeTab]);

  const refreshCurrentView = async () => {
    setLoading(true);
    try {
      if (activeTab === "USERS" || activeTab === "OVERVIEW") {
        setUsers(await fetchAllProfiles());
      }
      if (activeTab === "LOGS" || activeTab === "OVERVIEW") {
        setLogs(await fetchSystemLogs());
      }
      if (activeTab === "FINANCE" || activeTab === "OVERVIEW") {
        setTransactions(await fetchTransactions());
      }
      if (activeTab === "STORE" || activeTab === "OVERVIEW") {
        setCategories(await fetchStoreCategories());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // ... (Helper functions remain same) ...
  const formatTimeAgo = (timestamp: number) => {
    if (!timestamp) return "Never";
    const diff = Date.now() - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  // ... (Action Handlers remain same) ...
  const openActionModal = (
    type: ActionType,
    username: string,
    userData?: any
  ) => {
    setActionModal({ isOpen: true, type, targetUsername: username, userData });
    setActionInputValue("");
    if (type === "EDIT_USER" && userData) {
      setEditForm({
        rank: userData.rank || "E",
        level: userData.level || 1,
        totalTasks: userData.totalTasksCompleted || 0,
        xp: userData.currentXp || 0,
      });
    }
  };

  const executeAction = async () => {
    const { type, targetUsername, userData } = actionModal;
    if (!targetUsername || !type) return;

    setActionLoading(`${type.toLowerCase()}-${targetUsername}`);
    // Close modal immediately to show loading on button row (except for EDIT which might take longer)
    if (type !== "EDIT_USER")
      setActionModal({ isOpen: false, type: null, targetUsername: null });

    try {
      let updatedFields: Partial<Player> = {};

      if (type === "EDIT_USER") {
        updatedFields = {
          rank: editForm.rank as Rank,
          level: Number(editForm.level),
          totalTasksCompleted: Number(editForm.totalTasks),
          currentXp: Number(editForm.xp),
        };
        await updateUserStatus(targetUsername, updatedFields);
        await logSystemEvent({
          username: currentUser,
          event_type: "ADMIN_ACTION",
          ip_address: "SYSTEM",
          country: "SYSTEM",
          details: `Admin Updated Profile for ${targetUsername}`,
        });
        setActionModal({ isOpen: false, type: null, targetUsername: null });
      }

      if (type === "FORCE_UNBAN") {
        updatedFields = {
          isBanned: false,
          lastActiveTimestamp: Date.now(),
        };
        await updateUserStatus(targetUsername, updatedFields);
        await logSystemEvent({
          username: currentUser,
          event_type: "ADMIN_ACTION",
          ip_address: "SYSTEM",
          country: "SYSTEM",
          details: `Admin FORCE REVIVED ${targetUsername}`,
        });
      }

      if (type === "BAN") {
        updatedFields = { isBanned: true };
        await updateUserStatus(targetUsername, updatedFields);
        await logSystemEvent({
          username: currentUser,
          event_type: "BAN",
          ip_address: "SYSTEM",
          country: "SYSTEM",
          details: `Admin BANNED ${targetUsername}`,
        });
      }

      if (type === "SET_XP") {
        const val = parseInt(actionInputValue);
        if (isNaN(val)) throw new Error("Invalid Number");

        const currentXp = userData?.currentXp || 0;
        const boughtXp = userData?.boughtXp || 0; // Get existing Action XP

        const newTotal = currentXp + val;
        const newBought = boughtXp + val; // Increment Action XP

        updatedFields = { currentXp: newTotal, boughtXp: newBought };

        await updateUserStatus(targetUsername, updatedFields);
        await logSystemEvent({
          username: currentUser,
          event_type: "ADMIN_ACTION",
          ip_address: "SYSTEM",
          country: "SYSTEM",
          details: `Admin Topped Up ${val} ACTION XP for ${targetUsername} (Total: ${newTotal}, Action: ${newBought})`,
        });
      }

      if (type === "GIFT") {
        const amount = parseInt(actionInputValue);
        if (isNaN(amount) || amount <= 0) throw new Error("Invalid Amount");

        const currentXp = userData?.currentXp || 0;
        updatedFields = { currentXp: currentXp + amount };

        await updateUserStatus(targetUsername, updatedFields);
        await createTransaction({
          username: targetUsername || "Unknown",
          type: "SYSTEM_BONUS",
          amount: amount,
          status: "APPROVED",
          reference_id: `ADMIN_GIFT_${Date.now()}`,
        });
        await logSystemEvent({
          username: currentUser,
          event_type: "ADMIN_ACTION",
          ip_address: "SYSTEM",
          country: "SYSTEM",
          details: `Admin gifted ${amount} XP to ${targetUsername}`,
        });
      }

      if (targetUsername === currentUser && onSyncPlayer) {
        onSyncPlayer(updatedFields);
      }

      await refreshCurrentView();
    } catch (e: any) {
      alert(`Action Failed: ${e.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendManualEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualEmail.to || !manualEmail.subject || !manualEmail.message) return;

    setEmailStatus("sending");
    try {
      const res = await fetch("/api/email/send-manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(manualEmail),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Transmission Failed");
      }

      setEmailStatus("success");
      setManualEmail({ to: "", subject: "", message: "" });
      setTimeout(() => setEmailStatus("idle"), 3000);
    } catch (err) {
      console.error(err);
      setEmailStatus("error");
      setTimeout(() => setEmailStatus("idle"), 3000);
    }
  };

  const handleTransactionAction = async (
    tx: Transaction,
    action: "APPROVED" | "REJECTED"
  ) => {
    setActionLoading(`tx-${tx.id}`);
    try {
      await updateTransactionStatus(tx.id, action);
      if (action === "APPROVED" && tx.type === "PURCHASE_XP") {
        const user = users.find((u) => u.username === tx.username);
        if (user) {
          const updatedXp = user.currentXp + tx.amount;
          await updateUserStatus(user.username, {
            currentXp: updatedXp,
            isBanned: false,
            lastActiveTimestamp: Date.now(),
          });

          if (user.username === currentUser && onSyncPlayer) {
            onSyncPlayer({
              currentXp: updatedXp,
              isBanned: false,
              lastActiveTimestamp: Date.now(),
            });
          }
        }
      }
      await refreshCurrentView();
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveItem = async () => {
    if (!editingItem?.name || !editingItem?.cost) return;
    setLoading(true);
    try {
      let newItem: StoreItem = {
        id: editingItem.id || `item_${Date.now()}`,
        name: editingItem.name,
        description: editingItem.description || "",
        cost: Number(editingItem.cost),
        type: editingItem.type || "CONSUMABLE",
        image_url: editingItem.image_url,
        content_link: editingItem.content_link,
      };
      let newItems = [...storeItems];
      if (editingItem.id) {
        newItems = newItems.map((i) => (i.id === editingItem.id ? newItem : i));
      } else {
        newItems.push(newItem);
      }
      await upsertStoreItem(newItem);
      onUpdateStoreItems(newItems);
      setEditingItem(null);
    } catch (e: any) {
      alert(`Error saving item: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    setLoading(true);
    try {
      await deleteStoreItem(id);
      onUpdateStoreItems(storeItems.filter((i) => i.id !== id));
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCatName) return;
    const id = newCatName.toUpperCase().replace(/\s+/g, "_");
    try {
      await createStoreCategory({
        id,
        name: newCatName,
        description: newCatDesc,
      });
      setCategories((prev) => [
        ...prev,
        { id, name: newCatName, description: newCatDesc },
      ]);
      setNewCatName("");
      setNewCatDesc("");
    } catch (e: any) {
      alert("Failed to add category");
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await deleteStoreCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      alert("Failed to delete category");
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Image too large. Max 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setEditingItem((prev) =>
        prev ? { ...prev, image_url: reader.result as string } : null
      );
    };
    reader.readAsDataURL(file);
  };

  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase())
  );
  const paginatedUsers = filteredUsers.slice(
    (userPage - 1) * PAGE_SIZE,
    userPage * PAGE_SIZE
  );

  const paginatedLogs = logs.slice(
    (logPage - 1) * PAGE_SIZE,
    logPage * PAGE_SIZE
  );
  const paginatedTransactions = transactions.slice(
    (financePage - 1) * PAGE_SIZE,
    financePage * PAGE_SIZE
  );

  return (
    // UPDATED PADDING: pb-48 to ensure floating widget does not block content
    <div className="flex-1 h-full overflow-y-auto p-4 md:p-6 lg:p-10 pb-48 bg-black text-white font-mono relative">
      {/* ... existing render logic ... */}
      <header className="mb-8 flex flex-col md:flex-row justify-between md:items-center border-b border-gray-800 pb-4 gap-4">
        {/* ... Header content ... */}
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
            <Crown size={32} className="text-system-red" /> THE ARCHITECT
          </h1>
          <p className="text-xs text-gray-500">
            System Operator: <span className="text-white">{currentUser}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {["OVERVIEW", "USERS", "FINANCE", "STORE", "LOGS", "COMMS"].map(
            (tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-3 py-1 text-[10px] font-bold rounded uppercase tracking-wide border ${activeTab === tab ? "bg-system-red text-black border-system-red" : "bg-transparent text-gray-500 border-gray-800 hover:text-white"}`}
              >
                {tab}
              </button>
            )
          )}
        </div>
      </header>

      {/* ... Loading Overlay ... */}
      {loading && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-gray-900 border border-system-red p-4 rounded-lg flex items-center gap-3 shadow-2xl">
            <Loader2 size={24} className="animate-spin text-system-red" />
            <span className="text-sm font-bold uppercase tracking-widest text-white">
              Accessing Database...
            </span>
          </div>
        </div>
      )}

      {activeTab === "OVERVIEW" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
            <div className="bg-gray-900 border border-gray-800 p-6 rounded">
              <div className="text-gray-500 text-xs uppercase mb-2">
                Total Agents
              </div>
              <div className="text-4xl font-bold text-white">
                {users.length}
              </div>
            </div>
            <div className="bg-gray-900 border border-gray-800 p-6 rounded">
              <div className="text-gray-500 text-xs uppercase mb-2">
                Pending Transactions
              </div>
              <div className="text-4xl font-bold text-system-gold">
                {transactions.filter((t) => t.status === "PENDING").length}
              </div>
            </div>
            <div className="bg-gray-900 border border-gray-800 p-6 rounded">
              <div className="text-gray-500 text-xs uppercase mb-2">
                Recent Logs
              </div>
              <div className="text-4xl font-bold text-system-blue">
                {logs.length}
              </div>
            </div>
            <div className="bg-gray-900 border border-gray-800 p-6 rounded">
              <div className="text-gray-500 text-xs uppercase mb-2">
                System Status
              </div>
              <div className="text-4xl font-bold text-green-500">ONLINE</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ActivityGlobe
              users={users}
              onUserClick={(u) => openActionModal("EDIT_USER", u.username, u)}
            />
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col justify-center">
              <h3 className="text-white font-bold mb-4 uppercase tracking-widest text-xs border-b border-gray-800 pb-2">
                Active Sessions
              </h3>
              <ul className="space-y-2 text-xs font-mono max-h-60 overflow-y-auto custom-scrollbar">
                {users
                  .sort((a, b) => b.lastActiveTimestamp - a.lastActiveTimestamp)
                  .slice(0, 10)
                  .map((u) => {
                    const isActive =
                      Date.now() - u.lastActiveTimestamp < 15 * 60 * 1000;
                    return (
                      <li
                        key={u.username}
                        className="flex justify-between items-center hover:bg-white/5 p-1 rounded transition-colors cursor-pointer"
                        onClick={() =>
                          openActionModal("EDIT_USER", u.username, u)
                        }
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${isActive ? "bg-system-blue animate-pulse" : "bg-gray-700"}`}
                          ></div>
                          <span
                            className={
                              isActive
                                ? "text-white font-bold"
                                : "text-gray-500"
                            }
                          >
                            {u.username}
                          </span>
                        </div>
                        <span
                          className={
                            isActive ? "text-green-500" : "text-gray-600"
                          }
                        >
                          {isActive
                            ? "ONLINE"
                            : formatTimeAgo(u.lastActiveTimestamp)}
                        </span>
                      </li>
                    );
                  })}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ... OTHER TABS ... */}
      {activeTab === "USERS" && (
        <div className="space-y-4">
          {/* Search & Refresh */}
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-3 text-gray-500"
                size={16}
              />
              <input
                className="w-full bg-gray-900 border border-gray-800 rounded py-2 pl-10 text-sm focus:border-system-red outline-none"
                placeholder="Search codename..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button
              onClick={refreshCurrentView}
              className="bg-gray-800 p-2 rounded hover:bg-gray-700 text-white"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded overflow-hidden overflow-x-auto flex flex-col">
            <table className="w-full text-left text-xs min-w-[600px]">
              <thead className="bg-black border-b border-gray-800 text-gray-500 uppercase">
                <tr>
                  <th className="p-4">Identity</th>
                  <th className="p-4">Rank</th>
                  <th className="p-4">XP Balance</th>
                  <th className="p-4">Last Active</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {paginatedUsers.length > 0 ? (
                  paginatedUsers.map((user) => (
                    <tr
                      key={user.username}
                      className={`hover:bg-gray-800/50 ${user.isBanned ? "bg-red-900/10" : ""}`}
                    >
                      <td
                        className="p-4 font-bold text-white cursor-pointer hover:text-system-blue"
                        onClick={() =>
                          openActionModal("EDIT_USER", user.username, user)
                        }
                      >
                        {user.username}
                      </td>
                      <td className="p-4 text-system-blue">{user.rank}</td>
                      <td className="p-4 font-mono">{user.currentXp}</td>
                      <td className="p-4 text-gray-400 font-mono">
                        {formatTimeAgo(user.lastActiveTimestamp)}
                      </td>
                      <td className="p-4">
                        {user.isBanned ? (
                          <span className="text-red-500 font-bold bg-red-900/20 px-2 py-1 rounded flex items-center gap-1 w-fit border border-red-500/50">
                            <Ban size={10} /> BANNED
                          </span>
                        ) : (
                          <span className="text-green-500 bg-green-900/20 px-2 py-1 rounded">
                            ACTIVE
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right flex justify-end gap-2">
                        <button
                          onClick={() =>
                            openActionModal("GIFT", user.username, user)
                          }
                          disabled={actionLoading !== null}
                          className="bg-gray-800 hover:bg-system-blue hover:text-white text-system-blue p-2 rounded transition-colors border border-gray-700 hover:border-system-blue disabled:opacity-50"
                          title="Gift XP"
                        >
                          <Gift size={14} />
                        </button>
                        <button
                          onClick={() =>
                            openActionModal("SET_XP", user.username, user)
                          }
                          disabled={actionLoading !== null}
                          className="bg-gray-800 hover:bg-white hover:text-black p-2 rounded transition-colors disabled:opacity-50"
                          title="Top Up Action XP"
                        >
                          <DollarSign size={14} />
                        </button>
                        <button
                          onClick={() =>
                            openActionModal("FORCE_UNBAN", user.username)
                          }
                          disabled={actionLoading !== null}
                          className="bg-green-600 hover:bg-green-500 text-white px-3 py-2 rounded font-bold uppercase text-[10px] flex items-center gap-2 shadow-lg w-32 justify-center"
                          title="Force Unban & Reset Timer"
                        >
                          <Unlock size={14} /> REVIVE
                        </button>
                        <button
                          onClick={() => openActionModal("BAN", user.username)}
                          disabled={actionLoading !== null}
                          className="bg-red-900/50 hover:bg-red-600 text-red-200 hover:text-white px-3 py-2 rounded text-[10px] flex items-center gap-2 transition-colors border border-red-900"
                          title="Ban Agent"
                        >
                          <Ban size={14} /> BAN
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      {loading ? "" : "No Agents Found."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <PaginationControls
              page={userPage}
              totalPages={Math.ceil(filteredUsers.length / PAGE_SIZE)}
              onPageChange={setUserPage}
            />
          </div>
        </div>
      )}

      {/* ... STORE, LOGS, FINANCE Tabs (Shortened for brevity as they follow similar structure) ... */}
      {activeTab === "STORE" && (
        // ... Store Content ...
        <div>
          <div className="flex justify-end gap-2 mb-4">
            <button
              onClick={() => setShowCatModal(true)}
              className="bg-gray-800 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-gray-700 transition-colors text-xs font-bold uppercase"
            >
              <Layers size={14} /> Manage Categories
            </button>
            <button
              onClick={() => setEditingItem({})}
              className="bg-system-blue text-black font-bold px-4 py-2 rounded flex items-center gap-2 hover:bg-white transition-colors text-xs uppercase"
            >
              <Plus size={14} /> ADD ITEM
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {storeItems.map((item) => (
              <div
                key={item.id}
                className="bg-gray-900 border border-gray-800 rounded group relative overflow-hidden flex flex-col"
              >
                {/* Item Card Content */}
                <div className="h-32 bg-gray-800 relative">
                  {item.image_url && (
                    <img
                      src={item.image_url}
                      className="w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-opacity"
                      alt=""
                    />
                  )}
                  <div className="absolute top-2 right-2 bg-black/80 text-white text-[10px] px-2 py-1 rounded">
                    {item.type}
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-bold text-white">{item.name}</div>
                    <div className="text-system-gold font-mono">
                      {item.cost} XP
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mb-4 h-10 line-clamp-2">
                    {item.description}
                  </div>
                  <div className="mt-auto flex gap-2">
                    <button
                      onClick={() => setEditingItem(item)}
                      className="flex-1 bg-gray-800 hover:bg-white hover:text-black py-2 rounded flex justify-center"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="flex-1 bg-red-900/50 hover:bg-red-600 text-white py-2 rounded flex justify-center"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "LOGS" && (
        <div className="bg-gray-900 border border-gray-800 rounded overflow-hidden overflow-x-auto flex flex-col">
          {/* Logs Table */}
          <div className="p-4 border-b border-gray-800 flex justify-between items-center min-w-[600px]">
            <h3 className="font-bold">System Audit Logs</h3>
            <button
              onClick={refreshCurrentView}
              className="text-xs text-system-blue hover:text-white"
            >
              <Activity size={14} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left text-xs min-w-[600px]">
              <thead className="bg-black border-b border-gray-800 text-gray-500 uppercase sticky top-0">
                <tr>
                  <th className="p-4">Time</th>
                  <th className="p-4">Agent</th>
                  <th className="p-4">Event</th>
                  <th className="p-4">Details</th>
                  <th className="p-4 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {paginatedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-800/50 font-mono">
                    <td className="p-4 text-gray-500">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="p-4 font-bold text-white">{log.username}</td>
                    <td className="p-4">
                      <span className="text-system-blue">{log.event_type}</span>
                    </td>
                    <td className="p-4 text-gray-500">{log.details}</td>
                    <td className="p-4 text-right">
                      {(log.event_type === "SUSPENSION" ||
                        log.event_type === "BAN") && (
                        <button
                          onClick={() =>
                            openActionModal("FORCE_UNBAN", log.username)
                          }
                          className="text-green-500 hover:text-green-400 font-bold uppercase text-[10px] flex items-center justify-end gap-1"
                        >
                          <Unlock size={12} /> REVIVE
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <PaginationControls
            page={logPage}
            totalPages={Math.ceil(logs.length / PAGE_SIZE)}
            onPageChange={setLogPage}
          />
        </div>
      )}

      {activeTab === "FINANCE" && (
        <div className="bg-gray-900 border border-gray-800 rounded overflow-hidden overflow-x-auto flex flex-col">
          {/* Finance Table */}
          <table className="w-full text-left text-xs min-w-[600px]">
            <thead className="bg-black border-b border-gray-800 text-gray-500 uppercase">
              <tr>
                <th className="p-4">Date</th>
                <th className="p-4">User</th>
                <th className="p-4">Type</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {paginatedTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-800/50">
                  <td className="p-4 text-gray-500">
                    {new Date(tx.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4 font-bold">{tx.username}</td>
                  <td className="p-4">{tx.type}</td>
                  <td
                    className={`p-4 font-mono font-bold ${tx.amount > 0 ? "text-green-400" : "text-white"}`}
                  >
                    {tx.amount}
                  </td>
                  <td className="p-4">{tx.status}</td>
                  <td className="p-4 text-right flex justify-end gap-2">
                    {tx.status === "PENDING" && (
                      <>
                        <button
                          onClick={() =>
                            handleTransactionAction(tx, "APPROVED")
                          }
                          className="p-1.5 bg-green-900 text-green-200 rounded hover:bg-green-700"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() =>
                            handleTransactionAction(tx, "REJECTED")
                          }
                          className="p-1.5 bg-red-900 text-red-200 rounded hover:bg-red-700"
                        >
                          <X size={14} />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <PaginationControls
            page={financePage}
            totalPages={Math.ceil(transactions.length / PAGE_SIZE)}
            onPageChange={setFinancePage}
          />
        </div>
      )}

      {activeTab === "COMMS" && (
        <div className="bg-gray-900 border border-gray-800 rounded p-6 max-w-2xl mx-auto shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-system-blue/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-system-blue/10 border border-system-blue/30 rounded">
              <RefreshCw size={24} className="text-system-blue" />
            </div>
            <div>
              <h2 className="text-xl font-bold uppercase tracking-tighter">
                System Manual Uplink
              </h2>
              <p className="text-xs text-gray-500 font-mono">
                Resend Integration Active: administrator@executioncabal.com
              </p>
            </div>
          </div>

          <form onSubmit={handleSendManualEmail} className="space-y-4">
            <div>
              <label className="text-[10px] text-gray-500 uppercase block mb-1">
                Recipient Address (AGENT_EMAIL)
              </label>
              <input
                type="email"
                required
                className="w-full bg-black border border-gray-800 p-3 text-white outline-none focus:border-system-blue font-mono"
                placeholder="target@cabal.com"
                value={manualEmail.to}
                onChange={(e) =>
                  setManualEmail({ ...manualEmail, to: e.target.value })
                }
              />
            </div>

            <div>
              <label className="text-[10px] text-gray-500 uppercase block mb-1">
                Directive Subject
              </label>
              <input
                type="text"
                required
                className="w-full bg-black border border-gray-800 p-3 text-white outline-none focus:border-system-blue font-mono"
                placeholder="[SYSTEM] Urgent Update Required"
                value={manualEmail.subject}
                onChange={(e) =>
                  setManualEmail({ ...manualEmail, subject: e.target.value })
                }
              />
            </div>

            <div>
              <label className="text-[10px] text-gray-500 uppercase block mb-1">
                Message Content (MARKDOWN_ENABLED)
              </label>
              <textarea
                required
                rows={8}
                className="w-full bg-black border border-gray-800 p-3 text-white outline-none focus:border-system-blue font-mono text-sm leading-relaxed"
                placeholder="Enter core directive instructions..."
                value={manualEmail.message}
                onChange={(e) =>
                  setManualEmail({ ...manualEmail, message: e.target.value })
                }
              />
            </div>

            <button
              type="submit"
              disabled={emailStatus === "sending"}
              className={`w-full py-4 font-bold text-xs uppercase tracking-[0.2em] rounded transition-all flex items-center justify-center gap-2 ${
                emailStatus === "sending"
                  ? "bg-gray-800 cursor-not-allowed"
                  : emailStatus === "success"
                    ? "bg-green-600 shadow-[0_0_20px_rgba(34,197,94,0.4)]"
                    : emailStatus === "error"
                      ? "bg-red-600 shadow-[0_0_20px_rgba(220,38,38,0.4)]"
                      : "bg-system-blue hover:bg-blue-600 shadow-[0_0_15px_rgba(0,162,255,0.4)]"
              }`}
            >
              {emailStatus === "sending" ? (
                <>
                  {" "}
                  <Loader2 size={16} className="animate-spin" /> Transmitting...
                </>
              ) : emailStatus === "success" ? (
                <>
                  {" "}
                  <Check size={16} /> Uplink Successful
                </>
              ) : emailStatus === "error" ? (
                <>
                  {" "}
                  <ShieldAlert size={16} /> Transmission Failed
                </>
              ) : (
                <>
                  {" "}
                  <Send size={16} /> Execute Broadcast
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-800">
            <h4 className="text-[10px] text-gray-500 uppercase font-mono mb-3">
              Transmission Protocols
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-black/50 border border-gray-800 rounded">
                <div className="text-[9px] text-gray-400 font-bold mb-1 underline">
                  ALIASING
                </div>
                <p className="text-[9px] text-gray-500 leading-tight">
                  Domain verification confirmed. administrator@ alias authorized
                  for global delivery.
                </p>
              </div>
              <div className="p-3 bg-black/50 border border-gray-800 rounded">
                <div className="text-[9px] text-gray-400 font-bold mb-1 underline">
                  SECURITY
                </div>
                <p className="text-[9px] text-gray-500 leading-tight">
                  All manual broadcasts are logged in the System Audit Log for
                  accountability.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ... Modals ... */}
      {/* (ActionModal, CatModal, EditItemModal code remains unchanged from previous version, just ensuring PaginationControls is used correctly above) */}

      {actionModal.isOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4">
          {/* ... (rest of action modal) ... */}
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-gray-900 border border-gray-700 p-6 rounded w-[95%] max-w-sm overflow-hidden"
          >
            {/* ... Modal Content ... */}
            <h3 className="text-xl font-bold text-white mb-2 uppercase">
              {actionModal.type === "GIFT" && "Send Grant"}
              {actionModal.type === "SET_XP" && "Override Balance"}
              {actionModal.type === "BAN" && "TERMINATE AGENT"}
              {actionModal.type === "FORCE_UNBAN" && "REVIVE AGENT"}
              {actionModal.type === "EDIT_USER" && "EDIT AGENT PROFILE"}
            </h3>
            <p className="text-xs text-gray-400 mb-4 font-mono">
              Target: {actionModal.targetUsername}
            </p>

            {actionModal.type === "EDIT_USER" && (
              <div className="space-y-4 mb-4">
                {/* Edit Form */}
                <div>
                  <label className="text-[10px] text-gray-500 uppercase block mb-1">
                    Rank
                  </label>
                  <select
                    className="w-full bg-black border border-gray-800 p-2 text-white outline-none"
                    value={editForm.rank}
                    onChange={(e) =>
                      setEditForm({ ...editForm, rank: e.target.value })
                    }
                  >
                    {["E", "D", "C", "B", "A", "S", "X"].map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-[10px] text-gray-500 uppercase block mb-1">
                      Level
                    </label>
                    <input
                      type="number"
                      className="w-full bg-black border border-gray-800 p-2 text-white"
                      value={editForm.level}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          level: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] text-gray-500 uppercase block mb-1">
                      Total Tasks
                    </label>
                    <input
                      type="number"
                      className="w-full bg-black border border-gray-800 p-2 text-white"
                      value={editForm.totalTasks}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          totalTasks: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase block mb-1">
                    Current XP
                  </label>
                  <input
                    type="number"
                    className="w-full bg-black border border-gray-800 p-2 text-white"
                    value={editForm.xp}
                    onChange={(e) =>
                      setEditForm({ ...editForm, xp: Number(e.target.value) })
                    }
                  />
                </div>
              </div>
            )}

            {(actionModal.type === "GIFT" || actionModal.type === "SET_XP") && (
              <div className="mb-4">
                <label className="text-[10px] text-gray-500 uppercase mb-1 block">
                  {actionModal.type === "GIFT"
                    ? "XP Amount to Add"
                    : "New Total XP Balance"}
                </label>
                <input
                  type="number"
                  className="w-full bg-black border border-gray-800 p-3 text-white outline-none focus:border-system-blue font-mono text-lg"
                  autoFocus
                  value={actionInputValue}
                  onChange={(e) => setActionInputValue(e.target.value)}
                  placeholder="0"
                />
              </div>
            )}

            {/* Confirm Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() =>
                  setActionModal({
                    isOpen: false,
                    type: null,
                    targetUsername: null,
                  })
                }
                className="flex-1 py-3 text-xs font-bold bg-gray-800 hover:bg-gray-700 rounded"
              >
                CANCEL
              </button>
              <button
                onClick={executeAction}
                className={`flex-1 py-3 text-xs font-bold text-white rounded ${actionModal.type === "FORCE_UNBAN" ? "bg-green-600 hover:bg-green-500" : "bg-system-blue hover:bg-blue-600"}`}
              >
                CONFIRM
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ... Category & Edit Item Modals (omitted for brevity, handled above) ... */}
      {showCatModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4">
          {/* ... Cat Modal Content ... */}
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-gray-900 border border-gray-700 p-6 rounded w-[95%] max-w-md max-h-[80vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Store Categories</h3>
              <button onClick={() => setShowCatModal(false)}>
                <X size={20} className="text-gray-500 hover:text-white" />
              </button>
            </div>

            <div className="mb-6 flex gap-2">
              <input
                placeholder="New Category Name"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="flex-1 bg-black border border-gray-800 p-2 text-white text-sm outline-none focus:border-system-blue"
              />
              <button
                onClick={handleAddCategory}
                className="bg-system-blue text-white p-2 rounded"
              >
                <Plus size={18} />
              </button>
            </div>

            <div className="space-y-2">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex justify-between items-center p-3 bg-gray-800 rounded"
                >
                  <div>
                    <div className="font-bold text-sm text-white">
                      {cat.name}
                    </div>
                    <div className="text-[10px] text-gray-500">{cat.id}</div>
                  </div>
                  {!["CONSUMABLE", "EQUIPMENT", "SPECIAL"].includes(cat.id) && (
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="text-red-500 hover:text-red-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {editingItem && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          {/* ... Edit Item Modal Content ... */}
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-gray-900 border border-gray-700 p-6 rounded w-[95%] max-w-md max-h-[90vh] overflow-y-auto"
          >
            <h3 className="text-xl font-bold text-white mb-4">
              Configure Artifact
            </h3>
            <div className="space-y-4">
              <input
                placeholder="Item Name"
                className="w-full bg-black border border-gray-800 p-2 text-white outline-none focus:border-system-blue"
                value={editingItem.name || ""}
                onChange={(e) =>
                  setEditingItem({ ...editingItem, name: e.target.value })
                }
              />
              <textarea
                placeholder="Description"
                className="w-full bg-black border border-gray-800 p-2 text-white outline-none focus:border-system-blue"
                value={editingItem.description || ""}
                onChange={(e) =>
                  setEditingItem({
                    ...editingItem,
                    description: e.target.value,
                  })
                }
              />
              <div className="flex gap-4">
                <input
                  type="number"
                  placeholder="Cost (XP)"
                  className="flex-1 bg-black border border-gray-800 p-2 text-white outline-none focus:border-system-blue"
                  value={editingItem.cost || ""}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      cost: Number(e.target.value),
                    })
                  }
                />
                <select
                  className="flex-1 bg-black border border-gray-800 p-2 text-white outline-none focus:border-system-blue"
                  value={editingItem.type || "CONSUMABLE"}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      type: e.target.value as any,
                    })
                  }
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                  <Image size={10} /> ARTIFACT VISUAL
                </label>

                <div className="flex gap-2">
                  <div className="flex-1">
                    <input
                      placeholder="https://..."
                      className="w-full bg-black border border-gray-800 p-2 text-white outline-none focus:border-system-blue text-xs rounded-l"
                      value={editingItem.image_url || ""}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          image_url: e.target.value,
                        })
                      }
                    />
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-gray-800 hover:bg-gray-700 text-white px-3 border border-gray-800 border-l-0 rounded-r flex items-center justify-center"
                    title="Upload Image"
                  >
                    <Upload size={14} />
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </div>

                {editingItem.image_url && (
                  <div className="mt-2 relative w-full h-32 bg-gray-800 rounded overflow-hidden border border-gray-700 group">
                    <img
                      src={editingItem.image_url}
                      className="w-full h-full object-cover"
                      alt="Preview"
                    />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() =>
                          setEditingItem({ ...editingItem, image_url: "" })
                        }
                        className="text-white bg-red-600/80 p-1 rounded"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                )}
                <p className="text-[9px] text-gray-600 mt-1 font-mono">
                  Supports HTTPS URL or Local Upload (Max 2MB)
                </p>
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                  <ExternalLink size={10} /> CONTENT LINK (PDF/eBook)
                </label>
                <input
                  placeholder="https://..."
                  className="w-full bg-black border border-gray-800 p-2 text-white outline-none focus:border-system-blue text-xs"
                  value={editingItem.content_link || ""}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      content_link: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveItem}
                className="bg-system-blue text-black font-bold px-6 py-2 rounded hover:bg-white transition-colors"
              >
                Save To Database
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
