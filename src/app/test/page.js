'use client';
import { useState } from 'react';
import { createShoeDocument } from '../lib/createShoeData';
import Navbar from '../components/Navbar';

export default function TestPage() {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [shoeId, setShoeId] = useState('');

  const handleCreateTestShoe = async () => {
    if (!shoeId.trim()) {
      setStatus('Please enter a shoe ID');
      return;
    }

    setLoading(true);
    setStatus('Creating shoe...');

    try {
      const result = await createShoeDocument(shoeId);
      if (result.success) {
        setStatus('Success: Shoe created with test data!');
      } else {
        setStatus(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Error:', error);
      setStatus(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Test Data Creator</h1>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="shoeId">
                Shoe ID
              </label>
              <input
                type="text"
                id="shoeId"
                value={shoeId}
                onChange={(e) => setShoeId(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter shoe ID for test data"
              />
            </div>

            <button
              onClick={handleCreateTestShoe}
              disabled={loading}
              className="w-full bg-blue-500 text-white p-3 rounded-lg font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Test Shoe'}
            </button>

            {status && (
              <div className={`p-4 rounded-lg ${
                status.startsWith('Success') 
                  ? 'bg-green-50 text-green-700' 
                  : status.startsWith('Error') 
                    ? 'bg-red-50 text-red-700'
                    : 'bg-blue-50 text-blue-700'
              }`}>
                {status}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 