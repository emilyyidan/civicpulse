'use client';

import { useState } from 'react';

interface ZipCodeEntryProps {
  onSubmit: (zipCode: string) => void;
}

export function ZipCodeEntry({ onSubmit }: ZipCodeEntryProps) {
  const [zipCode, setZipCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanZip = zipCode.trim();
    if (!/^\d{5}$/.test(cleanZip)) {
      setError('Please enter a valid 5-digit zip code');
      return;
    }

    if (!cleanZip.startsWith('94')) {
      setError(
        'This MVP is currently limited to San Francisco. Please enter an SF zip code (94xxx).'
      );
      return;
    }

    setError('');
    onSubmit(cleanZip);
  };

  return (
    <div className="w-full max-w-md mx-auto text-center animate-fade-in-up">
      {/* Logo/Title */}
      <div className="mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 mb-6 shadow-lg shadow-violet-500/30">
          <svg
            className="w-8 h-8 text-white"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"
            />
          </svg>
        </div>
        <h1 className="text-5xl font-display mb-3">
          <span className="gradient-text">CivicPulse</span>
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          Your voice in policies that impact your community.
        </p>
      </div>

      {/* Value prop */}
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm rounded-2xl p-6 mb-10 border border-slate-200/50 dark:border-slate-700/50 shadow-lg shadow-slate-200/30 dark:shadow-none">
        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
          Let us show you local, state and national
          bills that align with your values. Then you get a single click to call your rep with a script.
        </p>
      </div>

      {/* Zip code form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="zipcode"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 text-left"
          >
            Enter your zip code to get started
          </label>
          <input
            type="text"
            id="zipcode"
            value={zipCode}
            onChange={(e) => {
              setZipCode(e.target.value.replace(/\D/g, '').slice(0, 5));
              setError('');
            }}
            placeholder="94102"
            className="w-full px-5 py-4 text-xl text-center tracking-[0.3em] font-mono rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-slate-600 focus:outline-none focus:ring-4 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
            inputMode="numeric"
            autoComplete="postal-code"
          />
          {error && (
            <p className="mt-3 text-sm text-red-500 text-left">{error}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={zipCode.length !== 5}
          className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-violet-500 to-blue-500 text-white font-semibold text-lg disabled:opacity-30 disabled:cursor-not-allowed hover:from-violet-600 hover:to-blue-600 transition-all shadow-lg shadow-violet-500/25 btn-shine"
        >
          Get started
        </button>
      </form>

      {/* Trust indicators */}
      <div className="mt-10 flex items-center justify-center gap-6 text-sm text-slate-400">
        <span className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <svg
              className="w-4 h-4 text-slate-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <span>Private</span>
        </span>
        <span className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <svg
              className="w-4 h-4 text-slate-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <span>2 min</span>
        </span>
      </div>
    </div>
  );
}
