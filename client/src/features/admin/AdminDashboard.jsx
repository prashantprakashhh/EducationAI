import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { 
  Users, Shield, Plus, Search, 
  MoreHorizontal, XCircle, 
  TrendingUp, Zap, Clock,
  Sparkles, Bell, Settings,
  GraduationCap, UserCog, BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================
// GRAPHQL OPERATIONS
// ============================================

const GET_ADMIN_DATA = gql`
  query GetAdminData {
    allUsers {
      id
      username
      fullName
      role
    }
    systemStatus
    adminStats {
      totalUsers
      totalStudents
      totalTeachers
      activeUsersToday
      totalQuizzesToday
      totalMessagesToday
      averageAccuracy
      totalBadgesAwarded
    }
  }
`;

const CREATE_USER = gql`
  mutation CreateUser($username: String!, $fullName: String!, $role: Role!) {
    createUser(username: $username, fullName: $fullName, role: $role) {
      id
      username
    }
  }
`;

// ============================================
// ANIMATION VARIANTS
// ============================================

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
};

// ============================================
// MICRO COMPONENTS
// ============================================

const StatusIndicator = ({ status = 'online' }) => {
  const colors = {
    online: 'bg-emerald-500',
    offline: 'bg-slate-500',
    busy: 'bg-amber-500'
  };
  
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${colors[status]} opacity-75`} />
      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${colors[status]}`} />
    </span>
  );
};

const GlassCard = ({ children, className = '', hover = true, ...props }) => (
  <motion.div
    className={`
      relative overflow-hidden rounded-2xl
      bg-white/[0.03] backdrop-blur-xl
      border border-white/[0.06]
      ${hover ? 'transition-all duration-300 hover:bg-white/[0.05] hover:border-white/[0.1] hover:-translate-y-1 hover:shadow-card-hover' : ''}
      ${className}
    `}
    {...props}
  >
    {/* Subtle inner glow */}
    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
    <div className="relative z-10">{children}</div>
  </motion.div>
);

const RoleBadge = ({ role }) => {
  const config = {
    ADMIN: { 
      bg: 'bg-purple-500/10', 
      text: 'text-purple-400', 
      border: 'border-purple-500/20',
      icon: UserCog
    },
    TEACHER: { 
      bg: 'bg-blue-500/10', 
      text: 'text-blue-400', 
      border: 'border-blue-500/20',
      icon: GraduationCap
    },
    STUDENT: { 
      bg: 'bg-amber-500/10', 
      text: 'text-amber-400', 
      border: 'border-amber-500/20',
      icon: BookOpen
    },
    PARENT: { 
      bg: 'bg-emerald-500/10', 
      text: 'text-emerald-400', 
      border: 'border-emerald-500/20',
      icon: Users
    }
  };
  
  const { bg, text, border, icon: Icon } = config[role] || config.STUDENT;
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold uppercase tracking-wider ${bg} ${text} border ${border}`}>
      <Icon size={12} />
      {role}
    </span>
  );
};

const StatCard = ({ label, value, icon: IconComponent, trend, color, delay = 0 }) => {
  const colorClasses = {
    blue: 'from-blue-500/20 to-blue-600/5 text-blue-400',
    purple: 'from-purple-500/20 to-purple-600/5 text-purple-400',
    emerald: 'from-emerald-500/20 to-emerald-600/5 text-emerald-400',
    amber: 'from-amber-500/20 to-amber-600/5 text-amber-400'
  };

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      transition={{ delay, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <GlassCard className="p-6 group cursor-default">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClasses[color]}`}>
            <IconComponent size={22} strokeWidth={1.5} />
          </div>
          {trend && (
            <div className="flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">
              <TrendingUp size={12} />
              {trend}
            </div>
          )}
        </div>
        <div className="space-y-1">
          <div className="text-3xl font-bold text-white tracking-tight">{value}</div>
          <div className="text-sm text-slate-400 font-medium">{label}</div>
        </div>
      </GlassCard>
    </motion.div>
  );
};

const UserRow = ({ user, index }) => (
  <motion.tr
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.05, duration: 0.3 }}
    className="group border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors cursor-default"
  >
    <td className="px-6 py-4">
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-sm font-semibold text-white ring-2 ring-white/10">
            {user.fullName?.charAt(0) || user.username.charAt(0).toUpperCase()}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5">
            <StatusIndicator status="online" />
          </div>
        </div>
        <div>
          <div className="font-semibold text-white group-hover:text-blue-400 transition-colors">
            {user.fullName || 'Unnamed User'}
          </div>
          <div className="text-xs text-slate-500">ID: {user.id}</div>
        </div>
      </div>
    </td>
    <td className="px-6 py-4">
      <span className="text-sm text-slate-400 font-mono">@{user.username}</span>
    </td>
    <td className="px-6 py-4">
      <RoleBadge role={user.role} />
    </td>
    <td className="px-6 py-4">
      <div className="flex items-center gap-2">
        <StatusIndicator status="online" />
        <span className="text-sm text-emerald-400 font-medium">Active</span>
      </div>
    </td>
    <td className="px-6 py-4">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Clock size={14} />
        <span>Just now</span>
      </div>
    </td>
    <td className="px-6 py-4">
      <button className="p-2 rounded-lg hover:bg-white/[0.05] text-slate-500 hover:text-white transition-all opacity-0 group-hover:opacity-100">
        <MoreHorizontal size={18} />
      </button>
    </td>
  </motion.tr>
);

// ============================================
// LOADING STATE
// ============================================

const LoadingState = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center"
    >
      {/* Animated Logo */}
      <div className="relative mb-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center"
        >
          <Sparkles size={28} className="text-white" />
        </motion.div>
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 rounded-2xl bg-blue-500/20 blur-xl"
        />
      </div>
      
      {/* Loading Text */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-center"
      >
        <h2 className="text-xl font-semibold text-white mb-2">Initializing EduAI</h2>
        <p className="text-slate-500">Loading neural systems...</p>
      </motion.div>
      
      {/* Progress Bar */}
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: '200px' }}
        className="mt-6 h-1 bg-white/10 rounded-full overflow-hidden"
      >
        <motion.div
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="h-full w-1/2 bg-gradient-to-r from-transparent via-blue-500 to-transparent"
        />
      </motion.div>
    </motion.div>
  </div>
);

// ============================================
// CREATE USER MODAL
// ============================================

const CreateUserModal = ({ isOpen, onClose, onSubmit, formData, setFormData }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          onClick={onClose}
        />
        
        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50"
        >
          <div className="bg-[#141421]/95 backdrop-blur-xl rounded-3xl border border-white/[0.08] shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-white/[0.06]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-500/10">
                    <Plus size={20} className="text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Create New User</h2>
                    <p className="text-xs text-slate-500">Add a new member to EduAI</p>
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 rounded-xl hover:bg-white/[0.05] text-slate-400 hover:text-white transition-all"
                >
                  <XCircle size={20} />
                </button>
              </div>
            </div>
            
            {/* Form */}
            <form onSubmit={onSubmit} className="p-6 space-y-5">
              {/* Full Name */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Full Name
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Albert Einstein"
                  value={formData.fullName}
                  onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>
              
              {/* Username */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Username
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600">@</span>
                  <input
                    required
                    type="text"
                    placeholder="einstein_01"
                    value={formData.username}
                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                    className="w-full pl-8 pr-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
              </div>
              
              {/* Role */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Role
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {['TEACHER', 'STUDENT', 'ADMIN', 'PARENT'].map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setFormData({ ...formData, role })}
                      className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                        formData.role === role
                          ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                          : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:bg-white/[0.04] hover:text-white'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0"
              >
                Create Account
              </button>
            </form>
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

// ============================================
// MAIN COMPONENT
// ============================================

export default function AdminDashboard() {
  const { loading, error, data } = useQuery(GET_ADMIN_DATA);
  const [createUser] = useMutation(CREATE_USER, {
    refetchQueries: [{ query: GET_ADMIN_DATA }]
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({ fullName: '', username: '', role: 'TEACHER' });

  // Memoize users array
  const allUsers = useMemo(() => data?.allUsers ?? [], [data?.allUsers]);
  
  // Filter users based on search
  const filteredUsers = useMemo(() => {
    if (!searchQuery) return allUsers;
    
    const query = searchQuery.toLowerCase();
    return allUsers.filter(user => 
      user.fullName?.toLowerCase().includes(query) ||
      user.username.toLowerCase().includes(query) ||
      user.role.toLowerCase().includes(query)
    );
  }, [allUsers, searchQuery]);

  // Calculate stats from real data
  const stats = useMemo(() => {
    const adminStats = data?.adminStats;
    return {
      total: adminStats?.totalUsers || allUsers.length,
      teachers: adminStats?.totalTeachers || allUsers.filter(u => u.role === 'TEACHER').length,
      students: adminStats?.totalStudents || allUsers.filter(u => u.role === 'STUDENT').length,
      admins: allUsers.filter(u => u.role === 'ADMIN').length,
      activeToday: adminStats?.activeUsersToday || 0,
      quizzesToday: adminStats?.totalQuizzesToday || 0,
      messagesToday: adminStats?.totalMessagesToday || 0,
      avgAccuracy: adminStats?.averageAccuracy || 0,
      totalBadges: adminStats?.totalBadgesAwarded || 0,
    };
  }, [allUsers, data?.adminStats]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createUser({ variables: formData });
      setIsModalOpen(false);
      setFormData({ fullName: '', username: '', role: 'TEACHER' });
    } catch (err) {
      console.error('Error creating user:', err);
    }
  };

  if (loading) return <LoadingState />;
  
  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
      <div className="text-center">
        <div className="h-16 w-16 mx-auto mb-4 rounded-2xl bg-red-500/10 flex items-center justify-center">
          <XCircle size={28} className="text-red-500" />
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">Connection Error</h2>
        <p className="text-slate-500">{error.message}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* ============================================
          TOP NAVIGATION BAR
          ============================================ */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#0a0a0f]/80 backdrop-blur-xl">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Brand */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                    <Shield size={20} className="text-white" />
                  </div>
                  <div className="absolute -inset-1 rounded-xl bg-blue-500/20 blur-md -z-10" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white tracking-tight">EduAI</h1>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-medium">Admin Console</p>
                </div>
              </div>
            </div>

            {/* Center - System Status */}
            <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <StatusIndicator status="online" />
              <span className="text-sm font-medium text-emerald-400">{data.systemStatus}</span>
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-3">
              <button className="p-2.5 rounded-xl hover:bg-white/[0.05] text-slate-400 hover:text-white transition-all relative">
                <Bell size={20} />
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500" />
              </button>
              <button className="p-2.5 rounded-xl hover:bg-white/[0.05] text-slate-400 hover:text-white transition-all">
                <Settings size={20} />
              </button>
              <div className="h-6 w-px bg-white/10 mx-1" />
              <button className="flex items-center gap-3 pl-3 pr-4 py-2 rounded-xl hover:bg-white/[0.05] transition-all group">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-sm font-semibold ring-2 ring-white/10 group-hover:ring-white/20 transition-all">
                  A
                </div>
                <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">Admin</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ============================================
          MAIN CONTENT
          ============================================ */}
      <main className="max-w-[1600px] mx-auto px-6 lg:px-8 py-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-3xl font-bold text-white mb-2">Dashboard</h2>
          <p className="text-slate-400">Welcome back. Here's what's happening with EduAI today.</p>
        </motion.div>

        {/* ============================================
            STATS GRID
            ============================================ */}
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8"
        >
          <StatCard 
            label="Total Users" 
            value={stats.total} 
            icon={Users} 
            color="blue"
            delay={0}
          />
          <StatCard 
            label="Active Today" 
            value={stats.activeToday} 
            icon={GraduationCap} 
            color="purple"
            delay={0.1}
          />
          <StatCard 
            label="Students" 
            value={stats.students} 
            icon={BookOpen} 
            color="amber"
            delay={0.2}
          />
          <StatCard 
            label="Quizzes Today" 
            value={stats.quizzesToday} 
            icon={Zap} 
            color="emerald"
            delay={0.3}
          />
        </motion.div>

        {/* ============================================
            USERS TABLE SECTION
            ============================================ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <GlassCard hover={false} className="overflow-hidden">
            {/* Table Header */}
            <div className="px-6 py-5 border-b border-white/[0.06]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">User Directory</h3>
                  <p className="text-sm text-slate-500">{filteredUsers.length} users registered</p>
                </div>
                
                <div className="flex items-center gap-3">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-64 pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                  </div>
                  
                  {/* Add User Button */}
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white text-[#0a0a0f] font-semibold rounded-xl hover:bg-slate-100 transition-all hover:-translate-y-0.5 shadow-lg shadow-white/10"
                  >
                    <Plus size={18} />
                    <span>Add User</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    {['User', 'Username', 'Role', 'Status', 'Last Active', ''].map((header) => (
                      <th key={header} className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user, index) => (
                    <UserRow key={user.id} user={user} index={index} />
                  ))}
                </tbody>
              </table>
              
              {/* Empty State */}
              {filteredUsers.length === 0 && (
                <div className="py-16 text-center">
                  <div className="h-16 w-16 mx-auto mb-4 rounded-2xl bg-white/[0.03] flex items-center justify-center">
                    <Users size={28} className="text-slate-600" />
                  </div>
                  <h4 className="text-lg font-medium text-white mb-1">No users found</h4>
                  <p className="text-slate-500">
                    {searchQuery ? 'Try a different search term' : 'Get started by adding your first user'}
                  </p>
                </div>
              )}
            </div>
          </GlassCard>
        </motion.div>
      </main>

      {/* ============================================
          CREATE USER MODAL
          ============================================ */}
      <CreateUserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreate}
        formData={formData}
        setFormData={setFormData}
      />
    </div>
  );
}