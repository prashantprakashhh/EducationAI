import React from 'react';
import { useQuery, gql } from '@apollo/client';
import { Users, ShieldCheck, Activity } from 'lucide-react';

const GET_ADMIN_DATA = gql`
  query GetAdminData {
    allUsers {
      id
      username
      fullName
      role
    }
    systemStatus
  }
`;

export default function AdminDashboard() {
  const { loading, error, data } = useQuery(GET_ADMIN_DATA);

  if (loading) return <div className="p-8 text-center">Loading EduAI Systems...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error.message}</div>;

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Admin Command Center</h1>
        <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full font-medium">
          <Activity size={18} />
          {data.systemStatus}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="text-slate-500 mb-2">Total Users</div>
          <div className="text-4xl font-bold">{data.allUsers.length}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-slate-600 font-semibold">Full Name</th>
              <th className="px-6 py-4 text-slate-600 font-semibold">Username</th>
              <th className="px-6 py-4 text-slate-600 font-semibold">Role</th>
              <th className="px-6 py-4 text-slate-600 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.allUsers.map((user) => (
              <tr key={user.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-medium">{user.fullName}</td>
                <td className="px-6 py-4 text-slate-600">{user.username}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-green-600 font-medium">Active</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}