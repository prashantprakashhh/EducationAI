import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import {
  Send, Bot, BrainCircuit, Scroll, Atom,
  MessageSquare, User, Trophy, LogOut,
  BarChart3, ChevronLeft, ChevronRight,
  Loader2, Trash2, Star, Sparkles
} from 'lucide-react';
import StudentProfile from './StudentProfile';
import { QuickFeedbackButtons, FeedbackButton } from '../../components/AiFeedback';

// ─── GraphQL ────────────────────────────
const GET_CHAT_HISTORY = gql`
  query GetChatHistory($userId: ID!) {
    chatHistory(userId: $userId) { id content sender persona timestamp }
  }
`;
const SEND_MESSAGE = gql`
  mutation SendMessage($userId: ID!, $content: String!, $persona: String!) {
    sendMessage(userId: $userId, content: $content, persona: $persona) { id content sender persona timestamp }
  }
`;
const CLEAR_CHAT = gql`
  mutation ClearChatHistory($userId: ID!) { clearChatHistory(userId: $userId) }
`;
const GET_PROFILE = gql`
  query GetStudentProfile($userId: ID!) {
    studentProfile(userId: $userId) { id displayName totalXp currentStreak level profileCompleted }
  }
`;
const GET_PROGRESS_STATS = gql`
  query GetProgressStats($userId: ID!) {
    progressStats(userId: $userId) {
      totalLearningMinutes totalLearningHours totalLearningDays totalQuizzes
      averageQuizAccuracy perfectScores totalXp currentStreak totalChatMessages totalBadges
    }
  }
`;
const GET_USER_BADGES = gql`
  query GetUserBadges($userId: ID!) {
    userBadges(userId: $userId) { id badgeType level name description icon earnedAt }
  }
`;
const GET_RECENT_QUIZZES = gql`
  query GetRecentQuizzes($userId: ID!, $limit: Int) {
    recentQuizzes(userId: $userId, limit: $limit) {
      id subject topic quizType totalQuestions correctAnswers accuracy xpEarned completedAt
    }
  }
`;

// ─── Nav items ──────────────────────────
const navItems = [
  { id: 'chat', label: 'AI Tutor', icon: MessageSquare },
  { id: 'profile', label: 'My Profile', icon: User },
  { id: 'progress', label: 'Progress', icon: BarChart3 },
  { id: 'achievements', label: 'Achievements', icon: Trophy },
];

// ─── Persona Selector ───────────────────
const PersonaSelector = ({ selected, onSelect }) => {
  const personas = [
    { id: 'SOCRATIC', name: 'Socratic Coach', desc: 'Learn through questions', icon: BrainCircuit },
    { id: 'NEWTON', name: 'Isaac Newton', desc: 'Science & Math expert', icon: Atom },
    { id: 'SHAKESPEARE', name: 'Shakespeare', desc: 'Language & Literature', icon: Scroll },
  ];
  return (
    <div className="flex gap-2 p-3 overflow-x-auto border-b border-gray-200">
      {personas.map(p => (
        <button key={p.id} onClick={() => onSelect(p.id)}
          className={`flex items-center gap-2.5 px-4 py-3 rounded-lg border text-sm min-w-[180px] transition-all ${
            selected === p.id
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
          }`}>
          <p.icon size={18} />
          <div className="text-left">
            <div className="font-medium">{p.name}</div>
            <div className="text-xs text-gray-400">{p.desc}</div>
          </div>
        </button>
      ))}
    </div>
  );
};

// ─── Chat Bubble ────────────────────────
const ChatBubble = ({ message, userId, showFeedback }) => {
  const isAi = message.sender === 'AI';
  return (
    <div className={`flex w-full mb-4 ${isAi ? 'justify-start' : 'justify-end'}`}>
      <div className={`flex max-w-[75%] ${isAi ? 'flex-row' : 'flex-row-reverse'} gap-3`}>
        <div className={`flex-shrink-0 h-9 w-9 rounded-lg flex items-center justify-center text-white text-sm font-bold ${
          isAi ? 'bg-blue-600' : 'bg-gray-700'}`}>
          {isAi ? <Bot size={18} /> : 'ME'}
        </div>
        <div className="flex flex-col gap-1.5">
          <div className={`px-4 py-3 rounded-xl text-sm leading-relaxed ${
            isAi
              ? 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'
              : 'bg-blue-600 text-white rounded-tr-sm'
          }`}>
            {isAi && message.persona && (
              <div className="text-[11px] font-medium text-blue-500 uppercase tracking-wider mb-1.5 pb-1.5 border-b border-gray-100">
                {message.persona}
              </div>
            )}
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
          {isAi && showFeedback && (
            <div className="flex items-center gap-3 pl-1">
              <QuickFeedbackButtons userId={userId} messageId={message.id} />
              <FeedbackButton userId={userId} messageId={message.id} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Sidebar ────────────────────────────
const Sidebar = ({ activeTab, onTabChange, user, profile, onLogout, collapsed, onToggleCollapse }) => (
  <aside style={{ width: collapsed ? 64 : 240 }}
    className="h-screen bg-white border-r border-gray-200 flex flex-col flex-shrink-0 transition-all duration-200">
    {/* Logo */}
    <div className="p-3 border-b border-gray-100">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
          <BrainCircuit className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <div>
            <div className="text-sm font-bold text-gray-900">EduAI</div>
            <div className="text-[10px] text-gray-400">Learning Platform</div>
          </div>
        )}
      </div>
    </div>

    {/* User */}
    <div className="p-3 border-b border-gray-100">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 text-sm font-bold text-gray-600">
          {profile?.displayName?.charAt(0) || user?.fullName?.charAt(0) || '?'}
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <div className="text-sm font-medium text-gray-900 truncate">
              {profile?.displayName || user?.fullName || 'Student'}
            </div>
            <div className="text-xs text-gray-400">
              Lvl {profile?.level || 1} · {profile?.currentStreak || 0}🔥
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Nav */}
    <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
      {navItems.map(item => (
        <button key={item.id} onClick={() => onTabChange(item.id)}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
            activeTab === item.id
              ? 'bg-blue-50 text-blue-700 font-medium'
              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
          }`}>
          <item.icon className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>{item.label}</span>}
        </button>
      ))}
    </nav>

    {/* Bottom */}
    <div className="p-2 border-t border-gray-100">
      <button onClick={onLogout}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-all">
        <LogOut className="w-4 h-4" />
        {!collapsed && <span>Logout</span>}
      </button>
      <button onClick={onToggleCollapse}
        className="w-full flex items-center justify-center p-1.5 rounded-lg hover:bg-gray-50 mt-1">
        {collapsed ? <ChevronRight className="w-4 h-4 text-gray-400" /> : <ChevronLeft className="w-4 h-4 text-gray-400" />}
      </button>
    </div>
  </aside>
);

// ─── Progress View ──────────────────────
const ProgressView = ({ userId }) => {
  const { data, loading } = useQuery(GET_PROGRESS_STATS, { variables: { userId }, skip: !userId });
  const { data: quizzesData } = useQuery(GET_RECENT_QUIZZES, { variables: { userId, limit: 5 }, skip: !userId });
  const stats = data?.progressStats;
  const recentQuizzes = quizzesData?.recentQuizzes || [];

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Your Progress</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { emoji: '📚', val: stats?.totalLearningDays || 0, label: 'Days Learning' },
          { emoji: '⏱️', val: `${(stats?.totalLearningHours || 0).toFixed(1)} hrs`, label: 'Learning Time' },
          { emoji: '🎯', val: `${(stats?.averageQuizAccuracy || 0).toFixed(1)}%`, label: 'Quiz Accuracy' },
          { emoji: '🔥', val: stats?.currentStreak || 0, label: 'Day Streak' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="text-2xl mb-2">{s.emoji}</div>
            <div className="text-2xl font-bold text-gray-900">{s.val}</div>
            <div className="text-sm text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { emoji: '📝', val: stats?.totalQuizzes || 0, label: 'Quizzes' },
          { emoji: '💬', val: stats?.totalChatMessages || 0, label: 'AI Messages' },
          { emoji: '💯', val: stats?.perfectScores || 0, label: 'Perfect Scores' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900">{s.val}</div>
              <div className="text-sm text-gray-500">{s.label}</div>
            </div>
            <span className="text-3xl">{s.emoji}</span>
          </div>
        ))}
      </div>

      {/* XP Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Total XP</h3>
          <span className="text-lg font-bold text-amber-600">{stats?.totalXp || 0} XP</span>
        </div>
        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-amber-500 rounded-full transition-all"
            style={{ width: `${Math.min(((stats?.totalXp || 0) % 1000) / 10, 100)}%` }} />
        </div>
        <p className="text-xs text-gray-400 mt-1.5">{1000 - ((stats?.totalXp || 0) % 1000)} XP to next milestone</p>
      </div>

      {/* Recent Quizzes */}
      {recentQuizzes.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Recent Quizzes</h3>
          <div className="space-y-2">
            {recentQuizzes.map(q => (
              <div key={q.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-gray-900">{q.subject}</div>
                  <div className="text-xs text-gray-500">{q.topic || q.quizType}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-bold ${q.accuracy >= 80 ? 'text-green-600' : q.accuracy >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                    {q.accuracy.toFixed(0)}%
                  </span>
                  <span className="text-xs text-amber-600">+{q.xpEarned} XP</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats?.totalQuizzes === 0 && stats?.totalChatMessages === 0 && (
        <div className="text-center py-12 text-gray-400">
          <div className="text-5xl mb-3">🚀</div>
          <p>Start chatting with your AI tutor to begin tracking progress!</p>
        </div>
      )}
    </div>
  );
};

// ─── Achievements View ──────────────────
const AchievementsView = ({ userId }) => {
  const { data, loading } = useQuery(GET_USER_BADGES, { variables: { userId }, skip: !userId });
  const earnedBadges = data?.userBadges || [];

  const allBadges = [
    { type: 'FIRST_CHAT', name: 'First Chat', desc: 'Start your learning journey', icon: '💬', requirement: 'Send your first message' },
    { type: 'ACCURACY_BEGINNER', name: 'Accuracy Beginner', desc: '70%+ quiz accuracy', icon: '🎯', requirement: '70%+ avg accuracy' },
    { type: 'ACCURACY_INTERMEDIATE', name: 'Accuracy Pro', desc: '80%+ accuracy', icon: '🎯', requirement: '5+ quizzes, 80%+ avg' },
    { type: 'ACCURACY_EXPERT', name: 'Accuracy Expert', desc: '90%+ accuracy', icon: '🎯', requirement: '10+ quizzes, 90%+ avg' },
    { type: 'PERFECT_SCORE', name: 'Perfect Score', desc: '100% on a quiz', icon: '💯', requirement: '100% on any quiz' },
    { type: 'STREAK_STARTER', name: 'Streak Starter', desc: '3 day streak', icon: '🔥', requirement: '3 consecutive days' },
    { type: 'STREAK_WARRIOR', name: 'Streak Warrior', desc: '7 day streak', icon: '🔥', requirement: '7 consecutive days' },
    { type: 'STREAK_CHAMPION', name: 'Streak Champion', desc: '30 day streak', icon: '🔥', requirement: '30 consecutive days' },
    { type: 'QUIZ_ROOKIE', name: 'Quiz Rookie', desc: 'Complete 5 quizzes', icon: '📝', requirement: '5 quizzes' },
    { type: 'QUIZ_VETERAN', name: 'Quiz Veteran', desc: 'Complete 25 quizzes', icon: '📝', requirement: '25 quizzes' },
    { type: 'QUIZ_MASTER', name: 'Quiz Master', desc: 'Complete 100 quizzes', icon: '📝', requirement: '100 quizzes' },
    { type: 'XP_MILESTONE_100', name: '100 XP Club', desc: 'Earn 100 XP', icon: '⭐', requirement: '100 total XP' },
    { type: 'XP_MILESTONE_500', name: '500 XP Club', desc: 'Earn 500 XP', icon: '⭐', requirement: '500 total XP' },
    { type: 'XP_MILESTONE_1000', name: '1000 XP Club', desc: 'Earn 1000 XP', icon: '⭐', requirement: '1000 total XP' },
    { type: 'MATH_WHIZ', name: 'Math Whiz', desc: '85%+ in Math', icon: '🧮', requirement: '85%+ avg in Math' },
    { type: 'SCIENCE_STAR', name: 'Science Star', desc: '85%+ in Science', icon: '🔬', requirement: '85%+ avg in Science' },
    { type: 'EARLY_BIRD', name: 'Early Bird', desc: 'Study before 7 AM', icon: '🌅', requirement: 'Session before 7 AM' },
    { type: 'NIGHT_OWL', name: 'Night Owl', desc: 'Study after 10 PM', icon: '🦉', requirement: 'Session after 10 PM' },
  ];
  const earnedTypes = new Set(earnedBadges.map(b => b.badgeType));

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Achievements</h2>
        <div className="flex items-center gap-1.5 text-amber-600 font-bold text-sm">
          <Trophy className="w-4 h-4" /> {earnedBadges.length} / {allBadges.length}
        </div>
      </div>

      {earnedBadges.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-green-600 mb-3 flex items-center gap-1.5">
            <Star className="w-4 h-4" /> Earned
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {earnedBadges.map(badge => (
              <div key={badge.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="text-3xl mb-2">{badge.icon}</div>
                <div className="text-sm font-semibold text-gray-900">{badge.name}</div>
                <div className="text-xs text-gray-500">{badge.description}</div>
                <span className="inline-block mt-2 text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded bg-amber-50 text-amber-700">
                  {badge.level}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold text-gray-400 mb-3">Locked</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {allBadges.filter(b => !earnedTypes.has(b.type)).map(badge => (
            <div key={badge.type} className="bg-gray-50 rounded-xl border border-gray-100 p-4 opacity-60">
              <div className="text-3xl mb-2 grayscale">{badge.icon}</div>
              <div className="text-sm font-medium text-gray-500">{badge.name}</div>
              <div className="text-xs text-gray-400">{badge.desc}</div>
              <div className="text-[10px] text-gray-400 mt-2">🔒 {badge.requirement}</div>
            </div>
          ))}
        </div>
      </div>

      {earnedBadges.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <div className="text-5xl mb-3">🏆</div>
          <p>Complete activities to earn your first badge!</p>
        </div>
      )}
    </div>
  );
};

// ─── Chat View ──────────────────────────
const ChatView = ({ userId, profile }) => {
  const [activePersona, setActivePersona] = useState('SOCRATIC');
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const { data, loading, refetch } = useQuery(GET_CHAT_HISTORY, { variables: { userId }, pollInterval: 3000 });
  const [sendMessage, { loading: sending }] = useMutation(SEND_MESSAGE, {
    refetchQueries: [{ query: GET_CHAT_HISTORY, variables: { userId } }]
  });
  const [clearChat, { loading: clearing }] = useMutation(CLEAR_CHAT, { onCompleted: () => refetch() });

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => { scrollToBottom(); }, [data?.chatHistory]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending) return;
    const msg = input;
    setInput('');
    try { await sendMessage({ variables: { userId, content: msg, persona: activePersona } }); }
    catch { setInput(msg); }
  };

  const handleClear = async () => {
    if (window.confirm('Clear all chat history? This cannot be undone.')) {
      try { await clearChat({ variables: { userId } }); } catch (e) { console.error(e); }
    }
  };

  const messages = data?.chatHistory || [];

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Persona + Clear */}
      <div className="flex items-center justify-between bg-white">
        <PersonaSelector selected={activePersona} onSelect={setActivePersona} />
        {messages.length > 0 && (
          <button onClick={handleClear} disabled={clearing}
            className="mr-3 p-2 rounded-lg text-red-500 hover:bg-red-50 transition-all flex items-center gap-1.5 text-sm">
            {clearing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            <span className="hidden sm:inline">Clear</span>
          </button>
        )}
      </div>

      {/* Profile prompt */}
      {!profile?.profileCompleted && (
        <div className="p-3 m-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
          <span className="font-medium text-blue-700">Complete your profile</span>
          <span className="text-blue-600"> to get personalized learning.</span>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
              <BrainCircuit className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Hi{profile?.displayName ? `, ${profile.displayName}` : ''}! 👋
            </h3>
            <p className="text-gray-500 text-sm max-w-md">
              I'm your AI tutor. Ask me anything about your studies!
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => (
              <ChatBubble key={msg.id} message={msg} userId={userId}
                showFeedback={msg.sender === 'AI' && idx === messages.length - 1} />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-3 border-t border-gray-200 bg-white">
        <div className="flex gap-2">
          <input type="text" value={input} onChange={e => setInput(e.target.value)}
            placeholder={`Ask ${activePersona === 'SOCRATIC' ? 'Socratic Coach' : activePersona === 'NEWTON' ? 'Newton' : 'Shakespeare'} anything...`}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900
                     focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
          />
          <button type="submit" disabled={!input.trim() || sending}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 flex items-center gap-1.5">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </form>
    </div>
  );
};

// ─── Main Layout ────────────────────────
export default function StudentLayout({ user, onLogout }) {
  const userId = user?.id || "1";
  const [activeTab, setActiveTab] = useState('chat');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const { data: profileData } = useQuery(GET_PROFILE, { variables: { userId } });
  const profile = profileData?.studentProfile;

  const renderContent = () => {
    switch (activeTab) {
      case 'chat': return <ChatView userId={userId} profile={profile} />;
      case 'profile': return <StudentProfile userId={userId} />;
      case 'progress': return <ProgressView userId={userId} />;
      case 'achievements': return <AchievementsView userId={userId} />;
      default: return <ChatView userId={userId} profile={profile} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} user={user} profile={profile}
        onLogout={onLogout} collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <main className="flex-1 overflow-hidden">{renderContent()}</main>
    </div>
  );
}
