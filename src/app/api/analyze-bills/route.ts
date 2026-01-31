import { NextRequest, NextResponse } from 'next/server';
import { analyzeBills, BillAnalysis } from '@/lib/claude';
import { OpenStatesBill } from '@/types/openstates';
import { UserPreference } from '@/types';

export interface AnalyzeBillsRequestBody {
  bills: OpenStatesBill[];
  preferences: UserPreference[];
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeBillsRequestBody = await request.json();

    if (!body.bills || !Array.isArray(body.bills)) {
      return NextResponse.json(
        { error: 'bills array is required' },
        { status: 400 }
      );
    }

    if (!body.preferences || !Array.isArray(body.preferences)) {
      return NextResponse.json(
        { error: 'preferences array is required' },
        { status: 400 }
      );
    }

    // Limit to analyzing 20 bills at a time to manage API costs
    const billsToAnalyze = body.bills.slice(0, 20);

    const analyses = await analyzeBills(billsToAnalyze, body.preferences);

    return NextResponse.json({ analyses });
  } catch (error) {
    console.error('Error in analyze-bills API:', error);

    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'Claude API key not configured' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to analyze bills' },
      { status: 500 }
    );
  }
}
