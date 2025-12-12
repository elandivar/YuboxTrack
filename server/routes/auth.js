const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();
const SECRET_KEY = process.env.SECRET_KEY || 'supersecretkey';

const { users } = require('../schema');
const { eq } = require('drizzle-orm');

// Register
router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).send('Missing fields');

    const hashedPassword = bcrypt.hashSync(password, 8);

    try {
        const result = await db.insert(users).values({
            username,
            password: hashedPassword
        }).returning({ id: users.id, username: users.username });

        res.status(201).json(result[0]);
    } catch (err) {
        if (err.code === '23505') { // unique_violation
            return res.status(400).send('Username already exists');
        }
        console.error(err);
        res.status(500).send('Server error');
    }
});

// Login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const result = await db.select().from(users).where(eq(users.username, username));
        const user = result[0];

        if (!user) return res.status(404).send('User not found');

        const isValid = bcrypt.compareSync(password, user.password);
        if (!isValid) return res.status(401).send('Invalid password');

        const token = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: '24h' });
        res.json({ token, username });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

module.exports = router;
