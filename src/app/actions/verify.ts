'use server';

type VerificationResult = {
  isAuthentic: boolean;
  reason: string;
  relevance: 'high' | 'medium' | 'low' | 'irrelevant';
};

export async function performReceiptVerification(imageUrl: string, loanPurpose: string): Promise<VerificationResult> {
  // Simulate AI verification with a delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  const isAuthentic = Math.random() > 0.2; // 80% chance of being authentic
  let reason = '';
  let relevance: VerificationResult['relevance'] = 'high';

  const keywords = loanPurpose.toLowerCase().split(' ');
  const isMedicalRelated = imageUrl.includes('medical') || Math.random() > 0.8;
  const isBikeRelated = imageUrl.includes('bike') || Math.random() > 0.7;

  if (isAuthentic) {
    reason = "The receipt's text is clear, and the layout matches common formats. No obvious signs of digital alteration were detected.";
    
    if (keywords.some(k => ['bike', 'vehicle', 'scooter'].includes(k)) && isBikeRelated) {
        relevance = 'high';
        reason += ' The purchase appears highly relevant to the loan purpose.'
    } else if (keywords.some(k => ['medical', 'health', 'hospital'].includes(k)) && isMedicalRelated) {
        relevance = 'high';
        reason += ' The purchase appears highly relevant to the loan purpose.'
    } else if (isMedicalRelated) {
        relevance = 'irrelevant';
        reason += ' However, the items (medical supplies) seem irrelevant to the loan purpose.'
    } else if (Math.random() > 0.5) {
        relevance = 'medium';
        reason += ' The purchase seems moderately relevant to the loan purpose.'
    } else {
        relevance = 'low';
        reason += ' The relevance of this purchase to the loan purpose is questionable.'
    }

  } else {
    relevance = 'irrelevant';
    const reasons = [
      "Inconsistent text fonts and sizes suggest digital editing.",
      "Pixel analysis shows signs of content-aware fill, indicating parts may have been removed or altered.",
      "The date format does not match the typical format for receipts from this region.",
      "Unusual blurring around the total amount suggests targeted manipulation."
    ];
    reason = reasons[Math.floor(Math.random() * reasons.length)];
  }

  return { isAuthentic, reason, relevance };
}
