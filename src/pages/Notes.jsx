export default function Notes({ children }) {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Notes</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Capture ideas and summarize them with AI.</p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {children}
      </div>
    </div>
  );
}
