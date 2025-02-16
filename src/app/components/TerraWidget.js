'use client';
import { useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function TerraWidget() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authInitialized, setAuthInitialized] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthInitialized(true);
      if (user) {
        generateTerraSession(user);
      } else {
        setError('User not authenticated');
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const generateTerraSession = async (user) => {
    try {
      // Get user doc to check if already connected
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();

      if (userData?.terraConnected) {
        setLoading(false);
        return; // Already connected
      }

      // Generate Terra widget session
      const response = await fetch('https://api.tryterra.co/v2/auth/generateWidgetSession', {
        method: 'POST',
        headers: {
          'dev-id': process.env.NEXT_PUBLIC_TERRA_DEV_ID,
          'x-api-key': process.env.NEXT_PUBLIC_TERRA_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reference_id: user.uid,
          providers: "GARMIN,FITBIT,OURA,WITHINGS,SUUNTO",
          language: "en",
          auth_success_redirect_url: `${window.location.origin}/dashboard?terra_success=true`,
          auth_failure_redirect_url: `${window.location.origin}/dashboard?error=connection_failed`
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate Terra session');
      }

      const data = await response.json();
      
      // Store Terra session info in user's document
      await updateDoc(doc(db, 'users', user.uid), {
        terraSessionId: data.session_id,
        terraSessionCreated: new Date().toISOString(),
        terraConnected: false
      });

      // Store both session ID and reference ID in localStorage
      localStorage.setItem('terraSessionId', data.session_id);
      localStorage.setItem('terraReferenceId', user.uid);

      // Redirect to Terra widget URL
      window.location.href = data.url;
    } catch (err) {
      console.error('Terra Widget Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!authInitialized || loading) {
    return (
      <div className="flex justify-center items-center p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-50 text-gray-700 rounded-lg">
      Initializing connection to wearable devices...
    </div>
  );
}