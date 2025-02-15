'use client';
import { useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import Navbar from '../components/Navbar';
import TemperatureChart from '../components/TemperatureChart';
import StimulusChart from '../components/StimulusChart';
import InsightsWidget from '../components/InsightsWidget';
import ActionsWidget from '../components/ActionsWidget';
import { withAuth } from '../lib/withAuth';
import DailySummaryWidget from '../components/DailySummaryWidget';

function Dashboard() {
  const [userData, setUserData] = useState(null);
  const [selectedShoeId, setSelectedShoeId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserData(data);
            // Set first shoe as default if available
            if (data.shoes && data.shoes.length > 0) {
              setSelectedShoeId(data.shoes[0].id);
            }
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center items-center h-[calc(100vh-4rem)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          {userData?.shoes?.length > 1 && (
            <select
              value={selectedShoeId}
              onChange={(e) => setSelectedShoeId(e.target.value)}
              className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {userData.shoes.map((shoe) => (
                <option key={shoe.id} value={shoe.id}>
                  {shoe.name}
                </option>
              ))}
            </select>
          )}
        </div>
        
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <DailySummaryWidget shoeId={selectedShoeId} />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold mb-4 text-gray-800">Foot Temperature Over Time</h2>
              <TemperatureChart shoeId={selectedShoeId} />
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold mb-4 text-gray-800">Heating/Cooling State Over Time</h2>
              <StimulusChart shoeId={selectedShoeId} />
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold mb-4 text-gray-800">Insights</h2>
              <InsightsWidget shoeId={selectedShoeId} />
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Recommended Actions</h2>
                <div className="relative group">
                  <svg 
                    className="w-5 h-5 text-gray-400 cursor-help" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth="2" 
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div className="absolute right-0 w-64 p-2 bg-gray-800 text-white text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                    Here are some suggested actions based on your Therms data. Carrying them out is as easy as one click. The tags by the action will determine how immediate/urgent the action is for our agent to use.
                  </div>
                </div>
              </div>
              <ActionsWidget />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withAuth(Dashboard);