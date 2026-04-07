// src/lib/textSanitizer.ts

// Banned words list - keep in sync with your database
const BANNED_WORDS = [
  // Adult content
  'onlyfans', '0f', 'sex', 'hj', 'bj', 'blowjob', 'hookup', 'hook up',
  'massage', 'gfe', 'escort', 'callgirl', 'call girl',
  
  // Social media
  'instagram', 'ig', 'telegram', 'snapchat', 'tiktok', 'twitter', 'facebook',
  
  // Contact info
  'phone', 'email', 'gmail'
];

// Check if text contains any banned words
export function containsBlockedWords(text: string): boolean {
  const lowerText = text.toLowerCase();
  console.log('Checking text:', lowerText);
  
  for (const word of BANNED_WORDS) {
    console.log('Checking word:', word, lowerText.includes(word));
    if (lowerText.includes(word)) {
      return true;
    }
  }
  
  return false;
}

// Get all banned words that appear in text
export function getBlockedWordsInText(text: string): string[] {
  const lowerText = text.toLowerCase();
  const found: string[] = [];
  
  for (const word of BANNED_WORDS) {
    if (lowerText.includes(word)) {
      found.push(word);
    }
  }
  
  return found;
}

// Replace banned words with ***
export function sanitizeText(text: string): string {
  let sanitized = text;
  
  for (const word of BANNED_WORDS) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    sanitized = sanitized.replace(regex, '***');
  }
  
  return sanitized;
}

// Validate text before saving
export async function validateText(text: string, context: string): Promise<{
  isValid: boolean;
  blockedWords: string[];
  error?: string;
}> {
  const blockedWords = getBlockedWordsInText(text);
  
  if (blockedWords.length > 0) {
    return {
      isValid: false,
      blockedWords,
      error: `Your ${context} contains blocked words: ${blockedWords.join(', ')}. Please remove them.`
    };
  }
  
  return {
    isValid: true,
    blockedWords: []
  };
}