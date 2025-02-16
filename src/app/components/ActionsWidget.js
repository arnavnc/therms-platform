'use client';
import { useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export default function ActionsWidget({ shoeId }) {
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [executingAction, setExecutingAction] = useState(null);
  const [lastExitMessage, setLastExitMessage] = useState(null);
  const [selectedAction, setSelectedAction] = useState(null);
  const [userPrompt, setUserPrompt] = useState(null);
  const [userInput, setUserInput] = useState('');
  const [initialMessages, setInitialMessages] = useState([]);

  useEffect(() => {
    fetchActions();
  }, [shoeId]);

  const fetchActions = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.log('No user logged in');
        return;
      }

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      console.log('userData:', userData);
      
      const shoeInsights = userData?.insights?.[shoeId];
      console.log('shoeInsights:', shoeInsights, 'shoeId:', shoeId);
      
      const actions = shoeInsights?.data?.actions || [];
      console.log('actions:', actions);
      
      setActions(actions);
    } catch (error) {
      console.error('Error fetching actions:', error);
      setError('Failed to load actions');
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteAction = async (action, previousAttempt = null) => {
    if (!['appointment', 'medication'].includes(action.type)) {
      setError('This action type cannot be automated');
      return;
    }

    setExecutingAction(action.id);
    setError(null);

    try {
      const response = await fetch('/api/execute-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: {
            type: action.type,
            parameters: {
              url: action.urls?.[0] ?? null,
              formData: action.formData ?? {},
              successCriteria: action.successCriteria ?? '',
              fallbackSteps: action.fallbackSteps ?? []
            }
          },
          previousAttempt,
          initialMessages: initialMessages
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('API Error:', data);
        throw new Error(data.error || 'Failed to execute action');
      }

      if (data.needsMoreInfo) {
        console.log('Needs more info:', data.message);
        setLastExitMessage(data.message);
        setSelectedAction(action);
        setExecutingAction(null);
        return;
      }

      if (data.output) {
        const user = auth.currentUser;
        if (!user) return;

        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();
        
        const shoeInsights = userData.insights[shoeId];
        const updatedActions = shoeInsights.data.actions.map(a => {
          if (a.id === action.id) {
            return {
              ...a,
              status: 'completed',
              result: data.output
            };
          }
          return a;
        });
        if (data.messages) {
          setInitialMessages(data.messages);
        }

        await updateDoc(doc(db, 'users', user.uid), {
          [`insights.${shoeId}.data.actions`]: updatedActions
        });

        setActions(updatedActions);
      }

    } catch (error) {
      console.error('Error executing action:', error);
      setError(error.message);
    } finally {
      setExecutingAction(null);
    }
  };

  const handleUpdateActionDetails = async (updatedDetails) => {
    if (!selectedAction) return;

    try {
      const user = auth.currentUser;
      if (!user) return;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      
      const shoeInsights = userData.insights[shoeId];
      const updatedActions = shoeInsights.data.actions.map(a => {
        if (a.id === selectedAction.id) {
          return {
            ...a,
            formData: {
              ...a.formData,
              ...updatedDetails
            }
          };
        }
        return a;
      });

      await updateDoc(doc(db, 'users', user.uid), {
        [`insights.${shoeId}.data.actions`]: updatedActions
      });

      setActions(updatedActions);
      setLastExitMessage(null);
      setSelectedAction(null);

      const updatedAction = updatedActions.find(a => a.id === selectedAction.id);
      if (updatedAction) {
        handleExecuteAction(updatedAction);
      }
    } catch (error) {
      console.error('Error updating action details:', error);
      setError('Failed to update action details');
    }
  };

  const handleDeleteAction = async (actionId) => {
    try {
      const user = auth.currentUser;
      if (!user) return;


      const updatedActions = actions.filter(action => action.id !== actionId);
      

      await updateDoc(doc(db, 'users', user.uid), {
        actions: updatedActions
      });


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
      {console.log('Render - lastExitMessage:', lastExitMessage)}
      {console.log('Render - selectedAction:', selectedAction)}
      
      {error && (
        <div className="p-3 bg-red-50 text-red-500 rounded-lg text-sm">
          {error}
        </div>
      )}
      
      {actions.length === 0 && !loading && (
        <div className="text-gray-500 text-center py-4">
          No actions found for this shoe
        </div>
      )}
      
      {actions.map((action, index) => (
        <div 
          key={action.id || `action-${index}`}
          className="p-4 bg-white rounded-lg shadow border border-gray-100"
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium text-gray-900">{action.title}</h3>
              <p className="text-sm text-gray-500">{action.details}</p>
              <div className="mt-2 flex gap-2">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  action.urgency === 'immediate' ? 'bg-red-100 text-red-700' :
                  action.urgency === 'scheduled' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {action.urgency}
                </span>
                <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">
                  {action.type}
                </span>
              </div>
            </div>
            
            <div className="flex gap-2">
              {['appointment', 'medication'].includes(action.type) && (
                <button
                  onClick={() => handleExecuteAction(action)}
                  disabled={!!executingAction}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${
                    executingAction === action.id
                      ? 'bg-gray-100 text-gray-400'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  {executingAction === action.id ? 'Executing...' : 'Execute'}
                </button>
              )}
              <button
                onClick={() => handleDeleteAction(action.id)}
                className="px-3 py-1 rounded-md text-sm font-medium text-gray-500 hover:bg-gray-100"
              >
                Delete
              </button>
            </div>
          </div>
          
          {action.status === 'completed' && action.result && (
            <div className="mt-3 text-sm text-gray-600">
              <p>Completed: {action.result.details?.timestamp}</p>
              {action.result.details?.confirmationNumber && (
                <p>Confirmation: {action.result.details?.confirmationNumber}</p>
              )}
            </div>
          )}
        </div>
      ))}
      
      {loading && (
        <div className="animate-pulse text-center py-4">
          Loading actions...
        </div>
      )}

      {userPrompt && (
        <UserPromptDialog
          message={userPrompt.message}
          onSubmit={userPrompt.onSubmit}
          onClose={() => setUserPrompt(null)}
        />
      )}

      {lastExitMessage && selectedAction && (
        <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <h3 className="text-lg font-medium text-yellow-800 mb-2">
            Additional Information Needed
          </h3>
          <div className="text-sm text-yellow-700 whitespace-pre-wrap mb-4">
            {lastExitMessage}
          </div>
          
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const updates = {
                url: formData.get('url'),
                patientInfo: formData.get('patientInfo'),
                preferredDate: formData.get('preferredDate'),
                appointmentType: formData.get('appointmentType'),
                insurance: formData.get('insurance'),
                successCriteria: formData.get('successCriteria')
              };
              handleUpdateActionDetails(updates);
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Booking URL
              </label>
              <input
                type="url"
                name="url"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="https://..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Patient Information
              </label>
              <textarea
                name="patientInfo"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                rows="3"
                placeholder="Name, DOB, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Preferred Date/Time
              </label>
              <input
                type="text"
                name="preferredDate"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="e.g., Next Tuesday afternoon"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Appointment Type/Specialty
              </label>
              <input
                type="text"
                name="appointmentType"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="e.g., Primary Care, Specialist"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Insurance Information
              </label>
              <textarea
                name="insurance"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                rows="2"
                placeholder="Insurance provider, member ID, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Success Criteria
              </label>
              <input
                type="text"
                name="successCriteria"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="e.g., Confirmation number received"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setLastExitMessage(null);
                  setSelectedAction(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600"
              >
                Update & Retry
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

const UserPromptDialog = ({ message, onSubmit, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
    <div className="bg-white p-4 rounded-lg w-96">
      <p className="mb-4">{message}</p>
      <textarea 
        className="w-full p-2 border rounded"
        placeholder="Enter additional details..."
        onChange={(e) => setUserInput(e.target.value)}
      />
      <div className="mt-4 flex justify-end gap-2">
        <button onClick={onClose}>Cancel</button>
        <button onClick={() => onSubmit(userInput)}>Submit</button>
      </div>
    </div>
  </div>
);