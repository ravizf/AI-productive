import { motion } from 'framer-motion';

export default function About({ githubUrl }) {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">About NeuroSync</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Built by Ravi as an AI productivity dashboard for focused daily execution.
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800"
        >
          <h2 className="font-bold text-slate-900 dark:text-white">Project Idea</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
            NeuroSync solves the problem of scattered tasks, notes, and priorities. It gives users one workspace
            to plan the day, summarize notes, arrange tasks, and review productivity analytics.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800"
        >
          <h2 className="font-bold text-slate-900 dark:text-white">Tech Stack</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
            React, Firebase, Gemini AI, Tailwind CSS, React Router, Framer Motion, and Vite.
          </p>
          <a
            href={githubUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
          >
            View GitHub
          </a>
        </motion.div>
      </div>
    </div>
  );
}
