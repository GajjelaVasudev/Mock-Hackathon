/**
 * BNHS Automatic Event-Image Search & Relevance Scoring Service
 * Connects to both Pexels and Unsplash APIs to search, score, and select
 * high-resolution, non-repetitive wildlife & nature photography for BNHS activities.
 */

const https = require('https');

// Curated high-res nature fallbacks if external APIs are unreachable or rate-limited
const CURATED_FALLBACK_IMAGES = {
  bird: [
    {
      url: 'https://images.pexels.com/photos/2317904/pexels-photo-2317904.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      smallUrl: 'https://images.pexels.com/photos/2317904/pexels-photo-2317904.jpeg?auto=compress&cs=tinysrgb&w=400',
      source: 'pexels',
      photographer: 'David Selbert',
      attributionUrl: 'https://www.pexels.com/photo/close-up-photo-of-kingfisher-2317904/',
      alt: 'Common Kingfisher resting on branch near water'
    },
    {
      url: 'https://images.unsplash.com/photo-1549608276-5786777e6587?auto=format&fit=crop&w=1200&q=80',
      smallUrl: 'https://images.unsplash.com/photo-1549608276-5786777e6587?auto=format&fit=crop&w=400&q=80',
      source: 'unsplash',
      photographer: 'Vincent van Zalinge',
      attributionUrl: 'https://unsplash.com/photos/vivid-bird-perched',
      alt: 'Wild songbird perching on forest tree branch'
    }
  ],
  flamingo: [
    {
      url: 'https://images.pexels.com/photos/105808/pexels-photo-105808.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      smallUrl: 'https://images.pexels.com/photos/105808/pexels-photo-105808.jpeg?auto=compress&cs=tinysrgb&w=400',
      source: 'pexels',
      photographer: 'David Dibert',
      attributionUrl: 'https://www.pexels.com/photo/flock-of-pink-flamingos-105808/',
      alt: 'Flock of greater flamingos feeding in shallow wetland lagoon'
    },
    {
      url: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=1200&q=80',
      smallUrl: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=400&q=80',
      source: 'unsplash',
      photographer: 'Clem Onojeghuo',
      attributionUrl: 'https://unsplash.com/photos/flock-of-flamingos',
      alt: 'Greater flamingos in wetland nature reserve'
    }
  ],
  marine: [
    {
      url: 'https://images.pexels.com/photos/1001682/pexels-photo-1001682.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      smallUrl: 'https://images.pexels.com/photos/1001682/pexels-photo-1001682.jpeg?auto=compress&cs=tinysrgb&w=400',
      source: 'pexels',
      photographer: 'Pok Rie',
      attributionUrl: 'https://www.pexels.com/photo/rock-formations-on-sea-shore-1001682/',
      alt: 'Coastal shoreline tide pools and marine intertidal biodiversity'
    },
    {
      url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
      smallUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80',
      source: 'unsplash',
      photographer: 'Sean Oulashin',
      attributionUrl: 'https://unsplash.com/photos/coastal-seashore',
      alt: 'Tropical seashore and coastal marine ecology'
    }
  ],
  nature: [
    {
      url: 'https://images.pexels.com/photos/142497/pexels-photo-142497.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      smallUrl: 'https://images.pexels.com/photos/142497/pexels-photo-142497.jpeg?auto=compress&cs=tinysrgb&w=400',
      source: 'pexels',
      photographer: 'Pixabay',
      attributionUrl: 'https://www.pexels.com/photo/green-leaf-trees-142497/',
      alt: 'Lush green ancient forest canopy in botanical nature sanctuary'
    },
    {
      url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80',
      smallUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=400&q=80',
      source: 'unsplash',
      photographer: 'Sebastian Unrau',
      attributionUrl: 'https://unsplash.com/photos/forest-canopy',
      alt: 'Dense green ancient forest canopy and wilderness'
    }
  ]
};

class ImageSearchService {
  /**
   * Build smart, high-signal nature search query
   */
  generateNatureQuery(eventData) {
    const { title = '', description = '', type = '', tags = [], location = '' } = eventData;

    const stopWords = new Set([
      'a', 'an', 'the', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'near',
      'bnhs', 'event', 'walk', 'trail', 'awareness', 'explore', 'join', 'guided', 'session',
      'focusing', 'observation', 'study', 'camp', 'course', 'project', 'our', 'this', 'about',
      'programme', 'program', 'workshop'
    ]);

    const titleTokens = title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.has(w));

    const tagTokens = Array.isArray(tags)
      ? tags.map(t => String(t).toLowerCase().trim()).filter(t => t.length > 2 && !stopWords.has(t))
      : [];

    const textCorpus = `${title} ${description} ${tagTokens.join(' ')} ${location}`.toLowerCase();

    // 1. Flamingo Specific
    if (textCorpus.includes('flamingo')) {
      return {
        primary: 'flamingo wetland birds flock',
        secondary: 'greater flamingo wildlife nature',
        category: 'flamingo',
        keyTerms: ['flamingo', 'flamingos', 'wetland', 'wetlands', 'bird', 'flock']
      };
    }

    // 2. Marine / Tidepool / Coast Specific
    if (textCorpus.includes('marine') || textCorpus.includes('tidepool') || textCorpus.includes('coast') || textCorpus.includes('juhu') || textCorpus.includes('sea') || textCorpus.includes('shore')) {
      return {
        primary: 'intertidal marine coastal biodiversity',
        secondary: 'tide pool marine sea shore crab',
        category: 'marine',
        keyTerms: ['marine', 'intertidal', 'coastal', 'tidepool', 'coast', 'crab', 'sea', 'ocean', 'shore', 'corals']
      };
    }

    // 3. Tree / Botany / Heritage Tree
    if (textCorpus.includes('tree') || textCorpus.includes('flora') || textCorpus.includes('botanical') || textCorpus.includes('heritage') || textCorpus.includes('banyan') || textCorpus.includes('canopy')) {
      return {
        primary: 'ancient heritage tree nature botanical',
        secondary: 'lush banyan tree forest canopy',
        category: 'nature',
        keyTerms: ['tree', 'trees', 'botanical', 'flora', 'heritage', 'banyan', 'canopy', 'forest']
      };
    }

    // 4. Specific Bird & SGNP Monitoring
    if (textCorpus.includes('sgnp') || textCorpus.includes('monitoring') || textCorpus.includes('forest bird')) {
      return {
        primary: 'forest bird watching wildlife nature',
        secondary: 'wild bird branch forest nature',
        category: 'bird',
        keyTerms: ['bird', 'forest', 'wildlife', 'monitoring', 'sanctuary', 'avian']
      };
    }

    if (textCorpus.includes('bird') || textCorpus.includes('avian') || textCorpus.includes('owl') || textCorpus.includes('raptor') || textCorpus.includes('kingfisher')) {
      const birdSpecific = titleTokens.find(w => ['kingfisher', 'hornbill', 'owl', 'pitta', 'eagle', 'heron', 'stork', 'duck', 'woodpecker'].includes(w));
      return {
        primary: birdSpecific ? `${birdSpecific} wild bird nature` : 'wild bird watching nature wildlife',
        secondary: 'colorful wild bird nature',
        category: 'bird',
        keyTerms: birdSpecific ? [birdSpecific, 'bird', 'wildlife'] : ['bird', 'birds', 'wildlife', 'avian']
      };
    }

    if (textCorpus.includes('butterfly') || textCorpus.includes('insect') || textCorpus.includes('moth')) {
      return {
        primary: 'wild butterfly flower nature macro',
        secondary: 'colorful butterfly wildlife flower',
        category: 'nature',
        keyTerms: ['butterfly', 'insect', 'flower', 'macro', 'nature']
      };
    }

    if (textCorpus.includes('herpeto') || textCorpus.includes('frog') || textCorpus.includes('reptile') || textCorpus.includes('snake') || textCorpus.includes('amphibian')) {
      return {
        primary: 'frog amphibian wildlife nature macro',
        secondary: 'reptile lizard herpetofauna nature',
        category: 'nature',
        keyTerms: ['frog', 'toad', 'lizard', 'reptile', 'amphibian', 'herpetofauna', 'wildlife']
      };
    }

    // Default nature query
    const combinedTokens = [...new Set([...titleTokens, ...tagTokens])].slice(0, 4);
    const queryStr = combinedTokens.length > 0 ? `${combinedTokens.join(' ')} nature wildlife` : 'nature wildlife habitat';

    return {
      primary: queryStr,
      secondary: 'nature wildlife habitat',
      category: 'nature',
      keyTerms: combinedTokens.length > 0 ? combinedTokens : ['nature', 'wildlife']
    };
  }

  /**
   * Relevance Scoring Algorithm
   * Scores candidate image based on keyword overlap with event details,
   * species specificity, habitat match, and negative penalties for non-nature content.
   */
  scoreImageCandidate(candidate, eventData, queryInfo, candidateIndex = 0) {
    let score = 50; // base score

    const altText = (candidate.alt || '').toLowerCase();
    const urlText = (candidate.url || '').toLowerCase();
    const photographer = (candidate.photographer || '').toLowerCase();
    const combinedCandidateText = `${altText} ${urlText} ${photographer}`;

    const { keyTerms = [], category = 'nature' } = queryInfo;
    const { title = '', description = '', tags = [] } = eventData;

    // 1. Exact Key Species / Subject Matching (+30 to +50 points)
    for (const term of keyTerms) {
      if (term.length > 2 && combinedCandidateText.includes(term.toLowerCase())) {
        score += 35;
      }
    }

    // 2. Category specific matches
    if (category === 'flamingo') {
      if (combinedCandidateText.includes('flamingo')) score += 40;
      if (combinedCandidateText.includes('wetland') || combinedCandidateText.includes('water')) score += 20;
    } else if (category === 'marine') {
      if (combinedCandidateText.includes('marine') || combinedCandidateText.includes('tide') || combinedCandidateText.includes('crab') || combinedCandidateText.includes('coral') || combinedCandidateText.includes('seaweed')) score += 40;
      if (combinedCandidateText.includes('coast') || combinedCandidateText.includes('sea') || combinedCandidateText.includes('ocean')) score += 20;
    } else if (category === 'bird') {
      if (combinedCandidateText.includes('bird') || combinedCandidateText.includes('kingfisher') || combinedCandidateText.includes('owl') || combinedCandidateText.includes('hornbill') || combinedCandidateText.includes('feathers')) score += 40;
      if (combinedCandidateText.includes('branch') || combinedCandidateText.includes('perch') || combinedCandidateText.includes('wildlife')) score += 15;
    }

    // 3. Alt text descriptive quality (+10 points)
    if (altText.length > 15) score += 10;

    // 4. Rank Gradient
    score += Math.max(0, 10 - candidateIndex * 2);

    // 5. Negative Penalties (Avoid people portraits, indoor, urban vehicles)
    const negativeKeywords = ['portrait of woman', 'portrait of man', 'smiling person', 'young woman', 'fashion model', 'crowd', 'indoor', 'office', 'vehicle', 'car', 'building', 'city street'];
    for (const neg of negativeKeywords) {
      if (combinedCandidateText.includes(neg)) {
        score -= 45;
      }
    }

    return score;
  }

  /**
   * Search Pexels API
   */
  async searchPexels(query, perPage = 6) {
    const apiKey = process.env.PEXELS_API_KEY || process.env.IMAGE_SEARCH_API_KEY;
    if (!apiKey) return [];

    return new Promise((resolve) => {
      const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`;

      const req = https.get(
        url,
        {
          headers: {
            Authorization: apiKey,
            'User-Agent': 'BNHS-Nature-Platform/1.0',
          },
          timeout: 7000,
        },
        (res) => {
          if (res.statusCode !== 200) return resolve([]);

          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => {
            try {
              const parsed = JSON.parse(data);
              if (parsed.photos && Array.isArray(parsed.photos)) {
                const results = parsed.photos.map((photo) => {
                  // Build optimized multi-resolution URL set from Pexels URL params.
                  // Pexels supports ?auto=compress&cs=tinysrgb&w=NNN&h=NNN query params.
                  const baseUrl = photo.src?.original || photo.src?.large || photo.src?.medium || '';
                  // Strip any existing size params and rebuild clean tiered sizes
                  const pexelsBase = baseUrl.includes('?') ? baseUrl.split('?')[0] : baseUrl;
                  return {
                    url: `${pexelsBase}?auto=compress&cs=tinysrgb&w=1280`,        // full – detail page
                    mediumUrl: `${pexelsBase}?auto=compress&cs=tinysrgb&w=700`,   // card grid
                    smallUrl: `${pexelsBase}?auto=compress&cs=tinysrgb&w=400`,    // thumb / small viewport
                    source: 'pexels',
                    photographer: photo.photographer || 'Pexels Contributor',
                    attributionUrl: photo.url || 'https://www.pexels.com',
                    alt: photo.alt || query,
                  };
                });
                return resolve(results);
              }
              resolve([]);
            } catch (err) {
              resolve([]);
            }
          });
        }
      );

      req.on('error', () => resolve([]));
      req.on('timeout', () => { req.destroy(); resolve([]); });
    });
  }

  /**
   * Search Unsplash API
   */
  async searchUnsplash(query, perPage = 6) {
    const accessKey = process.env.UNSPLASH_ACCESS_KEY;
    if (!accessKey) return [];

    return new Promise((resolve) => {
      const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`;

      const req = https.get(
        url,
        {
          headers: {
            Authorization: `Client-ID ${accessKey}`,
            'User-Agent': 'BNHS-Nature-Platform/1.0',
          },
          timeout: 7000,
        },
        (res) => {
          if (res.statusCode !== 200) return resolve([]);

          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => {
            try {
              const parsed = JSON.parse(data);
              if (parsed.results && Array.isArray(parsed.results)) {
                const results = parsed.results.map((photo) => {
                  // Unsplash URL supports &w=NNN param for precise width control.
                  // We construct three size tiers from the raw (full) URL.
                  const rawUrl = photo.urls?.raw || photo.urls?.full || photo.urls?.regular || '';
                  const unsplashBase = rawUrl.includes('?') ? rawUrl.split('?')[0] : rawUrl;
                  const unsplashParams = 'auto=format&fit=crop&q=80';
                  return {
                    url: `${unsplashBase}?${unsplashParams}&w=1280`,        // full – detail page
                    mediumUrl: `${unsplashBase}?${unsplashParams}&w=700`,   // card grid
                    smallUrl: `${unsplashBase}?${unsplashParams}&w=400`,    // thumb / small viewport
                    source: 'unsplash',
                    photographer: photo.user?.name || photo.user?.username || 'Unsplash Contributor',
                    attributionUrl: photo.links?.html || `https://unsplash.com/@${photo.user?.username || ''}`,
                    alt: photo.alt_description || photo.description || query,
                  };
                });
                return resolve(results);
              }
              resolve([]);
            } catch (err) {
              resolve([]);
            }
          });
        }
      );

      req.on('error', () => resolve([]));
      req.on('timeout', () => { req.destroy(); resolve([]); });
    });
  }

  /**
   * Find and Rank Single Best Event Image from Pexels + Unsplash
   * Automatically picks top-ranked image without requiring admin selection.
   */
  async findBestEventImage(eventData, options = {}) {
    const queryInfo = this.generateNatureQuery(eventData);
    const { primary, secondary, category } = queryInfo;
    const excludeUrls = new Set(options.excludeUrls || []);

    // 1. Search Pexels and Unsplash concurrently for rich non-repetitive imagery
    const [pexelsResults, unsplashResults] = await Promise.allSettled([
      this.searchPexels(primary, 6),
      this.searchUnsplash(primary, 6),
    ]);

    const pexelsCandidates = pexelsResults.status === 'fulfilled' ? pexelsResults.value : [];
    const unsplashCandidates = unsplashResults.status === 'fulfilled' ? unsplashResults.value : [];

    // Interleave results to maximize diversity
    let candidates = [];
    const maxLen = Math.max(pexelsCandidates.length, unsplashCandidates.length);
    for (let i = 0; i < maxLen; i++) {
      if (pexelsCandidates[i]) candidates.push(pexelsCandidates[i]);
      if (unsplashCandidates[i]) candidates.push(unsplashCandidates[i]);
    }

    // 2. If candidates are sparse, search with secondary query
    if (candidates.length < 4 && secondary) {
      const [secPexels, secUnsplash] = await Promise.allSettled([
        this.searchPexels(secondary, 4),
        this.searchUnsplash(secondary, 4),
      ]);
      const secList = [
        ...(secPexels.status === 'fulfilled' ? secPexels.value : []),
        ...(secUnsplash.status === 'fulfilled' ? secUnsplash.value : [])
      ];
      const seen = new Set(candidates.map(c => c.url));
      for (const c of secList) {
        if (!seen.has(c.url)) {
          candidates.push(c);
          seen.add(c.url);
        }
      }
    }

    // 3. If still empty, use curated high-resolution fallbacks
    if (candidates.length === 0) {
      const fallbackList = CURATED_FALLBACK_IMAGES[category] || CURATED_FALLBACK_IMAGES.nature;
      candidates = [...fallbackList];
    }

    // 4. Score and Rank all candidates
    const scoredCandidates = candidates.map((cand, idx) => ({
      ...cand,
      relevanceScore: this.scoreImageCandidate(cand, eventData, queryInfo, idx),
    }));

    scoredCandidates.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // 5. Select top candidate not in excludeUrls
    let selected = scoredCandidates.find(c => !excludeUrls.has(c.url));
    if (!selected) {
      selected = scoredCandidates[0] || (CURATED_FALLBACK_IMAGES[category] || CURATED_FALLBACK_IMAGES.nature)[0];
    }

    return {
      bestImage: {
        url: selected.url,
        mediumUrl: selected.mediumUrl || selected.url,
        smallUrl: selected.smallUrl || selected.url,
        source: selected.source || 'pexels',
        photographer: selected.photographer || 'Nature Contributor',
        attributionUrl: selected.attributionUrl || (selected.source === 'unsplash' ? 'https://unsplash.com' : 'https://www.pexels.com'),
        alt: selected.alt || primary,
      },
      query: primary,
      relevanceScore: selected.relevanceScore,
      allCandidates: scoredCandidates,
    };
  }

  /**
   * Main Search Method (Backwards compatibility)
   */
  async searchEventImages(eventData, options = {}) {
    const result = await this.findBestEventImage(eventData, options);
    return {
      query: result.query,
      image: result.bestImage,
      images: [result.bestImage, ...(result.allCandidates || []).slice(1, 4)],
      automaticallySelected: true,
      relevanceScore: result.relevanceScore,
    };
  }
}

module.exports = new ImageSearchService();
