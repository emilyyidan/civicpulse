import { NextRequest, NextResponse } from 'next/server';
import { getOpenStatesAPI } from '@/lib/openstates';

// Approximate coordinates for SF zip codes
// In production, you'd use a proper geocoding service
const SF_ZIP_COORDINATES: Record<string, { lat: number; lng: number }> = {
  '94102': { lat: 37.7786, lng: -122.4193 }, // Civic Center
  '94103': { lat: 37.7726, lng: -122.4110 }, // SoMa
  '94104': { lat: 37.7915, lng: -122.4018 }, // Financial District
  '94105': { lat: 37.7893, lng: -122.3951 }, // Rincon Hill
  '94107': { lat: 37.7621, lng: -122.3971 }, // Potrero Hill
  '94108': { lat: 37.7929, lng: -122.4080 }, // Chinatown
  '94109': { lat: 37.7941, lng: -122.4211 }, // Nob Hill/Russian Hill
  '94110': { lat: 37.7486, lng: -122.4154 }, // Mission
  '94111': { lat: 37.7989, lng: -122.4001 }, // Embarcadero
  '94112': { lat: 37.7209, lng: -122.4423 }, // Ingleside
  '94114': { lat: 37.7585, lng: -122.4352 }, // Castro
  '94115': { lat: 37.7857, lng: -122.4370 }, // Western Addition
  '94116': { lat: 37.7436, lng: -122.4862 }, // Parkside
  '94117': { lat: 37.7702, lng: -122.4447 }, // Haight-Ashbury
  '94118': { lat: 37.7816, lng: -122.4618 }, // Inner Richmond
  '94121': { lat: 37.7768, lng: -122.4941 }, // Outer Richmond
  '94122': { lat: 37.7585, lng: -122.4843 }, // Sunset
  '94123': { lat: 37.8003, lng: -122.4368 }, // Marina
  '94124': { lat: 37.7318, lng: -122.3877 }, // Bayview
  '94127': { lat: 37.7359, lng: -122.4570 }, // St. Francis Wood
  '94129': { lat: 37.7996, lng: -122.4662 }, // Presidio
  '94130': { lat: 37.8235, lng: -122.3707 }, // Treasure Island
  '94131': { lat: 37.7416, lng: -122.4378 }, // Twin Peaks
  '94132': { lat: 37.7241, lng: -122.4834 }, // Lake Merced
  '94133': { lat: 37.8008, lng: -122.4117 }, // North Beach
  '94134': { lat: 37.7192, lng: -122.4130 }, // Visitacion Valley
  '94158': { lat: 37.7695, lng: -122.3870 }, // Mission Bay
};

// Default to City Hall if zip not found
const DEFAULT_SF_COORDINATES = { lat: 37.7793, lng: -122.4193 };

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const zipCode = searchParams.get('zip');

    if (!zipCode) {
      return NextResponse.json(
        { error: 'Zip code is required' },
        { status: 400 }
      );
    }

    // Get coordinates for the zip code
    const coordinates = SF_ZIP_COORDINATES[zipCode] || DEFAULT_SF_COORDINATES;

    const api = getOpenStatesAPI();
    const response = await api.getPeopleByLocation(
      coordinates.lat,
      coordinates.lng
    );

    // Filter to only California state legislators
    const stateLegislators = response.results.filter(
      (person) =>
        person.jurisdiction.name === 'California' &&
        person.current_role !== null
    );

    return NextResponse.json({
      results: stateLegislators,
      coordinates,
      zipCode,
    });
  } catch (error) {
    console.error('Error fetching representatives:', error);

    if (error instanceof Error && error.message.includes('OPEN_STATES_API_KEY')) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch representatives' },
      { status: 500 }
    );
  }
}
