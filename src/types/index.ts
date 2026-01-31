export interface PolicyIssue {
  id: string;
  name: string;
  category: IssueCategory;
  leftLabel: string;
  rightLabel: string;
  description: string;
}

export type IssueCategory =
  | 'housing'
  | 'environment'
  | 'economy'
  | 'safety'
  | 'social'
  | 'governance';

export interface UserPreference {
  issueId: string;
  position: number; // -2 to +2 scale (-2 = strongly left, +2 = strongly right)
  intensity: number; // 0 to 2 (0 = don't care, 2 = care a lot)
}

export interface UserProfile {
  zipCode: string;
  preferences: UserPreference[];
  createdAt: Date;
}

export interface Bill {
  id: string;
  identifier: string; // e.g., "SB 123"
  title: string;
  summary: string; // Plain language summary (AI-generated)
  status: string;
  lastAction: string;
  lastActionDate: string;
  url: string;
  relevanceScore: number;
  matchedIssues: string[];
  recommendation: 'support' | 'oppose' | 'engage';
}

export interface Representative {
  id: string;
  name: string;
  role: string; // e.g., "State Senator", "Assembly Member"
  district: string;
  party: string;
  photoUrl?: string;
  phone: string;
  email?: string;
  website?: string;
}
