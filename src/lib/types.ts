export type UserRole = 'borrower' | 'lender';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  mobile_number: string;
  role: UserRole;
  user_metrics?: UserMetrics;
}

export type Proof = {
  id: string;
  loan_id: string;
  borrower_id: string;
  description: string;
  amount: number;
  status: 'approved' | 'pending' | 'rejected';
  image_urls: string[];
  latitude: number;
  longitude: number;
  created_at: string;
};

export type Loan = {
  id: string;
  borrower_id: string;
  lender_id: string;
  amount: number;
  interest_rate: number;
  tenure: number; // in months
  purpose: string;
  status: 'active' | 'repaid' | 'defaulted';
  created_at: string;
  proofs: Proof[];
};

export type UserMetrics = {
    user_id: string;
    confidence_score: number;
    last_updated: string;
}

export const getUtilizedAmount = (loan: Loan): number => {
  if (!loan || !loan.proofs) return 0;
  return loan.proofs
    .filter((proof) => proof.status === 'approved')
    .reduce((total, proof) => total + proof.amount, 0);
};
