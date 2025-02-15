import { db } from './firebase';
import { doc, setDoc } from 'firebase/firestore';
import { shoeData } from './data';

export async function createShoeDocument(shoeId) {
  try {
    // Create the shoe document structure using shoeData
    const shoeDocument = {
      name: "Right Shoe",
      temperature: shoeData.temperatureData.map(reading => ({
        timestamp: reading.timestamp,
        temp: reading.temp
      })),
      stimulus: shoeData.stimulusData ? shoeData.stimulusData.map(reading => ({
        timestamp: reading.timestamp,
        state: reading.state
      })) : []  // Provide empty array if stimulusData doesn't exist
    };

    // Create the document in Firebase
    await setDoc(doc(db, 'shoes', shoeId), shoeDocument);
    
    return {
      success: true,
      message: 'Shoe data created successfully'
    };
  } catch (error) {
    console.error('Error creating shoe data:', error);
    return {
      success: false,
      message: error.message
    };
  }
} 