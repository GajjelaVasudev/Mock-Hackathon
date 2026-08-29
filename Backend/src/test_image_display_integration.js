const nodeCrypto = require('crypto');
global.crypto = nodeCrypto.webcrypto || nodeCrypto;
if (!global.crypto.getRandomValues) global.crypto.getRandomValues = (arr) => nodeCrypto.randomFillSync(arr);

const http = require('http');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: __dirname + '/../.env' });

function httpGet(urlStr) {
  return new Promise((resolve, reject) => {
    http.get(urlStr, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    }).on('error', reject);
  });
}

function httpPost(urlStr, bodyObj) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const postData = JSON.stringify(bodyObj);
    const req = http.request({
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function verifyImageIntegration() {
  console.log('========================================================');
  console.log('📸 BNHS ACTIVITY IMAGE DATA INTEGRATION VERIFICATION');
  console.log('========================================================\n');

  await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URL);
  console.log('✓ Connected to MongoDB\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, stepName, details = '') {
    if (condition) {
      console.log(`  ✓ PASS: ${stepName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${stepName} - ${details}`);
      failed++;
    }
  }

  // 1. Verify GET /api/ai/activities returns 25 activities with real images
  console.log('--- 1. API Response & Image Metadata Integrity ---');
  const res = await httpGet('http://localhost:3000/api/ai/activities');
  assert(res.status === 200, 'GET /api/ai/activities returns 200 OK');
  assert(res.data.count === 25, `Returns 25 activities (received ${res.data.count})`);

  const activities = res.data.activities || [];
  let activitiesWithRealImages = 0;
  let activitiesWithFallback = 0;

  for (const act of activities) {
    const hasImage = act.image && act.image.url && (act.image.url.startsWith('https://images.pexels.com') || act.image.url.startsWith('https://images.unsplash.com'));
    if (hasImage) {
      activitiesWithRealImages++;
    } else {
      activitiesWithFallback++;
    }
  }

  console.log(`  📊 Count of activities with real Pexels / Unsplash event images: ${activitiesWithRealImages} / 25`);
  console.log(`  📊 Count of activities using fallback placeholder: ${activitiesWithFallback} / 25`);

  assert(activitiesWithRealImages === 25, 'All 25 activities have valid Pexels/Unsplash event images');
  assert(activitiesWithFallback === 0, '0 activities falling back to generic placeholder');

  // 2. Verify specific core activities
  console.log('\n--- 2. Core Activity-Specific Image Assertions ---');

  const checkTargets = [
    {
      name: 'Flamingo Watch at TS Chanakya',
      expectedKeywords: ['flamingo', 'wetland', 'birds']
    },
    {
      name: 'Flamingo & Bird Walk at NRI Pond',
      expectedKeywords: ['flamingo', 'wetland', 'birds']
    },
    {
      name: 'Marine Walk at Juhu Beach',
      expectedKeywords: ['sea', 'corals', 'marine', 'coastal', 'beach', 'tide', 'seaweed']
    },
    {
      name: 'SGNP Bird Monitoring Programme',
      expectedKeywords: ['bird', 'forest', 'branch', 'wildlife']
    },
    {
      name: 'BNHS Butterfly Festival & Life-Cycle Walk',
      expectedKeywords: ['butterfly', 'flower']
    },
    {
      name: 'Amboli Herpetology Field Camp',
      expectedKeywords: ['frog', 'herpetofauna', 'leaf']
    }
  ];

  for (const target of checkTargets) {
    const act = activities.find(a => (a.name || a.title) === target.name);
    assert(act !== undefined, `Found activity "${target.name}"`);
    if (act) {
      assert(act.image && act.image.url, `"${target.name}" has image.url populated`);
      assert(act.imageUrl && act.imageUrl === act.image.url, `"${target.name}" has synchronized imageUrl`);
      assert(act.image.photographer && act.image.photographer.length > 0, `"${target.name}" has photographer attribution (${act.image.photographer})`);
      assert(act.image.source === 'pexels' || act.image.source === 'unsplash', `"${target.name}" source is Pexels or Unsplash (${act.image.source})`);
      
      const altLower = (act.image.alt || '').toLowerCase();
      const keywordMatch = target.expectedKeywords.some(k => altLower.includes(k));
      assert(keywordMatch, `"${target.name}" image alt text is event-specific ("${act.image.alt}")`);
    }
  }

  // 3. Verify Activity Detail Endpoint
  console.log('\n--- 3. Activity Detail Endpoint Verification ---');
  const detailRes = await httpGet('http://localhost:3000/api/ai/activities/bnhs_flamingo_watch_chanakya');
  assert(detailRes.status === 200, 'GET /api/ai/activities/bnhs_flamingo_watch_chanakya returns 200 OK');
  assert(detailRes.data.image && (detailRes.data.image.url.includes('pexels') || detailRes.data.image.url.includes('unsplash')), 'Detail response returns full image subdocument');
  assert(detailRes.data.image.photographer && detailRes.data.image.photographer.length > 0, `Detail photographer attribution present (${detailRes.data.image.photographer})`);

  // 4. Verify Recommendations Endpoint
  console.log('\n--- 4. Recommendations Image Integration ---');
  const recRes = await httpPost('http://localhost:3000/api/ai/recommend', {
    interests: ['flamingos', 'wetlands'],
    location: 'Navi Mumbai'
  });
  assert(recRes.status === 200, 'POST /api/ai/recommend returns 200 OK');
  const recs = recRes.data.recommendations || [];
  assert(recs.length > 0, 'Recommendations returned');
  assert(recs[0].image && recs[0].image.url, 'Top recommendation has real image attached');

  await mongoose.disconnect();

  console.log('\n========================================================');
  console.log(`📊 INTEGRATION TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================\n');

  if (failed > 0) process.exit(1);
  else process.exit(0);
}

verifyImageIntegration().catch(err => {
  console.error('Integration test failed:', err);
  process.exit(1);
});
