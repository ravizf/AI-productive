import { motion } from 'framer-motion';

export default function Settings({ hasFirebaseConfig }) {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Review workspace configuration.</p>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800"
      >
        <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
          Sync Mode
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {hasFirebaseConfig ? 'Firebase sync is enabled.' : 'Local storage mode is enabled.'}
        </p>
      </motion.div>
    </div>
  );
}
