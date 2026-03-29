const mysql = require('mysql2/promise');

async function fix() {
    try {
        const conn = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'root',
            database: 'resq_db'
        });

        const [tablesRows] = await conn.execute(`
            SELECT TABLE_NAME, COUNT(INDEX_NAME) as index_count 
            FROM information_schema.STATISTICS 
            WHERE TABLE_SCHEMA = 'resq_db' 
            GROUP BY TABLE_NAME 
            ORDER BY index_count DESC;
        `);

        console.log("Indexes per table:", tablesRows);

        for (const row of tablesRows) {
            if (row.index_count > 10) {
                console.log(`Table ${row.TABLE_NAME} has ${row.index_count} indexes. Cleaning up...`);
                const [indexRows] = await conn.execute(`SHOW INDEX FROM ${row.TABLE_NAME}`);

                // Track indexes to avoid dropping PRIMARY
                const indexesDropping = new Set();
                for (const idx of indexRows) {
                    if (idx.Key_name !== 'PRIMARY' && !idx.Key_name.includes('phone') && !idx.Key_name.includes('PRIMARY')) {
                        if (!indexesDropping.has(idx.Key_name)) {
                            indexesDropping.add(idx.Key_name);
                            // Drop duplicate indexes
                            if (idx.Key_name.match(/_foreign_idx|_ibfk|service_requests_user_phone|service_requests_mechanic_phone/)) {
                                console.log(`Dropping index ${idx.Key_name} from ${row.TABLE_NAME}`);
                                await conn.execute(`ALTER TABLE ${row.TABLE_NAME} DROP INDEX \`${idx.Key_name}\``).catch(e => console.error(e.message));
                            } else if (idx.Key_name.startsWith('userPhone') || idx.Key_name.startsWith('mechanicPhone') || idx.Key_name.startsWith('service_requests')) {
                                console.log(`Dropping index ${idx.Key_name} from ${row.TABLE_NAME}`);
                                await conn.execute(`ALTER TABLE ${row.TABLE_NAME} DROP INDEX \`${idx.Key_name}\``).catch(e => console.error(e.message));
                            }
                        }
                    }
                }

                // Also, let's just aggressively drop all non-primary ones that end with a number as well as sequelize tends to append '1', '2'
                const [indexRows2] = await conn.execute(`SHOW INDEX FROM ${row.TABLE_NAME}`);
                for (const idx of indexRows2) {
                    if (idx.Key_name !== 'PRIMARY') {
                        console.log(`Dropping aggressive index ${idx.Key_name} from ${row.TABLE_NAME}`);
                        await conn.execute(`ALTER TABLE ${row.TABLE_NAME} DROP INDEX \`${idx.Key_name}\``).catch(e => console.error(e.message));
                    }
                }
            }
        }

        await conn.end();
        console.log("Cleanup script finished.");
    } catch (error) {
        console.error("Error:", error);
    }
}

fix();
