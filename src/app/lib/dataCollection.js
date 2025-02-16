import { db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

export async function collectUserData(userId, shoeId) {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    const userData = userDoc.data();

    const shoeDoc = await getDoc(doc(db, 'shoes', shoeId));
    if (!shoeDoc.exists()) {
      throw new Error('Shoe not found');
    }
    const shoeData = shoeDoc.data();

    const data = {
      user: {
        age: userData.age,
        sex: userData.sex,
        height: userData.height,
        weight: userData.weight,
        healthConditions: userData.healthConditions || []
      },
      shoe: {
        temperature: shoeData.temperature || [],
        stimulus: shoeData.stimulus || []
      }
    };

    if (userData.terraId) {
      try {
        const params = new URLSearchParams({
          user_id: userData.terraId,
          start_date: "2025-02-15",
          // end_date: new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })).toISOString().split('T')[0],
          to_webhook: 'false',
          with_samples: 'true'
        });

        const response = await fetch(
          `https://api.tryterra.co/v2/daily?${params}`,
          {
            method: 'GET',
            headers: {
              'dev-id': process.env.NEXT_PUBLIC_TERRA_DEV_ID,
              'x-api-key': process.env.NEXT_PUBLIC_TERRA_API_KEY,
              'Content-Type': 'application/json'
            }
          }
        );
        // console.log("terra test" + JSON.stringify(await response.json()));
        // console.log("terra date" + new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })).toISOString().split('T')[0]);

        if (!response.ok) {
          console.error('Terra API error:', await response.text());
          console.log({
            'dev-id': process.env.NEXT_PUBLIC_TERRA_DEV_ID,
            'x-api-key': process.env.NEXT_PUBLIC_TERRA_API_KEY,
            'Content-Type': 'application/json'
          });
          throw new Error('Failed to fetch Terra data');
        }

        const terraData = await response.json();
        
        
        data.health = {
          heartRate: terraData.data?.[0]?.heart_data?.heart_rate || null,
          movement: {
            distance: terraData.data?.[0]?.distance_data?.distance_meters || null,
            steps: terraData.data?.[0]?.steps || null,
            speedSamples: terraData.data?.[0]?.speed_samples || []
          },
          activity: {
            activitySeconds: terraData.data?.[0]?.activity_seconds || null,
            activityLevels: terraData.data?.[0]?.activity_levels || null,
            intensities: {
              low: terraData.data?.[0]?.activity_seconds_low || 0,
              moderate: terraData.data?.[0]?.activity_seconds_med || 0,
              vigorous: terraData.data?.[0]?.activity_seconds_high || 0
            }
          },
          calories: {
            total: terraData.data?.[0]?.calories_total || null,
            active: terraData.data?.[0]?.calories_active || null
          }
        };

        console.log('Terra data fetched:', data.health); 

      } catch (error) {
        console.error('Error fetching Terra data:', error);
        data.health = null;
      }
    } else {
      data.health = null;
    }

    console.log('Final data object:', data);
    return data;
  } catch (error) {
    console.error('Error collecting user data:', error);
    throw error;
  }
} 