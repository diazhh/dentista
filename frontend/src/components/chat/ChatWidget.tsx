import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageSquare, X, Send, User, Bot, Minimize2 } from 'lucide-react';

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  actions?: Array<{ type: string; label: string; value: string }>;
}

interface ChatWidgetProps {
  tenantId: string;
  apiUrl?: string;
  theme?: 'blue' | 'green' | 'purple' | 'red';
  position?: 'bottom-right' | 'bottom-left';
  welcomeMessage?: string;
  providerName?: string;
}

const THEME_COLORS = {
  blue: {
    primary: 'bg-blue-600',
    primaryHover: 'hover:bg-blue-700',
    primaryLight: 'bg-blue-50',
    primaryText: 'text-blue-600',
    primaryBorder: 'border-blue-200',
    userBubble: 'bg-blue-600 text-white',
    ring: 'ring-blue-300',
    badge: 'bg-red-500',
  },
  green: {
    primary: 'bg-green-600',
    primaryHover: 'hover:bg-green-700',
    primaryLight: 'bg-green-50',
    primaryText: 'text-green-600',
    primaryBorder: 'border-green-200',
    userBubble: 'bg-green-600 text-white',
    ring: 'ring-green-300',
    badge: 'bg-red-500',
  },
  purple: {
    primary: 'bg-purple-600',
    primaryHover: 'hover:bg-purple-700',
    primaryLight: 'bg-purple-50',
    primaryText: 'text-purple-600',
    primaryBorder: 'border-purple-200',
    userBubble: 'bg-purple-600 text-white',
    ring: 'ring-purple-300',
    badge: 'bg-red-500',
  },
  red: {
    primary: 'bg-red-600',
    primaryHover: 'hover:bg-red-700',
    primaryLight: 'bg-red-50',
    primaryText: 'text-red-600',
    primaryBorder: 'border-red-200',
    userBubble: 'bg-red-600 text-white',
    ring: 'ring-red-300',
    badge: 'bg-orange-500',
  },
};

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ChatWidget({
  tenantId,
  apiUrl,
  theme = 'blue',
  position = 'bottom-right',
  welcomeMessage,
  providerName,
}: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const baseUrl = apiUrl || import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  const colors = THEME_COLORS[theme];

  // Scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  // Add welcome message when widget first opens
  useEffect(() => {
    if (isOpen && messages.length === 0 && welcomeMessage) {
      setMessages([
        {
          id: generateId(),
          text: welcomeMessage,
          sender: 'bot',
          timestamp: new Date(),
        },
      ]);
    }
  }, [isOpen, messages.length, welcomeMessage]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setUnreadCount(0);
    }
  }, [isOpen]);

  // NOTE: In production, this can be replaced with Socket.io for real-time communication.
  // Currently using REST API calls for reliability.
  const sendMessage = useCallback(async (text: string) => {
    const userMessage: ChatMessage = {
      id: generateId(),
      text,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch(`${baseUrl}/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, message: text, sessionId }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();

      // Store session ID from first response
      if (data.sessionId && !sessionId) {
        setSessionId(data.sessionId);
      }

      const botMessage: ChatMessage = {
        id: generateId(),
        text: data.reply || data.message || 'Sorry, I could not process your request.',
        sender: 'bot',
        timestamp: new Date(),
        actions: data.actions || undefined,
      };

      setMessages((prev) => [...prev, botMessage]);

      if (!isOpen) {
        setUnreadCount((prev) => prev + 1);
      }
    } catch {
      const errorMessage: ChatMessage = {
        id: generateId(),
        text: 'Sorry, there was an error connecting to the server. Please try again later.',
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  }, [baseUrl, tenantId, sessionId, isOpen]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isTyping) return;
    sendMessage(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleActionClick = (action: { type: string; label: string; value: string }) => {
    sendMessage(action.value);
  };

  const positionClasses = position === 'bottom-right'
    ? 'right-4 sm:right-6'
    : 'left-4 sm:left-6';

  const panelPositionClasses = position === 'bottom-right'
    ? 'right-0 sm:right-0'
    : 'left-0 sm:left-0';

  return (
    <div className={`fixed bottom-4 sm:bottom-6 ${positionClasses} z-[9999]`}>
      {/* Chat Panel */}
      {isOpen && (
        <div
          className={`
            ${panelPositionClasses}
            fixed inset-0 sm:absolute sm:inset-auto sm:bottom-16
            sm:w-[380px] sm:h-[500px] sm:rounded-xl
            bg-white shadow-2xl border border-gray-200
            flex flex-col overflow-hidden
            sm:mb-2
            animate-in fade-in slide-in-from-bottom-2 duration-200
          `}
        >
          {/* Header */}
          <div className={`${colors.primary} text-white px-4 py-3 flex items-center justify-between flex-shrink-0`}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-sm">
                  {providerName || 'Virtual Assistant'}
                </p>
                <p className="text-xs opacity-80">Online</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors hidden sm:block"
                aria-label="Minimize chat"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                aria-label="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.length === 0 && !welcomeMessage && (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <MessageSquare className="w-10 h-10 mb-2" />
                <p className="text-sm">Send a message to get started</p>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-end gap-2 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                  {/* Avatar */}
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                      msg.sender === 'user'
                        ? 'bg-gray-200 text-gray-600'
                        : `${colors.primaryLight} ${colors.primaryText}`
                    }`}
                  >
                    {msg.sender === 'user' ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Bot className="w-4 h-4" />
                    )}
                  </div>

                  {/* Bubble */}
                  <div>
                    <div
                      className={`px-3 py-2 rounded-xl text-sm leading-relaxed ${
                        msg.sender === 'user'
                          ? `${colors.userBubble} rounded-br-sm`
                          : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm shadow-sm'
                      }`}
                    >
                      {msg.text}
                    </div>

                    {/* Action Buttons */}
                    {msg.actions && msg.actions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {msg.actions.map((action, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleActionClick(action)}
                            className={`px-3 py-1 text-xs font-medium rounded-full border ${colors.primaryBorder} ${colors.primaryText} hover:${colors.primaryLight} transition-colors`}
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Timestamp */}
                    <p className={`text-[10px] text-gray-400 mt-1 ${msg.sender === 'user' ? 'text-right' : ''}`}>
                      {formatTime(msg.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex items-end gap-2 max-w-[85%]">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${colors.primaryLight} ${colors.primaryText}`}>
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl rounded-bl-sm px-4 py-3 shadow-sm">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 bg-white p-3 flex-shrink-0">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isTyping}
                placeholder="Type a message..."
                className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ boxShadow: 'none' }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className={`${colors.primary} ${colors.primaryHover} text-white p-2.5 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0`}
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-gray-400 text-center mt-1.5">
              Powered by MediCloud AI
            </p>
          </div>
        </div>
      )}

      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`${colors.primary} ${colors.primaryHover} text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 ${colors.ring} focus:ring-opacity-50`}
          aria-label="Open chat"
        >
          <MessageSquare className="w-6 h-6" />

          {/* Unread Badge */}
          {unreadCount > 0 && (
            <span className={`absolute -top-1 -right-1 ${colors.badge} text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center`}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      )}
    </div>
  );
}
