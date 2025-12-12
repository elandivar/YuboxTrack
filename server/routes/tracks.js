const express = require('express');
const db = require('../db');
const router = express.Router();
const { tracks } = require('../schema');
const { desc, sql } = require('drizzle-orm');

// Get latest tracks
router.get('/', async (req, res) => {
    try {
        const result = await db.select().from(tracks).orderBy(desc(tracks.timestamp)).limit(100);

        // Map Drizzle keys to frontend expectations if needed
        // Frontend expects: tractor_id, latitude, longitude, timestamp
        // Drizzle returns: tractorId, latitude, longitude, timestamp
        const mappedResult = result.map(t => ({
            ...t,
            tractor_id: t.tractorId
        }));

        res.json(mappedResult);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching tracks');
    }
});

// Add a track point (simulated from tractor)
router.post('/', (req, res) => {
    const { tractor_id, latitude, longitude } = req.body;
    if (!tractor_id || !latitude || !longitude) {
        return res.status(400).send('Missing data');
    }

    try {
        const stmt = db.prepare('INSERT INTO tracks (tractor_id, latitude, longitude) VALUES (?, ?, ?)');
        stmt.run(tractor_id, latitude, longitude);
        res.status(201).send('Track point added');
    } catch (err) {
        res.status(500).send('Error saving track');
    }
});

// Seed some dummy data if empty
const seedData = async () => {
    try {
        const result = await db.select({ count: sql`count(*)` }).from(tracks);
        const count = parseInt(result[0].count);

        if (count === 0) {
            console.log('Seeding track data...');
            const baseLat = -2.170998;
            const baseLng = -79.922359;
            const newTracks = [];

            for (let i = 0; i < 20; i++) {
                newTracks.push({
                    tractorId: 'tractor-1',
                    latitude: baseLat + (i * 0.0001),
                    longitude: baseLng + (i * 0.0001)
                });
            }
            await db.insert(tracks).values(newTracks);
            console.log('Seeding complete.');
        }
    } catch (err) {
        console.error('Error seeding data:', err);
    }
};

seedData();

module.exports = router;
