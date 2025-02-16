'use client';
import { useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function InsightsWidget({ shoeId }) {
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState(null);
  const [error, setError] = useState(null);
  const [nextUpdate, setNextUpdate] = useState(null);
  const [authInitialized, setAuthInitialized] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthInitialized(true);
      if (user && shoeId) {
        fetchInsights(user.uid);
      }
    });

    return () => unsubscribe();
  }, [shoeId]);

  const fetchInsights = async (userId) => {
    try {
      setLoading(true);
      setError(null);

      if (!userId) throw new Error('User not authenticated');
      if (!shoeId) throw new Error('No shoe selected');

      // Get user document to check for Terra ID and stored insights
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = userDoc.data();
      
      const storedInsights = userData.insights?.[shoeId];
      const now = new Date();
      now.setHours(0, 0, 0, 0); // Set to start of day

      // Check if insights exist and are from today
      if (storedInsights && storedInsights.generatedAt) {
        const lastGenerated = new Date(storedInsights.generatedAt);
        lastGenerated.setHours(0, 0, 0, 0);

        if (lastGenerated.getTime() === now.getTime()) {
          // Only set insights data, excluding actions
          const { actions, ...insightsWithoutActions } = storedInsights.data;
          setInsights(insightsWithoutActions);
          
          // Set next update to tomorrow
          const nextUpdateTime = new Date(now);
          nextUpdateTime.setDate(nextUpdateTime.getDate() + 1);
          setNextUpdate(nextUpdateTime);
          setLoading(false);
          return;
        }
      }

      // Generate new insights, passing the terraId if it exists
      const response = await fetch('/api/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          shoeId: shoeId,
          terraId: userData.terraId // Pass the Terra ID directly from user document
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch insights');
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.message || data.error);
      }

      // Store new insights in Firebase
      await updateDoc(doc(db, 'users', userId), {
        [`insights.${shoeId}`]: {
          data: data,
          generatedAt: now.toISOString()
        }
      });

      // Only set insights data, excluding actions
      const { actions, ...insightsWithoutActions } = data;
      setInsights(insightsWithoutActions);
      
      // Set next update to tomorrow
      const nextUpdateTime = new Date(now);
      nextUpdateTime.setDate(nextUpdateTime.getDate() + 1);
      setNextUpdate(nextUpdateTime);
    } catch (err) {
      console.error('Insights Error:', err);
      setError(err.message || 'Failed to process request');
    } finally {
      setLoading(false);
    }
  };

  // Format time until next update
  const formatTimeUntilUpdate = () => {
    if (!nextUpdate) return '';
    const now = new Date();
    const diff = nextUpdate - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `Next update in ${hours}h ${minutes}m`;
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'alert':
        return 'text-red-600';
      case 'warning':
        return 'text-yellow-600';
      case 'normal':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  if (!authInitialized || loading) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
        <span>Loading insights...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg border border-red-100">
        {error}
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
          <span className="text-sm font-medium text-gray-700">Status:</span>
          <span className={`font-semibold ${getStatusColor(insights.status)}`}>
            {insights.status.toUpperCase()}
          </span>
        </div>
        {nextUpdate && (
          <span className="text-sm text-gray-500">
            {formatTimeUntilUpdate()}
          </span>
        )}
      </div>

      <div className="p-4 bg-white rounded-lg border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-800 mb-2">Summary</h3>
        <p className="text-sm text-gray-600">{insights.summary}</p>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-800">Insights</h3>
        {insights.insights.map((insight, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg shadow-sm ${getSeverityColor(insight.severity)}`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="font-medium capitalize text-sm">{insight.type}</span>
              <span className="text-xs px-2 py-1 rounded-full bg-white/50">
                {insight.severity} severity
              </span>
            </div>
            <p className="text-sm mb-2">{insight.description}</p>
            <p className="text-sm font-medium">
              Recommendation: {insight.recommendation}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}