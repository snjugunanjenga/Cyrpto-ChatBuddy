const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Cryptocurrency data
const cryptoData = {
  "Bitcoin": { 
    "price_trend": "rising", 
    "market_cap": "high", 
    "energy_use": "high", 
    "sustainability_score": 5 
  },
  "Ethereum": { 
    "price_trend": "stable", 
    "market_cap": "high", 
    "energy_use": "medium", 
    "sustainability_score": 7 
  },
  "Cardano": { 
    "price_trend": "rising", 
    "market_cap": "medium", 
    "energy_use": "low", 
    "sustainability_score": 9 
  }
};

// Helper function to get trending cryptocurrencies
const getTrendingCryptos = () => {
  return Object.entries(cryptoData)
    .filter(([_, data]) => data.price_trend === 'rising')
    .map(([name]) => name);
};

// Helper function to get sustainable cryptocurrencies
const getSustainableCryptos = () => {
  return Object.entries(cryptoData)
    .filter(([_, data]) => data.energy_use === 'low' && data.sustainability_score > 7)
    .map(([name]) => name);
};

// Helper function to get profitable cryptocurrencies
const getProfitableCryptos = () => {
  return Object.entries(cryptoData)
    .filter(([_, data]) => data.price_trend === 'rising' && data.market_cap === 'high')
    .map(([name]) => name);
};

// Chatbot endpoint
app.post('/api/chat', (req, res) => {
  const { message } = req.body;
  const lowerMessage = message.toLowerCase();
  let response = '';

  if (lowerMessage.includes('trending') || lowerMessage.includes('trend')) {
    const trending = getTrendingCryptos();
    response = `📈 Here are the trending cryptocurrencies: ${trending.join(', ')}!`;
  } else if (lowerMessage.includes('sustainable') || lowerMessage.includes('green')) {
    const sustainable = getSustainableCryptos();
    response = `🌱 These are the most sustainable cryptocurrencies: ${sustainable.join(', ')}!`;
  } else if (lowerMessage.includes('profitable') || lowerMessage.includes('profit')) {
    const profitable = getProfitableCryptos();
    response = `💰 Here are the most profitable cryptocurrencies: ${profitable.join(', ')}!`;
  } else {
    response = "🤔 Hmm, I'm not sure about that. Ask me about trending, sustainable, or profitable coins!";
  }

  // Add disclaimer to all responses
  response += "\n\n⚠️ Crypto investing is risky—always do your own research!";

  res.json({ response });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 