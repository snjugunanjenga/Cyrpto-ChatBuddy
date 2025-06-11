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

// Rate limiting
const rateLimit = {};
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 50; // Maximum requests per minute

function checkRateLimit(ip) {
  const now = Date.now();
  if (!rateLimit[ip]) {
    rateLimit[ip] = { count: 1, timestamp: now };
    return true;
  }

  if (now - rateLimit[ip].timestamp > RATE_LIMIT_WINDOW) {
    rateLimit[ip] = { count: 1, timestamp: now };
    return true;
  }

  if (rateLimit[ip].count >= MAX_REQUESTS) {
    return false;
  }

  rateLimit[ip].count++;
  return true;
}

// Simple in-memory cache
const cache = {};
const CACHE_TTL = 60 * 1000; // 60 seconds

function getCache(key) {
  const entry = cache[key];
  if (entry && (Date.now() - entry.timestamp < CACHE_TTL)) {
    return entry.data;
  }
  return null;
}

function setCache(key, data) {
  cache[key] = { data, timestamp: Date.now() };
}

// Helper function to make CoinGecko API requests
const makeCoinGeckoRequest = async (endpoint, params = {}) => {
  try {
    const response = await axios.get(`${COINGECKO_BASE_URL}${endpoint}`, {
      params: {
        ...params,
        x_cg_api_key: COINGECKO_API_KEY
      },
      timeout: 10000 // 10 second timeout
    });
    return response.data;
  } catch (error) {
    console.error('CoinGecko API Error:', {
      endpoint,
      params,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });
    
    if (error.response?.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    
    if (error.response?.status === 401) {
      throw new Error('Invalid API key. Please check your CoinGecko API key configuration.');
    }
    
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timed out. Please try again.');
    }
    
    throw new Error(error.response?.data?.error || 'Failed to fetch data from CoinGecko');
  }
};

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Rate limiting middleware
app.use((req, res, next) => {
  const ip = req.ip;
  if (!checkRateLimit(ip)) {
    return res.status(429).json({
      error: 'Too many requests',
      message: 'Please try again later'
    });
  }
  next();
});

// Get market trends (with caching)
app.get('/api/trends', async (req, res) => {
  try {
    const vs_currency = req.query.vs_currency || 'usd';
    const per_page = req.query.per_page || 10;
    const cacheKey = `/trends?vs_currency=${vs_currency}&per_page=${per_page}`;
    const cached = getCache(cacheKey);
    if (cached) return res.json(cached);
    const data = await makeCoinGeckoRequest('/coins/markets', {
      vs_currency,
      order: 'market_cap_desc',
      per_page,
      sparkline: false
    });
    setCache(cacheKey, data);
    res.json(data);
  } catch (error) {
    console.error('Trends API Error:', error);
    res.status(error.message.includes('Rate limit') ? 429 : 500)
      .json({ error: error.message || 'Failed to fetch market trends' });
  }
});

// Get historical data (with caching)
app.get('/api/historical/:coinId', async (req, res) => {
  try {
    const { coinId } = req.params;
    const { days } = req.query;
    const cacheKey = `/historical/${coinId}?days=${days || '30'}`;
    const cached = getCache(cacheKey);
    if (cached) return res.json(cached);
    const data = await makeCoinGeckoRequest(`/coins/${coinId}/market_chart`, {
      vs_currency: 'usd',
      days: days || '30'
    });
    setCache(cacheKey, data);
    res.json(data);
  } catch (error) {
    console.error('Historical Data API Error:', error);
    res.status(error.message.includes('Rate limit') ? 429 : 500)
      .json({ error: error.message || 'Failed to fetch historical data' });
  }
});

// Get global market data (with caching)
app.get('/api/global', async (req, res) => {
  try {
    const cacheKey = '/global';
    const cached = getCache(cacheKey);
    if (cached) return res.json(cached);
    const data = await makeCoinGeckoRequest('/global');
    setCache(cacheKey, data);
    res.json(data);
  } catch (error) {
    console.error('Global Data API Error:', error);
    res.status(error.message.includes('Rate limit') ? 429 : 500)
      .json({ error: error.message || 'Failed to fetch global market data' });
  }
});

// Enhanced chat endpoint
app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const lowerMessage = message.toLowerCase();
  let response = '';
  let coinId = null;
  let days = null;
  let panel = null;

  try {
    // Coin and time range extraction (simple logic)
    const coinMap = {
      bitcoin: 'bitcoin',
      btc: 'bitcoin',
      ethereum: 'ethereum',
      eth: 'ethereum',
      tether: 'tether',
      usdt: 'tether',
      solana: 'solana',
      sol: 'solana',
      cardano: 'cardano',
      ada: 'cardano',
      dogecoin: 'dogecoin',
      doge: 'dogecoin',
      binance: 'binancecoin',
      bnb: 'binancecoin',
      xrp: 'ripple',
      ripple: 'ripple',
      // add more as needed
    };
    const timeMap = [
      { regex: /1\s?y|1 year|one year/, value: '365' },
      { regex: /90\s?d|90 days|three months/, value: '90' },
      { regex: /30\s?d|30 days|month/, value: '30' },
      { regex: /7\s?d|7 days|week/, value: '7' },
      { regex: /24h|1 day|today/, value: '1' },
    ];
    // Detect coin
    for (const [key, val] of Object.entries(coinMap)) {
      if (lowerMessage.includes(key)) {
        coinId = val;
        break;
      }
    }
    // Detect time range
    for (const t of timeMap) {
      if (t.regex.test(lowerMessage)) {
        days = t.value;
        break;
      }
    }

    // Panel detection and response logic
    if (lowerMessage.includes('trend') || lowerMessage.includes('market')) {
      panel = 'trends';
      const per_page = lowerMessage.includes('top 5') ? 5 : lowerMessage.includes('top 10') ? 10 : 5;
      const trends = await makeCoinGeckoRequest('/coins/markets', {
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page,
        sparkline: false
      });
      const topCoins = trends.map(coin =>
        `${coin.name} (${coin.symbol.toUpperCase()}): $${coin.current_price.toLocaleString()} (${coin.price_change_percentage_24h?.toFixed(2)}% 24h)`
      ).join('\n');
      response = `📈 Current Top Cryptocurrencies:\n${topCoins}`;
    } else if (lowerMessage.includes('historical') || lowerMessage.includes('price history') || lowerMessage.includes('trend')) {
      panel = 'historical';
      if (!coinId) coinId = 'bitcoin';
      if (!days) days = '30';
      const historical = await makeCoinGeckoRequest(`/coins/${coinId}/market_chart`, {
        vs_currency: 'usd',
        days
      });
      const prices = historical.prices;
      const currentPrice = prices[prices.length - 1][1];
      const startPrice = prices[0][1];
      const change = ((currentPrice - startPrice) / startPrice * 100).toFixed(2);
      response = `📊 ${coinId.charAt(0).toUpperCase() + coinId.slice(1)} Price History (${days}d):\n` +
        `Current Price: $${currentPrice.toLocaleString()}\n` +
        `${days}-day Change: ${change}%`;
    } else if (lowerMessage.includes('global') || lowerMessage.includes('market cap')) {
      panel = 'global';
      const global = await makeCoinGeckoRequest('/global');
      const data = global.data;
      response = `🌍 Global Crypto Market:\n` +
        `Total Market Cap: $${data.total_market_cap.usd.toLocaleString()}\n` +
        `24h Trading Volume: $${data.total_volume.usd.toLocaleString()}\n` +
        `BTC Dominance: ${data.market_cap_percentage.btc.toFixed(2)}%`;
    } else if (lowerMessage.includes('ohlc') || lowerMessage.includes('candlestick')) {
      panel = 'ohlc';
      if (!coinId) coinId = 'bitcoin';
      if (!days) days = '30';
      const ohlc = await makeCoinGeckoRequest(`/coins/${coinId}/ohlc`, {
        vs_currency: 'usd',
        days
      });
      response = `🕯️ Candlestick data for ${coinId.charAt(0).toUpperCase() + coinId.slice(1)} (${days}d) loaded. See chart panel.`;
    } else if (lowerMessage.includes('compare')) {
      panel = 'trends';
      // Simple compare: look for two coins
      const foundCoins = Object.entries(coinMap).filter(([key]) => lowerMessage.includes(key)).map(([, val]) => val);
      const uniqueCoins = [...new Set(foundCoins)];
      if (uniqueCoins.length >= 2) {
        const [coinA, coinB] = uniqueCoins;
        const [dataA, dataB] = await Promise.all([
          makeCoinGeckoRequest(`/coins/${coinA}/market_chart`, { vs_currency: 'usd', days: days || '30' }),
          makeCoinGeckoRequest(`/coins/${coinB}/market_chart`, { vs_currency: 'usd', days: days || '30' })
        ]);
        const priceA = dataA.prices[dataA.prices.length - 1][1];
        const priceB = dataB.prices[dataB.prices.length - 1][1];
        response = `🔍 Comparison (${days || '30'}d):\n` +
          `${coinA.charAt(0).toUpperCase() + coinA.slice(1)}: $${priceA.toLocaleString()}\n` +
          `${coinB.charAt(0).toUpperCase() + coinB.slice(1)}: $${priceB.toLocaleString()}`;
      } else {
        response = 'Please specify two coins to compare.';
      }
    } else {
      panel = 'help';
      response = "🤔 I can help you with:\n" +
        "- Market trends and top cryptocurrencies\n" +
        "- Historical price data\n" +
        "- Global market statistics\n" +
        "- Candlestick (OHLC) charts\n" +
        "- Coin comparisons\n" +
        "Just ask me about any of these topics!";
    }

    // Add disclaimer to all responses
    response += "\n\n⚠️ Crypto investing is risky—always do your own research!";
    res.json({ response, coinId, days, panel });
  } catch (error) {
    console.error('Chat API Error:', error);
    res.status(error.message.includes('Rate limit') ? 429 : 500).json({ 
      response: error.message || "Sorry, I'm having trouble fetching the data right now. Please try again later!", 
      coinId, days, panel
    });
  }
});

// Get OHLC (candlestick) data for a coin (with caching)
app.get('/api/coin/:coinId/ohlc', async (req, res) => {
  try {
    const { coinId } = req.params;
    const days = req.query.days || '30';
    const vs_currency = req.query.vs_currency || 'usd';
    const cacheKey = `/ohlc/${coinId}?days=${days}&vs_currency=${vs_currency}`;
    const cached = getCache(cacheKey);
    if (cached) return res.json(cached);
    const data = await makeCoinGeckoRequest(`/coins/${coinId}/ohlc`, {
      vs_currency,
      days
    });
    setCache(cacheKey, data);
    res.json(data);
  } catch (error) {
    console.error('OHLC Data API Error:', error);
    res.status(error.message.includes('Rate limit') ? 429 : 500)
      .json({ error: error.message || 'Failed to fetch OHLC data' });
  }
});

// Start server with error handling
const startServer = (port) => {
  try {
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer(port); 