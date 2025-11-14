'use server';

import { utils, write } from 'xlsx';
import type { Loan, Proof, UserProfile } from '@/lib/types';
import { getUtilizedAmount } from '@/lib/types';

type LoanWithRelations = Loan & { borrower: UserProfile; proofs: Proof[] };

export async function generateReport(loans: LoanWithRelations[]): Promise<Buffer> {
  // 1. Flatten the data
  const flatData = loans.flatMap(loan => {
    if (loan.proofs.length === 0) {
      // Include loan even if there are no proofs
      return [{
        'Loan ID': loan.id,
        'Borrower Name': loan.borrower.name,
        'Borrower Email': loan.borrower.email,
        'Loan Purpose': loan.purpose,
        'Loan Amount': loan.amount,
        'Interest Rate': loan.interest_rate,
        'Loan Tenure (Months)': loan.tenure,
        'Loan Status': loan.status,
        'Total Utilized': getUtilizedAmount(loan),
        'Proof ID': 'N/A',
        'Proof Description': 'N/A',
        'Proof Amount': 'N/A',
        'Proof Status': 'N/A',
        'Proof Submitted At': 'N/A',
      }];
    }
    return loan.proofs.map(proof => ({
      'Loan ID': loan.id,
      'Borrower Name': loan.borrower.name,
      'Borrower Email': loan.borrower.email,
      'Loan Purpose': loan.purpose,
      'Loan Amount': loan.amount,
      'Interest Rate': loan.interest_rate,
      'Loan Tenure (Months)': loan.tenure,
      'Loan Status': loan.status,
      'Total Utilized': getUtilizedAmount(loan),
      'Proof ID': proof.id,
      'Proof Description': proof.description,
      'Proof Amount': proof.amount,
      'Proof Status': proof.status,
      'Proof Submitted At': new Date(proof.created_at).toLocaleString(),
    }));
  });

  // 2. Create worksheet and workbook
  const worksheet = utils.json_to_sheet(flatData);
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, 'Loan Portfolio Report');

  // 3. Generate a buffer using `write` instead of `writeFile`
  const buffer = write(workbook, { bookType: 'xlsx', type: 'buffer' });

  return buffer;
}
