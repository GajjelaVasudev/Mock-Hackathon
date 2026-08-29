/**
 * BNHS Community Canonical Category & Hashtag Taxonomy
 * Shared by Backend Controllers, Migration Scripts, and Test Suites.
 */

const CANONICAL_CATEGORIES = [
  'Birds',
  'Marine',
  'Trees & Flora',
  'Conservation',
  'Field Camps',
  'Volunteering',
  'Insects',
  'General Nature',
];

const CATEGORY_HASHTAG_MAP = {
  'Birds': [
    'birds',
    'bird',
    'birdwatching',
    'ornithology',
    'kingfisher',
    'owl',
    'hornbill',
    'flamingo',
    'waterbirds',
  ],
  'Marine': [
    'marine',
    'marinelife',
    'marine-life',
    'ocean',
    'coastal',
    'intertidal',
    'seashore',
    'beach',
    'coral',
    'crab',
    'turtle',
  ],
  'Trees & Flora': [
    'trees',
    'tree',
    'flora',
    'plants',
    'plant',
    'botany',
    'forest',
    'forests',
    'nature',
    'vegetation',
    'biodiversity',
  ],
  'Conservation': [
    'conservation',
    'restoration',
    'habitatrestoration',
    'environment',
    'sustainability',
    'climate',
    'rewilding',
  ],
  'Field Camps': [
    'fieldcamp',
    'fieldcamps',
    'fieldcamping',
    'herpetology',
    'reptiles',
    'amphibians',
    'fieldwork',
  ],
  'Volunteering': [
    'volunteering',
    'volunteer',
    'citizenscience',
    'citizen-science',
    'bnhsseva',
    'seva',
  ],
  'Insects': [
    'insects',
    'insect',
    'butterfly',
    'butterflies',
    'moth',
    'moths',
    'bees',
    'dragonfly',
    'dragonflies',
  ],
};

/**
 * Normalizes a raw hashtag string or array of strings.
 * e.g., "#Marine-Life" -> "#marine-life", "flora" -> "#flora"
 */
function normalizeHashtag(tag) {
  if (!tag || typeof tag !== 'string') return '';
  let clean = tag.trim().toLowerCase();
  if (!clean.startsWith('#')) {
    clean = `#${clean}`;
  }
  // normalize multiple hyphens or trailing punctuation
  clean = clean.replace(/[^a-z0-9_#-]/gi, '');
  return clean;
}

/**
 * Extracts and normalizes all hashtags from text and/or array.
 * Returns array of unique normalized hashtags with '#' prefix.
 */
function extractAndNormalizeHashtags(content = '', explicitHashtags = []) {
  const tagsSet = new Set();

  if (Array.isArray(explicitHashtags)) {
    explicitHashtags.forEach((t) => {
      const norm = normalizeHashtag(t);
      if (norm && norm !== '#') tagsSet.add(norm);
    });
  }

  if (content && typeof content === 'string') {
    const matches = content.match(/#[a-zA-Z0-9_-]+/g) || [];
    matches.forEach((t) => {
      const norm = normalizeHashtag(t);
      if (norm && norm !== '#') tagsSet.add(norm);
    });
  }

  return Array.from(tagsSet);
}

/**
 * Normalizes a category string to one of the canonical values, or null.
 */
function normalizeCategoryName(cat) {
  if (!cat || typeof cat !== 'string') return null;
  const clean = cat.trim().toLowerCase();

  for (const canonical of CANONICAL_CATEGORIES) {
    if (canonical.toLowerCase() === clean) {
      return canonical;
    }
  }

  // Handle common aliases/variations
  if (clean.includes('tree') || clean.includes('flora') || clean.includes('botan') || clean.includes('plant')) {
    return 'Trees & Flora';
  }
  if (clean.includes('bird') || clean.includes('ornith') || clean.includes('flamingo') || clean.includes('hornbill')) {
    return 'Birds';
  }
  if (clean.includes('marin') || clean.includes('ocean') || clean.includes('intertidal') || clean.includes('beach') || clean.includes('coast')) {
    return 'Marine';
  }
  if (clean.includes('conserv') || clean.includes('restor') || clean.includes('climate') || clean.includes('wildlife')) {
    return 'Conservation';
  }
  if (clean.includes('camp') || clean.includes('herpet') || clean.includes('reptil')) {
    return 'Field Camps';
  }
  if (clean.includes('volunt') || clean.includes('seva') || clean.includes('citizen')) {
    return 'Volunteering';
  }
  if (clean.includes('insect') || clean.includes('butterfl') || clean.includes('moth') || clean.includes('bee')) {
    return 'Insects';
  }

  return null;
}

/**
 * Determines the canonical category for a post using the deterministic priority:
 * 1. Explicit valid category selected by the user (authoritative)
 * 2. Strongest matching hashtag group from the canonical taxonomy
 * 3. Activity category (if linked to an activity)
 * 4. "General Nature" fallback
 */
function determinePostCategory({
  explicitCategory = null,
  content = '',
  hashtags = [],
  activityCategory = null,
} = {}) {
  // 1. Explicit Category if valid and non-generic
  const normalizedExplicit = normalizeCategoryName(explicitCategory);
  if (normalizedExplicit && normalizedExplicit !== 'General Nature') {
    return normalizedExplicit;
  }

  // Extract all hashtags
  const allTags = extractAndNormalizeHashtags(content, hashtags);
  const tagWords = allTags.map((t) => t.replace(/^#/, '').toLowerCase());

  // Also include words from content for deeper inference
  const contentLower = (content || '').toLowerCase();

  // 2. Score each category based on matching hashtags and keywords
  const scores = {};
  for (const [category, keywords] of Object.entries(CATEGORY_HASHTAG_MAP)) {
    let score = 0;
    for (const kw of keywords) {
      const kwLower = kw.toLowerCase();
      // Exact hashtag match (high weight)
      if (tagWords.includes(kwLower)) {
        score += 10;
      }
      // Content word match (lower weight)
      const wordRegex = new RegExp(`\\b${kwLower}\\b`, 'i');
      if (wordRegex.test(contentLower)) {
        score += 2;
      }
    }
    if (score > 0) {
      scores[category] = score;
    }
  }

  // Find category with highest score
  let bestCategory = null;
  let maxScore = 0;
  for (const [cat, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      bestCategory = cat;
    }
  }

  if (bestCategory) {
    return bestCategory;
  }

  // 3. Activity category fallback
  const normalizedActivityCat = normalizeCategoryName(activityCategory);
  if (normalizedActivityCat) {
    return normalizedActivityCat;
  }

  // 4. Default fallback
  return normalizedExplicit || 'General Nature';
}

module.exports = {
  CANONICAL_CATEGORIES,
  CATEGORY_HASHTAG_MAP,
  normalizeHashtag,
  extractAndNormalizeHashtags,
  normalizeCategoryName,
  determinePostCategory,
};
