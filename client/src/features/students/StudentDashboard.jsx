import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { 
  Send, Sparkles, History, Bot, 
  BrainCircuit, Zap, Scroll, Atom,
  ChevronRight, Mic
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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


const PersonaSelector = ({ selected, onSelect }) => {
  const personas = [
    { id: 'SOCRATIC', name: 'Socratic Coach', icon: BrainCircuit, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { id: 'NEWTON', name: 'Isaac Newton', icon: Atom, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { id: 'SHAKESPEARE', name: 'Shakespeare', icon: Scroll, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ];

  return (
    <div className="flex gap-3 mb-6 overflow-x-auto pb-2 scrollbar-hide">
      {personas.map((p) => (
        <button
          key={p.id}
          onClick={() => onSelect(p.id)}
          className={`
            flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all duration-300 min-w-[180px]
            ${selected === p.id 
              ? 'bg-white/[0.08] border-white/20 shadow-glow-sm scale-105' 
              : 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.05]'}
          `}
        >
          <div className={`p-2 rounded-lg ${p.bg}`}>
            <p.icon size={18} className={p.color} />
          </div>
          <div className="text-left">
            <div className={`text-sm font-semibold ${selected === p.id ? 'text-white' : 'text-slate-400'}`}>
              {p.name}
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Active</div>
          </div>
        </button>
      ))}
    </div>
  );
};

const ChatBubble = ({ message }) => {
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
          flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center shadow-lg
          ${isAi 
            ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white' 
            : 'bg-white/[0.05] border border-white/10 text-slate-300'}
        `}>
          {isAi ? <Bot size={20} /> : <div className="text-sm font-bold">ME</div>}
        </div>

        {/* Message Content */}
        <div className={`
          p-5 rounded-2xl backdrop-blur-md border shadow-xl
          ${isAi 
            ? 'bg-white/[0.03] border-white/[0.08] rounded-tl-none text-slate-200' 
            : 'bg-blue-600/20 border-blue-500/30 rounded-tr-none text-white'}
        `}>
          {/* Persona Tag for AI */}
          {isAi && (
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/[0.05]">
              <Sparkles size={12} className="text-blue-400" />
              <span className="text-xs font-medium text-blue-400 uppercase tracking-widest">
                {message.persona || 'EduAI System'}
              </span>
            </div>
          )}
          
          <p className="leading-relaxed text-sm md:text-base font-light tracking-wide">
            {message.content}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export default function StudentDashboard() {
  // HARDCODED USER ID FOR DEMO - In real app, get from Context/Auth
  const CURRENT_USER_ID = "1"; 
  
  const [activePersona, setActivePersona] = useState('SOCRATIC');
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const { data, loading } = useQuery(GET_CHAT_HISTORY, {
    variables: { userId: CURRENT_USER_ID },
    pollInterval: 3000 // Real-time poll for demo
  });

  const [sendMessage, { loading: sending }] = useMutation(SEND_MESSAGE, {
    refetchQueries: [{ query: GET_CHAT_HISTORY, variables: { userId: CURRENT_USER_ID } }]
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [data?.chatHistory]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const messageContent = input;
    setInput(''); // Clear input immediately for better UX

    try {
      await sendMessage({
        variables: {
          userId: CURRENT_USER_ID,
          content: messageContent,
          persona: activePersona
        }
      });
    } catch (err) {
      console.error('Failed to send message:', err);
      setInput(messageContent); // Restore input on error
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden flex flex-col">
      
      {/* HEADER */}
      <header className="h-16 border-b border-white/[0.06] bg-[#0a0a0f]/80 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-emerald-500 to-blue-500 flex items-center justify-center shadow-glow-sm">
            <BrainCircuit size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wide">EduAI <span className="text-slate-500 font-normal">Student OS</span></h1>
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-emerald-500 font-medium uppercase tracking-wider">Neural Net Online</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06]">
            <Zap size={14} className="text-amber-400" />
            <span className="text-xs font-medium text-amber-400">Streak: 12 Days</span>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-6 flex flex-col h-[calc(100vh-4rem)]">
        
        {/* Persona Selector (Feature 1: Time Travel) */}
        <div className="flex-none">
          <PersonaSelector selected={activePersona} onSelect={setActivePersona} />
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar relative">
          
          {/* Welcome State */}
          {(!data?.chatHistory || data.chatHistory.length === 0) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center opacity-50 pointer-events-none">
              <div className="h-24 w-24 rounded-full bg-gradient-to-b from-blue-500/10 to-purple-500/10 border border-white/5 flex items-center justify-center mb-6 blur-sm">
                <Sparkles size={40} className="text-white/20" />
              </div>
              <h3 className="text-xl font-light text-slate-400">Initialize learning sequence...</h3>
            </div>
          )}

          {/* Messages */}
          <div className="space-y-2 pb-4">
            {data?.chatHistory?.map((msg) => (
              <ChatBubble key={msg.id} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="flex-none pt-4 pb-2">
          <form onSubmit={handleSend} className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
            <div className="relative flex items-center bg-[#13131f] border border-white/[0.08] rounded-2xl p-2 shadow-2xl">
              <button type="button" className="p-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
                <Mic size={20} />
              </button>
              
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Ask ${activePersona.toLowerCase().replace('_', ' ')} anything...`}
                className="flex-1 bg-transparent border-none text-white placeholder-slate-500 focus:ring-0 px-4 py-3 text-sm md:text-base"
              />
              
              <button 
                type="submit" 
                disabled={!input.trim() || sending}
                className="p-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95"
              >
                {sending ? (
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send size={20} fill="currentColor" />
                )}
              </button>
            </div>
          </form>
          <div className="text-center mt-3">
            <p className="text-[10px] text-slate-600">EduAI Socratic Engine v1.0 • AI can make mistakes. Verify important info.</p>
          </div>
        </div>
      </main>
    </div>
  );
}