import React, { useState } from 'react';
import ChatInterface from './components/ChatInterface';
import Dashboard from './components/Dashboard';
import './App.css';

function App() {
  // State to allow chatbot to update dashboard (e.g., focusCoin, trendRange)
  const [focusCoin, setFocusCoin] = useState(null);
  const [trendRange, setTrendRange] = useState('30');

  // Handler to receive dashboard update triggers from ChatInterface
  const handleDashboardUpdate = ({ coinId, days }) => {
    if (coinId) setFocusCoin(coinId);
    if (days) setTrendRange(days);
  };

  return (
    <div className="App">
      <Dashboard focusCoin={focusCoin} trendRange={trendRange} onTrendRangeChange={setTrendRange} />
      <ChatInterface onDashboardUpdate={handleDashboardUpdate} />
    </div>
  );
}

export default App;
