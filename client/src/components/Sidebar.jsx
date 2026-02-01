import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, User, Trophy, Settings, LogOut,
  Brain, BookOpen, BarChart3, HelpCircle, Sparkles,
  ChevronLeft, ChevronRight, Home, Zap
} from 'lucide-react';

const navItems = [
  { id: 'chat', label: 'AI Tutor', icon: MessageSquare, gradient: 'from-blue-500 to-cyan-500' },
  { id: 'profile', label: 'My Profile', icon: User, gradient: 'from-indigo-500 to-purple-500' },
  { id: 'progress', label: 'Progress', icon: BarChart3, gradient: 'from-emerald-500 to-teal-500' },
  { id: 'achievements', label: 'Achievements', icon: Trophy, gradient: 'from-amber-500 to-orange-500' },
];

const bottomItems = [
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'help', label: 'Help', icon: HelpCircle },
];

export default function Sidebar({ activeTab, onTabChange, user, onLogout, collapsed, onToggleCollapse }) {
  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 280 }}
      className="h-screen bg-slate-900/50 border-r border-white/[0.05] flex flex-col backdrop-blur-xl"
    >
      {/* Logo */}
      <div className="p-4 border-b border-white/[0.05]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                <div className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  EduAI
                </div>
                <div className="text-xs text-slate-500">AI Learning Platform</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-white/[0.05]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center flex-shrink-0 text-white font-bold">
            {user?.fullName?.charAt(0) || user?.username?.charAt(0) || '?'}
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="overflow-hidden"
              >
                <div className="text-sm font-semibold text-white truncate">
                  {user?.fullName || user?.username || 'Student'}
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>Level 1 Student</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${
              activeTab === item.id
                ? 'bg-white/[0.08] shadow-lg'
                : 'hover:bg-white/[0.04]'
            }`}
          >
            <div className={`p-2 rounded-lg ${
              activeTab === item.id
                ? `bg-gradient-to-br ${item.gradient}`
                : 'bg-white/[0.05] group-hover:bg-white/[0.1]'
            }`}>
              <item.icon className={`w-5 h-5 ${
                activeTab === item.id ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'
              }`} />
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className={`text-sm font-medium ${
                    activeTab === item.id ? 'text-white' : 'text-slate-400'
                  }`}
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
            {activeTab === item.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute left-0 w-1 h-8 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-r-full"
              />
            )}
          </button>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="p-3 border-t border-white/[0.05] space-y-1">
        {bottomItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/[0.04] transition-all"
          >
            <div className="p-2 rounded-lg bg-white/[0.05]">
              <item.icon className="w-5 h-5 text-slate-400" />
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="text-sm text-slate-400"
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        ))}

        {/* Logout Button */}
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-red-500/10 transition-all group"
        >
          <div className="p-2 rounded-lg bg-white/[0.05] group-hover:bg-red-500/20">
            <LogOut className="w-5 h-5 text-slate-400 group-hover:text-red-400" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="text-sm text-slate-400 group-hover:text-red-400"
              >
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* Collapse Toggle */}
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center p-2 rounded-xl hover:bg-white/[0.04] transition-all mt-2"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5 text-slate-500" />
          ) : (
            <ChevronLeft className="w-5 h-5 text-slate-500" />
          )}
        </button>
      </div>
    </motion.aside>
  );
}
