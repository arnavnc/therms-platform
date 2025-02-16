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
          heart_rate_data: {
            summary: {
              avg_hr_bpm: terraData.data?.[0]?.heart_rate_data?.summary?.avg_hr_bpm || null,
              max_hr_bpm: terraData.data?.[0]?.heart_rate_data?.summary?.max_hr_bpm || null,
              min_hr_bpm: terraData.data?.[0]?.heart_rate_data?.summary?.min_hr_bpm || null,
              resting_hr_bpm: terraData.data?.[0]?.heart_rate_data?.summary?.resting_hr_bpm || null,
            },
            detailed: {
              hr_samples: terraData.data?.[0]?.heart_rate_data?.detailed?.hr_samples || []
            }
          },
          distance_data: {
            distance_meters: terraData.data?.[0]?.distance_data?.distance_meters || null,
            steps: terraData.data?.[0]?.distance_data?.steps || null,
            detailed: {
              step_samples: terraData.data?.[0]?.distance_data?.detailed?.step_samples || [],
              distance_samples: terraData.data?.[0]?.distance_data?.detailed?.distance_samples || []
            }
          },
          active_durations_data: {
            activity_seconds: terraData.data?.[0]?.active_durations_data?.activity_seconds || null,
            rest_seconds: terraData.data?.[0]?.active_durations_data?.rest_seconds || null,
            low_intensity_seconds: terraData.data?.[0]?.active_durations_data?.low_intensity_seconds || 0,
            moderate_intensity_seconds: terraData.data?.[0]?.active_durations_data?.moderate_intensity_seconds || 0,
            vigorous_intensity_seconds: terraData.data?.[0]?.active_durations_data?.vigorous_intensity_seconds || 0,
            activity_levels_samples: terraData.data?.[0]?.active_durations_data?.activity_levels_samples || []
          },
          calories_data: {
            total_burned_calories: terraData.data?.[0]?.calories_data?.total_burned_calories || null,
            net_activity_calories: terraData.data?.[0]?.calories_data?.net_activity_calories || null,
            calorie_samples: terraData.data?.[0]?.calories_data?.calorie_samples || []
          }
        };

        console.log('Terra API Response:', terraData);
        console.log('Formatted Health Data:', data.health);

        console.log('Terra data fetched:', data.health); 

      } catch (error) {
        console.error('Error fetching Terra data:', error);
        data.health = null;
      }
    } else {
      data.health = null;
    }

    // First create the wearable data section
    const wearableDataSection = data.health ? `
    Wearable Device Data:
    - Heart Rate: 
      * Average: ${data.health.heart_rate_data.summary.avg_hr_bpm || 'Not available'} BPM
      * Max: ${data.health.heart_rate_data.summary.max_hr_bpm || 'Not available'} BPM
      * Min: ${data.health.heart_rate_data.summary.min_hr_bpm || 'Not available'} BPM
      * Resting: ${data.health.heart_rate_data.summary.resting_hr_bpm || 'Not available'} BPM
    - Activity:
      * Total Activity Time: ${data.health.active_durations_data.activity_seconds || 'Not available'} seconds
      * Low Intensity: ${data.health.active_durations_data.low_intensity_seconds || '0'} seconds
      * Moderate Intensity: ${data.health.active_durations_data.moderate_intensity_seconds || '0'} seconds
      * Vigorous Intensity: ${data.health.active_durations_data.vigorous_intensity_seconds || '0'} seconds
    - Movement:
      * Distance: ${data.health.distance_data.distance_meters || 'Not available'} meters
      * Steps: ${data.health.distance_data.steps || 'Not available'} steps
    - Calories:
      * Total Burned: ${data.health.calories_data.total_burned_calories || 'Not available'} calories
      * Active: ${data.health.calories_data.net_activity_calories || 'Not available'} calories` 
    : 'No wearable data available';

    // Then construct the full prompt
    const prompt = `Analyze this health-focused data:

    User Profile:
    - Age: ${data.user.age || 'Not specified'}
    - Sex: ${data.user.sex || 'Not specified'}
    - Height: ${data.user.height || 'Not specified'}cm
    - Weight: ${data.user.weight || 'Not specified'}kg
    - Health Conditions: ${data.user.healthConditions?.length ? data.user.healthConditions.join(", ") : "None reported"}

    Shoe Data:
    - Temperature Readings: ${JSON.stringify(data.shoe.temperature)}
    - Stimulus Data: ${JSON.stringify(data.shoe.stimulus)}

    ${wearableDataSection}`;

    console.log('Final data object:', data);
    console.log('Final Prompt:', prompt);
    return data;
  } catch (error) {
    console.error('Error collecting user data:', error);
    throw error;
  }
} 