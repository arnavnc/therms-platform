'use client';
import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function DailySummaryWidget({ shoeId }) {
  const [stats, setStats] = useState({
    totalHeating: 0,
    totalCooling: 0,
    averageTemp: 0,
    netHeat: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!shoeId) return;
      
      try {
        const shoeDoc = await getDoc(doc(db, 'shoes', shoeId));
        if (shoeDoc.exists()) {
          const shoeData = shoeDoc.data();
          const recentTemps = shoeData.temperature.slice(-20);
          const recentStimulus = shoeData.stimulus.slice(-20);
          const avgTemp = recentTemps.reduce((acc, curr) => acc + curr.temp, 0) / recentTemps.length;
          
          let heating = 0;
          let cooling = 0;
          
          recentStimulus.forEach(item => {
            if (item.state === 2) heating += 0.25; // 15 minutes
            if (item.state === 1) cooling += 0.25; // 15 minutes
          });
          
          const netHeat = heating - cooling;
          
          setStats({
            totalHeating: heating,
            totalCooling: cooling,
            averageTemp: avgTemp,
            netHeat: netHeat
          });
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
      setLoading(false);
    };

    fetchStats();
  }, [shoeId]);

  if (loading) {
    return <div className="animate-pulse">Loading stats...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-900">Daily Summary</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-red-50 p-4 rounded-xl">
          <div className="text-red-500 mb-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.totalHeating}h</div>
          <div className="text-sm text-gray-600">Total heating</div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-xl">
          <div className="text-yellow-500 mb-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.netHeat}°C</div>
          <div className="text-sm text-gray-600">Net Heat</div>
        </div>

        <div className="bg-green-50 p-4 rounded-xl">
          <div className="text-green-500 mb-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="text-2xl font-bold text-gray-900">{Math.round(stats.averageTemp * 10) / 10}</div>
          <div className="text-sm text-gray-600">Average temperature</div>
        </div>

        <div className="bg-blue-50 p-4 rounded-xl">
          <div className="text-blue-500 mb-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.totalCooling}h</div>
          <div className="text-sm text-gray-600">Cooling</div>
        </div>
      </div>
    </div>
  );
} 