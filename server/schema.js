const { pgTable, serial, text, doublePrecision, timestamp, integer, jsonb } = require('drizzle-orm/pg-core');

const users = pgTable('users', {
    id: serial('id').primaryKey(),
    username: text('username').unique().notNull(),
    password: text('password').notNull(),
});

const tracks = pgTable('tracks', {
    id: serial('id').primaryKey(),
    tractorId: text('tractor_id'),
    latitude: doublePrecision('latitude'),
    longitude: doublePrecision('longitude'),
    timestamp: timestamp('timestamp').defaultNow(),
});

const maps = pgTable('maps', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id),
    name: text('name'),
    imagePath: text('image_path'),
    bounds: jsonb('bounds'),
    coordinates: jsonb('coordinates'),
    mode: text('mode'),
    createdAt: timestamp('created_at').defaultNow(),
});

module.exports = { users, tracks, maps };
