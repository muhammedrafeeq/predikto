const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Manually load env variables
const envFiles = [".env", ".env.local"];
for (const file of envFiles) {
  const envPath = path.join(process.cwd(), file);
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf8");
    for (const line of envContent.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const sep = trimmed.indexOf("=");
      if (sep !== -1) {
        const key = trimmed.substring(0, sep).trim();
        let val = trimmed.substring(sep + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.substring(1, val.length - 1);
        }
        process.env[key] = val;
      }
    }
  }
}

async function run() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const usersRes = await pool.query("SELECT id, name, phone, role FROM users");
    console.log("Users:", usersRes.rows);

    const columnsRes = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'contests'");
    console.log("Contests Columns:", columnsRes.rows);

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await pool.end();
  }
}

run();
