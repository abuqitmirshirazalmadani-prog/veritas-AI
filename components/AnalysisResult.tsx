'use client';

import { motion } from 'motion/react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from 'recharts';
import { ShieldAlert, CheckCircle, AlertTriangle, Activity, BrainCircuit } from 'lucide-react';

interface AnalysisResultProps {
  result: {
    truthScore: number;
    breakdown: {
      voiceStress: number | null;
      facialExpressions: number | null;
      languagePatterns: number | null;
    };
    detailedReport: string;
    keyIndicators: string[];
  };
}

export default function AnalysisResult({ result }: AnalysisResultProps) {
  const { truthScore, breakdown, detailedReport, keyIndicators } = result;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 50) return 'text-amber-500';
    return 'text-red-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-emerald-500/10 border-emerald-500/20';
    if (score >= 50) return 'bg-amber-500/10 border-amber-500/20';
    return 'bg-red-500/10 border-red-500/20';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className={`w-8 h-8 ${getScoreColor(score)}`} />;
    if (score >= 50) return <AlertTriangle className={`w-8 h-8 ${getScoreColor(score)}`} />;
    return <ShieldAlert className={`w-8 h-8 ${getScoreColor(score)}`} />;
  };

  const radarData = [
    { subject: 'Voice Stress', A: breakdown.voiceStress || 0, fullMark: 100 },
    { subject: 'Micro-Expressions', A: breakdown.facialExpressions || 0, fullMark: 100 },
    { subject: 'Language Patterns', A: breakdown.languagePatterns || 0, fullMark: 100 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-6 lg:p-8 flex flex-col gap-8"
    >
      {/* Header / Main Score */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border ${getScoreBg(truthScore)}`}>
            {getScoreIcon(truthScore)}
          </div>
          <div>
            <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Truth Probability</h3>
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl md:text-5xl font-bold tracking-tighter ${getScoreColor(truthScore)}`}>
                {truthScore}%
              </span>
              <span className="text-sm font-medium text-zinc-500">Confidence</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 w-full md:w-auto">
          <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-1">Analysis Breakdown</div>
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(breakdown).map(([key, value]) => {
              if (value === null || value === undefined) return null;
              const label = key.replace(/([A-Z])/g, ' $1').trim();
              return (
                <div key={key} className="flex flex-col items-center p-3 bg-zinc-950/50 border border-zinc-800 rounded-xl">
                  <span className="text-[10px] font-medium text-zinc-500 uppercase text-center mb-1">{label}</span>
                  <span className={`text-lg font-bold font-mono ${value > 50 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {value}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="h-px w-full bg-zinc-800/50"></div>

      {/* Radar Chart & Key Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="flex flex-col gap-4">
          <h4 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-500" />
            Stress Indicators
          </h4>
          <div className="h-48 w-full bg-zinc-950/50 rounded-xl border border-zinc-800 p-2">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="#27272a" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#a1a1aa', fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Stress Level" dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', fontSize: '12px' }}
                  itemStyle={{ color: '#10b981' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <h4 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-emerald-500" />
            Key Findings
          </h4>
          <ul className="flex flex-col gap-3">
            {keyIndicators.map((indicator, idx) => (
              <li key={idx} className="flex items-start gap-3 bg-zinc-950/50 p-3 rounded-xl border border-zinc-800">
                <span className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center text-xs font-mono shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="text-sm text-zinc-300 leading-relaxed">{indicator}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="h-px w-full bg-zinc-800/50"></div>

      {/* Detailed Report */}
      <div className="flex flex-col gap-3">
        <h4 className="text-sm font-medium text-zinc-300">Detailed AI Report</h4>
        <div className="bg-zinc-950/50 border border-zinc-800 rounded-xl p-5">
          <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap font-sans">
            {detailedReport}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
