const express = require('express');
const db = require('../db'); // Correctly import default export
const { maps } = require('../schema');
const { eq, desc } = require('drizzle-orm');
const jwt = require('jsonwebtoken');

const router = express.Router();
const SECRET_KEY = process.env.SECRET_KEY || 'supersecretkey';

// Middleware to authenticate token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Save Map
router.post('/', authenticateToken, async (req, res) => {
    const { name, image_path, bounds, coordinates, mode } = req.body;
    const userId = req.user.id;

    try {
        const result = await db.insert(maps).values({
            userId,
            name,
            imagePath: image_path,
            bounds, // Drizzle handles JSONB automatically
            coordinates,
            mode
        }).returning({ id: maps.id });

        res.status(201).json({ id: result[0].id });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error saving map');
    }
});

// Get Maps for User
router.get('/', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    try {
        const result = await db.select().from(maps)
            .where(eq(maps.userId, userId))
            .orderBy(desc(maps.createdAt));

        // Map Drizzle result keys to frontend expectations if needed
        // Frontend expects: name, image_path, bounds, coordinates, mode, created_at
        // Drizzle returns: name, imagePath, bounds, coordinates, mode, createdAt
        // We need to map imagePath -> image_path and createdAt -> created_at to match previous API response
        const mappedResult = result.map(m => ({
            ...m,
            image_path: m.imagePath,
            created_at: m.createdAt
        }));

        res.json(mappedResult);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching maps');
    }
});

module.exports = router;
