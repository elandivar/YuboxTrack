const { defineConfig } = require('drizzle-kit');
require('dotenv').config({ path: '../.env' });

module.exports = defineConfig({
    schema: './schema.js',
    out: './drizzle',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL,
    },
});
