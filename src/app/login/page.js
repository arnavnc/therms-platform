'use client';
import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-500 to-red-600">
      <div className="bg-white p-8 rounded-xl shadow-lg w-96 border border-white/20">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-800">Welcome Back</h1>
          <p className="mt-2 text-sm text-gray-600">Sign in to your account to continue</p>
        </div>
        {error && <p className="text-red-500 text-sm mb-4 bg-red-50 p-3 rounded-lg">{error}</p>}
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="email">
              Email
            </label>
            <input
              type="email"
              id="email"
              className="text-black w-full p-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="password">
              Password
            </label>
            <input
              type="password"
              id="password"
              className="text-black w-full p-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-500 to-red-500 text-white p-3 rounded-lg font-medium hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
          >
            Sign In
          </button>
        </form>
        <div className="mt-6 text-center">
          <Link href="/signup" className="text-sm text-blue-500 hover:brightness-50 bg-gradient-to-r from-red-500 to-blue-500 inline-block text-transparent bg-clip-text">
            Don't have an account? Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}