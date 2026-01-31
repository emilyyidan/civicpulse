'use client';

import { useState } from 'react';
import { PolicyIssue, UserPreference } from '@/types';
import { IssueSlider } from './IssueSlider';

interface IssueCarouselProps {
  issues: PolicyIssue[];
  preferences: UserPreference[];
  onPreferenceChange: (preference: UserPreference) => void;
  onComplete: () => void;
  onRestart: () => void;
}

export function IssueCarousel({
  issues,
  preferences,
  onPreferenceChange,
  onComplete,
  onRestart,
}: IssueCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentIssue = issues[currentIndex];
  const currentPreference = preferences.find((p) => p.issueId === currentIssue.id);

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const goToNext = () => {
    if (currentIndex < issues.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const isLastIssue = currentIndex === issues.length - 1;
  const canComplete = preferences.length >= issues.length / 2;

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Issue dots navigation */}
      <div className="flex justify-center gap-2 mb-8 flex-wrap">
        {issues.map((issue, index) => {
          const pref = preferences.find((p) => p.issueId === issue.id);
          const isActive = index === currentIndex;
          const hasAnswer = !!pref;

          return (
            <button
              key={issue.id}
              onClick={() => setCurrentIndex(index)}
              className={`transition-all duration-200 ${
                isActive
                  ? 'w-8 h-2.5 rounded-full bg-gradient-to-r from-violet-500 to-blue-500 shadow-md shadow-violet-500/30'
                  : hasAnswer
                  ? `w-2.5 h-2.5 rounded-full ${
                      pref.position < 0
                        ? 'bg-amber-400'
                        : pref.position > 0
                        ? 'bg-violet-500'
                        : 'bg-slate-400'
                    }`
                  : 'w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500'
              }`}
              aria-label={`Go to issue ${index + 1}: ${issue.name}`}
            />
          );
        })}
      </div>

      {/* Current issue slider */}
      <div className="mb-8" key={currentIssue.id}>
        <IssueSlider
          issue={currentIssue}
          preference={currentPreference}
          onChange={onPreferenceChange}
        />
      </div>

      {/* Navigation buttons */}
      <div className="flex gap-3">
        <button
          onClick={goToPrevious}
          disabled={currentIndex === 0}
          className="flex-1 py-3.5 px-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-600 transition-all"
        >
          Previous
        </button>

        {isLastIssue ? (
          <button
            onClick={onComplete}
            disabled={!canComplete}
            className="flex-1 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-violet-500 to-blue-500 text-white font-semibold disabled:opacity-30 disabled:cursor-not-allowed hover:from-violet-600 hover:to-blue-600 transition-all shadow-lg shadow-violet-500/25 btn-shine"
          >
            See my bills
          </button>
        ) : (
          <button
            onClick={goToNext}
            className="flex-1 py-3.5 px-4 rounded-2xl bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold hover:bg-slate-700 dark:hover:bg-white transition-all"
          >
            Next
          </button>
        )}
      </div>

      {/* Restart link */}
      <div className="mt-6 text-center">
        <button
          onClick={onRestart}
          className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        >
          Restart
        </button>
      </div>
    </div>
  );
}
