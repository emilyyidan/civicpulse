import { NextRequest, NextResponse } from 'next/server';
import { getOpenStatesAPI } from '@/lib/openstates';
import { BillsSearchParams } from '@/types/openstates';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Build the query parameters
    const params: BillsSearchParams = {
      jurisdiction: 'California',
      per_page: parseInt(searchParams.get('per_page') || '20'),
      page: parseInt(searchParams.get('page') || '1'),
      include: ['abstracts', 'sponsorships', 'actions'],
    };

    // Optional filters
    const session = searchParams.get('session');
    if (session) params.session = session;

    const q = searchParams.get('q');
    if (q) params.q = q;

    const subject = searchParams.getAll('subject');
    if (subject.length) params.subject = subject;

    const updated_since = searchParams.get('updated_since');
    if (updated_since) params.updated_since = updated_since;

    const action_since = searchParams.get('action_since');
    if (action_since) params.action_since = action_since;

    const api = getOpenStatesAPI();
    const response = await api.searchBills(params);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching bills:', error);

    if (error instanceof Error && error.message.includes('OPEN_STATES_API_KEY')) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch bills' },
      { status: 500 }
    );
  }
}
