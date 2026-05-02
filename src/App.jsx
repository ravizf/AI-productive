import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  BrainCircuit,
  Calendar as CalendarIcon,
  CheckCircle2,
  CheckSquare,
  Cloud,
  CloudLightning,
  CloudRain,
  Download,
  FileText,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  Moon,
  Play,
  RefreshCcw,
  Sparkles,
  Sun,
  SunDim,
  Target,
  Trash2,
  X,
} from 'lucide-react';
import { BrowserRouter, Link, Navigate, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithCustomToken,
  signOut,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
} from 'firebase/firestore';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { auth, db, hasFirebaseConfig } from './firebase.js';
import Analytics from './pages/Analytics.jsx';
import About from './pages/About.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Notes from './pages/Notes.jsx';

const appId =
  typeof window !== 'undefined' && window.__app_id ? window.__app_id : 'neurosync-app';
const initialAuthToken =
  typeof window !== 'undefined' ? window.__initial_auth_token : undefined;

const ThemeContext = createContext(null);
const AuthContext = createContext(null);
const DataContext = createContext(null);

const GITHUB_URL = 'https://github.com/ravizf/AI-productive';
const LINKEDIN_URL = 'https://www.linkedin.com/in/ravizf';

const cardMotion = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
};

const demoTasks = [
  {
    id: 'demo-task-1',
    title: 'Prepare for viva',
    priority: 'High',
    status: 'todo',
    suggestion: 'Review key diagrams first, then practice answers aloud.',
    timeBlock: '09:00 - 10:30',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-task-2',
    title: 'Practice DSA',
    priority: 'Medium',
    status: 'in-progress',
    suggestion: 'Solve two medium problems, then revise notes for 15 minutes.',
    timeBlock: '11:00 - 12:00',
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-task-3',
    title: 'Update project README',
    priority: 'Low',
    status: 'done',
    suggestion: 'Add screenshots and live demo link after deployment.',
    timeBlock: '16:30 - 17:00',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date().toISOString(),
  },
];

const demoNotes =
  'Demo notes: NeuroSync helps students and builders turn scattered tasks into a focused daily plan. Today: finish DSA practice, prepare viva answers, and export a progress report.';

const loadLocalTasks = () => {
  const savedTasks = localStorage.getItem('ns_tasks');
  if (savedTasks) return JSON.parse(savedTasks);
  localStorage.setItem('ns_tasks', JSON.stringify(demoTasks));
  return demoTasks;
};

const loadLocalNotes = () => {
  const savedNotes = localStorage.getItem('ns_notes');
  if (savedNotes) return savedNotes;
  localStorage.setItem('ns_notes', demoNotes);
  return demoNotes;
};

const callGeminiAI = async (prompt, schema = null) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

  if (!apiKey) {
    if (!schema) {
      return [
        '09:00 - 10:30 | Deep Work | Start with the highest-priority task.',
        '10:45 - 11:30 | Review | Clear one medium task with no phone distractions.',
        '14:00 - 14:30 | Admin | Finish small tasks and update notes.',
        'Focus tip: use a 45-minute timer and keep only one task open.',
      ].join('\n');
    }
    return {
      summary: prompt.split('\n').slice(-1)[0].slice(0, 180) || 'No notes to summarize yet.',
      actions: ['Pick the next concrete action', 'Set a time block', 'Review progress later today'],
    };
  }

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    systemInstruction: {
      parts: [{ text: 'You are NeuroSync AI, an advanced productivity assistant.' }],
    },
  };

  if (schema) {
    payload.generationConfig = {
      responseMimeType: 'application/json',
      responseSchema: schema,
    };
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
  );

  if (!res.ok) throw new Error('AI API request failed');
  const result = await res.json();
  const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return schema ? JSON.parse(text) : text;
};

const AppProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => localStorage.getItem('ns_theme') || 'light');
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [tasks, setTasks] = useState(() => (hasFirebaseConfig ? [] : loadLocalTasks()));
  const [notes, setNotes] = useState(() => (hasFirebaseConfig ? '' : loadLocalNotes()));
  const [dataLoading, setDataLoading] = useState(Boolean(hasFirebaseConfig));

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    localStorage.setItem('ns_theme', theme);
  }, [theme]);

  useEffect(() => {
    if (!hasFirebaseConfig || !auth) {
      const syncLocalUser = () => {
        const localUser = localStorage.getItem('ns_auth_user');
        setUser(localUser ? JSON.parse(localUser) : null);
      };
      syncLocalUser();
      setAuthLoading(false);
      setDataLoading(false);
      window.addEventListener('ns-auth-change', syncLocalUser);
      return () => window.removeEventListener('ns-auth-change', syncLocalUser);
    }

    const initAuth = async () => {
      try {
        if (initialAuthToken) await signInWithCustomToken(auth, initialAuthToken);
      } catch (err) {
        console.error('Auth failed:', err);
        setAuthLoading(false);
      }
    };

    initAuth();
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!hasFirebaseConfig || !user || !db) return undefined;

    setDataLoading(true);
    const userRoot = ['artifacts', appId, 'users', user.uid];
    const tasksRef = collection(db, ...userRoot, 'tasks');
    const notesRef = collection(db, ...userRoot, 'notes');

    const unsubTasks = onSnapshot(tasksRef, (snapshot) => {
      const fetchedTasks = snapshot.docs.map((taskDoc) => ({
        id: taskDoc.id,
        ...taskDoc.data(),
      }));
      if (fetchedTasks.length === 0 && !localStorage.getItem(`ns_seeded_${user.uid}`)) {
        localStorage.setItem(`ns_seeded_${user.uid}`, 'true');
        demoTasks.forEach((task) => {
          setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'tasks', task.id), task);
        });
      }
      fetchedTasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setTasks(fetchedTasks);
      setDataLoading(false);
    });

    const unsubNotes = onSnapshot(notesRef, (snapshot) => {
      const noteDoc = snapshot.docs.find((item) => item.id === 'main_scratchpad');
      if (!noteDoc && !localStorage.getItem(`ns_notes_seeded_${user.uid}`)) {
        localStorage.setItem(`ns_notes_seeded_${user.uid}`, 'true');
        setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'notes', 'main_scratchpad'), {
          content: demoNotes,
        });
      }
      setNotes(noteDoc?.data()?.content || demoNotes);
    });

    return () => {
      unsubTasks();
      unsubNotes();
    };
  }, [user]);

  useEffect(() => {
    if (!hasFirebaseConfig) localStorage.setItem('ns_tasks', JSON.stringify(tasks));
  }, [tasks]);

  const taskStats = useMemo(() => ({
    total: tasks.length,
    done: tasks.filter((task) => task.status === 'done').length,
    pending: tasks.filter((task) => task.status !== 'done').length,
    focusHours: Math.max(1, tasks.filter((task) => task.status !== 'done').length * 1.5),
    streak: tasks.some((task) => task.status === 'done') ? 3 : 0,
  }), [tasks]);

  const authAction = useCallback(async (mode, email, password) => {
    if (!hasFirebaseConfig || !auth) {
      const localUser = {
        uid: localStorage.getItem('ns_local_uid') || crypto.randomUUID(),
        email,
      };
      localStorage.setItem('ns_local_uid', localUser.uid);
      localStorage.setItem('ns_auth_user', JSON.stringify(localUser));
      setUser(localUser);
      return localUser;
    }

    const credential =
      mode === 'signup'
        ? await createUserWithEmailAndPassword(auth, email, password)
        : await signInWithEmailAndPassword(auth, email, password);
    return credential.user;
  }, []);

  const logout = useCallback(async () => {
    if (hasFirebaseConfig && auth) await signOut(auth);
    localStorage.removeItem('ns_auth_user');
    setUser(null);
    window.dispatchEvent(new Event('ns-auth-change'));
  }, []);

  const addTask = useCallback(async (taskData) => {
    const task = {
      ...taskData,
      id: crypto.randomUUID(),
      status: 'todo',
      createdAt: new Date().toISOString(),
    };

    if (!hasFirebaseConfig || !user || !db) {
      setTasks((current) => [task, ...current]);
      return;
    }

    const taskRef = doc(collection(db, 'artifacts', appId, 'users', user.uid, 'tasks'));
    await setDoc(taskRef, { ...taskData, status: 'todo', createdAt: task.createdAt });
  }, [user]);

  const updateTaskStatus = useCallback(async (taskId, newStatus) => {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) return;

    const updatedTask = {
      ...task,
      status: newStatus,
      completedAt: newStatus === 'done' ? new Date().toISOString() : null,
    };

    if (!hasFirebaseConfig || !user || !db) {
      setTasks((current) => current.map((item) => (item.id === taskId ? updatedTask : item)));
      return;
    }

    await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'tasks', taskId), updatedTask);
  }, [tasks, user]);

  const updateTaskDetails = useCallback(async (taskId, updates) => {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) return;

    const updatedTask = { ...task, ...updates };

    if (!hasFirebaseConfig || !user || !db) {
      setTasks((current) => current.map((item) => (item.id === taskId ? updatedTask : item)));
      return;
    }

    await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'tasks', taskId), updatedTask);
  }, [tasks, user]);

  const removeTask = useCallback(async (taskId) => {
    if (!hasFirebaseConfig || !user || !db) {
      setTasks((current) => current.filter((task) => task.id !== taskId));
      return;
    }

    await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'tasks', taskId));
  }, [user]);

  const arrangeTasks = useCallback(async () => {
    const priorityRank = { High: 0, Medium: 1, Low: 2 };
    const slots = ['09:00 - 10:30', '10:45 - 11:45', '12:00 - 12:45', '14:00 - 15:00', '16:00 - 16:30'];
    const arranged = [...tasks]
      .sort((a, b) => (priorityRank[a.priority] ?? 3) - (priorityRank[b.priority] ?? 3))
      .map((task, index) => ({
        ...task,
        timeBlock: task.status === 'done' ? task.timeBlock : slots[index % slots.length],
      }));

    if (!hasFirebaseConfig || !user || !db) {
      setTasks(arranged);
      return;
    }

    await Promise.all(arranged.map((task) =>
      setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'tasks', task.id), task),
    ));
  }, [tasks, user]);

  const saveNotes = useCallback(async (content) => {
    setNotes(content);

    if (!hasFirebaseConfig || !user || !db) {
      localStorage.setItem('ns_notes', content);
      return;
    }

    await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'notes', 'main_scratchpad'), {
      content,
    });
  }, [user]);

  const dataValue = useMemo(
    () => ({ tasks, taskStats, addTask, updateTaskStatus, updateTaskDetails, removeTask, arrangeTasks, notes, saveNotes, dataLoading }),
    [tasks, taskStats, addTask, updateTaskStatus, updateTaskDetails, removeTask, arrangeTasks, notes, saveNotes, dataLoading],
  );

  return (
    <ThemeContext.Provider
      value={{ theme, toggleTheme: () => setTheme((current) => (current === 'light' ? 'dark' : 'light')) }}
    >
      <AuthContext.Provider value={{ user, authLoading, login: (email, password) => authAction('login', email, password), signup: (email, password) => authAction('signup', email, password), logout }}>
        <DataContext.Provider value={dataValue}>{children}</DataContext.Provider>
      </AuthContext.Provider>
    </ThemeContext.Provider>
  );
};

const Footer = () => (
  <footer className="mt-10 border-t border-slate-100 dark:border-slate-800 pt-5 text-sm text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between print:hidden">
    <span>Built by Ravi</span>
    <div className="flex items-center gap-4">
      <a className="hover:text-blue-600 dark:hover:text-blue-300" href={GITHUB_URL} target="_blank" rel="noreferrer">
        GitHub
      </a>
      <a className="hover:text-blue-600 dark:hover:text-blue-300" href={LINKEDIN_URL} target="_blank" rel="noreferrer">
        LinkedIn
      </a>
    </div>
  </footer>
);

const AuthScreen = () => (
  <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center p-4 transition-colors">
    <motion.div {...cardMotion} className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 text-center border border-slate-100 dark:border-slate-800">
      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-blue-500/30 mb-6">
        <BrainCircuit className="w-8 h-8 text-white" />
      </div>
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">NeuroSync</h1>
      <p className="text-slate-500 dark:text-slate-400 mb-8">Opening your workspace...</p>
      <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
    </motion.div>
  </div>
);

const AuthForm = ({ mode }) => {
  const { login, signup } = useContext(AuthContext);
  const navigate = useNavigate();
  const [email, setEmail] = useState('demo@neurosync.app');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const isSignup = mode === 'signup';

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await (isSignup ? signup(email, password) : login(email, password));
      navigate('/dashboard');
    } catch {
      setError('Authentication failed. Check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  const continueDemo = async () => {
    setLoading(true);
    await login('demo@neurosync.app', 'password123');
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
      <motion.form {...cardMotion} onSubmit={submit} className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-8 shadow-xl">
        <Link to="/" className="text-sm font-bold text-blue-600">NeuroSync</Link>
        <h1 className="mt-4 text-3xl font-extrabold text-slate-950 dark:text-white">
          {isSignup ? 'Create your account' : 'Welcome back'}
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {isSignup ? 'Sign up to save your AI productivity workspace.' : 'Log in to open your productivity dashboard.'}
        </p>

        {error && (
          <div className="mt-5 bg-red-50 text-red-600 p-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        <div className="mt-6 space-y-4">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-sm dark:text-white"
            placeholder="Email"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-sm dark:text-white"
            placeholder="Password"
            required
          />
        </div>

        <button type="submit" disabled={loading} className="mt-6 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60">
          {loading ? 'Please wait...' : isSignup ? 'Sign Up' : 'Login'}
        </button>
        <button type="button" onClick={continueDemo} disabled={loading} className="mt-3 w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">
          Continue with Demo
        </button>

        <p className="mt-5 text-center text-sm text-slate-500">
          {isSignup ? 'Already have an account?' : 'New here?'}{' '}
          <Link className="font-bold text-blue-600" to={isSignup ? '/login' : '/signup'}>
            {isSignup ? 'Login' : 'Create account'}
          </Link>
        </p>
      </motion.form>
    </div>
  );
};

const WeatherWidget = () => {
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch(
          'https://api.open-meteo.com/v1/forecast?latitude=40.71&longitude=-74.01&current=temperature_2m,weather_code&temperature_unit=celsius',
        );
        const data = await res.json();
        setWeather(data.current);
      } catch {
        setWeather(null);
      }
    };
    fetchWeather();
  }, []);

  const code = weather?.weather_code;
  const icon =
    code === undefined ? (
      <Cloud className="w-8 h-8 text-slate-400" />
    ) : code <= 3 ? (
      <SunDim className="w-8 h-8 text-amber-500" />
    ) : code <= 69 ? (
      <CloudRain className="w-8 h-8 text-blue-400" />
    ) : (
      <CloudLightning className="w-8 h-8 text-purple-500" />
    );

  return (
    <motion.div {...cardMotion} className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400">Environment</h3>
          <p className="text-xs text-slate-400 mt-1">Local Context</p>
        </div>
        {icon}
      </div>
      <div className="mt-4">
        {weather ? (
          <span className="text-3xl font-bold text-slate-900 dark:text-white tracking-tighter">
            {weather.temperature_2m}
            <span className="text-xl text-slate-400 font-normal">C</span>
          </span>
        ) : (
          <div className="h-8 w-16 animate-pulse bg-slate-200 dark:bg-slate-800 rounded" />
        )}
      </div>
    </motion.div>
  );
};

const CalendarWidget = () => {
  const { taskStats } = useContext(DataContext);

  return (
    <motion.div {...cardMotion} className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-center items-center text-center">
      <CalendarIcon className="w-8 h-8 text-indigo-500 mb-3" />
      <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Today</h3>
      <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
        {new Date().toLocaleDateString('default', { month: 'short', day: 'numeric' })}
      </p>
      <p className="text-xs text-indigo-500 dark:text-indigo-400 mt-2 font-medium bg-indigo-50 dark:bg-indigo-950 px-3 py-1 rounded-full">
        {taskStats.pending} Pending Tasks
      </p>
    </motion.div>
  );
};

const SmartNotesWidget = () => {
  const { notes, saveNotes } = useContext(DataContext);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [error, setError] = useState('');

  const handleSummarize = async () => {
    if (!notes.trim()) return;
    setIsSummarizing(true);
    setError('');
    try {
      const response = await callGeminiAI(`Summarize these notes and suggest 3 action points:\n\n${notes}`, {
        type: 'OBJECT',
        properties: {
          summary: { type: 'STRING' },
          actions: { type: 'ARRAY', items: { type: 'STRING' } },
        },
        required: ['summary', 'actions'],
      });
      setAiAnalysis(response);
    } catch {
      setError('AI summary failed. Please try again.');
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <motion.div {...cardMotion} className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 col-span-1 md:col-span-2 flex flex-col h-[300px]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-emerald-500" />
          <h3 className="font-semibold text-slate-900 dark:text-white">Brain Dump</h3>
        </div>
        <button
          onClick={handleSummarize}
          disabled={isSummarizing || !notes}
          className="flex items-center gap-1.5 text-xs font-medium text-purple-600 bg-purple-50 dark:bg-purple-950 dark:text-purple-300 px-3 py-1.5 rounded-lg hover:bg-purple-100 disabled:opacity-50"
        >
          {isSummarizing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
          {isSummarizing ? 'AI thinking...' : 'AI Summarize'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-3">
          {error}
        </div>
      )}

      {!aiAnalysis ? (
        <textarea
          value={notes}
          onChange={(event) => saveNotes(event.target.value)}
          placeholder="Jot down thoughts, ideas, or meeting notes..."
          className="flex-1 w-full bg-transparent resize-none border-none outline-none text-slate-700 dark:text-slate-300 text-sm focus:ring-0 p-0"
        />
      ) : (
        <div className="flex-1 overflow-y-auto pr-2">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Summary</h4>
          <p className="text-sm text-slate-800 dark:text-slate-200 mb-4">{aiAnalysis.summary}</p>
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Action Points</h4>
          <ul className="space-y-2">
            {aiAnalysis.actions.map((action) => (
              <li key={action} className="flex items-start gap-2 text-sm text-slate-800 dark:text-slate-200">
                <CheckSquare className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />
                {action}
              </li>
            ))}
          </ul>
          <button onClick={() => setAiAnalysis(null)} className="mt-4 text-xs text-blue-500 hover:text-blue-600 font-medium">
            Back to Notes
          </button>
        </div>
      )}
    </motion.div>
  );
};

const PriorityBadge = ({ priority }) => {
  const colors = {
    High: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
    Medium: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    Low: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  };
  return <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${colors[priority] || colors.Medium}`}>{priority}</span>;
};

const KanbanBoard = () => {
  const { tasks, addTask, updateTaskStatus, updateTaskDetails, removeTask, arrangeTasks, dataLoading } = useContext(DataContext);
  const [newTaskStr, setNewTaskStr] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiPlan, setAiPlan] = useState('');
  const [isPlanning, setIsPlanning] = useState(false);
  const [error, setError] = useState('');

  const columns = [
    { id: 'todo', title: 'To Do', color: 'bg-slate-50 dark:bg-slate-900/60' },
    { id: 'in-progress', title: 'In Progress', color: 'bg-blue-50/50 dark:bg-blue-950/20' },
    { id: 'done', title: 'Done', color: 'bg-emerald-50/50 dark:bg-emerald-950/20' },
  ];

  const nextBestTask = useMemo(() => {
    const priorityRank = { High: 0, Medium: 1, Low: 2 };
    return tasks
      .filter((task) => task.status !== 'done')
      .sort((a, b) => (priorityRank[a.priority] ?? 3) - (priorityRank[b.priority] ?? 3))[0];
  }, [tasks]);

  const handleSmartAdd = async (event) => {
    event.preventDefault();
    if (!newTaskStr.trim()) return;

    setIsProcessing(true);
    setError('');
    try {
      const ai = await callGeminiAI(`Analyze this task and extract details:\nTask: "${newTaskStr}"`, {
        type: 'OBJECT',
        properties: {
          title: { type: 'STRING' },
          priority: { type: 'STRING' },
          suggestion: { type: 'STRING' },
        },
        required: ['title', 'priority', 'suggestion'],
      });
      await addTask({
        title: ai.title || newTaskStr,
        priority: ai.priority || 'Medium',
        suggestion: ai.suggestion || 'Review this task manually.',
      });
      setNewTaskStr('');
    } catch {
      setError('AI task parsing failed. Added the task manually.');
      await addTask({ title: newTaskStr, priority: 'Medium', suggestion: 'Review this task manually.' });
      setNewTaskStr('');
    } finally {
      setIsProcessing(false);
    }
  };

  const generateDayPlan = async () => {
    setIsPlanning(true);
    setError('');
    try {
      const activeTasks = tasks
        .filter((task) => task.status !== 'done')
        .map((task) => `[${task.priority}] ${task.title}`)
        .join('\n');
      setAiPlan(
        activeTasks
          ? await callGeminiAI(`I have these tasks:\n${activeTasks}\nCreate a structured day plan with time blocks, priority order, and focus tips.`)
          : 'You have no active tasks. Enjoy your day!',
      );
    } catch {
      setError('AI day plan failed. Please try again.');
      setAiPlan('Failed to generate plan. Please try again.');
    } finally {
      setIsPlanning(false);
    }
  };

  const suggestForTask = async (task) => {
    const suggestion = `Next step: spend 25 minutes on "${task.title}" and write one clear outcome before stopping.`;
    await updateTaskDetails(task.id, { suggestion });
  };

  const improveTask = async (task) => {
    setNewTaskStr(`${task.title} — define outcome, deadline, and first action`);
  };

  const breakIntoSteps = async (task) => {
    setAiPlan([
      `Breakdown for: ${task.title}`,
      '1. Define the exact finished outcome.',
      '2. Collect the material or context needed.',
      '3. Work in one 25-minute focus block.',
      '4. Review and mark progress.',
    ].join('\n'));
  };

  return (
    <div className="flex flex-col gap-6">
      {dataLoading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((item) => (
            <div key={item} className="rounded-2xl border border-slate-100 dark:border-slate-800 p-4 bg-white dark:bg-slate-900">
              <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
              <div className="mt-5 space-y-3">
                <div className="h-20 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                <div className="h-20 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between print:hidden">
        <form onSubmit={handleSmartAdd} className="relative flex items-center flex-1 w-full">
          <BrainCircuit className={`absolute left-4 w-5 h-5 ${isProcessing ? 'text-blue-500 animate-pulse' : 'text-slate-400'}`} />
          <input
            value={newTaskStr}
            onChange={(event) => setNewTaskStr(event.target.value)}
            placeholder="AI Add: Review design mockups by Friday"
            className="w-full pl-12 pr-24 py-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 dark:text-white transition-all text-sm placeholder:text-slate-400"
            disabled={isProcessing}
          />
          <button type="submit" disabled={isProcessing} className="absolute right-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium disabled:opacity-50">
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enter'}
          </button>
        </form>

        <button onClick={arrangeTasks} className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md font-semibold">
          <RefreshCcw className="w-5 h-5" />
          Auto Arrange Tasks
        </button>

        <button onClick={generateDayPlan} disabled={isPlanning} className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 bg-slate-950 dark:bg-blue-600 text-white rounded-2xl shadow-md hover:shadow-lg font-semibold disabled:opacity-70">
          {isPlanning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
          {isPlanning ? 'AI thinking...' : 'Plan My Day'}
        </button>
      </div>

      {nextBestTask && (
        <motion.div {...cardMotion} className="grid md:grid-cols-3 gap-4">
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-2xl p-4">
            <p className="text-xs font-bold text-blue-600 dark:text-blue-300 uppercase">Next Best Task</p>
            <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{nextBestTask.title}</p>
          </div>
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900 rounded-2xl p-4">
            <p className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase">Focus Suggestion</p>
            <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">Work on one task for 45 minutes before switching.</p>
          </div>
          <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900 rounded-2xl p-4">
            <p className="text-xs font-bold text-rose-700 dark:text-rose-300 uppercase">Procrastination Check</p>
            <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">If a high priority task is stuck, break it into a 10-minute first step.</p>
          </div>
        </motion.div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {aiPlan && (
        <motion.div {...cardMotion} className="bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900 p-5 rounded-2xl relative print:block print:border-black print:text-black">
          <button onClick={() => setAiPlan('')} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 print:hidden">
            <X className="w-4 h-4" />
          </button>
          <h3 className="font-bold text-purple-800 dark:text-purple-300 mb-2 flex items-center gap-2">
            <Sparkles className="w-5 h-5" /> AI Suggested Strategy
          </h3>
          <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed print:text-black">{aiPlan}</div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full min-h-[400px]">
        {columns.map((column) => (
          <div
            key={column.id}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              const taskId = event.dataTransfer.getData('taskId');
              if (taskId) updateTaskStatus(taskId, column.id);
            }}
            className={`flex flex-col rounded-2xl border border-slate-100 dark:border-slate-800 p-4 ${column.color}`}
          >
            <h3 className="font-bold text-sm tracking-wide mb-4 flex items-center justify-between text-slate-800 dark:text-slate-200">
              {column.title}
              <span className="bg-white dark:bg-slate-800 px-2.5 py-0.5 rounded-full text-xs shadow-sm">
                {tasks.filter((task) => task.status === column.id).length}
              </span>
            </h3>

            <div className="flex flex-col gap-3 flex-1 overflow-y-auto print:overflow-visible custom-scrollbar">
              {tasks
                .filter((task) => task.status === column.id)
                .map((task) => (
                  <motion.div
                    {...cardMotion}
                    key={task.id}
                    draggable
                    onDragStart={(event) => event.dataTransfer.setData('taskId', task.id)}
                    className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 cursor-grab active:cursor-grabbing hover:shadow-md transition-all group print:border-slate-400 print:shadow-none"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <PriorityBadge priority={task.priority} />
                      <button onClick={() => removeTask(task.id)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity print:hidden">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100 leading-snug print:text-black">{task.title}</p>
                    {task.timeBlock && (
                      <p className="mt-2 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                        {task.timeBlock}
                      </p>
                    )}
                    {task.suggestion && (
                      <p className="mt-3 text-xs text-blue-500 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/30 p-2 rounded-lg flex items-start gap-1">
                        <Sparkles className="w-3 h-3 mt-0.5 shrink-0" />
                        {task.suggestion}
                      </p>
                    )}
                    <div className="mt-3 grid grid-cols-1 gap-2 print:hidden">
                      <button onClick={() => suggestForTask(task)} className="rounded-lg bg-slate-50 dark:bg-slate-800 px-3 py-2 text-left text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors">
                        Suggest next task
                      </button>
                      <button onClick={() => improveTask(task)} className="rounded-lg bg-slate-50 dark:bg-slate-800 px-3 py-2 text-left text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-purple-950 transition-colors">
                        Improve this task
                      </button>
                      <button onClick={() => breakIntoSteps(task)} className="rounded-lg bg-slate-50 dark:bg-slate-800 px-3 py-2 text-left text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors">
                        Break into steps
                      </button>
                    </div>
                  </motion.div>
                ))}
              {tasks.filter((task) => task.status === column.id).length === 0 && (
                <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-400 opacity-60 print:hidden">
                  No tasks yet — start your AI workflow 🚀
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AnalyticsView = () => {
  const { tasks, taskStats } = useContext(DataContext);
  const { total, done, streak, focusHours } = taskStats;
  const completionRate = total === 0 ? 0 : Math.round((done / total) * 100);
  const priorities = {
    High: tasks.filter((task) => task.priority === 'High').length,
    Medium: tasks.filter((task) => task.priority === 'Medium').length,
    Low: tasks.filter((task) => task.priority === 'Low').length,
  };
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const weeklyData = [2, 4, 3, 5, Math.max(done, 1), taskStats.pending, total].map((value, index) => ({
    day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index],
    value,
  }));

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Productivity Analytics</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Visualize your workflow performance.</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Productivity Score', value: `${completionRate}/100` },
          { label: 'Daily Streak', value: `${streak} days` },
          { label: 'Focus Hours', value: `${focusHours}h` },
        ].map((item) => (
          <motion.div {...cardMotion} key={item.label} className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{item.label}</p>
            <p className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">{item.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div {...cardMotion} className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center">
          <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-6 self-start">Completed vs Pending</h3>
          <div className="relative w-40 h-40">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
              <circle cx="70" cy="70" r={radius} stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100 dark:text-slate-800" />
              <circle cx="70" cy="70" r={radius} stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={circumference} strokeDashoffset={circumference - (completionRate / 100) * circumference} strokeLinecap="round" className="text-blue-500 transition-all duration-1000 ease-out" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-slate-900 dark:text-white">{completionRate}%</span>
              <span className="text-xs text-slate-500 font-medium">Completed</span>
            </div>
          </div>
        </motion.div>

        <motion.div {...cardMotion} className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col">
          <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-8">Workload Distribution</h3>
          <div className="flex-1 flex flex-col justify-end gap-6 pb-2">
            {[
              { label: 'High', value: priorities.High, color: 'bg-red-500' },
              { label: 'Medium', value: priorities.Medium, color: 'bg-amber-500' },
              { label: 'Low', value: priorities.Low, color: 'bg-slate-400' },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-xs font-semibold mb-1 text-slate-600 dark:text-slate-400">
                  <span>{item.label} Priority</span>
                  <span>{item.value} tasks</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full transition-all duration-1000 ease-out`} style={{ width: total ? `${(item.value / total) * 100}%` : '0%' }} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div {...cardMotion} className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
        <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-6">Weekly Productivity</h3>
        <div className="flex items-end gap-3 h-44">
          {weeklyData.map((item) => (
            <div key={item.day} className="flex-1 flex flex-col items-center gap-2">
              <div
                className="w-full rounded-t-xl bg-blue-500 min-h-4"
                style={{ height: `${Math.max(12, item.value * 18)}px` }}
              />
              <span className="text-xs font-bold text-slate-500">{item.day}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

const DashboardShell = () => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { user, logout } = useContext(AuthContext);
  const { tasks, taskStats } = useContext(DataContext);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const activeTab = location.pathname.split('/')[1] || 'dashboard';
  const navItems = [
    { id: 'dashboard', to: '/dashboard', icon: <LayoutDashboard />, label: 'Dashboard' },
    { id: 'analytics', to: '/analytics', icon: <BarChart3 />, label: 'Analytics' },
    { id: 'notes', to: '/notes', icon: <FileText />, label: 'Notes' },
    { id: 'about', to: '/about', icon: <Target />, label: 'About' },
  ];
  const downloadReport = () => {
    const report = [
      'NeuroSync AI Dashboard Report',
      `Total tasks: ${taskStats.total}`,
      `Completed: ${taskStats.done}`,
      `Pending: ${taskStats.pending}`,
      '',
      ...tasks.map((task) => `- [${task.status}] ${task.title} (${task.priority}) ${task.timeBlock || ''}`),
    ].join('\n');
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'neurosync-report.txt';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 overflow-hidden font-sans">
      {sidebarOpen && <div className="md:hidden fixed inset-0 bg-black/40 z-40 backdrop-blur-sm print:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 flex flex-col transition-transform duration-300 print:hidden`}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3 font-bold text-xl text-slate-900 dark:text-white tracking-tight">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <BrainCircuit className="w-4 h-4 text-white" />
            </div>
            NeuroSync
          </div>
          <button className="md:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.id}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${isActive ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'}`}
            >
              {React.cloneElement(item.icon, { className: 'w-5 h-5' })}
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 mt-auto">
          <div className="bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-2xl p-4">
            <p className="text-xs font-bold text-blue-700 dark:text-blue-300 mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> {hasFirebaseConfig ? 'Firebase Sync Active' : 'Local Mode Active'}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">Tasks and notes are ready for your workflow.</p>
          </div>
          <div className="mt-4 flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
              {user?.uid?.substring(0, 2).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">Workspace User</p>
              <p className="text-[10px] text-slate-500 truncate">{user?.uid?.substring(0, 8)}...</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-20 px-6 md:px-8 flex items-center justify-between shrink-0 bg-white/70 dark:bg-slate-950/70 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 z-10 print:hidden">
          <div className="flex items-center gap-4">
            <button className="md:hidden p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white capitalize hidden sm:block">{activeTab}</h2>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => window.print()} className="px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-white dark:bg-slate-900 rounded-full shadow-sm border border-slate-100 dark:border-slate-800">
              <Download className="w-4 h-4" />
              <span className="sr-only">Export PDF</span>
            </button>
            <button onClick={downloadReport} className="inline-flex px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-white dark:bg-slate-900 rounded-full shadow-sm border border-slate-100 dark:border-slate-800">
              Download Productivity Report (PDF)
            </button>
            <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-white dark:bg-slate-900 rounded-full shadow-sm border border-slate-100 dark:border-slate-800">
              GitHub
            </a>
            <a href={LINKEDIN_URL} target="_blank" rel="noreferrer" className="hidden sm:inline-flex px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-white dark:bg-slate-900 rounded-full shadow-sm border border-slate-100 dark:border-slate-800">
              LinkedIn
            </a>
            <button onClick={toggleTheme} className="p-2.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-white dark:bg-slate-900 rounded-full shadow-sm border border-slate-100 dark:border-slate-800">
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
            <button onClick={logout} className="p-2.5 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-300 bg-white dark:bg-slate-900 rounded-full shadow-sm border border-slate-100 dark:border-slate-800" title="Logout">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar print:p-0 print:bg-white print:text-black">
          <div className="max-w-6xl mx-auto">
            <Routes>
              <Route path="/dashboard" element={<Dashboard>
              <div className="space-y-8">
                <header className="print:block print:pb-4 print:border-b print:border-slate-300">
                  <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Daily Command Center</h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">Manage your workflow, powered by smart assistance.</p>
                </header>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:hidden">
                  <SmartNotesWidget />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2 mb-4 print:mt-6">
                    <CheckCircle2 className="w-5 h-5 text-blue-500" /> Active Workspace
                  </h2>
                  <KanbanBoard />
                </div>
              </div>
              </Dashboard>} />
              <Route path="/analytics" element={<Analytics><AnalyticsView /></Analytics>} />
              <Route path="/notes" element={<Notes><SmartNotesWidget /></Notes>} />
              <Route path="/about" element={<About githubUrl={GITHUB_URL} />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
            <Footer />
          </div>
        </div>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route path="/" element={<Landing githubUrl={GITHUB_URL} linkedinUrl={LINKEDIN_URL} />} />
          <Route path="/about" element={<div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-10"><div className="max-w-6xl mx-auto"><About githubUrl={GITHUB_URL} /></div></div>} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Login />} />
          <Route path="/*" element={(
            <ProtectedRoute>
              <AuthContext.Consumer>
                {({ authLoading }) => {
                  if (authLoading) return <AuthScreen />;
                  return <DashboardShell />;
                }}
              </AuthContext.Consumer>
            </ProtectedRoute>
          )} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
