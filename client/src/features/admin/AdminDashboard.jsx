import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import {
  Users, Shield, Plus, Search,
  XCircle, Loader2,
  GraduationCap, UserCog, BookOpen, LogOut
} from 'lucide-react';

// GraphQL
const GET_ADMIN_DATA = gql`
  query GetAdminData {
    allUsers { id username fullName role }
    systemStatus
    adminStats {
      totalUsers totalStudents totalTeachers activeUsersToday
      totalQuizzesToday totalMessagesToday averageAccuracy totalBadgesAwarded
    }
  }
`;

const CREATE_USER = gql`
  mutation CreateUser($username: String!, $fullName: String!, $role: Role!) {
    createUser(username: $username, fullName: $fullName, role: $role) { id username }
  }
`;

// Sub-components
const RoleBadge = ({ role }) => {
  const cfg = {
    ADMIN:   { bg: 'bg-purple-50', text: 'text-purple-700', icon: UserCog },
    TEACHER: { bg: 'bg-blue-50',   text: 'text-blue-700',   icon: GraduationCap },
    STUDENT: { bg: 'bg-amber-50',  text: 'text-amber-700',  icon: BookOpen },
    PARENT:  { bg: 'bg-green-50',  text: 'text-green-700',  icon: Users },
  };
  const { bg, text, icon: Icon } = cfg[role] || cfg.STUDENT;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${bg} ${text}`}>
      <Icon size={12} /> {role}
    </span>
  );
};

const StatCard = ({ label, value, icon: Icon, color }) => {
  const colors = {
    blue:   'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    amber:  'bg-amber-50 text-amber-600',
    green:  'bg-green-50 text-green-600',
  };
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-lg ${colors[color]}`}>
          <Icon size={20} />
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-500 mt-0.5">{label}</div>
    </div>
  );
};

// Modal
const CreateUserModal = ({ isOpen, onClose, onSubmit, formData, setFormData }) => {
  if (!isOpen) return null;
  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-50" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50">
        <div className="bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Create New User</h2>
              <p className="text-sm text-gray-500">Add a new member to EduAI</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
              <XCircle size={20} />
            </button>
          </div>
          <form onSubmit={onSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input required type="text" placeholder="Albert Einstein"
                value={formData.fullName}
                onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 text-sm
                         focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input required type="text" placeholder="einstein_01"
                value={formData.username}
                onChange={e => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 text-sm
                         focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <div className="grid grid-cols-2 gap-2">
                {['TEACHER', 'STUDENT', 'ADMIN', 'PARENT'].map(role => (
                  <button key={role} type="button"
                    onClick={() => setFormData({ ...formData, role })}
                    className={`p-2.5 rounded-lg border text-sm font-medium transition-all ${
                      formData.role === role
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                  >{role}</button>
                ))}
              </div>
            </div>
            <button type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg">
              Create Account
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

// Main
export default function AdminDashboard({ onLogout }) {
  const { loading, error, data } = useQuery(GET_ADMIN_DATA);
  const [createUser] = useMutation(CREATE_USER, { refetchQueries: [{ query: GET_ADMIN_DATA }] });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({ fullName: '', username: '', role: 'TEACHER' });

  const allUsers = useMemo(() => data?.allUsers ?? [], [data?.allUsers]);
  const filteredUsers = useMemo(() => {
    if (!searchQuery) return allUsers;
    const q = searchQuery.toLowerCase();
    return allUsers.filter(u =>
      u.fullName?.toLowerCase().includes(q) || u.username.toLowerCase().includes(q) || u.role.toLowerCase().includes(q)
    );
  }, [allUsers, searchQuery]);

  const stats = useMemo(() => {
    const s = data?.adminStats;
    return {
      total: s?.totalUsers || allUsers.length,
      students: s?.totalStudents || allUsers.filter(u => u.role === 'STUDENT').length,
      activeToday: s?.activeUsersToday || 0,
      quizzesToday: s?.totalQuizzesToday || 0,
    };
  }, [allUsers, data?.adminStats]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createUser({ variables: formData });
      setIsModalOpen(false);
      setFormData({ fullName: '', username: '', role: 'TEACHER' });
    } catch (err) { console.error(err); }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <XCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Connection Error</h2>
        <p className="text-gray-500 text-sm">{error.message}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Shield size={16} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900">EduAI</h1>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">Admin</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:flex items-center gap-1.5 text-xs text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> {data.systemStatus}
            </span>
            {onLogout && (
              <button onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                <LogOut size={16} /> Sign out
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Dashboard</h2>
        <p className="text-gray-500 text-sm mb-6">Welcome back. Here's what's happening today.</p>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Users" value={stats.total} icon={Users} color="blue" />
          <StatCard label="Active Today" value={stats.activeToday} icon={GraduationCap} color="purple" />
          <StatCard label="Students" value={stats.students} icon={BookOpen} color="amber" />
          <StatCard label="Quizzes Today" value={stats.quizzesToday} icon={Shield} color="green" />
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-gray-900">User Directory</h3>
              <p className="text-sm text-gray-500">{filteredUsers.length} users</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input type="text" placeholder="Search users..." value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-56 pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900
                           focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                />
              </div>
              <button onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg">
                <Plus size={16} /> Add User
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {['User', 'Username', 'Role'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-600">
                          {user.fullName?.charAt(0) || user.username.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{user.fullName || 'Unnamed'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-500">@{user.username}</td>
                    <td className="px-6 py-3"><RoleBadge role={user.role} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredUsers.length === 0 && (
              <div className="py-12 text-center">
                <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">{searchQuery ? 'No users match your search' : 'No users yet'}</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <CreateUserModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreate} formData={formData} setFormData={setFormData} />
    </div>
  );
}