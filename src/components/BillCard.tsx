'use client';

import { OpenStatesBill } from '@/types/openstates';

interface BillCardProps {
  bill: OpenStatesBill;
  recommendation?: 'support' | 'oppose' | 'engage';
  onLearnMore?: () => void;
  onCallRep?: () => void;
}

export function BillCard({
  bill,
  recommendation = 'engage',
  onLearnMore,
  onCallRep,
}: BillCardProps) {
  const recommendationConfig = {
    support: {
      label: "You'd likely support",
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      textColor: 'text-green-700 dark:text-green-400',
    },
    oppose: {
      label: "You'd likely oppose",
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      textColor: 'text-red-700 dark:text-red-400',
    },
    engage: {
      label: 'Worth exploring',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      textColor: 'text-blue-700 dark:text-blue-400',
    },
  };

  const config = recommendationConfig[recommendation];

  // Get the abstract or use a truncated title
  const abstract =
    bill.abstracts?.[0]?.abstract ||
    bill.title;

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

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-gray-100 dark:border-zinc-800 shadow-sm">
      {/* Recommendation badge */}
      <div className="flex items-center justify-between mb-3">
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${config.bgColor} ${config.textColor}`}
        >
          {config.label}
        </span>
        {lastActionDate && (
          <span className="text-xs text-gray-400">
            Updated {lastActionDate}
          </span>
        )}
      </div>

      {/* Bill identifier and title */}
      <div className="mb-3">
        <span className="text-sm font-mono text-gray-500 dark:text-gray-400">
          {bill.identifier}
        </span>
        <h3 className="text-lg font-display text-gray-900 dark:text-white mt-1 line-clamp-2">
          {bill.title}
        </h3>
      </div>

      {/* Abstract/Summary */}
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
        {abstract}
      </p>

      {/* Sponsor info */}
      {primarySponsor && (
        <div className="flex items-center gap-2 mb-4 text-sm text-gray-500 dark:text-gray-400">
          <svg
            className="w-4 h-4"
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
            Sponsored by {primarySponsor.name}
            {primarySponsor.person?.party && (
              <span className="text-gray-400">
                {' '}
                ({primarySponsor.person.party})
              </span>
            )}
          </span>
        </div>
      )}

      {/* Latest action */}
      {bill.latest_action_description && (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Latest Action
          </span>
          <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
            {bill.latest_action_description}
          </p>
        </div>
      )}

      {/* Subject tags */}
      {bill.subject && bill.subject.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {bill.subject.slice(0, 3).map((subject) => (
            <span
              key={subject}
              className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 rounded"
            >
              {subject}
            </span>
          ))}
          {bill.subject.length > 3 && (
            <span className="px-2 py-0.5 text-xs text-gray-400">
              +{bill.subject.length - 3} more
            </span>
          )}
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
          className="flex-1 py-2 px-4 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors"
        >
          Call My Rep
        </button>
      </div>
    </div>
  );
}
