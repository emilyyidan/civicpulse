import {
  OpenStatesBillsResponse,
  OpenStatesPeopleResponse,
  BillsSearchParams,
  PeopleSearchParams,
  OpenStatesBill,
  OpenStatesPerson,
} from '@/types/openstates';

const OPEN_STATES_API_URL = 'https://v3.openstates.org';

class OpenStatesAPI {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async fetch<T>(
    endpoint: string,
    params: Record<string, string | string[] | number | undefined> = {}
  ): Promise<T> {
    const url = new URL(`${OPEN_STATES_API_URL}${endpoint}`);

    // Add query parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach((v) => url.searchParams.append(key, v));
        } else {
          url.searchParams.append(key, String(value));
        }
      }
    });

    const response = await fetch(url.toString(), {
      headers: {
        'X-API-KEY': this.apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Open States API error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    return response.json();
  }

  /**
   * Search for bills
   */
  async searchBills(params: BillsSearchParams): Promise<OpenStatesBillsResponse> {
    const queryParams: Record<string, string | string[] | number | undefined> = {
      jurisdiction: params.jurisdiction,
      session: params.session,
      chamber: params.chamber,
      classification: params.classification,
      updated_since: params.updated_since,
      created_since: params.created_since,
      action_since: params.action_since,
      q: params.q,
      sponsor: params.sponsor,
      sponsor_classification: params.sponsor_classification,
      page: params.page,
      per_page: params.per_page,
    };

    // Handle arrays
    if (params.subject?.length) {
      queryParams.subject = params.subject;
    }
    if (params.include?.length) {
      queryParams.include = params.include;
    }

    return this.fetch<OpenStatesBillsResponse>('/bills', queryParams);
  }

  /**
   * Get a specific bill by its Open States ID
   */
  async getBill(
    billId: string,
    include?: string[]
  ): Promise<OpenStatesBill> {
    const params: Record<string, string | string[] | undefined> = {};
    if (include?.length) {
      params.include = include;
    }
    return this.fetch<OpenStatesBill>(`/bills/ocd-bill/${billId}`, params);
  }

  /**
   * Get a bill by jurisdiction, session, and identifier
   */
  async getBillByIdentifier(
    jurisdiction: string,
    session: string,
    identifier: string,
    include?: string[]
  ): Promise<OpenStatesBill> {
    const params: Record<string, string | string[] | undefined> = {};
    if (include?.length) {
      params.include = include;
    }
    return this.fetch<OpenStatesBill>(
      `/bills/${jurisdiction}/${session}/${encodeURIComponent(identifier)}`,
      params
    );
  }

  /**
   * Search for legislators/people
   */
  async searchPeople(params: PeopleSearchParams): Promise<OpenStatesPeopleResponse> {
    return this.fetch<OpenStatesPeopleResponse>('/people', {
      jurisdiction: params.jurisdiction,
      name: params.name,
      party: params.party,
      org_classification: params.org_classification,
      district: params.district,
      page: params.page,
      per_page: params.per_page,
    });
  }

  /**
   * Get legislators by geographic coordinates
   */
  async getPeopleByLocation(
    lat: number,
    lng: number
  ): Promise<OpenStatesPeopleResponse> {
    return this.fetch<OpenStatesPeopleResponse>('/people.geo', {
      lat: lat,
      lng: lng,
    });
  }

  /**
   * Get a specific person by their Open States ID
   */
  async getPerson(personId: string): Promise<OpenStatesPerson> {
    return this.fetch<OpenStatesPerson>(`/people/${personId}`);
  }
}

// Singleton instance for server-side use
let apiInstance: OpenStatesAPI | null = null;

export function getOpenStatesAPI(): OpenStatesAPI {
  const apiKey = process.env.OPEN_STATES_API_KEY;

  if (!apiKey) {
    throw new Error(
      'OPEN_STATES_API_KEY is not set. Get one at https://openstates.org/accounts/register/'
    );
  }

  if (!apiInstance) {
    apiInstance = new OpenStatesAPI(apiKey);
  }

  return apiInstance;
}

export { OpenStatesAPI };
