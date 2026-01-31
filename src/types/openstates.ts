// Open States API v3 Types
// Documentation: https://docs.openstates.org/api-v3/

export interface OpenStatesBillsResponse {
  results: OpenStatesBill[];
  pagination: {
    per_page: number;
    page: number;
    max_page: number;
    total_items: number;
  };
}

export interface OpenStatesBill {
  id: string;
  session: string;
  jurisdiction: {
    id: string;
    name: string;
    classification: string;
  };
  from_organization: {
    id: string;
    name: string;
    classification: string;
  };
  identifier: string; // e.g., "SB 123"
  title: string;
  classification: string[]; // e.g., ["bill", "resolution"]
  subject: string[];
  abstracts: BillAbstract[];
  other_titles: BillTitle[];
  other_identifiers: BillIdentifier[];
  actions: BillAction[];
  sponsorships: BillSponsorship[];
  related_bills: RelatedBill[];
  versions: BillVersion[];
  documents: BillDocument[];
  votes: VoteEvent[];
  sources: Link[];
  created_at: string;
  updated_at: string;
  extras: Record<string, unknown>;
  first_action_date: string | null;
  latest_action_date: string | null;
  latest_action_description: string | null;
  latest_passage_date: string | null;
  openstates_url: string;
}

export interface BillAbstract {
  abstract: string;
  note: string;
  date: string;
}

export interface BillTitle {
  title: string;
  note: string;
}

export interface BillIdentifier {
  identifier: string;
  scheme: string;
}

export interface BillAction {
  organization: {
    id: string;
    name: string;
    classification: string;
  };
  description: string;
  date: string;
  classification: string[];
  order: number;
}

export interface BillSponsorship {
  name: string;
  entity_type: string;
  organization: {
    id: string;
    name: string;
    classification: string;
  } | null;
  person: {
    id: string;
    name: string;
    party: string;
    current_role: {
      title: string;
      org_classification: string;
      district: string;
    } | null;
  } | null;
  primary: boolean;
  classification: string;
}

export interface RelatedBill {
  identifier: string;
  legislative_session: string;
  relation_type: string;
}

export interface BillVersion {
  note: string;
  date: string;
  links: Link[];
}

export interface BillDocument {
  note: string;
  date: string;
  links: Link[];
}

export interface Link {
  url: string;
  media_type?: string;
}

export interface VoteEvent {
  id: string;
  motion_text: string;
  motion_classification: string[];
  start_date: string;
  result: string;
  organization: {
    id: string;
    name: string;
    classification: string;
  };
  votes: Vote[];
}

export interface Vote {
  option: string;
  voter_name: string;
  voter: {
    id: string;
    name: string;
  } | null;
}

// API Request Parameters
export interface BillsSearchParams {
  jurisdiction?: string; // e.g., "California" or "ca"
  session?: string;
  chamber?: 'upper' | 'lower';
  classification?: string;
  subject?: string[];
  updated_since?: string;
  created_since?: string;
  action_since?: string;
  q?: string; // Full text search
  sponsor?: string;
  sponsor_classification?: string;
  page?: number;
  per_page?: number;
  include?: string[]; // e.g., ["abstracts", "sponsorships", "actions"]
}

// People/Legislator Types
export interface OpenStatesPeopleResponse {
  results: OpenStatesPerson[];
  pagination: {
    per_page: number;
    page: number;
    max_page: number;
    total_items: number;
  };
}

export interface OpenStatesPerson {
  id: string;
  name: string;
  party: string;
  current_role: {
    title: string;
    org_classification: string;
    district: string;
    division_id: string;
  } | null;
  jurisdiction: {
    id: string;
    name: string;
    classification: string;
  };
  given_name: string;
  family_name: string;
  image: string;
  email: string;
  links: Link[];
  sources: Link[];
  capitol_office: {
    name: string;
    address: string;
    voice: string;
    fax: string;
  } | null;
  district_office: {
    name: string;
    address: string;
    voice: string;
    fax: string;
  } | null;
}

export interface PeopleSearchParams {
  jurisdiction?: string;
  name?: string;
  party?: string;
  org_classification?: 'upper' | 'lower';
  district?: string;
  page?: number;
  per_page?: number;
}

// Geo lookup
export interface GeoLookupParams {
  lat: number;
  lng: number;
}
