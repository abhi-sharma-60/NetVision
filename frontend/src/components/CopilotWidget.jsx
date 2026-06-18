import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Loader2, Sparkles, Terminal } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';

export default function CopilotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', content: 'Hello! I am NetVision AI. How can I help you analyze the network today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (text) => {
    if (!text.trim()) return;
    
    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/copilot/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: text })
      });
      const data = await response.json();
      
      setMessages(prev => [...prev, { 
        role: 'ai', 
        content: data.answer || data.error || "Sorry, I couldn't process that." 
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', content: 'Connection error. Please try again later.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestions = [
    "Show threats in last hour",
    "Which IP generated most traffic?",
    "Summarize current network state"
  ];

  return (
    <>
      {/* Floating Action Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-8 right-8 px-6 py-4 rounded-full bg-gradient-to-r from-primary to-blue-600 text-white shadow-[0_0_30px_rgba(59,130,246,0.4)] z-[9999] flex items-center gap-3 group border border-white/10"
          >
            <Bot className="w-6 h-6 group-hover:animate-bounce" />
            <span className="font-bold tracking-wide text-sm">Ask NetVision AI</span>
            <span className="absolute -top-2 -right-2 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-300 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-white shadow-[0_0_10px_white]"></span>
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9, originX: 1, originY: 1 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="fixed bottom-8 right-8 w-[450px] h-[700px] glass-panel !rounded-3xl flex flex-col z-[9999] overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="p-5 border-b border-white/5 bg-white/5 flex justify-between items-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent pointer-events-none"></div>
              <div className="flex items-center gap-4 relative z-10">
                <div className="p-2.5 bg-primary/20 rounded-xl border border-primary/30 relative">
                  <div className="absolute inset-0 bg-primary/40 blur-md rounded-xl animate-pulse"></div>
                  <Bot className="w-6 h-6 text-primary relative z-10" />
                </div>
                <div>
                  <h3 className="font-bold text-text-main flex items-center gap-2 text-lg tracking-wide">
                    NetVision AI
                    <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                    <p className="text-[10px] text-green-500 font-bold uppercase tracking-widest">Security Copilot Online</p>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 text-text-muted hover:text-text-main hover:bg-white/10 rounded-full transition-colors relative z-10">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar bg-background/20">
              {messages.map((msg, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={idx} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-gradient-to-br from-primary to-blue-600 text-white rounded-tr-sm shadow-[0_10px_20px_rgba(59,130,246,0.3)]' 
                      : 'bg-white/5 border border-black/10 dark:border-white/5 text-text-main rounded-tl-sm backdrop-blur-md'
                  }`}>
                    {msg.role === 'ai' && idx === 0 && (
                      <div className="flex items-center gap-2 mb-2 text-primary opacity-80">
                         <Terminal className="w-4 h-4" />
                         <span className="text-[10px] uppercase font-bold tracking-widest">System Ready</span>
                      </div>
                    )}
                    {msg.role === 'ai' ? (
                      <div className="prose dark:prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-surface/50 prose-pre:border prose-pre:border-border text-text-main">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                  <div className="bg-white/5 border border-black/10 dark:border-white/5 backdrop-blur-md text-text-main p-4 rounded-2xl rounded-tl-sm flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <span className="text-xs text-text-muted uppercase tracking-widest font-semibold">Analyzing Context...</span>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-5 border-t border-white/5 bg-white/5 backdrop-blur-md">
              
              {/* Suggestions */}
              <div className="flex flex-wrap gap-2 mb-4">
                {suggestions.map((s, idx) => (
                  <button 
                    key={idx}
                    onClick={() => handleSend(s)}
                    className="px-3 py-1.5 bg-surface border border-border hover:border-primary/50 hover:bg-primary/10 text-[11px] font-medium text-text-muted hover:text-primary rounded-full transition-all text-left tracking-wide"
                  >
                    {s}
                  </button>
                ))}
              </div>

              <form 
                onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
                className="relative flex items-center group"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask NetVision AI..."
                  className="w-full bg-surface border border-border focus:border-primary/50 rounded-2xl px-5 py-4 pr-14 text-sm text-text-main outline-none transition-all placeholder:text-text-muted/50 focus:bg-background shadow-inner"
                />
                <button 
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 p-2.5 bg-primary text-white rounded-xl disabled:opacity-50 disabled:bg-white/10 disabled:text-text-muted transition-all hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(59,130,246,0.4)] disabled:shadow-none"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </form>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
