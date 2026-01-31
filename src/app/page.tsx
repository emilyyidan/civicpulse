'use client';

import { useState, useEffect } from 'react';
import { UserPreference } from '@/types';
import { OpenStatesBill, OpenStatesPerson } from '@/types/openstates';
import { BillAnalysis } from '@/lib/claude';
import { POLICY_ISSUES } from '@/data/issues';
import { ZipCodeEntry } from '@/components/ZipCodeEntry';
import { IssueCarousel } from '@/components/IssueCarousel';
import { BillsList } from '@/components/BillsList';
import { fetchRepresentatives, generateScript } from '@/lib/api-client';
import { getCachedScript, setCachedScript } from '@/lib/cache';

type AppStep = 'zipcode' | 'issues' | 'bills' | 'call';

interface SelectedBillData {
  bill: OpenStatesBill;
  analysis: BillAnalysis;
}

export default function Home() {
  const [step, setStep] = useState<AppStep>('zipcode');
  const [zipCode, setZipCode] = useState('');
  const [preferences, setPreferences] = useState<UserPreference[]>([]);
  const [selectedBillData, setSelectedBillData] = useState<SelectedBillData | null>(null);
  const [representatives, setRepresentatives] = useState<OpenStatesPerson[]>([]);
  const [selectedRep, setSelectedRep] = useState<OpenStatesPerson | null>(null);
  const [callScript, setCallScript] = useState<string>('');
  const [loadingReps, setLoadingReps] = useState(false);
  const [loadingScript, setLoadingScript] = useState(false);

  const handleZipCodeSubmit = (zip: string) => {
    setZipCode(zip);
    setStep('issues');
  };

  const handlePreferenceChange = (preference: UserPreference) => {
    setPreferences((prev) => {
      const existing = prev.findIndex((p) => p.issueId === preference.issueId);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = preference;
        return updated;
      }
      return [...prev, preference];
    });
  };

  const handleIssuesComplete = () => {
    setStep('bills');
  };

  const handleRestart = () => {
    setStep('zipcode');
    setPreferences([]);
  };

  const handleCallRep = (bill: OpenStatesBill, analysis: BillAnalysis) => {
    setSelectedBillData({ bill, analysis });
    setStep('call');
  };

  const handleBack = () => {
    if (step === 'call') {
      setStep('bills');
      setSelectedBillData(null);
      setCallScript('');
      setSelectedRep(null);
    } else if (step === 'bills') {
      setStep('issues');
    } else if (step === 'issues') {
      setStep('zipcode');
    }
  };

  // Fetch representatives when entering call step
  useEffect(() => {
    if (step === 'call' && zipCode && representatives.length === 0) {
      setLoadingReps(true);
      fetchRepresentatives(zipCode)
        .then((response) => {
          setRepresentatives(response.results);
          if (response.results.length > 0) {
            setSelectedRep(response.results[0]);
          }
        })
        .catch((err) => {
          console.error('Failed to fetch representatives:', err);
        })
        .finally(() => {
          setLoadingReps(false);
        });
    }
  }, [step, zipCode, representatives.length]);

  // Auto-select first rep if none selected but reps are loaded
  useEffect(() => {
    if (step === 'call' && !selectedRep && representatives.length > 0) {
      setSelectedRep(representatives[0]);
    }
  }, [step, selectedRep, representatives]);

  // Get bill status from actions
  const getBillStatus = (bill: OpenStatesBill): string => {
    if (bill.actions && bill.actions.length > 0) {
      const latestAction = bill.actions[bill.actions.length - 1];
      const classification = latestAction.classification?.[0];

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

  // Generate call script when rep is selected (with caching)
  useEffect(() => {
    if (selectedRep && selectedBillData && selectedBillData.analysis.recommendation !== 'engage') {
      const billId = selectedBillData.bill.id;
      const recommendation = selectedBillData.analysis.recommendation as 'support' | 'oppose';
      const billStatus = getBillStatus(selectedBillData.bill);

      // Check cache first
      const cachedScript = getCachedScript(billId, recommendation);
      if (cachedScript) {
        console.log('Using cached script for', billId);
        setCallScript(cachedScript);
        return;
      }

      // Generate new script
      setLoadingScript(true);
      generateScript(
        selectedBillData.bill,
        preferences,
        recommendation,
        billStatus
      )
        .then((response) => {
          setCallScript(response.script);
          // Cache the script
          setCachedScript(billId, recommendation, response.script);
          console.log('Cached new script for', billId);
        })
        .catch((err) => {
          console.error('Failed to generate script:', err);
          // Fallback script
          setCallScript(
            `Hi, my name is [YOUR NAME] and I'm a constituent from ${zipCode}. I'm calling about ${selectedBillData.bill.identifier}. I ${selectedBillData.analysis.recommendation} this bill. Thank you for your time.`
          );
        })
        .finally(() => {
          setLoadingScript(false);
        });
    }
  }, [selectedRep, selectedBillData, preferences, zipCode]);

  const handleCall = () => {
    if (selectedRep?.capitol_office?.voice) {
      window.location.href = `tel:${selectedRep.capitol_office.voice}`;
    } else if (selectedRep?.district_office?.voice) {
      window.location.href = `tel:${selectedRep.district_office.voice}`;
    }
  };

  // Format script with line breaks and bold key phrases
  const formatScript = (script: string): string => {
    // Add line breaks after sentences for better readability
    let formatted = script
      .replace(/\. /g, '.\n\n')
      .replace(/\? /g, '?\n\n')
      .trim();

    // Bold key position phrases
    const phrasesToBold = [
      'my support',
      'my opposition',
      'I support',
      'I oppose',
      'in support of',
      'in opposition to',
      'strongly support',
      'strongly oppose',
      'vote YES',
      'vote NO',
      'vote yes',
      'vote no',
      'urge you to support',
      'urge you to oppose',
      'asking you to support',
      'asking you to oppose',
      'please support',
      'please oppose',
      'support this bill',
      'oppose this bill',
    ];

    phrasesToBold.forEach((phrase) => {
      const regex = new RegExp(`(${phrase})`, 'gi');
      formatted = formatted.replace(regex, '**$1**');
    });

    return formatted;
  };

  // Render script with markdown-style bold
  const renderScript = (script: string) => {
    const parts = script.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={index} className="font-semibold text-gray-800 dark:text-gray-200">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div className="min-h-screen bg-mesh">
      {/* Header - disabled for now */}
      {false && step === 'call' && (
        <header className="sticky top-0 z-10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border-b border-gray-100 dark:border-zinc-800">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
            <button
              onClick={handleBack}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <span className="text-lg font-display text-gray-900 dark:text-white">
              CivicPulse
            </span>
            <div className="w-6" />
          </div>
        </header>
      )}

      {/* Main content */}
      <main className="px-4 py-8">
        {step === 'zipcode' && (
          <div className="min-h-[80vh] flex items-center justify-center">
            <ZipCodeEntry onSubmit={handleZipCodeSubmit} />
          </div>
        )}

        {step === 'issues' && (
          <div className="pt-4">
            <div className="max-w-lg mx-auto mb-6 text-center">
              <h2 className="text-3xl font-display text-gray-900 dark:text-white mb-2">
                How do you feel about these issues?
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Slide to indicate your position on each issue. This helps us
                find bills that you might care about.
              </p>
            </div>
            <IssueCarousel
              issues={POLICY_ISSUES}
              preferences={preferences}
              onPreferenceChange={handlePreferenceChange}
              onComplete={handleIssuesComplete}
              onRestart={handleRestart}
            />
          </div>
        )}

        {step === 'bills' && (
          <div className="max-w-lg md:max-w-2xl lg:max-w-3xl mx-auto">
            <BillsList
              preferences={preferences}
              zipCode={zipCode}
              onCallRep={handleCallRep}
            />

            {/* Start over link */}
            <div className="mt-8 text-center">
              <button
                onClick={handleRestart}
                className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                Start over
              </button>
            </div>
          </div>
        )}

        {step === 'call' && selectedBillData && (
          <div className="max-w-lg mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-display text-gray-900 dark:text-white">
                Call Your Representative about {selectedBillData.bill.identifier}
              </h2>
            </div>

            {/* Bill summary reminder */}
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 mb-6 border border-purple-100 dark:border-purple-800">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-medium">Bill: </span>
                {selectedBillData.analysis.summary}
              </p>
              <p className="text-sm text-purple-600 dark:text-purple-400 mt-2">
                Your position:{' '}
                <span className="font-medium capitalize">
                  {selectedBillData.analysis.recommendation}
                </span>
              </p>
            </div>

            {/* Representative selection */}
            {loadingReps ? (
              <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-gray-100 dark:border-zinc-800 text-center">
                <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  Finding your representatives...
                </p>
              </div>
            ) : representatives.length > 0 ? (
              <div className="space-y-4">
                {/* Rep selector if multiple */}
                {representatives.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {representatives.map((rep) => (
                      <button
                        key={rep.id}
                        onClick={() => setSelectedRep(rep)}
                        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                          selectedRep?.id === rep.id
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {rep.current_role?.org_classification === 'upper'
                          ? 'Senator'
                          : 'Assembly'}
                      </button>
                    ))}
                  </div>
                )}

                {/* Selected rep card */}
                {selectedRep && (
                  <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-gray-100 dark:border-zinc-800">
                    <div className="flex items-center gap-4 mb-6">
                      {selectedRep.image ? (
                        <img
                          src={selectedRep.image}
                          alt={selectedRep.name}
                          className="w-20 h-20 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-gray-200 dark:bg-zinc-700 rounded-full flex items-center justify-center">
                          <svg
                            className="w-10 h-10 text-gray-400"
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
                        </div>
                      )}
                      <div>
                        <h3 className="text-xl font-display text-gray-900 dark:text-white">
                          {selectedRep.name}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400">
                          {selectedRep.current_role?.title} •{' '}
                          {selectedRep.current_role?.district}
                        </p>
                        <p className="text-sm text-gray-400">
                          {selectedRep.party}
                        </p>
                      </div>
                    </div>

                    {/* Call script */}
                    <div className="bg-gray-50 dark:bg-zinc-800 rounded-xl p-4 mb-6">
                      <div className="flex items-center gap-2 mb-2">
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
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          AI-Generated Script
                        </h4>
                      </div>
                      {loadingScript ? (
                        <div className="flex items-center gap-2 text-gray-400">
                          <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                          <span className="text-sm">Generating script...</span>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap leading-relaxed">
                          {renderScript(formatScript(callScript ||
                            `Hi, my name is [YOUR NAME] and I'm a constituent from ${zipCode}. I'm calling about ${selectedBillData.bill.identifier}. I ${selectedBillData.analysis.recommendation} this bill because ${selectedBillData.analysis.reasoning} Thank you for your time.`))}
                        </p>
                      )}
                    </div>

                    {/* Phone numbers */}
                    <div className="space-y-2 mb-6">
                      {selectedRep.capitol_office?.voice && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500 dark:text-gray-400">
                            Capitol Office
                          </span>
                          <span className="font-mono text-gray-700 dark:text-gray-300">
                            {selectedRep.capitol_office.voice}
                          </span>
                        </div>
                      )}
                      {selectedRep.district_office?.voice && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500 dark:text-gray-400">
                            District Office
                          </span>
                          <span className="font-mono text-gray-700 dark:text-gray-300">
                            {selectedRep.district_office.voice}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Call button */}
                    <button
                      onClick={handleCall}
                      disabled={
                        !selectedRep.capitol_office?.voice &&
                        !selectedRep.district_office?.voice
                      }
                      className="w-full py-4 px-4 rounded-xl text-white font-medium text-lg flex items-center justify-center gap-2 transition-colors bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                      Call Now
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl p-6 border border-yellow-200 dark:border-yellow-800 text-center">
                <p className="text-yellow-700 dark:text-yellow-400">
                  Could not find representatives for your area. Please check
                  your zip code.
                </p>
              </div>
            )}

            {/* Return to bills link - outside the card */}
            <div className="mt-8 text-center">
              <button
                onClick={handleBack}
                className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                Return to bills
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
