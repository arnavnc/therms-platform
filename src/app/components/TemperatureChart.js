'use client';
import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function TemperatureChart({ shoeId }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShoeData = async () => {
      if (!shoeId) return;
      
      setLoading(true);
      try {
        const shoeDoc = await getDoc(doc(db, 'shoes', shoeId));
        if (shoeDoc.exists()) {
          const shoeData = shoeDoc.data();
          const formattedData = shoeData.temperature.map(item => ({
            ...item,
            time: new Date(item.timestamp).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })
          }));
          setData(formattedData);
        }
      } catch (error) {
        console.error('Error fetching shoe data:', error);
      }
      setLoading(false);
    };

    fetchShoeData();
  }, [shoeId]);

  if (loading) {
    return <div className="h-64 w-full flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>;
  }

  if (data.length === 0) {
    return <div className="h-64 w-full flex items-center justify-center text-gray-500">
      No temperature data available
    </div>;
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="time" 
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            domain={['auto', 'auto']}
            tick={{ fontSize: 12, fill: '#6B7280' }}
            label={{ 
              value: 'Temperature (°C)', 
              angle: -90, 
              position: 'insideLeft',
              style: { textAnchor: 'middle', fill: '#6B7280', fontSize: 12 }
            }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '0.5rem',
              fontSize: '12px'
            }}
          />
          <Line
            type="monotone"
            dataKey="temp"
            stroke="#ef4444"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}