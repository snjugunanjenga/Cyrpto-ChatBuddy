const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// CoinGecko API configuration
const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;
const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';

// Helper function to make CoinGecko API requests
const makeCoinGeckoRequest = async (endpoint, params = {}) => {
  try {
    const response = await axios.get(`${COINGECKO_BASE_URL}${endpoint}`, {
      params: {
        ...params,
        x_cg_api_key: COINGECKO_API_KEY
      }
    });
    return response.data;
  } catch (error) {
    console.error('CoinGecko API Error:', error.message);
    throw error;
  }
};

// Get market trends
app.get('/api/trends', async (req, res) => {
  try {
    const data = await makeCoinGeckoRequest('/coins/markets', {
      vs_currency: 'usd',
      order: 'market_cap_desc',
      per_page: 10,
      sparkline: false
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch market trends' });
  }
});

// Get historical data
app.get('/api/historical/:coinId', async (req, res) => {
  try {
    const { coinId } = req.params;
    const { days } = req.query;
    const data = await makeCoinGeckoRequest(`/coins/${coinId}/market_chart`, {
      vs_currency: 'usd',
      days: days || '30'
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch historical data' });
  }
});

// Get global market data
app.get('/api/global', async (req, res) => {
  try {
    const data = await makeCoinGeckoRequest('/global');
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch global market data' });
  }
});

// Enhanced chat endpoint
app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  const lowerMessage = message.toLowerCase();
  let response = '';

  try {
    if (lowerMessage.includes('trend') || lowerMessage.includes('market')) {
      const trends = await makeCoinGeckoRequest('/coins/markets', {
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: 5,
        sparkline: false
      });
      
      const topCoins = trends.map(coin => 
        `${coin.name} (${coin.symbol.toUpperCase()}): $${coin.current_price.toLocaleString()}`
      ).join('\n');
      
      response = `📈 Current Top Cryptocurrencies:\n${topCoins}`;
    } 
    else if (lowerMessage.includes('historical') || lowerMessage.includes('price history')) {
      const coinId = lowerMessage.includes('bitcoin') ? 'bitcoin' : 
                     lowerMessage.includes('ethereum') ? 'ethereum' : 'bitcoin';
      
      const historical = await makeCoinGeckoRequest(`/coins/${coinId}/market_chart`, {
        vs_currency: 'usd',
        days: '30'
      });
      
      const prices = historical.prices;
      const currentPrice = prices[prices.length - 1][1];
      const monthAgoPrice = prices[0][1];
      const change = ((currentPrice - monthAgoPrice) / monthAgoPrice * 100).toFixed(2);
      
      response = `📊 ${coinId.charAt(0).toUpperCase() + coinId.slice(1)} Price History:\n` +
                `Current Price: $${currentPrice.toLocaleString()}\n` +
                `30-day Change: ${change}%`;
    }
    else if (lowerMessage.includes('global') || lowerMessage.includes('market cap')) {
      const global = await makeCoinGeckoRequest('/global');
      const data = global.data;
      
      response = `🌍 Global Crypto Market:\n` +
                `Total Market Cap: $${data.total_market_cap.usd.toLocaleString()}\n` +
                `24h Trading Volume: $${data.total_volume.usd.toLocaleString()}\n` +
                `BTC Dominance: ${data.market_cap_percentage.btc.toFixed(2)}%`;
    }
    else {
      response = "🤔 I can help you with:\n" +
                "- Market trends and top cryptocurrencies\n" +
                "- Historical price data\n" +
                "- Global market statistics\n" +
                "Just ask me about any of these topics!";
    }

    // Add disclaimer to all responses
    response += "\n\n⚠️ Crypto investing is risky—always do your own research!";
    res.json({ response });
  } catch (error) {
    console.error('Error processing chat request:', error);
    res.status(500).json({ 
      response: "Sorry, I'm having trouble fetching the data right now. Please try again later!" 
    });
  }
});

// Function to start server with port fallback
const startServer = (port) => {
  try {
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    if (error.code === 'EADDRINUSE') {
      console.log(`Port ${port} is in use, trying port ${port + 1}`);
      startServer(port + 1);
    } else {
      console.error('Error starting server:', error);
    }
  }
};

startServer(port); 