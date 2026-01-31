import { PolicyIssue } from '@/types';

export const POLICY_ISSUES: PolicyIssue[] = [
  // Housing & Urban Development
  {
    id: 'housing-development',
    name: 'Housing Development',
    category: 'housing',
    leftLabel: 'Preserve neighborhood character',
    rightLabel: 'Build more housing',
    description:
      'Should California prioritize building new housing even if it changes neighborhood character, or preserve existing communities?',
  },
  {
    id: 'rent-control',
    name: 'Rent Control',
    category: 'housing',
    leftLabel: 'Let market set prices',
    rightLabel: 'Expand rent protections',
    description:
      'Should the state expand rent control protections for tenants, or let the housing market determine rental prices?',
  },
  {
    id: 'homelessness',
    name: 'Homelessness Response',
    category: 'housing',
    leftLabel: 'Enforcement & mandates',
    rightLabel: 'Housing-first approach',
    description:
      'Should California address homelessness primarily through housing-first programs, or through enforcement and treatment mandates?',
  },

  // Environment & Infrastructure
  {
    id: 'wildfire',
    name: 'Wildfire Prevention',
    category: 'environment',
    leftLabel: 'Reduce regulatory burden',
    rightLabel: 'Stricter regulations',
    description:
      'Should California impose stricter building codes and utility regulations to prevent wildfires, or reduce regulatory burden on development?',
  },
  {
    id: 'water',
    name: 'Water Policy',
    category: 'environment',
    leftLabel: 'Prioritize supply',
    rightLabel: 'Prioritize conservation',
    description:
      'Should California prioritize water conservation and environmental flows, or focus on agricultural and urban supply needs?',
  },
  {
    id: 'energy',
    name: 'Energy Transition',
    category: 'environment',
    leftLabel: 'Keep all energy options',
    rightLabel: 'Accelerate renewables',
    description:
      'Should California accelerate renewable energy mandates, or maintain diverse energy sources including nuclear and gas for reliability?',
  },
  {
    id: 'transportation',
    name: 'Transportation',
    category: 'environment',
    leftLabel: 'Roads & car infrastructure',
    rightLabel: 'Public transit investment',
    description:
      'Should California invest heavily in public transit expansion, or prioritize roads and car infrastructure?',
  },

  // Economy & Labor
  {
    id: 'gig-workers',
    name: 'Gig Worker Rights',
    category: 'economy',
    leftLabel: 'Flexible contractor status',
    rightLabel: 'Employee classification',
    description:
      'Should gig workers be classified as employees with full benefits, or maintain flexible independent contractor status?',
  },
  {
    id: 'tech-regulation',
    name: 'Tech & AI Regulation',
    category: 'economy',
    leftLabel: 'Light-touch regulation',
    rightLabel: 'Stronger privacy/AI rules',
    description:
      'Should California impose stronger AI and data privacy regulations, or maintain light-touch policies to preserve innovation?',
  },

  // Public Safety & Justice
  {
    id: 'criminal-justice',
    name: 'Criminal Justice',
    category: 'safety',
    leftLabel: 'Tougher enforcement',
    rightLabel: 'Reduce incarceration',
    description:
      'Should California focus on reducing incarceration and rehabilitation, or prioritize tougher enforcement and sentencing?',
  },
  {
    id: 'gun-policy',
    name: 'Gun Policy',
    category: 'safety',
    leftLabel: 'Protect gun rights',
    rightLabel: 'Stricter regulations',
    description:
      'Should California impose stricter gun regulations, or focus on protecting Second Amendment rights?',
  },

  // Social Policy
  {
    id: 'immigration',
    name: 'Immigration',
    category: 'social',
    leftLabel: 'Federal cooperation',
    rightLabel: 'Expand sanctuary protections',
    description:
      'Should California expand sanctuary protections and services for immigrants, or increase cooperation with federal enforcement?',
  },
  {
    id: 'education',
    name: 'Education',
    category: 'social',
    leftLabel: 'Expand school choice',
    rightLabel: 'Increase public funding',
    description:
      'Should California increase public school funding, or expand school choice options including charter schools?',
  },
  {
    id: 'healthcare',
    name: 'Healthcare',
    category: 'social',
    leftLabel: 'Keep mixed system',
    rightLabel: 'Single-payer system',
    description:
      'Should California move toward a single-payer healthcare system, or maintain the current mixed public/private system?',
  },

  // Governance
  {
    id: 'ceqa',
    name: 'Environmental Review (CEQA)',
    category: 'governance',
    leftLabel: 'Maintain strong review',
    rightLabel: 'Streamline for housing',
    description:
      'Should California streamline environmental review (CEQA) to speed up housing and infrastructure projects, or maintain strong environmental protections?',
  },
];

export const ISSUE_CATEGORIES: Record<string, { label: string; color: string }> = {
  housing: { label: 'Housing & Urban Development', color: 'bg-amber-500' },
  environment: { label: 'Environment & Infrastructure', color: 'bg-green-500' },
  economy: { label: 'Economy & Labor', color: 'bg-blue-500' },
  safety: { label: 'Public Safety & Justice', color: 'bg-red-500' },
  social: { label: 'Social Policy', color: 'bg-purple-500' },
  governance: { label: 'Governance', color: 'bg-gray-500' },
};
