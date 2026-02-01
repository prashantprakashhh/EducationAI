import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Sparkles, Bot, BrainCircuit, Zap, Scroll, Atom,
  MessageSquare, User, Trophy, Settings, LogOut, Brain,
  BarChart3, HelpCircle, ChevronLeft, ChevronRight, Flame,
  ThumbsUp, ThumbsDown, Star, Mic, Loader2, Trash2
} from 'lucide-react';
import StudentProfile from './StudentProfile';
import { QuickFeedbackButtons, FeedbackButton } from '../../components/AiFeedback';

// GraphQL Queries & Mutations
const GET_CHAT_HISTORY = gql`
  query GetChatHistory($userId: ID!) {
    chatHistory(userId: $userId) {
      id
      content
      sender
      persona
      timestamp
    }
  }
`;

const SEND_MESSAGE = gql`
  mutation SendMessage($userId: ID!, $content: String!, $persona: String!) {
    sendMessage(userId: $userId, content: $content, persona: $persona) {
      id
      content
      sender
      persona
      timestamp
    }
  }
`;

const CLEAR_CHAT = gql`
  mutation ClearChatHistory($userId: ID!) {
    clearChatHistory(userId: $userId)
  }
`;

const GET_PROFILE = gql`
  query GetStudentProfile($userId: ID!) {
    studentProfile(userId: $userId) {
      id
      displayName
      totalXp
      currentStreak
      level
      profileCompleted
    }
  }
`;

// Sidebar Navigation
const navItems = [
  { id: 'chat', label: 'AI Tutor', icon: MessageSquare, gradient: 'from-blue-500 to-cyan-500' },
  { id: 'profile', label: 'My Profile', icon: User, gradient: 'from-indigo-500 to-purple-500' },
  { id: 'progress', label: 'Progress', icon: BarChart3, gradient: 'from-emerald-500 to-teal-500' },
  { id: 'achievements', label: 'Achievements', icon: Trophy, gradient: 'from-amber-500 to-orange-500' },
];

// Persona Selector
const PersonaSelector = ({ selected, onSelect }) => {
  const personas = [
    { id: 'SOCRATIC', name: 'Socratic Coach', desc: 'Learn through questions', icon: BrainCircuit, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
    { id: 'NEWTON', name: 'Isaac Newton', desc: 'Science & Math expert', icon: Atom, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
    { id: 'SHAKESPEARE', name: 'Shakespeare', desc: 'Language & Literature', icon: Scroll, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  ];

  return (
    <div className="flex gap-3 p-4 overflow-x-auto scrollbar-hide border-b border-white/[0.05]">
      {personas.map((p) => (
        <button
          key={p.id}
          onClick={() => onSelect(p.id)}
          className={`
            flex items-center gap-3 px-5 py-4 rounded-2xl border transition-all duration-300 min-w-[200px]
            ${selected === p.id 
              ? `${p.bg} ${p.border} shadow-lg scale-[1.02]` 
              : 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.05]'}
          `}
        >
          <div className={`p-3 rounded-xl ${p.bg}`}>
            <p.icon size={22} className={p.color} />
          </div>
          <div className="text-left">
            <div className={`font-semibold ${selected === p.id ? 'text-white' : 'text-slate-300'}`}>
              {p.name}
            </div>
            <div className="text-xs text-slate-500">{p.desc}</div>
          </div>
          {selected === p.id && (
            <Sparkles className={`w-4 h-4 ${p.color} ml-auto`} />
          )}
        </button>
      ))}
    </div>
  );
};

// Chat Bubble with Feedback
const ChatBubble = ({ message, userId, showFeedback }) => {
  const isAi = message.sender === 'AI';
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex w-full mb-6 ${isAi ? 'justify-start' : 'justify-end'}`}
    >
      <div className={`flex max-w-[80%] ${isAi ? 'flex-row' : 'flex-row-reverse'} gap-4`}>
        {/* Avatar */}
        <div className={`
          flex-shrink-0 h-11 w-11 rounded-xl flex items-center justify-center shadow-lg
          ${isAi 
            ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white' 
            : 'bg-gradient-to-br from-pink-500 to-rose-500 text-white'}
        `}>
          {isAi ? <Bot size={22} /> : <span className="font-bold text-sm">ME</span>}
        </div>

        {/* Message Content */}
        <div className="flex flex-col gap-2">
          <div className={`
            p-5 rounded-2xl backdrop-blur-md border shadow-xl
            ${isAi 
              ? 'bg-white/[0.03] border-white/[0.08] rounded-tl-sm text-slate-200' 
              : 'bg-indigo-600/20 border-indigo-500/30 rounded-tr-sm text-white'}
          `}>
            {/* Persona Tag for AI */}
            {isAi && message.persona && (
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/[0.05]">
                <Sparkles size={12} className="text-indigo-400" />
                <span className="text-xs font-medium text-indigo-400 uppercase tracking-widest">
                  {message.persona}
                </span>
              </div>
            )}
            
            <p className="leading-relaxed text-[15px] whitespace-pre-wrap">
              {message.content}
            </p>
          </div>

          {/* Feedback for AI messages */}
          {isAi && showFeedback && (
            <div className="flex items-center gap-4 pl-2">
              <QuickFeedbackButtons userId={userId} messageId={message.id} />
              <FeedbackButton userId={userId} messageId={message.id} />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Sidebar Component
const Sidebar = ({ activeTab, onTabChange, user, profile, onLogout, collapsed, onToggleCollapse }) => (
  <motion.aside
    initial={false}
    animate={{ width: collapsed ? 80 : 280 }}
    className="h-screen bg-slate-900/70 border-r border-white/[0.05] flex flex-col backdrop-blur-xl flex-shrink-0"
  >
    {/* Logo */}
    <div className="p-4 border-b border-white/[0.05]">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0">
          <Brain className="w-6 h-6 text-white" />
        </div>
        {!collapsed && (
          <div>
            <div className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              EduAI
            </div>
            <div className="text-xs text-slate-500">AI Learning Platform</div>
          </div>
        )}
      </div>
    </div>

    {/* User Info */}
    <div className="p-4 border-b border-white/[0.05]">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center flex-shrink-0 text-white font-bold">
          {profile?.displayName?.charAt(0) || user?.fullName?.charAt(0) || '?'}
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <div className="text-sm font-semibold text-white truncate">
              {profile?.displayName || user?.fullName || 'Student'}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <div className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" />
                <span>Lvl {profile?.level || 1}</span>
              </div>
              <div className="flex items-center gap-1">
                <Flame className="w-3 h-3 text-orange-400" />
                <span>{profile?.currentStreak || 0} day</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Navigation */}
    <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onTabChange(item.id)}
          className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 relative ${
            activeTab === item.id
              ? 'bg-white/[0.08]'
              : 'hover:bg-white/[0.04]'
          }`}
        >
          <div className={`p-2 rounded-lg transition-all ${
            activeTab === item.id
              ? `bg-gradient-to-br ${item.gradient}`
              : 'bg-white/[0.05]'
          }`}>
            <item.icon className={`w-5 h-5 ${
              activeTab === item.id ? 'text-white' : 'text-slate-400'
            }`} />
          </div>
          {!collapsed && (
            <span className={`text-sm font-medium ${
              activeTab === item.id ? 'text-white' : 'text-slate-400'
            }`}>
              {item.label}
            </span>
          )}
        </button>
      ))}
    </nav>

    {/* Bottom Section */}
    <div className="p-3 border-t border-white/[0.05]">
      <button
        onClick={onLogout}
        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-red-500/10 transition-all group"
      >
        <div className="p-2 rounded-lg bg-white/[0.05] group-hover:bg-red-500/20">
          <LogOut className="w-5 h-5 text-slate-400 group-hover:text-red-400" />
        </div>
        {!collapsed && (
          <span className="text-sm text-slate-400 group-hover:text-red-400">Logout</span>
        )}
      </button>
      
      <button
        onClick={onToggleCollapse}
        className="w-full flex items-center justify-center p-2 rounded-xl hover:bg-white/[0.04] mt-2"
      >
        {collapsed ? <ChevronRight className="w-5 h-5 text-slate-500" /> : <ChevronLeft className="w-5 h-5 text-slate-500" />}
      </button>
    </div>
  </motion.aside>
);

// GraphQL Queries for Progress & Achievements
const GET_PROGRESS_STATS = gql`
  query GetProgressStats($userId: ID!) {
    progressStats(userId: $userId) {
      totalLearningMinutes
      totalLearningHours
      totalLearningDays
      totalQuizzes
      averageQuizAccuracy
      perfectScores
      totalXp
      currentStreak
      totalChatMessages
      totalBadges
    }
  }
`;

const GET_USER_BADGES = gql`
  query GetUserBadges($userId: ID!) {
    userBadges(userId: $userId) {
      id
      badgeType
      level
      name
      description
      icon
      earnedAt
    }
  }
`;

const GET_RECENT_QUIZZES = gql`
  query GetRecentQuizzes($userId: ID!, $limit: Int) {
    recentQuizzes(userId: $userId, limit: $limit) {
      id
      subject
      topic
      quizType
      totalQuestions
      correctAnswers
      accuracy
      xpEarned
      completedAt
    }
  }
`;

// Progress View (Real Data)
const ProgressView = ({ userId }) => {
  const { data, loading } = useQuery(GET_PROGRESS_STATS, {
    variables: { userId },
    skip: !userId
  });

  const { data: quizzesData } = useQuery(GET_RECENT_QUIZZES, {
    variables: { userId, limit: 5 },
    skip: !userId
  });

  const stats = data?.progressStats;
  const recentQuizzes = quizzesData?.recentQuizzes || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-6">Your Progress</h2>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-2xl p-6 border border-blue-500/20">
          <div className="text-4xl mb-2">📚</div>
          <div className="text-2xl font-bold text-white">{stats?.totalLearningDays || 0}</div>
          <div className="text-slate-400">Days Learning</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-2xl p-6 border border-purple-500/20">
          <div className="text-4xl mb-2">⏱️</div>
          <div className="text-2xl font-bold text-white">{(stats?.totalLearningHours || 0).toFixed(1)} hrs</div>
          <div className="text-slate-400">Learning Time</div>
        </div>
        <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-2xl p-6 border border-emerald-500/20">
          <div className="text-4xl mb-2">🎯</div>
          <div className="text-2xl font-bold text-white">{(stats?.averageQuizAccuracy || 0).toFixed(1)}%</div>
          <div className="text-slate-400">Quiz Accuracy</div>
        </div>
        <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-2xl p-6 border border-amber-500/20">
          <div className="text-4xl mb-2">�</div>
          <div className="text-2xl font-bold text-white">{stats?.currentStreak || 0}</div>
          <div className="text-slate-400">Day Streak</div>
        </div>
      </div>

      {/* More Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white/[0.03] rounded-2xl p-5 border border-white/[0.08]">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-white">{stats?.totalQuizzes || 0}</div>
              <div className="text-slate-400 text-sm">Quizzes Completed</div>
            </div>
            <div className="text-4xl">📝</div>
          </div>
        </div>
        <div className="bg-white/[0.03] rounded-2xl p-5 border border-white/[0.08]">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-white">{stats?.totalChatMessages || 0}</div>
              <div className="text-slate-400 text-sm">Messages with AI</div>
            </div>
            <div className="text-4xl">💬</div>
          </div>
        </div>
        <div className="bg-white/[0.03] rounded-2xl p-5 border border-white/[0.08]">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-white">{stats?.perfectScores || 0}</div>
              <div className="text-slate-400 text-sm">Perfect Scores</div>
            </div>
            <div className="text-4xl">💯</div>
          </div>
        </div>
      </div>

      {/* XP Progress */}
      <div className="bg-white/[0.03] rounded-2xl p-6 border border-white/[0.08] mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Total XP Earned</h3>
          <div className="text-2xl font-bold text-amber-400">{stats?.totalXp || 0} XP</div>
        </div>
        <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(((stats?.totalXp || 0) % 1000) / 10, 100)}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
        <div className="text-sm text-slate-500 mt-2">
          {1000 - ((stats?.totalXp || 0) % 1000)} XP to next milestone
        </div>
      </div>

      {/* Recent Quizzes */}
      {recentQuizzes.length > 0 && (
        <div className="bg-white/[0.03] rounded-2xl p-6 border border-white/[0.08]">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Quizzes</h3>
          <div className="space-y-3">
            {recentQuizzes.map((quiz) => (
              <div key={quiz.id} className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl">
                <div>
                  <div className="text-white font-medium">{quiz.subject}</div>
                  <div className="text-sm text-slate-500">{quiz.topic || quiz.quizType}</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className={`text-lg font-bold ${quiz.accuracy >= 80 ? 'text-emerald-400' : quiz.accuracy >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                    {quiz.accuracy.toFixed(0)}%
                  </div>
                  <div className="text-amber-400 text-sm">+{quiz.xpEarned} XP</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats?.totalQuizzes === 0 && stats?.totalChatMessages === 0 && (
        <div className="text-center py-12 text-slate-500">
          <div className="text-6xl mb-4">🚀</div>
          <p className="text-lg">Start chatting with your AI tutor to begin tracking your progress!</p>
        </div>
      )}
    </div>
  );
};

// Achievements View (Real Data)
const AchievementsView = ({ userId }) => {
  const { data, loading } = useQuery(GET_USER_BADGES, {
    variables: { userId },
    skip: !userId
  });

  const { data: statsData } = useQuery(GET_PROGRESS_STATS, {
    variables: { userId },
    skip: !userId
  });

  const earnedBadges = data?.userBadges || [];
  // eslint-disable-next-line no-unused-vars
  const stats = statsData?.progressStats;

  // All possible badges with requirements
  const allBadges = [
    { type: 'FIRST_CHAT', name: 'First Chat', desc: 'Start your learning journey', icon: '💬', requirement: 'Send your first message' },
    { type: 'ACCURACY_BEGINNER', name: 'Accuracy Beginner', desc: 'Achieve 70%+ quiz accuracy', icon: '�', requirement: '70%+ avg accuracy' },
    { type: 'ACCURACY_INTERMEDIATE', name: 'Accuracy Pro', desc: '80%+ accuracy over 5 quizzes', icon: '🎯', requirement: '5+ quizzes, 80%+ avg' },
    { type: 'ACCURACY_EXPERT', name: 'Accuracy Expert', desc: '90%+ accuracy over 10 quizzes', icon: '🎯', requirement: '10+ quizzes, 90%+ avg' },
    { type: 'PERFECT_SCORE', name: 'Perfect Score', desc: 'Get 100% on a quiz', icon: '💯', requirement: '100% on any quiz' },
    { type: 'STREAK_STARTER', name: 'Streak Starter', desc: '3 day learning streak', icon: '🔥', requirement: '3 consecutive days' },
    { type: 'STREAK_WARRIOR', name: 'Streak Warrior', desc: '7 day learning streak', icon: '🔥', requirement: '7 consecutive days' },
    { type: 'STREAK_CHAMPION', name: 'Streak Champion', desc: '30 day learning streak', icon: '🔥', requirement: '30 consecutive days' },
    { type: 'QUIZ_ROOKIE', name: 'Quiz Rookie', desc: 'Complete 5 quizzes', icon: '📝', requirement: '5 quizzes completed' },
    { type: 'QUIZ_VETERAN', name: 'Quiz Veteran', desc: 'Complete 25 quizzes', icon: '📝', requirement: '25 quizzes completed' },
    { type: 'QUIZ_MASTER', name: 'Quiz Master', desc: 'Complete 100 quizzes', icon: '📝', requirement: '100 quizzes completed' },
    { type: 'XP_MILESTONE_100', name: '100 XP Club', desc: 'Earn 100 XP', icon: '⭐', requirement: '100 total XP' },
    { type: 'XP_MILESTONE_500', name: '500 XP Club', desc: 'Earn 500 XP', icon: '⭐', requirement: '500 total XP' },
    { type: 'XP_MILESTONE_1000', name: '1000 XP Club', desc: 'Earn 1000 XP', icon: '⭐', requirement: '1000 total XP' },
    { type: 'MATH_WHIZ', name: 'Math Whiz', desc: '85%+ in Mathematics', icon: '�', requirement: '85%+ avg in Math quizzes' },
    { type: 'SCIENCE_STAR', name: 'Science Star', desc: '85%+ in Science', icon: '🔬', requirement: '85%+ avg in Science quizzes' },
    { type: 'EARLY_BIRD', name: 'Early Bird', desc: 'Study before 7 AM', icon: '🌅', requirement: 'Session before 7 AM' },
    { type: 'NIGHT_OWL', name: 'Night Owl', desc: 'Study after 10 PM', icon: '🦉', requirement: 'Session after 10 PM' },
  ];

  const earnedTypes = new Set(earnedBadges.map(b => b.badgeType));

  const getLevelColor = (level) => {
    switch (level) {
      case 'PLATINUM': return 'from-purple-400 to-pink-400';
      case 'GOLD': return 'from-amber-400 to-yellow-300';
      case 'SILVER': return 'from-slate-300 to-slate-400';
      default: return 'from-amber-600 to-amber-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Achievements</h2>
        <div className="flex items-center gap-2 text-amber-400">
          <Trophy className="w-5 h-5" />
          <span className="font-bold">{earnedBadges.length} / {allBadges.length}</span>
        </div>
      </div>

      {/* Earned Badges */}
      {earnedBadges.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-emerald-400 mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 fill-current" /> Earned Badges
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {earnedBadges.map((badge) => (
              <motion.div
                key={badge.id}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`p-5 rounded-2xl border bg-gradient-to-br ${getLevelColor(badge.level)}/10 border-${badge.level === 'GOLD' ? 'amber' : badge.level === 'SILVER' ? 'slate' : 'purple'}-500/30`}
              >
                <div className="text-4xl mb-3">{badge.icon}</div>
                <div className="font-semibold text-white">{badge.name}</div>
                <div className="text-sm text-slate-400">{badge.description}</div>
                <div className="mt-3 flex items-center justify-between">
                  <span className={`text-xs px-2 py-1 rounded-full bg-gradient-to-r ${getLevelColor(badge.level)} text-black font-medium`}>
                    {badge.level}
                  </span>
                  <Star className="w-4 h-4 text-emerald-400 fill-current" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Locked Badges */}
      <div>
        <h3 className="text-lg font-semibold text-slate-400 mb-4">Badges to Unlock</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {allBadges.filter(b => !earnedTypes.has(b.type)).map((badge) => (
            <div
              key={badge.type}
              className="p-5 rounded-2xl border bg-white/[0.02] border-white/[0.05] opacity-60"
            >
              <div className="text-4xl mb-3 grayscale">{badge.icon}</div>
              <div className="font-semibold text-slate-400">{badge.name}</div>
              <div className="text-sm text-slate-600">{badge.desc}</div>
              <div className="mt-3 text-xs text-slate-500">
                🔒 {badge.requirement}
              </div>
            </div>
          ))}
        </div>
      </div>

      {earnedBadges.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <div className="text-6xl mb-4">🏆</div>
          <p className="text-lg">Complete activities to earn your first badge!</p>
          <p className="text-sm mt-2">Start chatting with your AI tutor or take a quiz</p>
        </div>
      )}
    </div>
  );
};

// Chat View
const ChatView = ({ userId, profile }) => {
  const [activePersona, setActivePersona] = useState('SOCRATIC');
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const { data, loading, refetch } = useQuery(GET_CHAT_HISTORY, {
    variables: { userId },
    pollInterval: 3000
  });

  const [sendMessage, { loading: sending }] = useMutation(SEND_MESSAGE, {
    refetchQueries: [{ query: GET_CHAT_HISTORY, variables: { userId } }]
  });

  const [clearChat, { loading: clearing }] = useMutation(CLEAR_CHAT, {
    onCompleted: () => refetch()
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [data?.chatHistory]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const messageContent = input;
    setInput('');

    try {
      await sendMessage({
        variables: {
          userId,
          content: messageContent,
          persona: activePersona
        }
      });
    } catch (error) {
      console.error('Error sending message:', error);
      setInput(messageContent);
    }
  };

  const handleClearChat = async () => {
    if (window.confirm('Are you sure you want to clear all chat history? This cannot be undone.')) {
      try {
        await clearChat({ variables: { userId } });
      } catch (error) {
        console.error('Error clearing chat:', error);
      }
    }
  };

  const messages = data?.chatHistory || [];

  return (
    <div className="flex flex-col h-full">
      {/* Persona Selector with Clear Chat Button */}
      <div className="flex items-center justify-between border-b border-white/[0.05]">
        <PersonaSelector selected={activePersona} onSelect={setActivePersona} />
        {messages.length > 0 && (
          <button
            onClick={handleClearChat}
            disabled={clearing}
            className="mr-4 p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 
                     text-red-400 transition-all flex items-center gap-2"
            title="Clear chat history"
          >
            {clearing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            <span className="text-sm hidden sm:inline">Clear</span>
          </button>
        )}
      </div>

      {/* Welcome Message if no profile */}
      {!profile?.profileCompleted && (
        <div className="p-4 m-4 bg-indigo-500/10 border border-indigo-500/30 rounded-xl">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <div>
              <div className="text-white font-medium">Complete your profile!</div>
              <div className="text-sm text-slate-400">
                Set up your profile to get personalized learning experiences.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mb-4 border border-indigo-500/30">
              <BrainCircuit className="w-10 h-10 text-indigo-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Hi{profile?.displayName ? `, ${profile.displayName}` : ''}! 👋
            </h3>
            <p className="text-slate-400 max-w-md">
              I'm your AI tutor. Ask me anything about your studies - math problems, science concepts, writing help, or any subject you're curious about!
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg, index) => (
              <ChatBubble 
                key={msg.id} 
                message={msg} 
                userId={userId}
                showFeedback={msg.sender === 'AI' && index === messages.length - 1}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t border-white/[0.05]">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask ${activePersona === 'SOCRATIC' ? 'Socratic Coach' : activePersona === 'NEWTON' ? 'Newton' : 'Shakespeare'} anything...`}
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-5 py-4 pr-12
                       text-white placeholder-slate-500 outline-none
                       focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="px-6 py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium
                     hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all
                     flex items-center gap-2"
          >
            {sending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

// Main Layout Component
export default function StudentLayout({ user, onLogout }) {
  const userId = user?.id || "1";
  const [activeTab, setActiveTab] = useState('chat');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const { data: profileData } = useQuery(GET_PROFILE, {
    variables: { userId },
  });

  const profile = profileData?.studentProfile;

  const renderContent = () => {
    switch (activeTab) {
      case 'chat':
        return <ChatView userId={userId} profile={profile} />;
      case 'profile':
        return <StudentProfile userId={userId} />;
      case 'progress':
        return <ProgressView userId={userId} />;
      case 'achievements':
        return <AchievementsView userId={userId} />;
      default:
        return <ChatView userId={userId} profile={profile} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[600px] h-[600px] rounded-full bg-indigo-500/10 blur-3xl -top-48 -right-48" />
        <div className="absolute w-[400px] h-[400px] rounded-full bg-purple-500/10 blur-3xl -bottom-32 -left-32" />
      </div>

      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        user={user}
        profile={profile}
        onLogout={onLogout}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
