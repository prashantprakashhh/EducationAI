import { useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useMutation, gql } from '@apollo/client';
import { Loader2, Mail, Lock, User, GraduationCap, BookOpen, Shield, Eye, EyeOff } from 'lucide-react';
import AdminDashboard from './features/admin/AdminDashboard';
import StudentLayout from './features/students/StudentLayout';
import TeacherDashboard from './features/teacher/TeacherDashboard';

// --- GraphQL Mutations ---
const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      token
      user { id username email fullName role }
    }
  }
`;

const REGISTER_MUTATION = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      token
      user { id username email fullName role }
    }
  }
`;

// --- Auth Page ---
function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '', password: '', username: '', fullName: '', role: 'STUDENT'
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

  const roles = [
    { id: 'STUDENT', label: 'Student', icon: GraduationCap, desc: 'Learn & grow' },
    { id: 'PARENT', label: 'Parent', icon: Shield, desc: 'Track progress' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left — Branding */}
      <div className="hidden lg:flex lg:w-[480px] bg-blue-600 text-white flex-col justify-between p-10">
        <div>
          <div className="flex items-center gap-2 mb-16">
            <GraduationCap className="w-8 h-8" />
            <span className="text-xl font-bold">EduAI</span>
          </div>
          <h1 className="text-4xl font-bold leading-tight mb-4">
            Learn smarter<br />with AI
          </h1>
          <p className="text-blue-100 text-lg leading-relaxed max-w-sm">
            Personalized tutoring, smart quizzes, and exam preparation — all powered by AI.
          </p>
        </div>
        <p className="text-blue-200 text-sm">© 2026 EduAI · clatone.co.in</p>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-8 justify-center">
            <GraduationCap className="w-7 h-7 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">EduAI</span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            {isLogin ? 'Welcome back' : 'Create account'}
          </h2>
          <p className="text-gray-500 mb-8">
            {isLogin ? 'Sign in to continue learning' : 'Get started with EduAI'}
          </p>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error.message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Register-only fields */}
            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text" required placeholder="John Doe"
                      value={formData.fullName}
                      onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm
                               focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text" required placeholder="johndoe"
                      value={formData.username}
                      onChange={e => setFormData({ ...formData, username: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm
                               focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                    />
                  </div>
                </div>
                {/* Role */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">I am a</label>
                  <div className="grid grid-cols-2 gap-2">
                    {roles.map(r => (
                      <button key={r.id} type="button"
                        onClick={() => setFormData({ ...formData, role: r.id })}
                        className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all
                          ${formData.role === r.id
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}
                      >
                        <r.icon className="w-4 h-4" />
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email" required placeholder="you@example.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm
                           focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'} required placeholder="••••••••"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm
                           focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button type="submit" disabled={isLoading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg
                       disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {isLogin ? 'Sign in' : 'Create account'}
            </button>
          </form>

          {/* Toggle */}
          <p className="text-center text-sm text-gray-500 mt-6">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => setIsLogin(!isLogin)} className="text-blue-600 hover:text-blue-700 font-medium">
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

// --- Protected Route ---
function ProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const location = useLocation();

  if (!token) return <Navigate to="/login" state={{ from: location }} replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'ADMIN') return children;
    return <Navigate to="/unauthorized" replace />;
  }
  return children;
}

// --- App Routes ---
function App() {
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <Routes>
      <Route path="/login" element={<AuthPage />} />

      <Route path="/student/*" element={
        <ProtectedRoute allowedRoles={['STUDENT']}>
          <StudentLayoutWrapper onLogout={handleLogout} />
        </ProtectedRoute>
      } />

      <Route path="/teacher/*" element={
        <ProtectedRoute allowedRoles={['TEACHER']}>
          <TeacherDashboard onLogout={handleLogout} />
        </ProtectedRoute>
      } />

      <Route path="/admin/*" element={
        <ProtectedRoute allowedRoles={['ADMIN']}>
          <AdminDashboard onLogout={handleLogout} />
        </ProtectedRoute>
      } />

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-2">404</h1>
            <p className="text-gray-500 mb-6">Page not found</p>
            <a href="/login" className="text-blue-600 hover:text-blue-700 font-medium text-sm">
              ← Back to login
            </a>
          </div>
        </div>
      } />
    </Routes>
  );
}

function StudentLayoutWrapper({ onLogout }) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return <StudentLayout user={user} onLogout={onLogout} />;
}

export default App;