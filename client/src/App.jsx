import { useState } from 'react';
import AdminDashboard from './features/admin/AdminDashboard';
import StudentDashboard from './features/students/StudentDashboard';

function App() {
  const [view, setView] = useState('STUDENT'); // Default to your new creation

  return (
    <div className="App relative">
      {/* Dev Toggle Switch */}
      <div className="fixed bottom-4 right-4 z-[100] flex bg-black/80 backdrop-blur border border-white/10 rounded-full p-1">
        <button 
          onClick={() => setView('STUDENT')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${view === 'STUDENT' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
        >
          Student
        </button>
        <button 
          onClick={() => setView('ADMIN')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${view === 'ADMIN' ? 'bg-purple-600 text-white' : 'text-slate-400'}`}
        >
          Admin
        </button>
      </div>

      {view === 'ADMIN' ? <AdminDashboard /> : <StudentDashboard />}
    </div>
  );
}

export default App;