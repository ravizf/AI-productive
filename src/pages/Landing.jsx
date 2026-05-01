import { motion } from 'framer-motion';
import { ArrowRight, BarChart3, BrainCircuit, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const cardMotion = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
};

export default function Landing({ githubUrl, linkedinUrl }) {
  const features = [
    {
      title: 'AI task planning',
      copy: 'Turn rough task ideas into prioritized work items with next-step suggestions.',
      icon: <BrainCircuit className="w-5 h-5 text-blue-600" />,
    },
    {
      title: 'Smart notes',
      copy: 'Capture meeting thoughts and summarize them into action points.',
      icon: <Sparkles className="w-5 h-5 text-purple-600" />,
    },
    {
      title: 'Analytics',
      copy: 'Track completed, pending, and priority-based workload from one dashboard.',
      icon: <BarChart3 className="w-5 h-5 text-emerald-600" />,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 font-bold text-lg">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
              <BrainCircuit className="w-5 h-5 text-white" />
            </div>
            NeuroSync
          </div>
          <a
            href={githubUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-blue-600"
          >
            GitHub
          </a>
        </div>
      </header>

      <main>
        <section className="max-w-6xl mx-auto px-6 py-16 md:py-24 grid lg:grid-cols-[1.05fr_0.95fr] gap-10 items-center">
          <motion.div {...cardMotion} className="space-y-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
              React + Firebase + Gemini AI
            </div>
            <div>
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-950">
                NeuroSync – AI Productivity Dashboard
              </h1>
              <p className="mt-5 max-w-2xl text-lg text-slate-600 leading-8">
                Plan your day with AI.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"
              >
                Open Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-5 py-3 text-sm font-bold text-blue-700 hover:bg-blue-100"
              >
                Sign Up
              </Link>
              <a
                href={githubUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:text-blue-600"
              >
                View GitHub
              </a>
            </div>
          </motion.div>

          <motion.div {...cardMotion} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/60">
            <div className="rounded-2xl bg-slate-950 p-5 text-white">
              <div className="flex items-center justify-between mb-6">
                <span className="text-sm font-bold">Today</span>
                <span className="text-xs rounded-full bg-emerald-500/20 px-2 py-1 text-emerald-200">
                  Demo data ready
                </span>
              </div>
              <div className="space-y-3">
                {['Prepare productivity dashboard demo', 'Review analytics workflow', 'Push final version to GitHub'].map((task, index) => (
                  <div key={task} className="rounded-xl bg-white/10 p-3">
                    <div className="text-sm font-semibold">{task}</div>
                    <div className="mt-2 h-2 rounded-full bg-white/10">
                      <div className="h-2 rounded-full bg-blue-400" style={{ width: `${90 - index * 25}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </section>

        <section className="bg-white border-y border-slate-200">
          <div className="max-w-6xl mx-auto px-6 py-14">
            <h2 className="text-2xl font-bold tracking-tight">Features Preview</h2>
            <div className="mt-6 grid md:grid-cols-3 gap-5">
              {features.map((feature) => (
                <motion.div
                  {...cardMotion}
                  key={feature.title}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                >
                  {feature.icon}
                  <h3 className="mt-4 font-bold text-slate-950">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{feature.copy}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-6 py-14">
          <div className="grid lg:grid-cols-2 gap-8">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">About</h2>
              <p className="mt-4 text-slate-600 leading-7">
                NeuroSync solves the problem of scattered productivity data. It combines task tracking,
                AI-assisted planning, notes, and lightweight analytics so users can decide what to do next
                without switching tools.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h3 className="font-bold text-slate-950">Tech Stack</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                React, Firebase, Gemini AI, Tailwind CSS, React Router, and Framer Motion.
              </p>
              <p className="mt-4 text-sm font-semibold text-slate-700">Built by Ravi</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between text-sm text-slate-500">
          <span>Built by Ravi</span>
          <div className="flex items-center gap-4">
            <a className="inline-flex items-center gap-1 hover:text-blue-600" href={githubUrl} target="_blank" rel="noreferrer">
              GitHub
            </a>
            <a className="inline-flex items-center gap-1 hover:text-blue-600" href={linkedinUrl} target="_blank" rel="noreferrer">
              LinkedIn
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
