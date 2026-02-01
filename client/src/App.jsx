import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useMutation, gql } from '@apollo/client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader2, LogIn, UserPlus, Mail, Lock, User, 
  Sparkles, GraduationCap, BookOpen, Brain, Eye, EyeOff,
  ChevronRight, Shield, Zap
} from 'lucide-react';
import AdminDashboard from './features/admin/AdminDashboard';
import StudentLayout from './features/students/StudentLayout';

// --- GraphQL Mutations ---
const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      token
      user {
        id
        username
        email
        fullName
        role
      }
    }
  }
`;

const REGISTER_MUTATION = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      token
      user {
        id
        username
        email
        fullName
        role
      }
    }
  }
`;

// --- Animated Background Component ---
const AnimatedBackground = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none">
    {/* Gradient orbs */}
    <motion.div
      className="absolute w-[800px] h-[800px] rounded-full"
      style={{
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
        top: '-20%',
        right: '-10%',
      }}
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.5, 0.8, 0.5],
      }}
      transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
    />
    <motion.div
      className="absolute w-[600px] h-[600px] rounded-full"
      style={{
        background: 'radial-gradient(circle, rgba(236, 72, 153, 0.12) 0%, transparent 70%)',
        bottom: '-15%',
        left: '-5%',
      }}
      animate={{
        scale: [1.2, 1, 1.2],
        opacity: [0.6, 0.4, 0.6],
      }}
      transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
    />
    <motion.div
      className="absolute w-[500px] h-[500px] rounded-full"
      style={{
        background: 'radial-gradient(circle, rgba(34, 211, 238, 0.1) 0%, transparent 70%)',
        top: '40%',
        left: '30%',
      }}
      animate={{
        scale: [1, 1.3, 1],
        x: [0, 50, 0],
        y: [0, -30, 0],
      }}
      transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
    />
    
    {/* Subtle grid pattern */}
    <div 
      className="absolute inset-0 opacity-[0.02]"
      style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), 
                          linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
        backgroundSize: '60px 60px'
      }}
    />
  </div>
);

// --- Feature Card Component ---
const FeatureCard = ({ icon: Icon, title, description, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] backdrop-blur-sm"
  >
    <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20">
      <Icon className="w-5 h-5 text-indigo-400" />
    </div>
    <div>
      <h4 className="font-semibold text-white mb-1">{title}</h4>
      <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
    </div>
  </motion.div>
);

// --- Input Component ---
const AuthInput = ({ icon: Icon, type, placeholder, value, onChange, delay }) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="relative group"
    >
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <Icon className="w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
      </div>
      <input
        type={isPassword && showPassword ? 'text' : type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required
        className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl pl-12 pr-12 py-4 
                   text-white placeholder-slate-500 outline-none
                   focus:border-indigo-500/50 focus:bg-white/[0.05] focus:ring-2 focus:ring-indigo-500/20
                   transition-all duration-300"
      />
      {isPassword && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
        >
          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      )}
    </motion.div>
  );
};

// --- Role Selector Component ---
const RoleSelector = ({ value, onChange, delay }) => {
  const roles = [
    { id: 'STUDENT', label: 'Student', icon: GraduationCap, color: 'from-blue-500 to-cyan-500' },
    { id: 'TEACHER', label: 'Teacher', icon: BookOpen, color: 'from-emerald-500 to-teal-500' },
    { id: 'ADMIN', label: 'Admin', icon: Shield, color: 'from-purple-500 to-pink-500' },
  ];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="grid grid-cols-3 gap-3"
    >
      {roles.map((role) => (
        <button
          key={role.id}
          type="button"
          onClick={() => onChange(role.id)}
          className={`relative p-4 rounded-xl border transition-all duration-300 ${
            value === role.id 
              ? 'bg-white/[0.08] border-indigo-500/50 shadow-lg shadow-indigo-500/10' 
              : 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.04] hover:border-white/[0.1]'
          }`}
        >
          <div className={`w-10 h-10 mx-auto mb-2 rounded-lg bg-gradient-to-br ${role.color} p-2.5 
                          ${value === role.id ? 'opacity-100' : 'opacity-60'}`}>
            <role.icon className="w-full h-full text-white" />
          </div>
          <span className={`text-sm font-medium ${value === role.id ? 'text-white' : 'text-slate-400'}`}>
            {role.label}
          </span>
          {value === role.id && (
            <motion.div
              layoutId="roleIndicator"
              className="absolute inset-0 border-2 border-indigo-500 rounded-xl"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
        </button>
      ))}
    </motion.div>
  );
};

// --- Main Auth Page Component ---
function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ 
    email: '', 
    password: '', 
    username: '', 
    fullName: '', 
    role: 'STUDENT' 
  });
  const navigate = useNavigate();

  const [login, { loading: loginLoading, error: loginError }] = useMutation(LOGIN_MUTATION);
  const [register, { loading: regLoading, error: regError }] = useMutation(REGISTER_MUTATION);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let result;
      if (isLogin) {
        result = await login({ 
          variables: { input: { email: formData.email, password: formData.password } } 
        });
      } else {
        result = await register({ variables: { input: formData } });
      }

      const { token, user } = result.data.login || result.data.register;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      if (user.role === 'ADMIN') navigate('/admin');
      else if (user.role === 'TEACHER') navigate('/teacher');
      else navigate('/student');

    } catch (err) {
      console.error("Auth failed:", err);
    }
  };

  const isLoading = loginLoading || regLoading;
  const error = loginError || regError;

  return (
    <div className="min-h-screen flex bg-[#0a0a0f] overflow-hidden">
      <AnimatedBackground />
      
      {/* Left Panel - Branding & Features */}
      <motion.div 
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative"
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-3"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Brain className="w-7 h-7 text-white" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            EduAI
          </span>
        </motion.div>
        
        {/* Hero Content */}
        <div className="space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <h1 className="text-5xl font-bold leading-tight mb-4">
              <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                Learn Smarter,
              </span>
              <br />
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Not Harder.
              </span>
            </h1>
            <p className="text-xl text-slate-400 max-w-md">
              Experience personalized AI-powered education that adapts to your unique learning style.
            </p>
          </motion.div>
          
          {/* Feature Cards */}
          <div className="space-y-4 max-w-md">
            <FeatureCard 
              icon={Sparkles} 
              title="AI-Powered Learning" 
              description="Adaptive tutoring that understands your strengths and weaknesses."
              delay={0.5}
            />
            <FeatureCard 
              icon={Zap} 
              title="Real-time Feedback" 
              description="Instant insights to help you improve and stay motivated."
              delay={0.6}
            />
            <FeatureCard 
              icon={Brain} 
              title="Smart Analytics" 
              description="Track your progress with detailed performance metrics."
              delay={0.7}
            />
          </div>
        </div>
        
        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-sm text-slate-600"
        >
          © 2026 EduAI. Empowering minds through technology.
        </motion.p>
      </motion.div>
      
      {/* Right Panel - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex lg:hidden items-center justify-center gap-3 mb-8"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">EduAI</span>
          </motion.div>
          
          {/* Auth Card */}
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-xl opacity-50" />
            
            <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-8">
              {/* Tab Switcher */}
              <div className="flex mb-8 bg-white/[0.03] rounded-xl p-1">
                <button
                  onClick={() => setIsLogin(true)}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                    isLogin 
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </button>
                <button
                  onClick={() => setIsLogin(false)}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                    !isLogin 
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  Sign Up
                </button>
              </div>
              
              {/* Error Message */}
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl"
                  >
                    <p className="text-red-400 text-sm text-center">{error.message}</p>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <AnimatePresence mode="wait">
                  {!isLogin && (
                    <motion.div
                      key="register-fields"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4"
                    >
                      <AuthInput
                        icon={User}
                        type="text"
                        placeholder="Full Name"
                        value={formData.fullName}
                        onChange={e => setFormData({...formData, fullName: e.target.value})}
                        delay={0.1}
                      />
                      <AuthInput
                        icon={User}
                        type="text"
                        placeholder="Username"
                        value={formData.username}
                        onChange={e => setFormData({...formData, username: e.target.value})}
                        delay={0.15}
                      />
                      
                      {/* Role Selection */}
                      <RoleSelector
                        value={formData.role}
                        onChange={(role) => setFormData({...formData, role})}
                        delay={0.2}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <AuthInput
                  icon={Mail}
                  type="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  delay={isLogin ? 0.1 : 0.25}
                />
                
                <AuthInput
                  icon={Lock}
                  type="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  delay={isLogin ? 0.15 : 0.3}
                />
                
                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: isLogin ? 0.2 : 0.35 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative w-full py-4 mt-6 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 
                           text-white font-semibold rounded-xl overflow-hidden
                           disabled:opacity-70 disabled:cursor-not-allowed
                           shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40
                           transition-shadow duration-300"
                >
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  
                  <span className="relative flex items-center justify-center gap-2">
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        {isLogin ? 'Sign In' : 'Create Account'}
                        <ChevronRight className="w-5 h-5" />
                      </>
                    )}
                  </span>
                </motion.button>
              </form>
              
              {/* Divider */}
              {isLogin && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="mt-8 pt-6 border-t border-white/[0.05]"
                >
                  <p className="text-center text-slate-500 text-sm">
                    Don't have an account?{' '}
                    <button 
                      onClick={() => setIsLogin(false)}
                      className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                    >
                      Sign up for free
                    </button>
                  </p>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// --- Protected Route Wrapper ---
function ProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'ADMIN') return children; 
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

// --- Main App Component ---
function App() {
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <Routes>
      <Route path="/login" element={<AuthPage />} />
      
      {/* Student Routes */}
      <Route path="/student" element={
        <ProtectedRoute allowedRoles={['STUDENT']}>
          <StudentLayoutWrapper onLogout={handleLogout} />
        </ProtectedRoute>
      } />

      {/* Admin Routes */}
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['ADMIN']}>
          <AdminDashboard />
        </ProtectedRoute>
      } />

      {/* Default Redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-white mb-4">404</h1>
            <p className="text-slate-400 mb-8">Page not found</p>
            <a href="/login" className="text-indigo-400 hover:text-indigo-300">Return to login</a>
          </div>
        </div>
      } />
    </Routes>
  );
}

// Wrapper to pass user to StudentLayout
function StudentLayoutWrapper({ onLogout }) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return <StudentLayout user={user} onLogout={onLogout} />;
}

export default App;