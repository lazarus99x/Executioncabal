import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserIcon,
  Users,
  BookOpen,
  Settings as SettingsIcon,
} from "lucide-react";

import Profile from "./Profile";
import ClientTracker from "./ClientTracker";
import Framework from "./Framework";

import { Player, Quest, Client, Currency } from "../types";

interface SettingsHubProps {
  // Profile Props
  player: Player;
  quests: Quest[];
  onUpdatePassword: (password: string) => Promise<void>;
  onUpdatePlayer?: (u: Partial<Player>) => void;
  onResetData?: () => void;
  onExportData?: () => void;
  isOnline?: boolean;
  lastSynced?: number;
  theme?: "light" | "dark";
  toggleTheme?: () => void;

  // Client Props
  clients: Client[];
  handleAddClient: (c: Omit<Client, "id" | "createdAt" | "updatedAt">) => void;
  handleUpdateClient: (id: string, updates: Partial<Client>) => void;
  handleDeleteClient: (id: string) => void;

  // General Props
  currency: Currency;
}

type TabType = "PROFILE" | "CLIENTS" | "PROTOCOL";

const SettingsHub: React.FC<SettingsHubProps> = ({
  player,
  quests,
  onUpdatePassword,
  onUpdatePlayer,
  onResetData,
  onExportData,
  isOnline,
  lastSynced,
  theme,
  toggleTheme,
  clients,
  handleAddClient,
  handleUpdateClient,
  handleDeleteClient,
  currency,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("PROFILE");

  const tabs = [
    { id: "PROFILE", label: "Profile & Config", icon: <UserIcon size={18} /> },
    { id: "CLIENTS", label: "Client Roster", icon: <Users size={18} /> },
    { id: "PROTOCOL", label: "The Protocol", icon: <BookOpen size={18} /> },
  ] as const;

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-black overflow-hidden relative">
      {/* Top Header / Tab Navigation */}
      <div className="bg-white dark:bg-[#0a0a0a] border-b border-gray-200 dark:border-gray-800 z-10 shrink-0">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="flex items-center gap-2 pt-6 mb-4">
            <SettingsIcon size={24} className="text-gray-900 dark:text-white" />
            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic">
              System Settings
            </h1>
          </div>
          
          <div className="flex gap-1 md:gap-4 overflow-x-auto custom-scrollbar pb-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 font-bold text-xs uppercase tracking-wider font-mono transition-colors whitespace-nowrap ${
                    isActive
                      ? "border-system-blue text-system-blue"
                      : "border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-900/50"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content Area */}
      <div className="flex-1 w-full h-full relative overflow-hidden bg-gray-50 dark:bg-black">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 h-full w-full"
          >
            {activeTab === "PROFILE" && (
              <Profile
                player={player}
                quests={quests}
                onUpdatePassword={onUpdatePassword}
                onUpdatePlayer={onUpdatePlayer}
                onResetData={onResetData}
                onExportData={onExportData}
                isOnline={isOnline}
                lastSynced={lastSynced}
                theme={theme}
                toggleTheme={toggleTheme}
              />
            )}
            {activeTab === "CLIENTS" && (
              <ClientTracker
                clients={clients}
                onAddClient={handleAddClient}
                onUpdateClient={handleUpdateClient}
                onDeleteClient={handleDeleteClient}
                currency={currency}
              />
            )}
            {activeTab === "PROTOCOL" && <Framework currency={currency} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SettingsHub;
