import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyD57HS8lmerJ6AflaUV4U1lrXmHh58oo30",
    authDomain: "therms-31aa6.firebaseapp.com",
    projectId: "therms-31aa6",
    storageBucket: "therms-31aa6.firebasestorage.app",
    messagingSenderId: "124064417025",
    appId: "1:124064417025:web:f0bbcc52e0f452a907c700"
};
  
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };

export async function updateUserStructure(userId) {
  const userRef = doc(db, 'users', userId);
  
  try {
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data();
    const updates = {};
    
    if (!userData.actions) updates.actions = [];
    if (!userData.preferredPharmacy) updates.preferredPharmacy = null;
    if (!userData.insurance) updates.insurance = null;
    if (!userData.location) updates.location = null;
    if (!userData.insightPreference) updates.insightPreference = 'health';
    
    if (Object.keys(updates).length > 0) {
      await updateDoc(userRef, updates);
    }
  } catch (error) {
    console.error('Error updating user structure:', error);
    throw error;
  }
}