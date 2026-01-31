import { NextRequest, NextResponse } from 'next/server';
import { getOpenStatesAPI } from '@/lib/openstates';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Bill ID is required' },
        { status: 400 }
      );
    }

    const api = getOpenStatesAPI();
    const bill = await api.getBill(id, [
      'abstracts',
      'sponsorships',
      'actions',
      'votes',
      'versions',
      'documents',
    ]);

    return NextResponse.json(bill);
  } catch (error) {
    console.error('Error fetching bill:', error);

    return NextResponse.json(
      { error: 'Failed to fetch bill' },
      { status: 500 }
    );
  }
}
