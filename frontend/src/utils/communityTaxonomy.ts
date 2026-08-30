/**
 * BNHS Community Canonical Category & Hashtag Taxonomy
 * Shared across Community UI, Post Creation, Feed Filtering, and Detail Views.
 */

export const CANONICAL_CATEGORIES = [
  'Birds',
  'Marine',
  'Trees & Flora',
  'Conservation',
  'Field Camps',
  'Volunteering',
  'Insects',
  'General Nature',
] as const;

export type CanonicalCategory = typeof CANONICAL_CATEGORIES[number];

export const CATEGORY_PILLS = [
  { id: 'all', label: 'All' },
  { id: 'Birds', label: 'Birds' },
  { id: 'Marine', label: 'Marine' },
  { id: 'Trees & Flora', label: 'Trees & Flora' },
  { id: 'Conservation', label: 'Conservation' },
  { id: 'Field Camps', label: 'Field Camps' },
  { id: 'Volunteering', label: 'Volunteering' },
  { id: 'Insects', label: 'Insects' },
];

export const CATEGORY_HASHTAG_MAP: Record<string, string[]> = {
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

export function normalizeHashtag(tag: string): string {
  if (!tag) return '';
  let clean = tag.trim().toLowerCase();
  if (!clean.startsWith('#')) {
    clean = `#${clean}`;
  }
  clean = clean.replace(/[^a-z0-9_#-]/gi, '');
  return clean;
}

export function extractAndNormalizeHashtags(content = '', explicitHashtags: string[] = []): string[] {
  const tagsSet = new Set<string>();

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
