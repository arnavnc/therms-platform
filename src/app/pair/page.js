'use client';
import { useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import { withAuth } from '../lib/withAuth';

function Pair() {
  const [shoeId, setShoeId] = useState('');
  const [shoeName, setShoeName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [foundShoe, setFoundShoe] = useState(null);
  const [userShoes, setUserShoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUserShoes = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserShoes(userData.shoes || []);
        }
      }
      setLoading(false);
    };
    fetchUserShoes();
  }, []);

  const validateShoeId = async (e) => {
    e.preventDefault();
    setIsValidating(true);
    setError('');
    setSuccess('');
    setFoundShoe(null);

    // Check if user already has 2 shoes
    if (userShoes.length >= 2) {
      setError('You can only pair up to 2 shoes. Please unpair a shoe before adding a new one.');
      setIsValidating(false);
      return;
    }

    // Check if shoe is already paired
    if (userShoes.some(shoe => shoe.id === shoeId)) {
      setError('This shoe has already been paired to your account.');
      setIsValidating(false);
      return;
    }

    try {
      const shoeDoc = await getDoc(doc(db, 'shoes', shoeId));
      if (!shoeDoc.exists()) {
        setError('Invalid shoe ID. Please check and try again.');
        setIsValidating(false);
        return;
      }
      setFoundShoe(shoeDoc.data());
      setIsValidating(false);
    } catch (err) {
      setError('Error validating shoe ID. Please try again.');
      setIsValidating(false);
      console.error('Error:', err);
    }
  };

  const handlePairShoe = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!shoeName.trim()) {
      setError('Please enter a name for your shoe.');
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) {
        router.push('/login');
        return;
      }

      // Update user's shoes array in Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        shoes: arrayUnion({
          id: shoeId,
          name: shoeName.trim()
        })
      });

      setSuccess('Shoe paired successfully!');
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err) {
      setError('Error pairing shoe. Please try again.');
      console.error('Error:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-blue-500 to-red-600">
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      </div>
    );
  }

  if (userShoes.length >= 2) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-blue-500 to-red-600">
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="bg-white p-8 rounded-xl shadow-lg w-96 border border-white/20">
            <div className="text-center">
              <h1 className="text-2xl font-semibold text-gray-800 mb-4">Maximum Shoes Paired</h1>
              <p className="text-gray-600 mb-6">You can only pair up to 2 shoes. Please unpair a shoe before adding a new one.</p>
              <a 
                href="/dashboard" 
                className="text-blue-500 hover:text-blue-600 font-medium"
              >
                Return to Dashboard
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-500 to-red-600">
      <Navbar />
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="bg-white p-8 rounded-xl shadow-lg w-96 border border-white/20">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-800">Pair Your Shoe</h1>
            <p className="mt-2 text-sm text-gray-600">Enter your shoe's unique identifier to begin</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-500 text-sm rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 text-green-500 text-sm rounded-lg">
              {success}
            </div>
          )}

          {!foundShoe ? (
            <form onSubmit={validateShoeId} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="shoeId">
                  Shoe ID
                </label>
                <input
                  type="text"
                  id="shoeId"
                  value={shoeId}
                  onChange={(e) => setShoeId(e.target.value)}
                  className="text-black w-full p-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your shoe ID"
                  required
                />
                <p className="mt-2 text-xs text-gray-500">You can find this ID on the bottom of your shoe</p>
              </div>
              <button
                type="submit"
                disabled={isValidating}
                className="w-full bg-gradient-to-r from-blue-500 to-red-500 text-white p-3 rounded-lg font-medium hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50"
              >
                {isValidating ? 'Validating...' : 'Validate Shoe ID'}
              </button>
            </form>
          ) : (
            <form onSubmit={handlePairShoe} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="shoeName">
                  Name Your Shoe
                </label>
                <input
                  type="text"
                  id="shoeName"
                  value={shoeName}
                  onChange={(e) => setShoeName(e.target.value)}
                  className="text-black w-full p-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter a name for your shoe"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-500 to-red-500 text-white p-3 rounded-lg font-medium hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
              >
                Pair Shoe
              </button>
              <button
                type="button"
                onClick={() => setFoundShoe(null)}
                className="w-full bg-gray-100 text-gray-600 p-3 rounded-lg font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200"
              >
                Try Different ID
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <a href="/dashboard" className="text-sm text-blue-500 hover:brightness-50 bg-gradient-to-r from-red-500 to-blue-500 inline-block text-transparent bg-clip-text">
              Return to Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withAuth(Pair);