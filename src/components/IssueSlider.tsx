'use client';

import { PolicyIssue, UserPreference } from '@/types';
import { ISSUE_CATEGORIES } from '@/data/issues';

interface IssueSliderProps {
  issue: PolicyIssue;
  preference: UserPreference | undefined;
  onChange: (preference: UserPreference) => void;
}

export function IssueSlider({ issue, preference, onChange }: IssueSliderProps) {
  const hasSelection = preference !== undefined;
  const position = preference?.position ?? null;
  const category = ISSUE_CATEGORIES[issue.category];

  const handlePositionChange = (newPosition: number) => {
    onChange({
      issueId: issue.id,
      position: newPosition,
      intensity: Math.abs(newPosition),
    });
  };

  const getPositionLabel = (pos: number): string => {
    if (pos === 0) return 'Neutral';
    if (pos === -2) return 'Strongly';
    if (pos === -1) return 'Somewhat';
    if (pos === 1) return 'Somewhat';
    if (pos === 2) return 'Strongly';
    return '';
  };

  const getPositionColor = (pos: number | null): string => {
    if (pos === null) return '';
    if (pos === 0) return 'bg-slate-400 dark:bg-slate-500';
    if (pos < 0) return 'bg-gradient-to-br from-amber-400 to-orange-500';
    return 'bg-gradient-to-br from-violet-500 to-blue-500';
  };

  const getTickColor = (tick: number, isSelected: boolean): string => {
    if (!isSelected) return '';
    if (tick === 0) return 'ring-slate-400 dark:ring-slate-500';
    if (tick < 0) return 'ring-amber-500';
    return 'ring-violet-500';
  };

  const getPositionText = (): string => {
    if (position === null) return '';
    if (position === 0) return 'I feel ambivalent about this';
    const intensity = getPositionLabel(position);
    const direction = (position < 0 ? issue.leftLabel : issue.rightLabel).toLowerCase();
    return `${intensity} ${direction}`;
  };

  return (
    <div className="w-full rounded-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm p-6 shadow-xl shadow-violet-500/5 border border-slate-200/60 dark:border-slate-700/60 animate-fade-in-up">
      {/* Category badge */}
      <div className="flex items-center gap-2 mb-4">
        <span
          className={`w-2 h-2 rounded-full ${category.color}`}
        />
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {category.label}
        </span>
      </div>

      {/* Issue name */}
      <h3 className="text-2xl font-display text-slate-800 dark:text-white mb-3">
        {issue.name}
      </h3>

      {/* Description */}
      <p className="text-[15px] text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
        {issue.description}
      </p>

      {/* Slider labels */}
      <div className="flex justify-between mb-3 px-1">
        <span className="text-xs font-medium text-amber-600 dark:text-amber-400 max-w-[42%] text-left">
          {issue.leftLabel}
        </span>
        <span className="text-xs font-medium text-violet-600 dark:text-violet-400 max-w-[42%] text-right">
          {issue.rightLabel}
        </span>
      </div>

      {/* Custom slider */}
      <div className="relative pt-3 pb-6">
        {/* Track background */}
        <div className="h-2 rounded-full bg-gradient-to-r from-amber-200 via-slate-200 to-violet-200 dark:from-amber-900/40 dark:via-slate-700 dark:to-violet-900/40" />

        {/* Active track fill */}
        {position !== null && position !== 0 && (
          <div
            className={`absolute top-3 h-2 rounded-full transition-all duration-300 ${
              position < 0
                ? 'bg-gradient-to-r from-amber-400 to-amber-300'
                : 'bg-gradient-to-r from-violet-400 to-blue-400'
            }`}
            style={{
              left: position < 0 ? `${50 + position * 25}%` : '50%',
              width: `${Math.abs(position) * 25}%`,
            }}
          />
        )}

        {/* Tick marks */}
        <div className="absolute top-3 left-0 right-0 flex justify-between px-0">
          {[-2, -1, 0, 1, 2].map((tick) => {
            const isSelected = position === tick;
            return (
              <button
                key={tick}
                onClick={() => handlePositionChange(tick)}
                className={`w-5 h-5 rounded-full border-2 transition-all duration-200 transform -translate-y-1.5 active:scale-90 ${
                  isSelected
                    ? `${getPositionColor(tick)} border-white scale-125 shadow-lg ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 ${getTickColor(tick, true)}`
                    : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:scale-110 hover:border-slate-400 dark:hover:border-slate-500 hover:shadow-md'
                }`}
                aria-label={tick === 0 ? 'Ambivalent' : `Position ${tick}`}
              />
            );
          })}
        </div>

        {/* Hidden range input for keyboard accessibility */}
        <input
          type="range"
          min={-2}
          max={2}
          step={1}
          value={position ?? 0}
          onChange={(e) => handlePositionChange(parseInt(e.target.value))}
          className="absolute inset-0 w-full opacity-0 pointer-events-none focus:pointer-events-auto"
          aria-label={`${issue.name} position slider`}
          tabIndex={0}
        />
      </div>

      {/* Current position indicator */}
      <div className="text-center h-10">
        {hasSelection && (
          <span
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 animate-fade-in-up ${
              position === 0
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                : position !== null && position < 0
                ? 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 text-amber-700 dark:text-amber-400'
                : 'bg-gradient-to-r from-violet-50 to-blue-50 dark:from-violet-900/20 dark:to-blue-900/20 text-violet-700 dark:text-violet-400'
            }`}
          >
            {position !== null && position !== 0 && (
              <span
                className={`w-2 h-2 rounded-full ${
                  position < 0 ? 'bg-amber-500' : 'bg-violet-500'
                }`}
              />
            )}
            {getPositionText()}
          </span>
        )}
      </div>
    </div>
  );
}
