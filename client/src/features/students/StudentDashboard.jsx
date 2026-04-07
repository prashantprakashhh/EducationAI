import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { Send, Bot, BrainCircuit, Scroll, Atom, Loader2 } from 'lucide-react';

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

const PersonaSelector = ({ selected, onSelect }) => {
  const personas = [
    { id: 'SOCRATIC', name: 'Socratic Coach', icon: BrainCircuit },
    { id: 'NEWTON', name: 'Isaac Newton', icon: Atom },
    { id: 'SHAKESPEARE', name: 'Shakespeare', icon: Scroll },
  ];
  return (
    <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
      {personas.map(p => (
        <button key={p.id} onClick={() => onSelect(p.id)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm transition-all min-w-[160px] ${
            selected === p.id
              ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
          }`}>
          <p.icon size={16} />
          <span>{p.name}</span>
        </button>
      ))}
    </div>
  );
};

const ChatBubble = ({ message }) => {
  const isAi = message.sender === 'AI';
  return (
    <div className={`flex w-full mb-4 ${isAi ? 'justify-start' : 'justify-end'}`}>
      <div className={`flex max-w-[75%] ${isAi ? 'flex-row' : 'flex-row-reverse'} gap-3`}>
        <div className={`flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center text-white text-xs font-bold ${
          isAi ? 'bg-blue-600' : 'bg-gray-700'}`}>
          {isAi ? <Bot size={16} /> : 'ME'}
        </div>
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
      </div>
    </div>
  );
};

export default function StudentDashboard() {
  const CURRENT_USER_ID = "1";
  const [activePersona, setActivePersona] = useState('SOCRATIC');
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const { data, loading } = useQuery(GET_CHAT_HISTORY, {
    variables: { userId: CURRENT_USER_ID }, pollInterval: 3000
  });
  const [sendMessage, { loading: sending }] = useMutation(SEND_MESSAGE, {
    refetchQueries: [{ query: GET_CHAT_HISTORY, variables: { userId: CURRENT_USER_ID } }]
  });

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => { scrollToBottom(); }, [data?.chatHistory]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const msg = input;
    setInput('');
    try { await sendMessage({ variables: { userId: CURRENT_USER_ID, content: msg, persona: activePersona } }); }
    catch { setInput(msg); }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <BrainCircuit size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-gray-900">EduAI <span className="text-gray-400 font-normal">Student</span></h1>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 flex flex-col h-[calc(100vh-3.5rem)]">
        <div className="flex-none">
          <PersonaSelector selected={activePersona} onSelect={setActivePersona} />
        </div>

        <div className="flex-1 overflow-y-auto pr-1">
          {(!data?.chatHistory || data.chatHistory.length === 0) && !loading && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center mb-3">
                <BrainCircuit className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Start learning! 👋</h3>
              <p className="text-gray-500 text-sm">Ask me anything about your studies.</p>
            </div>
          )}
          <div className="space-y-1 pb-4">
            {data?.chatHistory?.map(msg => <ChatBubble key={msg.id} message={msg} />)}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="flex-none pt-3 pb-1">
          <form onSubmit={handleSend} className="flex gap-2">
            <input type="text" value={input} onChange={e => setInput(e.target.value)}
              placeholder={`Ask ${activePersona.toLowerCase().replace('_', ' ')} anything...`}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900
                       focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
            />
            <button type="submit" disabled={!input.trim() || sending}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 flex items-center gap-1.5">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send size={16} />}
            </button>
          </form>
          <p className="text-center mt-2 text-[10px] text-gray-400">EduAI · AI can make mistakes. Verify important info.</p>
        </div>
      </main>
    </div>
  );
}