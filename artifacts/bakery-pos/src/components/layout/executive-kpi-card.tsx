import React from 'react';

export default function ExecutiveKpiCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = 'via-[#FF6D00]',
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ElementType;
  tone?: string;
}) {
  return (
    <article className="relative min-w-0 overflow-hidden rounded-xl border border-[#FF6D00]/15 bg-[#14161B] px-4 py-3 shadow-[0_10px_24px_rgba(0,0,0,0.18)]">
      <div className={`absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent ${tone} to-transparent`} />
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-[10px] font-bold uppercase tracking-[0.13em] text-[#CBD5E1]">{label}</p>
        <Icon className="h-4 w-4 shrink-0 text-[#FFD54F]" />
      </div>
      <p className="mt-2 font-mono text-xl font-bold tracking-tight text-white">{value}</p>
      <p className="mt-1 truncate text-[11px] text-[#64748B]">{detail}</p>
    </article>
  );
}