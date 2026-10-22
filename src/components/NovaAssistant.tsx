import { useState } from 'react';
import { Product } from '@/types';
import { MessageCircle, X, Send } from 'lucide-react';

interface NovaAssistantProps {
  product?: Product;
}

export default function NovaAssistant({ product }: NovaAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    {
      role: 'assistant',
      content: product
        ? `Hi! I'm Nova, your shopping assistant. I can help you learn more about the ${product.name}. What would you like to know?`
        : "Hi! I'm Nova, your shopping assistant. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState('');

  const getResponse = (question: string): string => {
    const q = question.toLowerCase();

    if (!product) {
      if (q.includes('laptop')) {
        return "We have a great selection of laptops! You can browse our laptop collection in the Shop section. Would you like me to help you find something specific?";
      }
      if (q.includes('phone')) {
        return "Check out our phone collection! We have the latest smartphones at competitive prices. What features are you looking for?";
      }
      if (q.includes('shipping') || q.includes('delivery')) {
        return "We offer free shipping on orders over KSh 30,000. Standard delivery takes 2-5 business days across Kenya. You can track your order once it's shipped!";
      }
      if (q.includes('payment') || q.includes('mpesa')) {
        return "We accept M-PESA PayBill for secure payments. After placing your order, our team will contact you with payment instructions.";
      }
      return "I'm here to help! You can ask me about our products, shipping, payments, or anything else. What would you like to know?";
    }

    // Product-specific responses
    if (q.includes('price') || q.includes('cost') || q.includes('how much')) {
      return `The ${product.name} is priced at KSh ${product.price.toLocaleString()}.${product.oldPrice ? ` That's a great deal - originally KSh ${product.oldPrice.toLocaleString()}!` : ''}`;
    }

    if (q.includes('spec') || q.includes('feature')) {
      const specsList = Object.entries(product.specs || {})
        .map(([key, value]) => `• ${key}: ${value}`)
        .join('\n');
      return `Here are the key specifications for ${product.name}:\n\n${specsList || 'Check the product details section for full specifications.'}`;
    }

    if (q.includes('stock') || q.includes('available') || q.includes('in stock')) {
      const stock = product.stock ?? (product.inStock ? 10 : 0);
      return stock > 0
        ? `Yes! The ${product.name} is currently in stock and ready to ship.`
        : `Sorry, the ${product.name} is currently out of stock. You can sign up to be notified when it's back, or check out similar products.`;
    }

    if (q.includes('warranty') || q.includes('guarantee')) {
      return `The ${product.name} comes with a standard manufacturer warranty. For specific warranty details, please contact our support team via WhatsApp.`;
    }

    if (q.includes('delivery') || q.includes('shipping')) {
      return `We can deliver the ${product.name} to your location. Shipping is free for orders over KSh 30,000, otherwise it's KSh 300. Delivery takes 2-5 business days.`;
    }

    if (q.includes('compare') || q.includes('vs') || q.includes('versus')) {
      return `I can help you compare products! Browse our ${product.category} section to see similar items, or ask me about specific features you're looking for.`;
    }

    if (q.includes('buy') || q.includes('purchase') || q.includes('order')) {
      return `Ready to get the ${product.name}? Just click "Add to Cart" and proceed to checkout. We'll guide you through the payment process via M-PESA.`;
    }

    if (q.includes('discount') || q.includes('deal') || q.includes('offer')) {
      return product.oldPrice
        ? `Great news! The ${product.name} is currently on sale. You save KSh ${(product.oldPrice - product.price).toLocaleString()}!`
        : `Check our Deals section for current promotions and special offers!`;
    }

    return `I'd be happy to help you with the ${product.name}. You can ask me about:\n• Price and availability\n• Specifications and features\n• Shipping and delivery\n• Warranty information\n• How to order\n\nWhat would you like to know?`;
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setInput('');

    // Simulate AI response delay
    setTimeout(() => {
      const response = getResponse(userMessage);
      setMessages((prev) => [...prev, { role: 'assistant', content: response }]);
    }, 500);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-teal text-white px-4 py-3 rounded-full shadow-lg hover:bg-tealdeep transition-colors"
      >
        <MessageCircle className="w-5 h-5" />
        <span className="font-semibold">Need Help?</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col max-h-[600px]">
      {/* Header */}
      <div className="bg-teal text-white p-4 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-6 h-6" />
          <div>
            <h3 className="font-bold">Nova Assistant</h3>
            <p className="text-xs text-white/80">Your shopping helper</p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 hover:bg-white/20 rounded transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                msg.role === 'user'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="text-sm whitespace-pre-line">{msg.content}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="border-t p-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about this product..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent text-sm"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="bg-primary-600 text-white p-2 rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          aria-label="Send"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
