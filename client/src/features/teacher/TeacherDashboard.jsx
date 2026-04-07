import React, { useState, useEffect } from 'react';
import { 
  Mic, MicOff, Upload, FileText, Check, Users, 
  Brain, Play, Loader2, FileQuestion, LogOut, Eye, X, Trash2,
  BookOpen, GraduationCap, Sparkles, ChevronDown
} from 'lucide-react';
export default function TeacherDashboard({ onLogout }) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const logout = onLogout || (() => { localStorage.removeItem('token'); localStorage.removeItem('user'); window.location.href = '/login'; });
  const [activeTab, setActiveTab] = useState('classroom');
  
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <BookOpen size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Teacher Console</h1>
              <p className="text-xs text-slate-500 font-medium">Welcome back, {user?.fullName || 'Teacher'}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
              <TabButton 
                active={activeTab === 'classroom'} 
                onClick={() => setActiveTab('classroom')} 
                icon={Users} 
                label="Classroom" 
              />
              <TabButton 
                active={activeTab === 'content'} 
                onClick={() => setActiveTab('content')} 
                icon={FileText} 
                label="Content Studio" 
              />
            </div>
            <div className="h-6 w-px bg-slate-200"></div>
            <button 
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-transparent hover:border-rose-200"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-8">
        {activeTab === 'classroom' ? <ClassroomManager /> : <ContentStudio />}
      </main>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
        active 
          ? 'bg-white text-blue-800 shadow-sm border border-slate-200' 
          : 'text-slate-500 hover:text-slate-700'
      }`}
    >
      <Icon size={18} />
      {label}
    </button>
  );
}

// --- SUB-COMPONENT: Classroom Manager (Voice Attendance) ---
function ClassroomManager() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [attendanceList, setAttendanceList] = useState([]);
  const [loading, setLoading] = useState(false);

  // Initialize speech recognition
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = SpeechRecognition ? new SpeechRecognition() : null;

  if (recognition) {
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let currentTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
      }
      setTranscript(currentTranscript);
    };
  }

  const toggleMic = () => {
    if (!recognition) {
      alert("Browser does not support speech recognition.");
      return;
    }
    if (isListening) {
      recognition.stop();
      setIsListening(false);
      processAttendance(transcript);
    } else {
      setTranscript('');
      recognition.start();
      setIsListening(true);
    }
  };

  const processAttendance = async (text) => {
    setLoading(true);
    try {
      const response = await fetch('/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            mutation MarkAttendance($transcript: String!) {
              markAttendanceVoice(transcript: $transcript) {
                id
                student { fullName }
                status
              }
            }
          `,
          variables: { transcript: text }
        })
      });
      const data = await response.json();
      if (data.data?.markAttendanceVoice) {
        setAttendanceList(data.data.markAttendanceVoice);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Voice Control Panel */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Mic className="text-blue-600" /> Voice Attendance
        </h2>
        
        <div className="flex flex-col items-center justify-center py-10 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 mb-6">
          <button
            onClick={toggleMic}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-lg ${
              isListening 
                ? 'bg-rose-500 text-white animate-pulse ring-4 ring-rose-200' 
                : 'bg-blue-600 text-white hover:shadow-xl'
            }`}
          >
            {isListening ? <MicOff size={32} /> : <Mic size={32} />}
          </button>
          <p className="mt-4 text-sm font-medium text-slate-500">
            {isListening ? "Listening... Speak student names" : "Tap to start taking attendance"}
          </p>
        </div>

        <div className="bg-slate-800 text-slate-200 p-4 rounded-xl min-h-[100px] text-sm font-mono">
          {transcript || <span className="text-slate-500">Transcript will appear here...</span>}
        </div>
      </div>

      {/* Attendance List */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Check className="text-emerald-500" /> Marked Present
        </h2>
        
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-blue-600" /></div>
        ) : attendanceList.length > 0 ? (
          <ul className="space-y-2">
            {attendanceList.map((record) => (
              <li key={record.id} className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <span className="font-medium text-slate-800">{record.student.fullName}</span>
                <span className="text-xs font-bold bg-emerald-500 text-white px-2.5 py-1 rounded-full">PRESENT</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-10 text-slate-400">No attendance marked yet today.</div>
        )}
      </div>
    </div>
  );
}

// --- SUB-COMPONENT: Content Studio (RAG) ---
function ContentStudio() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [results, setResults] = useState(null); // { quizId, attempts: [] }
  const [previewQuiz, setPreviewQuiz] = useState(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const response = await fetch('/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `query { allDocuments { id filename summary isProcessed } }`
        })
      });
      const data = await response.json();
      if (data.data?.allDocuments) setDocuments(data.data.allDocuments);
    } catch (e) { console.error(e); }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      // 1. Upload File
      const res = await fetch('/api/teacher/upload', {
        method: 'POST',
        body: formData
      });
      const doc = await res.json();

      // 2. Trigger Processing (RAG)
      await fetch('/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `mutation Process($id: ID!) { processDocument(id: $id) }`,
          variables: { id: doc.id }
        })
      });

      loadDocuments();
      setFile(null);
    } catch {
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleGenerateQuiz = async (docId) => {
    if (!confirm("Generate a new quiz for this document?")) return;
    try {
      await fetch('/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `mutation Quiz($id: ID!) { generateQuiz(documentId: $id) { id title } }`,
          variables: { id: docId }
        })
      });
      loadQuizzes(docId);
    } catch (e) { console.error(e); }
  };

  const loadQuizzes = async (docId) => {
    setSelectedDoc(docId);
    setResults(null);
    try {
      const response = await fetch('/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `query GetQuizzes($id: ID!) { quizzesForDocument(documentId: $id) { id title questionsJson } }`,
          variables: { id: docId }
        })
      });
      const data = await response.json();
      if (data.data?.quizzesForDocument) setQuizzes(data.data.quizzesForDocument);
    } catch (e) { console.error(e); }
  };

  const viewResults = async (quizId) => {
    try {
      const response = await fetch('/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `query Results($id: ID!) { quizResults(quizId: $id) { id score totalQuestions student { fullName } } }`,
          variables: { id: quizId }
        })
      });
      const data = await response.json();
      if (data.data?.quizResults) setResults({ quizId, attempts: data.data.quizResults });
    } catch (e) { console.error(e); }
  };

  const [deletingQuizId, setDeletingQuizId] = useState(null);
  const [deletingDocId, setDeletingDocId] = useState(null);

  const handleDeleteQuiz = async (quizId) => {
    if (!confirm('Delete this quiz and all student attempts?')) return;
    setDeletingQuizId(quizId);
    try {
      const res = await fetch('/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `mutation DeleteQuiz($id: ID!) { deleteQuiz(quizId: $id) }`,
          variables: { id: quizId }
        })
      });
      const data = await res.json();
      if (data.data?.deleteQuiz) {
        setQuizzes(prev => prev.filter(q => q.id !== quizId));
        if (results?.quizId === quizId) setResults(null);
      }
    } catch (e) { console.error('Delete failed:', e); }
    finally { setDeletingQuizId(null); }
  };

  const handleDeleteDocument = async (docId) => {
    if (!confirm('Delete this document and all its quizzes? This cannot be undone.')) return;
    setDeletingDocId(docId);
    try {
      const res = await fetch('/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `mutation DeleteDoc($id: ID!) { deleteDocument(documentId: $id) }`,
          variables: { id: docId }
        })
      });
      const data = await res.json();
      if (data.data?.deleteDocument) {
        setDocuments(prev => prev.filter(d => d.id !== docId));
        if (selectedDoc === docId) { setSelectedDoc(null); setQuizzes([]); setResults(null); }
      }
    } catch (e) { console.error('Delete document failed:', e); }
    finally { setDeletingDocId(null); }
  };

  // --- PREVIEW MODAL ---
  const PreviewModal = () => {
    if (!previewQuiz) return null;
    const questions = JSON.parse(previewQuiz.questionsJson);
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
        <div className="bg-white w-full max-w-2xl max-h-[80vh] rounded-2xl shadow-xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-blue-700">
            <h3 className="font-bold text-white">{previewQuiz.title} (Preview)</h3>
            <button onClick={() => setPreviewQuiz(null)} className="text-white/70 hover:text-white"><X size={20} /></button>
          </div>
          <div className="p-6 overflow-y-auto space-y-6">
            {questions.map((q, i) => (
              <div key={i} className="p-4 border border-slate-200 rounded-xl">
                <p className="font-medium mb-3 text-slate-800">{i+1}. {q.question}</p>
                <div className="space-y-2">
                  {q.options.map((opt, j) => (
                    <div key={j} className={`p-2.5 rounded-lg border ${j === q.correctIndex ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-medium' : 'border-slate-100 text-slate-600'}`}>
                      {opt} {j === q.correctIndex && "✓"}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <PreviewModal />
      
      {/* Upload Section */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Upload className="text-blue-700" size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Upload Study Material</h2>
          <p className="text-slate-500 mb-6">Support for PDF, TXT (Max 500MB)</p>
          
          <form onSubmit={handleUpload} className="flex gap-3">
            <input 
              type="file" 
              onChange={e => setFile(e.target.files[0])}
              className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-800 hover:file:bg-blue-100 cursor-pointer"
            />
            <button 
              type="submit" 
              disabled={!file || uploading}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md"
            >
              {uploading ? 'Uploading...' : 'Process'}
            </button>
          </form>
        </div>
      </div>

      {/* Documents List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-4">Processed Documents</h3>
          <div className="space-y-3">
            {documents.map(doc => (
              <div key={doc.id} className="p-4 border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-sm transition-all">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <FileText size={18} className="text-blue-600" />
                    <span className="font-medium text-slate-700">{doc.filename}</span>
                  </div>
                  {doc.isProcessed ? (
                    doc.summary && doc.summary.startsWith("Processing failed") 
                      ? <span className="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-semibold">Failed</span>
                      : <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">Ready</span>
                  ) : (
                    <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">Processing</span>
                  )}
                </div>
                <p className="text-xs text-slate-500 line-clamp-2 mb-3">{doc.summary || "No summary available yet."}</p>
                <div className="flex items-center justify-between">
                  <button 
                    onClick={() => loadQuizzes(doc.id)}
                    className="text-xs flex items-center gap-1 text-blue-700 font-medium hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <FileQuestion size={14} /> Manage Quizzes
                  </button>
                  <button
                    onClick={() => handleDeleteDocument(doc.id)}
                    disabled={deletingDocId === doc.id}
                    className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                    title="Delete document"
                  >
                    {deletingDocId === doc.id
                      ? <Loader2 size={14} className="animate-spin text-red-400" />
                      : <Trash2 size={14} />}
                  </button>
                </div>
              </div>
            ))}
            {documents.length === 0 && <p className="text-slate-400 text-sm text-center py-6">No documents uploaded.</p>}
          </div>
        </div>

        {/* Quiz Manager */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center justify-between">
            <span>{selectedDoc ? "Quizzes" : "Select a Document"}</span>
            {selectedDoc && (
              <button onClick={() => handleGenerateQuiz(selectedDoc)} className="text-xs bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 shadow-sm">
                + New Quiz
              </button>
            )}
          </h3>
          
          {selectedDoc ? (
            <div className="space-y-4">
              {quizzes.map(quiz => (
                <div key={quiz.id} className="border border-slate-200 rounded-xl p-4 hover:border-blue-200 transition-all">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm text-slate-700">{quiz.title}</h4>
                      <button onClick={() => setPreviewQuiz(quiz)} className="text-slate-400 hover:text-blue-700 transition-colors" title="Preview"><Eye size={14}/></button>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => viewResults(quiz.id)} className="text-xs text-blue-700 hover:underline font-medium">View Scores</button>
                      <button
                        onClick={() => handleDeleteQuiz(quiz.id)}
                        disabled={deletingQuizId === quiz.id}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                        title="Delete quiz"
                      >
                        {deletingQuizId === quiz.id
                          ? <Loader2 size={14} className="animate-spin text-red-400" />
                          : <Trash2 size={14} />}
                      </button>
                    </div>
                  </div>
                  
                  {results?.quizId === quiz.id && (
                    <div className="mt-3 bg-slate-50 rounded-lg p-3 border border-slate-100">
                      <h5 className="text-xs font-bold text-slate-500 uppercase mb-2">Student Scores</h5>
                      {results.attempts.length === 0 ? <p className="text-xs text-slate-400">No attempts yet.</p> : (
                        <ul className="space-y-1">
                          {results.attempts.map(attempt => (
                            <li key={attempt.id} className="flex justify-between text-xs">
                              <span className="text-slate-700">{attempt.student.fullName}</span>
                              <span className="font-mono font-bold text-blue-700">{attempt.score}/{attempt.totalQuestions}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {quizzes.length === 0 && <p className="text-sm text-slate-400">No quizzes generated yet.</p>}
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-slate-400 text-sm">
              Select a document to view or create quizzes.
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 

// X already imported at top