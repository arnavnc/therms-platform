'use client';
import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

const calculateMagnitude = (currentState, prevState, prevMagnitude = 0) => {
  if (currentState === 0) {
    return prevMagnitude * 0.6;
  }
  if (currentState === prevState && currentState !== 0) {
    const baseMagnitude = Math.abs(prevMagnitude);
    return Math.min(baseMagnitude + 1, 4);
  }
  return 1;
};

export default function StimulusChart({ shoeId }) {
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
          const processedData = shoeData.stimulus.reduce((acc, current, index, array) => {
            const prevItem = acc[index - 1];
            const prevState = prevItem ? prevItem.state : 0;
            const prevMagnitude = prevItem ? prevItem.magnitude : 0;
            let magnitude = calculateMagnitude(current.state, prevState, prevMagnitude);

            if (current.state === 1 || (current.state === 0 && prevState === 1)) {
              magnitude = -Math.abs(magnitude);
            } else if (current.state === 2 || (current.state === 0 && prevState === 2)) {
              magnitude = Math.abs(magnitude);
            }
            
            acc.push({
              ...current,
              time: new Date(current.timestamp).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              }),
              magnitude: magnitude
            });
            
            return acc;
          }, []);
          
          setData(processedData);
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
      No stimulus data available
    </div>;
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
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
            domain={[-4, 4]}
            ticks={[-4, -3, -2, -1, 0, 1, 2, 3, 4]}
            tick={{ fontSize: 12, fill: '#6B7280' }}
            label={{ 
              value: 'Heating/Cooling Intensity', 
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
          <Bar dataKey="magnitude">
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`}
                fill={entry.magnitude > 0 ? '#ef4444' : '#3b82f6'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}