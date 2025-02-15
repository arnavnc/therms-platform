'use client';
import { useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import { withAuth } from '../lib/withAuth';
import HealthConditionsInput from '../components/HealthConditionsInput';

function Profile() {
  const [userData, setUserData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    height: '',
    weight: '',
    sex: '',
    email: '',
    healthConditions: [],
    insightPreference: 'health'
  });
  const [message, setMessage] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserData(data);
            setFormData({
              ...data,
              healthConditions: data.healthConditions || [],
              insightPreference: data.insightPreference || 'health'
            });
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), formData);
        setUserData(formData);
        setIsEditing(false);
      } catch (error) {
        console.error('Error updating profile:', error);
      }
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePreferenceChange = async (preference) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      // Update formData
      setFormData({
        ...formData,
        insightPreference: preference
      });

      // Update Firebase
      await updateDoc(doc(db, 'users', user.uid), {
        insightPreference: preference
      });

      setMessage({ type: 'success', text: 'Preference updated successfully' });
    } catch (error) {
      console.error('Error updating preference:', error);
      setMessage({ type: 'error', text: 'Failed to update preference' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center items-center h-[calc(100vh-4rem)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Profile</h1>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-blue-500 hover:text-blue-600"
            >
              {isEditing ? 'Cancel' : 'Edit'}
            </button>
          </div>

          <form onSubmit={handleUpdate}>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={isEditing ? formData.name : userData.name}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="text-black w-full p-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-75"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Age
                </label>
                <input
                  type="number"
                  name="age"
                  value={isEditing ? formData.age : userData.age}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="text-black w-full p-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-75"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Height (inches)
                </label>
                <input
                  type="number"
                  name="height"
                  value={isEditing ? formData.height : userData.height}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="text-black w-full p-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-75"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Weight (lbs)
                </label>
                <input
                  type="number"
                  name="weight"
                  value={isEditing ? formData.weight : userData.weight}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="text-black w-full p-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-75"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sex
                </label>
                <select
                  name="sex"
                  value={isEditing ? formData.sex : userData.sex}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="text-black w-full p-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-75"
                >
                  <option value="">Select...</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={isEditing ? formData.email : userData.email}
                  disabled={true}
                  className="text-black w-full p-3 border border-gray-200 rounded-lg bg-gray-50 opacity-75"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Health Conditions
              </label>
              {isEditing ? (
                <HealthConditionsInput
                  conditions={formData.healthConditions}
                  setConditions={(conditions) => 
                    setFormData({ ...formData, healthConditions: conditions })
                  }
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {formData.healthConditions?.map((condition, index) => (
                    <span
                      key={index}
                      className="text-black px-3 py-1 rounded-lg bg-gray-50"
                    >
                      {condition}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white shadow sm:rounded-lg mt-5">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Insight Preferences
                </h3>
                <div className="mt-2 max-w-xl text-sm text-gray-500">
                  <p>Choose what type of insights you want to receive from your smart shoe data.</p>
                </div>
                <div className="mt-5">
                  <div className="space-y-4">
                    <button
                      onClick={() => handlePreferenceChange('health')}
                      className={`${
                        userData?.insightPreference === 'health'
                          ? 'bg-blue-50 border-blue-200 text-blue-800'
                          : 'bg-white border-gray-200 text-gray-800'
                      } px-4 py-3 w-full border rounded-lg flex justify-between items-center`}
                    >
                      <div>
                        <h4 className="font-medium">Health-Based Insights</h4>
                        <p className="text-sm text-gray-500">Focus on medical and health implications</p>
                      </div>
                      {userData?.insightPreference === 'health' && (
                        <span className="text-blue-600">✓</span>
                      )}
                    </button>

                    <button
                      onClick={() => handlePreferenceChange('performance')}
                      className={`${
                        userData?.insightPreference === 'performance'
                          ? 'bg-blue-50 border-blue-200 text-blue-800'
                          : 'bg-white border-gray-200 text-gray-800'
                      } px-4 py-3 w-full border rounded-lg flex justify-between items-center`}
                    >
                      <div>
                        <h4 className="font-medium">Performance-Based Insights</h4>
                        <p className="text-sm text-gray-500">Focus on shoe effectiveness and optimization</p>
                      </div>
                      {userData?.insightPreference === 'performance' && (
                        <span className="text-blue-600">✓</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {isEditing && (
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-gradient-to-r from-blue-500 to-red-500 text-white px-4 py-2 rounded-lg hover:brightness-110"
                >
                  Save Changes
                </button>
              </div>
            )}
          </form>
        </div>
      </div>

      {message && (
        <div className={`mt-4 p-4 rounded-md ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.text}
        </div>
      )}
    </div>
  );
}

export default withAuth(Profile); 