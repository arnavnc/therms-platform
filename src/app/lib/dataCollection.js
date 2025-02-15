import { db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import { terraData } from './terraData';

export async function collectUserData(userId, shoeId) {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userData = userDoc.data();

    const shoeDoc = await getDoc(doc(db, 'shoes', shoeId));
    const shoeData = shoeDoc.data();

    const recentTemps = shoeData.temperature.slice(-20);
    
    const recentStimulus = shoeData.stimulus.slice(-20);

    const activityData = terraData.data[0].active_durations_data;
    const heartRateData = terraData.data[0].heart_rate_data.detailed.hr_samples;
    const movementData = terraData.data[0].movement_data;

    const structuredData = {
      user: {
        age: userData.age,
        sex: userData.sex,
        height: userData.height,
        weight: userData.weight,
        healthConditions: userData.healthConditions
      },
      shoe: {
        temperature: recentTemps,
        stimulus: recentStimulus
      },
      health: {
        activity: {
          activitySeconds: activityData.activity_seconds,
          activityLevels: activityData.activity_levels_samples
        },
        heartRate: {
          samples: heartRateData
        },
        movement: {
          speedSamples: movementData.speed_samples
        }
      }
    };

    return structuredData;
  } catch (error) {
    console.error('Error collecting data:', error);
    throw error;
  }
} 