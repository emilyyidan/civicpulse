import Anthropic from '@anthropic-ai/sdk';
import { OpenStatesBill } from '@/types/openstates';
import { UserPreference } from '@/types';
import { POLICY_ISSUES } from '@/data/issues';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface BillAnalysis {
  billId: string;
  recommendation: 'support' | 'oppose' | 'engage';
  confidence: number; // 0-1
  summary: string; // Plain language summary
  relevantIssues: string[]; // Issue IDs this bill relates to
  reasoning: string; // Brief explanation of the recommendation
}

export interface AnalyzeBillsRequest {
  bills: OpenStatesBill[];
  preferences: UserPreference[];
}

export interface AnalyzeBillsResponse {
  analyses: BillAnalysis[];
}

/**
 * Analyze bills against user preferences using Claude
 */
export async function analyzeBills(
  bills: OpenStatesBill[],
  preferences: UserPreference[]
): Promise<BillAnalysis[]> {
  if (bills.length === 0 || preferences.length === 0) {
    return [];
  }

  // Build user profile description from preferences
  const userProfile = buildUserProfile(preferences);

  // Prepare bill summaries for analysis
  const billSummaries = bills.map((bill) => ({
    id: bill.id,
    identifier: bill.identifier,
    title: bill.title,
    abstract: bill.abstracts?.[0]?.abstract || '',
    subjects: bill.subject || [],
    latestAction: bill.latest_action_description || '',
  }));

  const prompt = `You are analyzing California state bills to help a citizen understand which bills align with their policy preferences.

## User's Policy Positions

${userProfile}

## Bills to Analyze

${JSON.stringify(billSummaries, null, 2)}

## Instructions

For each bill, analyze whether the user would likely support, oppose, or want to engage further with this bill based on their stated positions.

Respond with a JSON array containing an analysis object for each bill. Each object should have:
- "billId": the bill's id field
- "recommendation": one of "support", "oppose", or "engage" (use "engage" when the bill is relevant but the user's position isn't clear, or the bill has mixed implications)
- "confidence": a number from 0 to 1 indicating how confident you are in this recommendation
- "summary": a 1-2 sentence plain-language summary of what this bill does (avoid jargon)
- "relevantIssues": array of issue IDs from the user's preferences that this bill relates to
- "reasoning": a brief (1 sentence) explanation of why you made this recommendation based on the user's positions

Important guidelines:
- Be objective and base recommendations purely on the user's stated positions
- If a bill doesn't clearly relate to any of the user's stated issues, recommend "engage" with low confidence
- Write summaries that a non-expert could understand
- Consider the bill's actual likely effects, not just its stated intent

Respond ONLY with the JSON array, no other text.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Extract the text response
    const textContent = response.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude');
    }

    // Parse the JSON response - strip markdown code blocks if present
    let jsonText = textContent.text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.slice(7);
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.slice(3);
    }
    if (jsonText.endsWith('```')) {
      jsonText = jsonText.slice(0, -3);
    }
    jsonText = jsonText.trim();

    const analyses = JSON.parse(jsonText) as BillAnalysis[];
    return analyses;
  } catch (error) {
    console.error('Error analyzing bills with Claude:', error);
    throw error;
  }
}

/**
 * Build a human-readable user profile from preferences
 */
function buildUserProfile(preferences: UserPreference[]): string {
  const lines: string[] = [];

  preferences.forEach((pref) => {
    const issue = POLICY_ISSUES.find((i) => i.id === pref.issueId);
    if (!issue) return;

    const intensity =
      Math.abs(pref.position) === 2
        ? 'strongly'
        : Math.abs(pref.position) === 1
        ? 'somewhat'
        : 'neutral on';

    let position: string;
    if (pref.position === 0) {
      position = `Neutral on ${issue.name}`;
    } else if (pref.position > 0) {
      position = `${intensity} favors: "${issue.rightLabel}"`;
    } else {
      position = `${intensity} favors: "${issue.leftLabel}"`;
    }

    lines.push(`- **${issue.name}** (ID: ${issue.id}): ${position}`);
  });

  return lines.join('\n');
}

/**
 * Generate a call script for a specific bill
 */
export async function generateCallScript(
  bill: OpenStatesBill,
  preferences: UserPreference[],
  recommendation: 'support' | 'oppose',
  billStatus?: string
): Promise<string> {
  const userProfile = buildUserProfile(preferences);

  // Determine the specific ask based on bill status
  const getAskByStatus = (status: string | undefined, position: 'support' | 'oppose'): string => {
    const voteAsk = position === 'support' ? 'vote YES' : 'vote NO';
    const supportAsk = position === 'support' ? 'support' : 'oppose';

    switch (status) {
      case 'Introduced':
      case 'Filed':
        return `Please ${supportAsk} this bill as it moves through the legislative process.`;
      case 'In Committee':
        return position === 'support'
          ? 'Please support moving this bill out of committee.'
          : 'Please oppose this bill in committee and prevent it from advancing.';
      case 'Passed Committee':
      case 'First Reading':
      case 'Second Reading':
        return `Please ${voteAsk} on this bill when it comes to the floor.`;
      case 'Third Reading':
        return `I urge you to ${voteAsk} on this bill—the vote is imminent.`;
      case 'Passed':
        return position === 'support'
          ? 'Please continue to champion this bill as it moves to the other chamber.'
          : 'Please work to stop this bill in the other chamber.';
      default:
        return `I'm asking you to ${voteAsk} on this bill.`;
    }
  };

  const specificAsk = getAskByStatus(billStatus, recommendation);

  const prompt = `Generate a brief, polite phone call script for a constituent calling their California state legislator about this bill.

## Bill Information
- Identifier: ${bill.identifier}
- Title: ${bill.title}
- Abstract: ${bill.abstracts?.[0]?.abstract || 'No abstract available'}
- Current Status: ${billStatus || 'Unknown'}

## User's Position
The user wants to ${recommendation} this bill.

## Specific Ask to Include
${specificAsk}

## User's Values (for context)
${userProfile}

## Instructions
Write a script that:
1. Is 3-4 sentences maximum
2. Introduces the caller as a constituent
3. States their position clearly using phrases like "I support" or "I oppose"
4. Includes the SPECIFIC ASK provided above - this is the most important part
5. Gives ONE brief reason based on the bill's actual content
6. Thanks them for their time

Use placeholders [YOUR NAME] and [YOUR ZIP CODE] where appropriate.

Respond ONLY with the script text, no other formatting or explanation.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const textContent = response.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude');
    }

    return textContent.text;
  } catch (error) {
    console.error('Error generating call script:', error);
    throw error;
  }
}
