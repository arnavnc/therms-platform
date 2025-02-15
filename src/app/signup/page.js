'use client'; // Mark as Client Component
import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import HealthConditionsInput from '../components/HealthConditionsInput';

export default function Signup() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    age: '',
    sex: '',
    healthConditions: [],
    insightPreference: 'health'
  });
  const [error, setError] = useState('');
  const router = useRouter();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;
      
      await setDoc(doc(db, 'users', user.uid), {
        email: formData.email,
        name: formData.name,
        age: formData.age,
        height: '',
        weight: '',
        sex: formData.sex,
        terraId: 'placeholder',
        shoes: [],
        healthConditions: formData.healthConditions,
        insightPreference: formData.insightPreference // Added to user document
      });

      router.push('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSexChange = (e) => {
    const value = e.target.value.toUpperCase();
    if (value === '' || value === 'M' || value === 'F') {
      setFormData({
        ...formData,
        sex: value
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-500 to-red-600 p-6">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-4xl w-full border border-white/20">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-800">Create Account</h1>
          <p className="mt-2 text-sm text-gray-600">Join us to get started with THERMS</p>
        </div>
        
        {error && <p className="text-red-500 text-sm mb-4 bg-red-50 p-3 rounded-lg">{error}</p>}
        
        <form onSubmit={handleSignup} className="grid grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="name">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                className="text-black w-full p-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
                name="name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="age">
                Age
              </label>
              <input
                type="number"
                id="age"
                min="0"
                max="120"
                className="text-black w-full p-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your age"
                value={formData.age}
                onChange={handleChange}
                name="age"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="sex">
                Sex (M/F)
              </label>
              <input
                type="text"
                id="sex"
                maxLength="1"
                className="text-black w-full p-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="M or F"
                value={formData.sex}
                onChange={handleSexChange}
                name="sex"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="email">
                Email
              </label>
              <input
                type="email"
                id="email"
                className="text-black w-full p-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                name="email"
                required
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="password">
                Password
              </label>
              <input
                type="password"
                id="password"
                className="text-black w-full p-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                name="password"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Health Conditions
              </label>
              <HealthConditionsInput 
                conditions={formData.healthConditions} 
                setConditions={(conditions) => setFormData({ ...formData, healthConditions: conditions })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Insight Preference
              </label>
              <select
                name="insightPreference"
                value={formData.insightPreference}
                onChange={handleChange}
                className="text-black w-full p-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="health">Health-Based Insights</option>
                <option value="performance">Performance-Based Insights</option>
              </select>
            </div>
          </div>

          {/* Full Width Button */}
          <div className="col-span-2 space-y-4">
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-red-500 text-white p-3 rounded-lg font-medium hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
            >
              Create Account
            </button>
            
            <div className="text-center">
              <Link href="/login" className="text-sm text-blue-500 hover:brightness-50 bg-gradient-to-r from-red-500 to-blue-500 inline-block text-transparent bg-clip-text">
                Already have an account? Sign in
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}