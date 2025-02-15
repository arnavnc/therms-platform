'use client';
import { useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import Navbar from '../components/Navbar';
import TemperatureChart from '../components/TemperatureChart';
import StimulusChart from '../components/StimulusChart';
import InsightsWidget from '../components/InsightsWidget';
// import ActionsWidget from '../components/ActionsWidget';
import { withAuth } from '../lib/withAuth';
import DailySummaryWidget from '../components/DailySummaryWidget';

function Dashboard() {
  const [userData, setUserData] = useState(null);
  const [selectedShoeId, setSelectedShoeId] = useState(null);
  const [loading, setLoading] = useState(true);

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
              <h2 className="text-lg font-semibold mb-4 text-gray-800">Actions</h2>
              {/* <ActionsWidget /> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withAuth(Dashboard);