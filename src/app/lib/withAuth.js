'use client';

import { useEffect } from 'react';
import { auth } from './firebase';
import { useRouter } from 'next/navigation';

export const withAuth = (Component) => {
  return (props) => {
    const router = useRouter();

    useEffect(() => {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        if (!user) {
          router.push('/login');
        }
      });
      return () => unsubscribe();
    }, [router]);

    return <Component {...props} />;
  };
};