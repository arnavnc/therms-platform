'use client';
import { useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export default function InsightsWidget({ shoeId }) {
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState(null);
  const [error, setError] = useState(null);
  const [nextUpdate, setNextUpdate] = useState(null);

  useEffect(() => {
    fetchInsights();
  }, [shoeId]);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
      if (!shoeId) throw new Error('No shoe selected');

      // Get stored insights from Firebase
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      
      const storedInsights = userData.insights?.[shoeId];
      const now = new Date();

      // Check if insights exist and are less than 24 hours old
      if (storedInsights && storedInsights.generatedAt) {
        const lastGenerated = new Date(storedInsights.generatedAt);
        const timeDiff = now - lastGenerated;
        const hoursDiff = timeDiff / (1000 * 60 * 60);

        if (hoursDiff < 24) {
          setInsights(storedInsights.data);
          // Calculate time until next update
          const nextUpdateTime = new Date(lastGenerated.getTime() + (24 * 60 * 60 * 1000));
          setNextUpdate(nextUpdateTime);
          setLoading(false);
          return;
        }
      }

      // Generate new insights if none exist or they're old
      const response = await fetch('/api/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          shoeId: shoeId,
        }),
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.message || data.error);
      }

      // Add IDs to new actions
      const actionsWithIds = data.actions.map(action => ({
        ...action,
        id: Math.random().toString(36).substring(2, 15),
        createdAt: new Date().toISOString(),
        status: 'pending'
      }));

      // Merge with existing actions or create new array
      const existingActions = userData.actions || [];
      const updatedActions = [...existingActions, ...actionsWithIds];

      // Store new insights and actions in Firebase
      await updateDoc(doc(db, 'users', user.uid), {
        actions: updatedActions,
        insights: {
          ...userData.insights,
          [shoeId]: {
            data: { ...data, actions: actionsWithIds },
            generatedAt: now.toISOString()
          }
        }
      });

      // Update local state
      setInsights({ ...data, actions: actionsWithIds });
      setNextUpdate(new Date(now.getTime() + (24 * 60 * 60 * 1000)));
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

  return (
    <div className="h-full">
      {loading && (
        <div className="flex items-center gap-2 text-gray-500">
          <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          <span>Loading insights...</span>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg border border-red-100">
          {error}
        </div>
      )}

      {insights && (
        <div className="space-y-4">
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

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-800">Recommended Actions</h3>
            {insights.actions.map((action, index) => (
              <div key={index} className="p-4 bg-white rounded-lg border border-gray-100">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-bold capitalize text-gray-800">{action.type}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    action.urgency === 'immediate' ? 'bg-red-100 text-red-600' :
                    action.urgency === 'scheduled' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-green-100 text-green-600'
                  }`}>
                    {action.urgency}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{action.details}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}