const mysql = require('mysql2/promise');
require('dotenv').config();

async function createDb() {
    try {
        const conn = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || 'root'
        });
        await conn.execute(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'resq_db'}\`;`);
        console.log("Database created successfully or already exists.");
        await conn.end();
    } catch (e) {
        console.error("Error creating database:", e.message);
    }
}
createDb();
