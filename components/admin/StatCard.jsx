export default function StatCard({ title, value, sub }) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <div className="text-sm text-zinc-500">{title}</div>
        <div className="text-2xl font-semibold mt-1">{value}</div>
        {sub ? <div className="text-xs text-zinc-500 mt-1">{sub}</div> : null}
      </div>
    );
  }
  