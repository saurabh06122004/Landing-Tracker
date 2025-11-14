'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

interface CreateLoanData {
    borrowerId: string;
    lenderId: string;
    amount: number;
    interestRate: number;
    tenure: number;
    purpose: string;
}

export async function createLoan(loanData: CreateLoanData) {
    const supabase = createClient();

    const { error } = await supabase.from('loans').insert({
        borrower_id: loanData.borrowerId,
        lender_id: loanData.lenderId,
        amount: loanData.amount,
        interest_rate: loanData.interestRate,
        tenure: loanData.tenure,
        purpose: loanData.purpose,
        status: 'active'
    });

    if (error) {
        console.error('Error creating loan:', error);
        return { success: false, error: `Database error: ${error.message}` };
    }

    revalidatePath('/admin');
    // Also revalidate the borrower's dashboard so they see the new loan
    revalidatePath('/borrower/dashboard');

    return { success: true };
}
