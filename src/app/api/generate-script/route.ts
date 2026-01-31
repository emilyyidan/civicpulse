import { NextRequest, NextResponse } from 'next/server';
import { generateCallScript } from '@/lib/claude';
import { OpenStatesBill } from '@/types/openstates';
import { UserPreference } from '@/types';

export interface GenerateScriptRequestBody {
  bill: OpenStatesBill;
  preferences: UserPreference[];
  recommendation: 'support' | 'oppose';
  billStatus?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateScriptRequestBody = await request.json();

    if (!body.bill) {
      return NextResponse.json(
        { error: 'bill is required' },
        { status: 400 }
      );
    }

    if (!body.preferences || !Array.isArray(body.preferences)) {
      return NextResponse.json(
        { error: 'preferences array is required' },
        { status: 400 }
      );
    }

    if (!['support', 'oppose'].includes(body.recommendation)) {
      return NextResponse.json(
        { error: 'recommendation must be "support" or "oppose"' },
        { status: 400 }
      );
    }

    const script = await generateCallScript(
      body.bill,
      body.preferences,
      body.recommendation,
      body.billStatus
    );

    return NextResponse.json({ script });
  } catch (error) {
    console.error('Error generating script:', error);

    return NextResponse.json(
      { error: 'Failed to generate script' },
      { status: 500 }
    );
  }
}
