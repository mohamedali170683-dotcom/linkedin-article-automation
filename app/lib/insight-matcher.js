import { CURATED_INSIGHTS } from './knowledge-base';

// Match Light sources to curated insights by author name
// Shared by article generation and Opus editing endpoints
export function findMatchingInsights(lightSources) {
  if (!lightSources || lightSources.length === 0) return [];
  return CURATED_INSIGHTS.filter(ins => {
    const authorLast = ins.source.author.toLowerCase().split(' ').pop();
    const bookLower = ins.source.book.toLowerCase();
    return lightSources.some(src => {
      const srcLower = src.toLowerCase();
      return srcLower.includes(authorLast) || bookLower.includes(srcLower.split('(')[0].trim().toLowerCase());
    });
  });
}
