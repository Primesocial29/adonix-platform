// src/lib/textSanitizer.ts

// Banned words list - keep in sync with your database
const BANNED_WORDS = [
  // Adult content
  'onlyfans', '0f', 'sex', 'hj', 'bj', 'blowjob', 'hookup', 'hook up',
  'massage', 'gfe', 'escort', 'callgirl', 'call girl', 'sneakylink', 'sneaky link',

  // Profanity / Sexual content
  'fuck', 'shit', 'cunt', 'dick', 'pussy', 'asshole', 'bitch', 'whore', 'slut',
  'cock', 'cum', 'orgasm', 'penis', 'vagina', 'anal', 'oral', 'nude', 'naked',
  'sexy', 'sexual', 'porn', 'porno', 'xxx', 'horny', 'bdsm', 'kink', 'kinky',
  'escort', 'hooker', 'prostitute', 'stripper', 'erotic', 'adult',
  
  // Social media
  'instagram', 'insta', 'ig', 'telegram', 'snapchat', 'tiktok', 'twitter', 'facebook',
  'fb', 'whatsapp', 'patreon', 'linktree', 'beacons', 'kik', 'discord',
  
  // Contact Info Patterns
  'email', 'e-mail', 'call me', 'text me', 'dm me', 'message me', 'contact me',
  'phone', 'number', 'cell', '@gmail', '@yahoo', '@hotmail', '@outlook',
  '@aol', '@icloud', '@proton', '@pm.me', '@yandex',

  // Payment/Venmo references
  'venmo', 'cashapp', 'cash app', 'paypal', 'zelle', 'apple pay', 'google pay',
  'crypto', 'bitcoin', 'btc',
  
  // Location/Private meetup hints
  'private', 'discreet', 'hotel', 'my place', 'my house', 'apartment', 'home',
];

// Regular expression patterns for social media handles
export const SOCIAL_MEDIA_PATTERNS = [
  /@[\w\d_.]+/gi,                           // @username
  /instagram\.com\/[\w\d_.]+/gi,            // instagram.com/username
  /instagr\.am\/[\w\d_.]+/gi,               // instagr.am/username
  /facebook\.com\/[\w\d_.]+/gi,             // facebook.com/username
  /fb\.com\/[\w\d_.]+/gi,                   // fb.com/username
  /twitter\.com\/[\w\d_.]+/gi,              // twitter.com/username
  /x\.com\/[\w\d_.]+/gi,                    // x.com/username
  /tiktok\.com\/@[\w\d_.]+/gi,              // tiktok.com/@username
  /snapchat\.com\/add\/[\w\d_.]+/gi,        // snapchat.com/add/username
  /onlyfans\.com\/[\w\d_.]+/gi,             // onlyfans.com/username
  /discord\.gg\/[\w\d_]+/gi,                // discord.gg/invite
  /discord\.com\/invite\/[\w\d_]+/gi,       // discord.com/invite/
  /t\.me\/[\w\d_]+/gi,                      // t.me/username (Telegram)
  /wa\.me\/[\w\d_]+/gi,                     // wa.me/ (WhatsApp)
  /[\w\d_.]+\.[\w]{2,}\/[\w\d_.]+/gi,       // any domain.com/username
  /\b\d{10}\b/g,                            // 10-digit phone number
  /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,         // phone with separators (123-456-7890)
];

// Check if text contains any banned words
export function containsBlockedWords(text: string): boolean {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  
  for (const word of BANNED_WORDS) {
    if (lowerText.includes(word.toLowerCase())) {
      return true;
    }
  }
  
  // Also check patterns
  for (const pattern of SOCIAL_MEDIA_PATTERNS) {
    if (pattern.test(text)) {
      return true;
    }
  }
  
  return false;
}

// Get all banned words that appear in text
export function getBlockedWordsInText(text: string): string[] {
  if (!text) return [];
  const lowerText = text.toLowerCase();
  const found: string[] = [];
  
  for (const word of BANNED_WORDS) {
    if (lowerText.includes(word.toLowerCase())) {
      found.push(word);
    }
  }
  
  // Also check patterns
  for (const pattern of SOCIAL_MEDIA_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) {
      found.push(...matches);
    }
  }
  
  return [...new Set(found)]; // Remove duplicates
}

// Replace banned words with ***
export function sanitizeText(text: string): string {
  if (!text) return text;
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
      error: `Your ${context} contains blocked words that are not allowed on Adonix Fit: ${blockedWords.slice(0, 3).join(', ')}${blockedWords.length > 3 ? '...' : ''}`,
    };
  }
  
  return {
    isValid: true,
    blockedWords: []
  };
}