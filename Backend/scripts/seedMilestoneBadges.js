/**
 * scripts/seedMilestoneBadges.js
 *
 * Seeds all Badge documents required by the BNHS engagement progression system.
 *
 * SAFE TO RUN MULTIPLE TIMES — uses upsert on the unique `criteriaKey` field,
 * so existing badges are never duplicated or overwritten.
 *
 * Usage:
 *   node scripts/seedMilestoneBadges.js
 *
 * Requires MONGODB_URI to be set in Backend/.env (dotenv is loaded automatically).
 */

'use strict';

require('dotenv').config(); // loads Backend/.env

const mongoose = require('mongoose');
const BadgeModel = require('../src/models/badge.model');

// ---------------------------------------------------------------------------
// Badge definitions
// ---------------------------------------------------------------------------
// The 5 original milestone badges gate the volunteer request
// (user.controller.js checks isMilestone count >= 5).
// The 2 new progression badges extend the journey beyond volunteer status.
// ---------------------------------------------------------------------------

const BADGES = [
    // ── Original milestone badges (isMilestone: true) ──────────────────────
    {
        criteriaKey: 'attend_1_activity',
        name: 'First Step',
        description: 'Attended your first BNHS activity.',
        icon: '🌱',
        isMilestone: true
    },
    {
        criteriaKey: 'attend_5_activities',
        name: 'Nature Explorer',
        description: 'Attended 5 BNHS activities.',
        icon: '🦅',
        isMilestone: true
    },
    {
        criteriaKey: 'attend_1_conservation_project',
        name: 'Conservation Supporter',
        description: 'Attended at least one BNHS conservation project.',
        icon: '🌳',
        isMilestone: true
    },
    {
        criteriaKey: 'attend_3_different_tags',
        name: 'Diverse Explorer',
        description: 'Attended activities covering 3 or more different nature topics.',
        icon: '🔭',
        isMilestone: true
    },
    {
        criteriaKey: 'attend_3_months',
        name: 'Consistent Naturalist',
        description: 'Attended BNHS activities across 3 or more different calendar months.',
        icon: '📅',
        isMilestone: true
    },

    // ── New progression badges (isMilestone: false) ─────────────────────────

    {
        criteriaKey: 'attend_10_activities',
        name: 'Research Contributor',
        description:
            'Attended 10 BNHS activities — eligible to contribute a nature/conservation ' +
            'research paper. Topics may include bird monitoring, wildlife, biodiversity, ' +
            'conservation, field observations, marine life, or environmental education. ' +
            'Verification is handled offline through BNHS.',
        icon: '🔬',
        isMilestone: false
    },
    {
        criteriaKey: 'attend_20_activities',
        name: 'Nature Trip Opportunity',
        description:
            'Attended 20 BNHS activities — eligible for a special BNHS nature trip. ' +
            'This may include a guided wildlife tour, nature experience, or family field ' +
            'trip organised by BNHS. The annual trip schedule is managed separately; ' +
            'eligibility has no time limit.',
        icon: '🌿',
        isMilestone: false
    }
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function seed() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅  Connected to MongoDB\n');

    let created = 0;
    let skipped = 0;

    for (const def of BADGES) {
        const { criteriaKey, ...rest } = def;

        // updateOne with upsert:true on the unique criteriaKey —
        // creates if absent, does nothing if already present.
        const result = await BadgeModel.updateOne(
            { criteriaKey },
            { $setOnInsert: { criteriaKey, ...rest } },
            { upsert: true }
        );

        if (result.upsertedCount === 1) {
            console.log(`  ➕  Created  : [${criteriaKey}] ${def.name}`);
            created++;
        } else {
            console.log(`  ⏭   Skipped  : [${criteriaKey}] ${def.name} — already exists`);
            skipped++;
        }
    }

    console.log(`\n✅  Seeding complete — ${created} created, ${skipped} already existed.`);
    await mongoose.disconnect();
}

seed().catch(err => {
    console.error('❌  Seed failed:', err);
    process.exit(1);
});
