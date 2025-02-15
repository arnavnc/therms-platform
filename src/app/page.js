'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { auth } from './lib/firebase';

const features = [
  {
    title: "Smart Temperature Control",
    description: "Automatically adjusts to your optimal foot temperature throughout the day",
    icon: (
      <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 16v3a2 2 0 002 2h10a2 2 0 002-2v-3M5 16l3-6M5 16h14M19 16l-3-6M12 3v7m0 0l-3-3m3 3l3-3" />
      </svg>
    )
  },
  {
    title: "Real-time Monitoring",
    description: "Track your foot temperature and comfort levels with detailed analytics",
    icon: (
      <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    )
  },
  {
    title: "Long Battery Life",
    description: "Up to 12 hours of continuous temperature regulation on a single charge",
    icon: (
      <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    )
  }
];

export default function Home() {
  const [currentFeature, setCurrentFeature] = useState(0);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const nextFeature = () => {
    setCurrentFeature((prev) => (prev + 1) % features.length);
  };

  const prevFeature = () => {
    setCurrentFeature((prev) => (prev - 1 + features.length) % features.length);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 py-16">
          {/* Left Column */}
          <div className="flex flex-col justify-center space-y-8">
            <h1 className="text-6xl font-black">
              <span className="bg-gradient-to-r from-red-500 to-blue-500 inline-block text-transparent bg-clip-text">
                Therms.
              </span>
            </h1>
            <p className="text-2xl text-gray-600">
              The all-in-one thermoregulating wearable system
            </p>
            
            {/* Feature Carousel */}
            <div className="bg-gray-50 p-8 rounded-xl relative">
              <button 
                onClick={prevFeature}
                className="absolute left-5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white shadow-lg hover:bg-gray-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <div className="flex gap-6 items-center px-8">
                <div className="p-4">
                  {features[currentFeature].icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2 text-gray-800">{features[currentFeature].title}</h3>
                  <p className="text-gray-600">{features[currentFeature].description}</p>
                </div>
              </div>

              <button 
                onClick={nextFeature}
                className="absolute right-5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white shadow-lg hover:bg-gray-50"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Conditional CTA Buttons */}
            {!loading && (
              <div className="flex gap-4">
                {user ? (
                  <Link
                    href="/dashboard"
                    className="w-full bg-gradient-to-r from-blue-500 to-red-500 text-white px-6 py-3 rounded-lg font-medium hover:brightness-110 transition-all duration-200 text-center"
                  >
                    Go to Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/register"
                      className="flex-1 bg-gradient-to-r from-blue-500 to-red-500 text-white px-6 py-3 rounded-lg font-medium hover:brightness-110 transition-all duration-200 text-center"
                    >
                      Get started
                    </Link>
                    <Link
                      href="/login"
                      className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-all duration-200 text-center"
                    >
                      Sign in
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Hero Image */}
          <div className="hidden lg:block bg-gray-100 rounded-xl">
            {/* Replace with your hero image */}
            <div className="w-full h-full min-h-[600px] relative">
              <Image
                src="/hero.webp"
                alt="Therms smart shoe"
                fill
                className="object-cover rounded-xl"
              />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
