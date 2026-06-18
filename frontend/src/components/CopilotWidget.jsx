import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Loader2, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

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
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-8 right-8 px-6 py-4 rounded-full bg-primary text-white shadow-[0_0_30px_rgba(59,130,246,0.6)] hover:scale-105 transition-all z-[9999] flex items-center gap-3 group ${isOpen ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'}`}
      >
        <Bot className="w-6 h-6 group-hover:animate-bounce" />
        <span className="font-bold tracking-wide text-sm">Ask NetVision AI</span>
        <span className="absolute -top-2 -right-2 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-white shadow-[0_0_10px_white]"></span>
        </span>
      </button>

      {/* Chat Window */}
      <div className={`fixed bottom-8 right-8 w-[400px] h-[600px] bg-surface/95 backdrop-blur-xl border border-border shadow-2xl rounded-2xl flex flex-col z-[9999] transition-all duration-300 transform origin-bottom-right ${isOpen ? 'scale-100 opacity-100' : 'scale-90 opacity-0 pointer-events-none'}`}>
        
        {/* Header */}
        <div className="p-4 border-b border-border flex justify-between items-center bg-primary/5 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-text-main flex items-center gap-2">
                NetVision AI
                <Sparkles className="w-3 h-3 text-yellow-500" />
              </h3>
              <p className="text-xs text-green-500 font-medium">Security Copilot Online</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="p-2 text-text-muted hover:text-text-main hover:bg-white/[0.05] rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                msg.role === 'user' 
                  ? 'bg-primary text-white rounded-tr-sm shadow-[0_4px_15px_rgba(59,130,246,0.3)]' 
                  : 'bg-background border border-border text-text-main rounded-tl-sm'
              }`}>
                {msg.role === 'ai' ? (
                  <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-surface prose-pre:border-border">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-background border border-border text-text-main p-3 rounded-2xl rounded-tl-sm flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-xs text-text-muted">Analyzing context...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-border bg-surface/50 rounded-b-2xl">
          
          {/* Suggestions */}
          <div className="flex flex-wrap gap-2 mb-4">
            {suggestions.map((s, idx) => (
              <button 
                key={idx}
                onClick={() => handleSend(s)}
                className="px-3 py-1.5 bg-background border border-border hover:border-primary/50 text-xs text-text-muted hover:text-primary rounded-full transition-colors text-left"
              >
                {s}
              </button>
            ))}
          </div>

          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
            className="relative flex items-center"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask NetVision AI..."
              className="w-full bg-background border border-border focus:border-primary/50 rounded-xl px-4 py-3 pr-12 text-sm text-text-main outline-none transition-colors shadow-inner"
            />
            <button 
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-2 p-2 bg-primary text-white rounded-lg disabled:opacity-50 disabled:bg-surface disabled:text-text-muted transition-colors hover:shadow-[0_0_10px_rgba(59,130,246,0.5)]"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>
    </>
  );
}
