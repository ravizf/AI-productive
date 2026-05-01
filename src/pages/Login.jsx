import { useState } from 'react';
import { auth, hasFirebaseConfig } from '../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('demo@neurosync.app');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (!hasFirebaseConfig || !auth) {
        const localUser = {
          uid: localStorage.getItem('ns_local_uid') || crypto.randomUUID(),
          email,
        };
        localStorage.setItem('ns_local_uid', localUser.uid);
        localStorage.setItem('ns_auth_user', JSON.stringify(localUser));
        window.dispatchEvent(new Event('ns-auth-change'));
        navigate('/dashboard');
        return;
      }

      if (isSignup) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }

      navigate('/dashboard');
    } catch {
      setError('Invalid email or password. Try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
      <form
        onSubmit={handleAuth}
        className="w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl"
      >
        <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-white">
          NeuroSync
        </h1>

        <p className="text-center text-gray-500 mt-2 mb-6">
          {isSignup ? 'Create your account' : 'Login to your dashboard'}
        </p>

        {error && (
          <div className="mb-4 text-sm bg-red-100 text-red-600 p-3 rounded-xl">
            {error}
          </div>
        )}

        <input
          type="email"
          placeholder="Email"
          className="w-full mb-4 p-3 rounded-xl border dark:bg-gray-700 dark:text-white"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full mb-4 p-3 rounded-xl border dark:bg-gray-700 dark:text-white"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />

        <button className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700">
          {isSignup ? 'Sign Up' : 'Login'}
        </button>

        <p className="text-center mt-5 text-sm text-gray-500">
          {isSignup ? 'Already have account?' : 'New user?'}{' '}
          <button
            type="button"
            onClick={() => setIsSignup(!isSignup)}
            className="text-blue-600 font-semibold"
          >
            {isSignup ? 'Login' : 'Create account'}
          </button>
        </p>
      </form>
    </div>
  );
}
