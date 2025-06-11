import React, { useState, useRef, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './ChatInterface.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const ChatInterface = ({ onDashboardUpdate }) => {
  const [messages, setMessages] = useState([
    {
      text: "👋 Hi! I'm CryptoBuddy, your AI-powered financial sidekick! Ask me about market trends, historical data, or global statistics!",
      sender: 'bot'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chartData, setChartData] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, chartData]);

  const formatChartData = (prices) => {
    return prices.map(([timestamp, price]) => ({
      date: new Date(timestamp).toLocaleDateString(),
      price: price
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    const userMessage = { text: input, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setChartData(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: input }),
      });

      const data = await response.json();
      
      // Add bot response
      setMessages(prev => [...prev, { text: data.response, sender: 'bot' }]);

      // If the response includes historical data, fetch and display the chart
      if (data.historicalData) {
        setChartData(formatChartData(data.historicalData.prices));
      }

      // If the response includes dashboard update triggers, call the prop
      if (onDashboardUpdate && (data.coinId || data.days)) {
        onDashboardUpdate({ coinId: data.coinId, days: data.days });
      }
    } catch (error) {
      setMessages(prev => [...prev, { 
        text: "Sorry, I'm having trouble connecting to the server. Please try again later!", 
        sender: 'bot' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-container bg-gradient-to-tr from-blue-100 to-white min-h-screen flex flex-col justify-end p-4 md:p-8">
      <div className="chat-header bg-white rounded-2xl shadow-lg p-4 mb-4 flex flex-col items-center border border-blue-100">
        <h1 className="text-2xl font-bold text-blue-700 mb-1">CryptoBuddy</h1>
        <p className="text-blue-500">Your AI-Powered Financial Sidekick!</p>
      </div>
      
      <div className="messages-container flex-1 overflow-y-auto mb-4 px-2">
        {messages.map((message, index) => (
          <div 
            key={index} 
            className={`message max-w-xl mx-auto my-2 px-4 py-3 rounded-2xl shadow transition-all duration-200 ${message.sender === 'user' ? 'bg-blue-600 text-white self-end ml-auto' : 'bg-white text-blue-900 self-start mr-auto border border-blue-100'}`}
          >
            {message.text}
          </div>
        ))}
        {isLoading && (
          <div className="message bot-message loading max-w-xl mx-auto my-2 px-4 py-3 rounded-2xl shadow bg-white text-blue-900 border border-blue-100">
            <div className="typing-indicator flex gap-1">
              <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-blue-300 rounded-full animate-bounce delay-75"></span>
              <span className="w-2 h-2 bg-blue-200 rounded-full animate-bounce delay-150"></span>
            </div>
          </div>
        )}
        {chartData && (
          <div className="chart-container bg-white rounded-2xl shadow p-4 my-4 border border-blue-100">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="price" stroke="#2563eb" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="input-container flex gap-2 max-w-xl mx-auto mt-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me about cryptocurrencies..."
          disabled={isLoading}
          className="flex-1 rounded-2xl border border-blue-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition shadow"
        />
        <button type="submit" disabled={isLoading || !input.trim()} className="bg-blue-600 text-white px-6 py-2 rounded-2xl shadow hover:bg-blue-700 transition disabled:opacity-50">
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatInterface; 