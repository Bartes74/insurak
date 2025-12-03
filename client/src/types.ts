export interface Asset {
  id: number;
  name: string;
  type: 'VEHICLE' | 'MACHINE' | 'PERSON' | 'OTHER';
  identifier: string;
  status: 'ACTIVE' | 'EXPIRING' | 'EXPIRED' | 'ARCHIVED' | 'RENEWAL_IN_PROGRESS'; // Calculated on backend
  progress: number; // Calculated on backend
  
  // Policy & Dates
  policyNumber: string;
  insurer: string;
  validFrom: string; // ISO Date String YYYY-MM-DD
  validUntil: string; // ISO Date String YYYY-MM-DD
  conclusionDate: string; // ISO Date String YYYY-MM-DD
  paymentFrequency?: 'YEARLY' | 'QUARTERLY' | 'MONTHLY';
  
  // Financials & Contracts
  premium: number;
  sumInsured: number;
  leasingRef: string;
  insured: string;
  
  // Responsibility & Notes
  responsiblePerson: string;
  comments: string;
  notes: string;
}
