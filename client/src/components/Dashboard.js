import React, { useEffect, useState, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import axios from 'axios';

const trendRanges = [
  { label: '7d', value: '7' },
  { label: '30d', value: '30' },
  { label: '90d', value: '90' },
  { label: '1y', value: '365' },
];

const Dashboard = ({ focusCoin = null, trendRange = '30', onTrendRangeChange }) => {
  const [coins, setCoins] = useState([]);
  const [global, setGlobal] = useState(null);
  const [selectedCoin, setSelectedCoin] = useState(focusCoin);
  const [trendData, setTrendData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [range, setRange] = useState(trendRange);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [coinsRes, globalRes] = await Promise.all([
        axios.get('/api/trends?per_page=10'),
        axios.get('/api/global'),
      ]);
      setCoins(coinsRes.data);
      setGlobal(globalRes.data.data);
      setSelectedCoin(coinsRes.data[0]?.id);
      fetchTrendData(coinsRes.data[0]?.id, range);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch dashboard data');
      console.error('Dashboard data fetch error:', err);
    }
    setLoading(false);
  }, [range]);

  const fetchTrendData = useCallback(async (coinId, days) => {
    if (!coinId) return;
    setTrendData([]);
    setError(null);
    try {
      const res = await axios.get(`/api/historical/${coinId}?days=${days}`);
      setTrendData(
        res.data.prices.map(([timestamp, price]) => ({
          date: new Date(timestamp).toLocaleDateString(),
          price,
        }))
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch trend data');
      console.error('Trend data fetch error:', err);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    if (focusCoin) {
      setSelectedCoin(focusCoin);
      fetchTrendData(focusCoin, range);
    }
  }, [focusCoin, fetchTrendData, range]);

  useEffect(() => {
    if (selectedCoin) {
      fetchTrendData(selectedCoin, range);
    }
  }, [range, selectedCoin, fetchTrendData]);

  if (loading) return <div className="p-8 text-center text-lg text-gray-500">Loading dashboard...</div>;
  if (error) return <div className="p-8 text-center text-lg text-red-500">Error: {error}</div>;
  if (!global) return <div className="p-8 text-center text-lg text-gray-500">No data available</div>;

  return (
    <div>
      <div style={{color: 'red', fontWeight: 'bold', textAlign: 'center'}}>Dashboard component loaded</div>
      <div className="p-6 min-h-screen bg-gradient-to-br from-blue-50 to-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {/* Global Metrics Card */}
          <div className="col-span-1 bg-white rounded-2xl shadow-lg p-6 flex flex-col border border-blue-100">
            <h2 className="text-xl font-bold mb-3 text-blue-700">Global Market</h2>
            <div className="mb-1">Total Market Cap: <span className="font-mono text-blue-900">${global.total_market_cap.usd.toLocaleString()}</span></div>
            <div className="mb-1">24h Volume: <span className="font-mono text-blue-900">${global.total_volume.usd.toLocaleString()}</span></div>
            <div>BTC Dominance: <span className="font-mono text-yellow-600">{global.market_cap_percentage.btc.toFixed(2)}%</span></div>
          </div>
          {/* Top 10 Coins */}
          <div className="col-span-2 bg-white rounded-2xl shadow-lg p-6 border border-blue-100">
            <h2 className="text-xl font-bold mb-3 text-blue-700">Top 10 Cryptocurrencies</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-blue-50">
                    <th className="text-left py-2 px-2">#</th>
                    <th className="text-left py-2 px-2">Name</th>
                    <th className="text-right py-2 px-2">Price</th>
                    <th className="text-right py-2 px-2">24h</th>
                    <th className="text-right py-2 px-2">7d</th>
                    <th className="text-right py-2 px-2">30d</th>
                    <th className="text-right py-2 px-2">Volume</th>
                    <th className="text-right py-2 px-2">Dominance</th>
                  </tr>
                </thead>
                <tbody>
                  {coins.map((coin, idx) => (
                    <tr
                      key={coin.id}
                      className={`transition-colors duration-200 cursor-pointer ${selectedCoin === coin.id ? 'bg-blue-100/60' : 'hover:bg-blue-50'}`}
                      onClick={() => setSelectedCoin(coin.id)}
                    >
                      <td className="py-2 px-2">{idx + 1}</td>
                      <td className="flex items-center gap-2 py-2 px-2">
                        <img src={coin.image} alt={coin.name} className="w-6 h-6 rounded-full border border-blue-100" />
                        <span className="font-semibold text-gray-700">{coin.name}</span> <span className="uppercase text-xs text-gray-400">({coin.symbol})</span>
                      </td>
                      <td className="text-right py-2 px-2 font-mono">${coin.current_price.toLocaleString()}</td>
                      <td className={`text-right py-2 px-2 font-mono ${coin.price_change_percentage_24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>{coin.price_change_percentage_24h?.toFixed(2)}%</td>
                      <td className="text-right py-2 px-2">-</td>
                      <td className="text-right py-2 px-2">-</td>
                      <td className="text-right py-2 px-2 font-mono">${coin.total_volume.toLocaleString()}</td>
                      <td className="text-right py-2 px-2">-</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {/* Trend Selector & Chart */}
          <div className="col-span-3 bg-white rounded-2xl shadow-lg p-6 border border-blue-100 mt-2">
            <div className="flex items-center gap-4 mb-4">
              <h2 className="text-xl font-bold text-blue-700">{coins.find(c => c.id === selectedCoin)?.name || 'Coin'} Trend</h2>
              <select
                className="ml-auto border border-blue-200 rounded px-3 py-1 bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
                value={range}
                onChange={e => {
                  setRange(e.target.value);
                  if (onTrendRangeChange) onTrendRangeChange(e.target.value);
                }}
              >
                {trendRanges.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" minTickGap={20} />
                <YAxis domain={['auto', 'auto']} />
                <Tooltip formatter={v => `$${v.toLocaleString()}`} />
                <Line type="monotone" dataKey="price" stroke="#2563eb" dot={false} strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 