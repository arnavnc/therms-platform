'use client';
import { useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export default function ActionsWidget({ shoeId }) {
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchActions();
  }, [shoeId]);

  const fetchActions = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      setActions(userData.actions || []);
    } catch (error) {
      console.error('Error fetching actions:', error);
      setError('Failed to load actions');
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteAction = async (action) => {
    // Placeholder for future execution functionality
    console.log('Execute action:', action);
  };

  const handleDeleteAction = async (actionId) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      // Filter out the deleted action
      const updatedActions = actions.filter(action => action.id !== actionId);
      
      // Update Firebase
      await updateDoc(doc(db, 'users', user.uid), {
        actions: updatedActions
      });

      // Update local state
      setActions(updatedActions);
    } catch (error) {
      console.error('Error deleting action:', error);
      setError('Failed to delete action');
    }
  };

  if (loading) {
    return <div className="animate-pulse">Loading actions...</div>;
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-100">
          {error}
        </div>
      )}

      {actions.length === 0 ? (
        <p className="text-gray-500 text-sm">No pending actions</p>
      ) : (
        <div className="space-y-3">
          {actions.map((action) => (
            <div key={action.id} className="p-4 bg-white rounded-lg border border-gray-100">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-medium capitalize">{action.type}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  action.urgency === 'immediate' ? 'bg-red-100 text-red-600' :
                  action.urgency === 'scheduled' ? 'bg-yellow-100 text-yellow-600' :
                  'bg-green-100 text-green-600'
                }`}>
                  {action.urgency}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-3">{action.details}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleExecuteAction(action)}
                  className="text-sm bg-blue-500 text-white px-3 py-1.5 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Execute Action
                </button>
                <button
                  onClick={() => handleDeleteAction(action.id)}
                  className="text-sm bg-red-100 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-200"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}