import { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Bot, User } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function NovaChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m NOVA, your AI shopping assistant. How can I help you find the perfect electronics today?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: getAIResponse(input),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1000);
  };

  const getAIResponse = (userInput: string): string => {
    const lower = userInput.toLowerCase();

    if (lower.includes('laptop') || lower.includes('computer')) {
      return 'I can help you find the perfect laptop! We have options ranging from budget-friendly student laptops to high-performance gaming machines. What\'s your budget and primary use case?';
    }

    if (lower.includes('phone') || lower.includes('smartphone')) {
      return 'We have a great selection of smartphones! From budget options under KSh 20,000 to flagship devices. What features are most important to you - camera, battery life, or performance?';
    }

    if (lower.includes('price') || lower.includes('cost') || lower.includes('how much')) {
      return 'Our prices are clearly listed on each product page. We offer competitive pricing with genuine products and full warranty. Would you like me to help you find something within a specific budget?';
    }

    if (lower.includes('delivery') || lower.includes('shipping')) {
      return 'We offer fast delivery across Kenya! Same-day delivery in Nairobi for orders before 2 PM, and 1-3 days nationwide. Delivery fees start at KSh 300, and orders over KSh 30,000 get free delivery!';
    }

    if (lower.includes('payment') || lower.includes('mpesa')) {
      return 'We accept M-PESA PayBill for secure payments. After placing your order, you\'ll receive payment instructions via WhatsApp. It\'s fast, secure, and convenient!';
    }

    if (lower.includes('warranty') || lower.includes('guarantee')) {
      return 'All our products come with genuine manufacturer warranties, typically 12-24 months. We also offer our own Imara warranty support via WhatsApp for any issues.';
    }

    if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
      return 'Hello! Welcome to Imara Tech. I\'m here to help you find the best electronics at great prices. What are you looking for today?';
    }

    return 'I\'d be happy to help you with that! You can browse our product categories, or tell me what you\'re looking for and I\'ll guide you to the right products. We have laptops, phones, gaming gear, audio equipment, and much more!';
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-teal text-white shadow-lg transition-all hover:scale-110 hover:bg-tealdeep"
        aria-label="Open NOVA AI Chat"
      >
        <Sparkles className="h-6 w-6" />
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping-soft absolute inline-flex h-full w-full rounded-full bg-amber opacity-75"></span>
          <span className="relative inline-flex h-4 w-4 rounded-full bg-amber"></span>
        </span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex h-[600px] w-[400px] flex-col overflow-hidden rounded-2xl border border-line bg-card shadow-2xl max-w-[calc(100vw-2rem)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-line bg-ink px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-display text-sm font-bold text-white">NOVA AI</h3>
            <p className="text-xs text-white/60">Your shopping assistant</p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 transition hover:bg-white/10 hover:text-white"
          aria-label="Close chat"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                message.role === 'user' ? 'bg-amber' : 'bg-teal'
              }`}
            >
              {message.role === 'user' ? (
                <User className="h-4 w-4 text-ink" />
              ) : (
                <Bot className="h-4 w-4 text-white" />
              )}
            </div>
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                message.role === 'user'
                  ? 'bg-amber text-ink'
                  : 'bg-mist text-ink'
              }`}
            >
              <p className="text-sm font-semibold leading-relaxed">{message.content}</p>
              <p className="mt-1 text-xs opacity-60">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div className="rounded-2xl bg-mist px-4 py-3">
              <div className="flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-teal" style={{ animationDelay: '0ms' }}></span>
                <span className="h-2 w-2 animate-bounce rounded-full bg-teal" style={{ animationDelay: '150ms' }}></span>
                <span className="h-2 w-2 animate-bounce rounded-full bg-teal" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-line bg-mist p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask NOVA anything..."
            className="input flex-1 !h-11"
            disabled={isTyping}
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="btn btn-teal !h-11 !w-11 !p-0"
            aria-label="Send message"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
        <p className="mt-2 text-center text-xs text-muted">
          NOVA is here to help you shop smarter
        </p>
      </div>
    </div>
  );
}
