import React from 'react';

type ExecutiveKpiTheme = 'amber' | 'cyan' | 'emerald' | 'purple';

const themedStyles: Record<ExecutiveKpiTheme, { border: string; background: string; accent: string; rim: string }> = {
  amber: {
    border: 'border-amber-500/40 hover:border-amber-500/70',
    background: 'bg-gradient-to-b from-amber-500/10 via-[#14161B] to-[#14161B]',
    accent: 'text-amber-400',
    rim: 'via-amber-400/70',
  },
  cyan: {
    border: 'border-cyan-500/40 hover:border-cyan-500/70',
    background: 'bg-gradient-to-b from-cyan-500/10 via-[#14161B] to-[#14161B]',
    accent: 'text-cyan-400',
    rim: 'via-cyan-400/70',
  },
  emerald: {
    border: 'border-emerald-500/40 hover:border-emerald-500/70',
    background: 'bg-gradient-to-b from-emerald-500/10 via-[#14161B] to-[#14161B]',
    accent: 'text-emerald-400',
    rim: 'via-emerald-400/70',
  },
  purple: {
    border: 'border-purple-500/40 hover:border-purple-500/70',
    background: 'bg-gradient-to-b from-purple-500/10 via-[#14161B] to-[#14161B]',
    accent: 'text-purple-400',
    rim: 'via-purple-400/70',
  },
};

export default function ExecutiveKpiCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = 'via-[#FF6D00]',
  theme,
}: {
  label: string;
  value: string;
  detail?: string;
  icon: React.ElementType;
  tone?: string;
  theme?: ExecutiveKpiTheme;
}) {
  const colors = theme ? themedStyles[theme] : null;

  return (
    <article className={`relative min-w-0 overflow-hidden shadow-[0_10px_24px_rgba(0,0,0,0.18)] ${colors
      ? `flex h-full min-h-[104px] flex-col justify-between rounded-2xl border p-4 transition-colors ${colors.border} ${colors.background}`
      : 'rounded-xl border border-[#FF6D00]/15 bg-[#14161B] px-4 py-3'}`}>
      <div className={`absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent ${colors ? colors.rim : tone} to-transparent`} />
      <div className="flex items-center justify-between gap-2">
        <p className={colors
          ? `truncate text-xs font-semibold uppercase tracking-wider ${colors.accent}`
          : 'truncate text-[10px] font-bold uppercase tracking-[0.13em] text-[#CBD5E1]'}>{label}</p>
        <Icon className={`h-4 w-4 shrink-0 ${colors ? colors.accent : 'text-[#FFD54F]'}`} />
      </div>
      <p className={colors
        ? 'mt-auto pt-3 font-mono text-2xl font-bold tracking-tight text-white'
        : 'mt-2 font-mono text-xl font-bold tracking-tight text-white'}>{value}</p>
      {!colors && detail && <p className="mt-1 truncate text-[11px] text-[#64748B]">{detail}</p>}
    </article>
  );
}