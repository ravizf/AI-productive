import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, hasFirebaseConfig } from '../firebase';

export default function ProtectedRoute({ children }) {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    if (!hasFirebaseConfig || !auth) {
      const syncLocalUser = () => {
        const localUser = localStorage.getItem('ns_auth_user');
        setUser(localUser ? JSON.parse(localUser) : null);
      };

      syncLocalUser();
      window.addEventListener('ns-auth-change', syncLocalUser);
      return () => window.removeEventListener('ns-auth-change', syncLocalUser);
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  if (user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
