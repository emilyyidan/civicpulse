'use client';

import { useState, useEffect, useRef, TouchEvent } from 'react';
import { OpenStatesBill } from '@/types/openstates';
import { UserPreference } from '@/types';
import { BillAnalysis } from '@/lib/claude';
import { fetchRecentBills, analyzeBillsWithAI } from '@/lib/api-client';
import { BillCard } from './BillCard';
import {
  hashPreferences,
  getCachedAnalysis,
  setCachedAnalysis,
  CachedAnalysis,
} from '@/lib/cache';

type RecommendationFilter = 'all' | 'support' | 'oppose' | 'engage';

interface BillsListProps {
  preferences: UserPreference[];
  zipCode: string;
  onCallRep: (bill: OpenStatesBill, analysis: BillAnalysis, index: number, filter: RecommendationFilter) => void;
  initialIndex?: number;
  initialFilter?: RecommendationFilter;
}

interface AnalyzedBill {
  bill: OpenStatesBill;
  analysis: BillAnalysis;
}

export function BillsList({ preferences, zipCode, onCallRep, initialIndex, initialFilter }: BillsListProps) {
  const [analyzedBills, setAnalyzedBills] = useState<AnalyzedBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<RecommendationFilter>(initialFilter ?? 'all');
  const [currentIndex, setCurrentIndex] = useState(initialIndex ?? 0);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const isFirstRender = useRef(true);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Handle touch events for swipe navigation
  const handleTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = null;
  };

  const handleTouchMove = (e: TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;

    const diff = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (Math.abs(diff) > minSwipeDistance) {
      if (diff > 0) {
        // Swiped left -> go to next
        goToNext();
      } else {
        // Swiped right -> go to previous
        goToPrevious();
      }
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  useEffect(() => {
    async function loadAndAnalyzeBills() {
      try {
        setLoading(true);
        setError(null);

        // Create a hash of preferences for cache keys
        const prefHash = hashPreferences(preferences);

        // Step 1: Fetch bills from Open States
        const response = await fetchRecentBills(20);
        const bills = response.results;

        if (bills.length === 0) {
          setAnalyzedBills([]);
          setLoading(false);
          return;
        }

        setLoading(false);

        // Step 2: Check cache for existing analyses
        const cachedAnalyses: Map<string, BillAnalysis> = new Map();
        const uncachedBills: OpenStatesBill[] = [];

        bills.forEach((bill) => {
          const cached = getCachedAnalysis(bill.id, prefHash);
          if (cached) {
            cachedAnalyses.set(bill.id, cached as BillAnalysis);
          } else {
            uncachedBills.push(bill);
          }
        });

        console.log(`Cache hit: ${cachedAnalyses.size} bills, need to analyze: ${uncachedBills.length} bills`);

        // Step 3: Analyze uncached bills with Claude (if any)
        let newAnalyses: BillAnalysis[] = [];
        if (uncachedBills.length > 0) {
          setAnalyzing(true);
          const { analyses } = await analyzeBillsWithAI(uncachedBills, preferences);
          newAnalyses = analyses;

          // Cache the new analyses
          newAnalyses.forEach((analysis) => {
            setCachedAnalysis(analysis.billId, prefHash, analysis as CachedAnalysis);
          });
        }

        // Step 4: Combine cached and new analyses
        const allAnalyses = new Map(cachedAnalyses);
        newAnalyses.forEach((analysis) => {
          allAnalyses.set(analysis.billId, analysis);
        });

        // Step 5: Combine bills with their analyses
        const combined: AnalyzedBill[] = bills
          .map((bill) => {
            const analysis = allAnalyses.get(bill.id);
            if (!analysis) return null;
            return { bill, analysis };
          })
          .filter((b): b is AnalyzedBill => b !== null);

        // Sort by confidence (highest first) and then by recommendation
        combined.sort((a, b) => {
          // Priority: support > oppose > engage
          const priority = { support: 3, oppose: 2, engage: 1 };
          const priorityDiff =
            priority[b.analysis.recommendation] - priority[a.analysis.recommendation];
          if (priorityDiff !== 0) return priorityDiff;
          return b.analysis.confidence - a.analysis.confidence;
        });

        setAnalyzedBills(combined);
      } catch (err) {
        console.error('Failed to load/analyze bills:', err);
        setError(err instanceof Error ? err.message : 'Failed to load bills');
      } finally {
        setLoading(false);
        setAnalyzing(false);
      }
    }

    loadAndAnalyzeBills();
  }, [preferences]);

  const filteredBills =
    filter === 'all'
      ? analyzedBills
      : analyzedBills.filter((b) => b.analysis.recommendation === filter);

  // Reset index when filter changes (but not on initial mount)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setCurrentIndex(0);
  }, [filter]);

  const currentBill = filteredBills[currentIndex];

  const goToPrevious = () => {
    if (currentIndex > 0 && !isAnimating) {
      setIsAnimating(true);
      setSwipeDirection('right');
      setTimeout(() => {
        setCurrentIndex(currentIndex - 1);
        setSwipeDirection(null);
        setIsAnimating(false);
      }, 300);
    }
  };

  const goToNext = () => {
    if (currentIndex < filteredBills.length - 1 && !isAnimating) {
      setIsAnimating(true);
      setSwipeDirection('left');
      setTimeout(() => {
        setCurrentIndex(currentIndex + 1);
        setSwipeDirection(null);
        setIsAnimating(false);
      }, 300);
    }
  };

  const counts = {
    all: analyzedBills.length,
    support: analyzedBills.filter((b) => b.analysis.recommendation === 'support').length,
    oppose: analyzedBills.filter((b) => b.analysis.recommendation === 'oppose').length,
    engage: analyzedBills.filter((b) => b.analysis.recommendation === 'engage').length,
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Fetching California bills...
          </p>
        </div>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-gray-100 dark:border-zinc-800 animate-pulse"
          >
            <div className="h-4 w-24 bg-gray-200 dark:bg-zinc-700 rounded mb-4" />
            <div className="h-6 w-3/4 bg-gray-200 dark:bg-zinc-700 rounded mb-2" />
            <div className="h-4 w-full bg-gray-200 dark:bg-zinc-700 rounded mb-2" />
            <div className="h-4 w-2/3 bg-gray-200 dark:bg-zinc-700 rounded mb-4" />
            <div className="flex gap-2">
              <div className="h-10 flex-1 bg-gray-200 dark:bg-zinc-700 rounded-lg" />
              <div className="h-10 flex-1 bg-gray-200 dark:bg-zinc-700 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (analyzing) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <div className="inline-block w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Analyzing bills with AI...
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Matching bills to your policy preferences
          </p>
        </div>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-gray-100 dark:border-zinc-800 animate-pulse"
          >
            <div className="h-4 w-24 bg-purple-200 dark:bg-purple-700 rounded mb-4" />
            <div className="h-6 w-3/4 bg-gray-200 dark:bg-zinc-700 rounded mb-2" />
            <div className="h-4 w-full bg-gray-200 dark:bg-zinc-700 rounded mb-2" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center">
        <p className="text-red-600 dark:text-red-400 font-medium mb-2">
          Failed to load bills
        </p>
        <p className="text-red-500 dark:text-red-400 text-sm mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 px-1 md:justify-center">
        {(
          [
            { key: 'all', label: 'All', color: 'gray' },
            { key: 'support', label: 'Support', color: 'green' },
            { key: 'oppose', label: 'Oppose', color: 'red' },
            { key: 'engage', label: 'Explore further', color: 'blue' },
          ] as const
        ).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filter === key
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-700'
            }`}
          >
            {label} ({counts[key]})
          </button>
        ))}
      </div>

      {/* Bill counter */}
      {filteredBills.length > 0 && (
        <div className="text-center text-sm text-slate-500 dark:text-slate-400 mb-4">
          {currentIndex + 1} of {filteredBills.length}
        </div>
      )}

      {/* Card with side navigation arrows */}
      <div className="flex items-center gap-2">
        {/* Left arrow - hidden on mobile */}
        <button
          onClick={goToPrevious}
          disabled={currentIndex === 0 || filteredBills.length <= 1}
          className="hidden md:flex flex-shrink-0 w-12 h-12 items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-300 dark:hover:bg-slate-800 disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-all"
          aria-label="Previous bill"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Bill card with touch support */}
        <div
          className="flex-1 overflow-hidden touch-pan-y"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {filteredBills.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <p>No bills found for this filter.</p>
            </div>
          ) : currentBill ? (
            <div
              key={currentBill.bill.id}
              className={`transition-all duration-300 ease-out ${
                swipeDirection === 'left'
                  ? 'animate-swipe-left'
                  : swipeDirection === 'right'
                  ? 'animate-swipe-right'
                  : 'animate-swipe-in'
              }`}
            >
              <BillCardWithAnalysis
                bill={currentBill.bill}
                analysis={currentBill.analysis}
                onLearnMore={() => window.open(currentBill.bill.openstates_url, '_blank')}
                onCallRep={() => onCallRep(currentBill.bill, currentBill.analysis, currentIndex, filter)}
              />
            </div>
          ) : null}
        </div>

        {/* Right arrow - hidden on mobile */}
        <button
          onClick={goToNext}
          disabled={currentIndex === filteredBills.length - 1 || filteredBills.length <= 1}
          className="hidden md:flex flex-shrink-0 w-12 h-12 items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-300 dark:hover:bg-slate-800 disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-all"
          aria-label="Next bill"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// Enhanced BillCard that displays AI analysis
interface BillCardWithAnalysisProps {
  bill: OpenStatesBill;
  analysis: BillAnalysis;
  onLearnMore: () => void;
  onCallRep: () => void;
}

function BillCardWithAnalysis({
  bill,
  analysis,
  onLearnMore,
  onCallRep,
}: BillCardWithAnalysisProps) {
  const recommendationConfig = {
    support: {
      label: "You'd likely support",
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      textColor: 'text-green-700 dark:text-green-400',
      borderColor: 'border-green-200 dark:border-green-800',
    },
    oppose: {
      label: "You'd likely oppose",
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      textColor: 'text-red-700 dark:text-red-400',
      borderColor: 'border-red-200 dark:border-red-800',
    },
    engage: {
      label: 'Worth exploring',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      textColor: 'text-blue-700 dark:text-blue-400',
      borderColor: 'border-blue-200 dark:border-blue-800',
    },
  };

  const config = recommendationConfig[analysis.recommendation];

  // Format the last action date
  const lastActionDate = bill.latest_action_date
    ? new Date(bill.latest_action_date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  // Get primary sponsor
  const primarySponsor = bill.sponsorships?.find((s) => s.primary);

  // Status descriptions for tooltips - focused on next steps and when to act
  const statusDescriptions: Record<string, string> = {
    'Introduced': 'Early stage — just filed. Will be assigned to a committee. Good time to contact your rep before hearings begin.',
    'Filed': 'Very early stage — awaiting committee assignment. Weeks or months before any vote. Good time to voice support or opposition early.',
    'In Committee': 'Being studied and debated in committee. May be amended. Key time to call — committee members decide if it moves forward.',
    'Passed Committee': 'Cleared committee and heading to floor debate. Gaining momentum. Vote could happen within weeks.',
    'First Reading': 'Procedural step — bill officially introduced to the full chamber. Not yet being debated.',
    'Second Reading': 'Active debate happening now. Amendments being considered. Critical time to make your voice heard before the vote.',
    'Third Reading': 'Final debate before vote. Decision imminent — usually within days. Last chance to influence the outcome.',
    'Passed': 'Approved by one chamber. Now moves to the other chamber to repeat the process, or to the Governor if already passed both.',
    'Failed': 'Did not pass. May be reintroduced next session. No further action needed unless it\'s revived.',
    'Withdrawn': 'Sponsor pulled the bill. No longer being considered this session.',
    'Substituted': 'Replaced with a new version. Review the updated text — it may have changed significantly.',
    'Amended': 'Text has been modified. Worth reviewing what changed before taking action.',
    'Amendment Passed': 'Changes approved. The bill text has been updated.',
    'Sent to Governor': 'Passed both chambers! Governor has 12 days to sign or veto. Contact the Governor\'s office now.',
    'Signed by Governor': 'Will become law. Takes effect on Jan 1 or 90 days after signing, unless it\'s an urgency bill.',
    'Vetoed': 'Governor rejected it. Legislature could attempt an override (rare). Likely dead for this session.',
    'Became Law': 'Now in effect. No further legislative action possible.',
    'In Progress': 'Moving through the process. Check back for status updates.',
  };

  // Get bill status from latest action or actions array
  const getBillStatus = (): string => {
    if (bill.actions && bill.actions.length > 0) {
      const latestAction = bill.actions[bill.actions.length - 1];
      const classification = latestAction.classification?.[0];

      // Map common classifications to user-friendly status
      const statusMap: Record<string, string> = {
        'introduction': 'Introduced',
        'filing': 'Filed',
        'referral-committee': 'In Committee',
        'committee-passage': 'Passed Committee',
        'reading-1': 'First Reading',
        'reading-2': 'Second Reading',
        'reading-3': 'Third Reading',
        'passage': 'Passed',
        'failure': 'Failed',
        'withdrawal': 'Withdrawn',
        'substitution': 'Substituted',
        'amendment-introduction': 'Amended',
        'amendment-passage': 'Amendment Passed',
        'executive-receipt': 'Sent to Governor',
        'executive-signature': 'Signed by Governor',
        'executive-veto': 'Vetoed',
        'became-law': 'Became Law',
      };

      if (classification && statusMap[classification]) {
        return statusMap[classification];
      }
    }
    return 'In Progress';
  };

  const billStatus = getBillStatus();

  // Construct official CA Legislature URL for the sponsor
  const getSponsorUrl = (): string | null => {
    const role = primarySponsor?.person?.current_role;
    if (!role?.district) return null;

    // Extract district number from strings like "11" or "District 11"
    const districtMatch = role.district.match(/\d+/);
    if (!districtMatch) return null;
    const districtNum = parseInt(districtMatch[0], 10);

    if (role.org_classification === 'upper') {
      // California Senate
      return `https://sd${districtNum}.senate.ca.gov/`;
    } else if (role.org_classification === 'lower') {
      // California Assembly - district-specific page (zero-pad single digits)
      const paddedDistrict = districtNum.toString().padStart(2, '0');
      return `https://www.assembly.ca.gov/assemblymembers/${paddedDistrict}`;
    }
    return null;
  };

  const sponsorUrl = getSponsorUrl();

  // Confidence indicator
  const confidencePercent = Math.round(analysis.confidence * 100);

  return (
    <div
      className={`bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden border ${config.borderColor} shadow-sm`}
    >
      {/* Prominent recommendation header */}
      <div className={`px-6 py-4 ${config.bgColor}`}>
        <div className="flex items-center justify-between">
          <span className={`text-lg font-semibold ${config.textColor}`}>
            {config.label}
          </span>
          {analysis.recommendation !== 'engage' && (
            <span className={`text-sm font-medium ${config.textColor} opacity-75`}>
              {confidencePercent}% confident
            </span>
          )}
        </div>
      </div>

      <div className="p-6">
        {/* Bill identifier and title */}
        <div className="mb-3">
          <span className="text-sm font-mono text-gray-500 dark:text-gray-400">
            {bill.identifier}
          </span>
          <h3 className="text-lg font-display text-gray-900 dark:text-white mt-1 line-clamp-2">
            {bill.title}
          </h3>
        </div>

        {/* Status and relevant issues - moved below title */}
        <div className="flex flex-wrap gap-1.5 mb-4 items-center">
          <span className="tooltip-container cursor-help">
            <span className="px-2 py-0.5 text-xs font-medium rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
              {billStatus}
            </span>
            <span className="tooltip">
              {statusDescriptions[billStatus] || 'Current status of this bill in the legislative process.'}
            </span>
          </span>
          {analysis.relevantIssues && analysis.relevantIssues.length > 0 && (
            <>
              {analysis.relevantIssues.map((issueId) => (
                <span
                  key={issueId}
                  className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 rounded capitalize"
                >
                  {issueId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                </span>
              ))}
            </>
          )}
        </div>

      {/* AI-generated summary */}
      <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-100 dark:border-purple-800">
        <div className="flex items-center gap-1 mb-1">
          <svg
            className="w-4 h-4 text-purple-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
          <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
            AI Summary
          </span>
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {analysis.summary}
        </p>
      </div>

      {/* AI reasoning */}
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        {analysis.reasoning}
      </p>

      {/* Sponsor info */}
      {primarySponsor && (
        <div className="flex items-center gap-2 mb-4 text-sm text-gray-500 dark:text-gray-400">
          <svg
            className="w-4 h-4 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          <span>
            Sponsored by{' '}
            {sponsorUrl ? (
              <a
                href={sponsorUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-violet-600 dark:text-violet-400 hover:underline"
              >
                {primarySponsor.name}
              </a>
            ) : (
              primarySponsor.name
            )}
            {primarySponsor.person?.party && (
              <span className="text-gray-400">
                {' '}
                ({primarySponsor.person.party})
              </span>
            )}
          </span>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={onLearnMore}
          className="flex-1 py-2 px-4 rounded-lg border border-gray-200 dark:border-zinc-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
        >
          Learn More
        </button>
        <button
          onClick={onCallRep}
          className="flex-1 py-2 px-4 rounded-lg text-white text-sm font-medium transition-colors bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
        >
          Call My Rep
        </button>
      </div>
      </div>
    </div>
  );
}
