'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

const CONFIDENCE_SCORE_INCREMENTS = {
    high: 10,
    medium: 5,
    low: 2,
    irrelevant: 1, // small reward even if irrelevant but approved by lender
};
const CONFIDENCE_SCORE_DECREMENTS = {
    rejected_irrelevant: 15,
    rejected_authentic: 10,
};

export async function uploadProof(formData: FormData) {
  const supabase = createClient();
  
  const loanId = formData.get('loanId') as string;
  const borrowerId = formData.get('borrowerId') as string;
  const description = formData.get('description') as string;
  const amount = parseFloat(formData.get('amount') as string);
  const latitude = parseFloat(formData.get('latitude') as string);
  const longitude = parseFloat(formData.get('longitude') as string);

  const imageFiles = formData.getAll('imageFiles') as File[];

  if (imageFiles.length === 0 || !loanId || !borrowerId || !description || isNaN(amount)) {
    return { success: false, error: 'Missing or invalid data.' };
  }
  
  // 1. Upload all images to Supabase Storage
  const uploadPromises = imageFiles.map(file => {
    const fileName = `${borrowerId}/${Date.now()}_${file.name}`;
    return supabase.storage.from('proofs').upload(fileName, file);
  });

  const uploadResults = await Promise.all(uploadPromises);

  const failedUpload = uploadResults.find(res => res.error);
  if (failedUpload) {
    console.error('Storage Error:', failedUpload.error);
    return { success: false, error: `Failed to upload file: ${failedUpload.error.message}` };
  }

  // 2. Get public URLs of all uploaded images
  const imageUrls = uploadResults.map(res => {
    const { data } = supabase.storage.from('proofs').getPublicUrl(res.data.path);
    return data.publicUrl;
  });

  // 3. Insert proof record into the database with the array of URLs
  const { error: dbError } = await supabase.from('proofs').insert({
    loan_id: loanId,
    borrower_id: borrowerId,
    description,
    amount,
    image_urls: imageUrls,
    latitude,
    longitude,
    status: 'pending',
  });

  if (dbError) {
    console.error('Database Error:', dbError);
    // Optionally delete all uploaded files if DB insert fails
    const filePaths = uploadResults.map(res => res.data.path);
    await supabase.storage.from('proofs').remove(filePaths);
    return { success: false, error: `Failed to save proof: ${dbError.message}` };
  }
  
  revalidatePath('/borrower/dashboard');
  revalidatePath('/borrower/dashboard/reports');
  revalidatePath('/lender/loans/' + loanId);

  return { success: true };
}

export async function updateProofStatus(proofId: string, borrowerId: string, newStatus: 'approved' | 'rejected', relevance: 'high' | 'medium' | 'low' | 'irrelevant', documentCount: number = 1) {
    const supabase = createClient();

    // 1. Update the proof status
    const { data: proofData, error: proofError } = await supabase
        .from('proofs')
        .update({ status: newStatus })
        .eq('id', proofId)
        .select('loan_id')
        .single();

    if (proofError) {
        return { success: false, error: `Failed to update proof: ${proofError.message}` };
    }

    // 2. Get current confidence score
    const { data: metricsData, error: metricsError } = await supabase
        .from('user_metrics')
        .select('confidence_score')
        .eq('user_id', borrowerId)
        .single();
    
    if (metricsError && metricsError.code !== 'PGRST116') {
        // 'PGRST116' means no rows found, which is fine for the first time.
        return { success: false, error: `Failed to get user metrics: ${metricsError.message}` };
    }
    
    const currentScore = metricsData?.confidence_score ?? 50;

    // 3. Calculate new score
    let newScore: number;
    if (newStatus === 'approved') {
        // Base increment on relevance
        let increment = CONFIDENCE_SCORE_INCREMENTS[relevance] || 1;
        // Add a bonus for providing more documents (e.g., 1 extra point per additional doc)
        increment += Math.max(0, documentCount - 1);
        newScore = Math.min(100, currentScore + increment);
    } else { // 'rejected'
        const decrement = relevance === 'irrelevant' 
            ? CONFIDENCE_SCORE_DECREMENTS.rejected_irrelevant 
            : CONFIDENCE_SCORE_DECREMENTS.rejected_authentic;
        newScore = Math.max(0, currentScore - decrement);
    }
    
    // 4. Update or insert confidence score in user_metrics table
    const { error: updateMetricsError } = await supabase
        .from('user_metrics')
        .upsert({ user_id: borrowerId, confidence_score: newScore, last_updated: new Date().toISOString() }, { onConflict: 'user_id' });
    
    if (updateMetricsError) {
        return { success: false, error: `Failed to update confidence score: ${updateMetricsError.message}` };
    }
    
    revalidatePath('/admin/loans');
    revalidatePath(`/admin/loans/${proofData?.loan_id}`);
    revalidatePath(`/lender/loans/${proofData?.loan_id}`);
    revalidatePath('/borrower/dashboard');
    revalidatePath('/lender/borrowers'); 

    return { success: true };
}
