import * as fs from "fs";
import * as path from "path";
import { Client } from "pg";
import bcrypt from "bcryptjs";

// Manually load env variables from .env or .env.local
const envFiles = [".env", ".env.local"];
let envLoaded = false;
for (const file of envFiles) {
  const envPath = path.join(process.cwd(), file);
  if (fs.existsSync(envPath)) {
    console.log(`Loading environment variables from ${file}...`);
    const envContent = fs.readFileSync(envPath, "utf8");
    for (const line of envContent.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex !== -1) {
        const key = trimmed.substring(0, separatorIndex).trim();
        let val = trimmed.substring(separatorIndex + 1).trim();
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.substring(1, val.length - 1);
        }
        process.env[key] = val;
      }
    }
    envLoaded = true;
  }
}
if (!envLoaded) {
  console.log("No .env or .env.local file found. Using system environment variables.");
}

const connectionString = process.env.DATABASE_URL || "";

if (!connectionString) {
  console.error("Error: DATABASE_URL is not set in environment or .env.local");
  process.exit(1);
}

async function migrate() {
  console.log("Connecting to the database...");
  const client = new Client({
    connectionString,
    ssl: connectionString.includes("localhost") || connectionString.includes("127.0.0.1")
      ? false
      : { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log("Connected successfully. Running schema.sql...");

    // Read and run schema.sql
    const schemaPath = path.join(process.cwd(), "lib", "schema.sql");
    const schemaSql = fs.readFileSync(schemaPath, "utf8");
    await client.query(schemaSql);
    console.log("Schema tables created/verified successfully.");

    // Seed Users
    console.log("Checking and seeding users...");
    const userCheck = await client.query("SELECT COUNT(*) FROM users");
    const userCount = parseInt(userCheck.rows[0].count, 10);

    let adminId: number;
    let userId: number;

    if (userCount === 0) {
      const adminPinHash = bcrypt.hashSync("1234", 10);
      const userPinHash = bcrypt.hashSync("4321", 10);

      const adminRes = await client.query(
        `INSERT INTO users (name, phone, pin_hash, role) 
         VALUES ($1, $2, $3, $4) RETURNING id`,
        ["Alex Morgan", "1234567890", adminPinHash, "admin"]
      );
      adminId = adminRes.rows[0].id;

      const userRes = await client.query(
        `INSERT INTO users (name, phone, pin_hash, role) 
         VALUES ($1, $2, $3, $4) RETURNING id`,
        ["John Doe", "0987654321", userPinHash, "user"]
      );
      userId = userRes.rows[0].id;

      console.log(`Seeded users. Admin ID: ${adminId}, User ID: ${userId}`);
    } else {
      const adminRes = await client.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
      const userRes = await client.query("SELECT id FROM users WHERE role = 'user' LIMIT 1");
      adminId = adminRes.rows[0]?.id;
      userId = userRes.rows[0]?.id;
      console.log("Users already exist in database.");
    }

    // Seed Matches
    console.log("Checking and seeding matches...");
    const matchCheck = await client.query("SELECT COUNT(*) FROM matches");
    const matchCount = parseInt(matchCheck.rows[0].count, 10);

    if (matchCount === 0) {
      const now = new Date();

      // Match 1: Man United vs Man City (Open/Upcoming)
      const match1Time = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
      const match1Deadline = new Date(now.getTime() + 30 * 60 * 1000); // 30 mins from now
      const m1Res = await client.query(
        `INSERT INTO matches (team_home, team_away, match_time, deadline, status)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        ["Man United", "Man City", match1Time, match1Deadline, "upcoming"]
      );
      const m1Id = m1Res.rows[0].id;

      // Match 2: Real Madrid vs Barcelona (Upcoming)
      const match2Time = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
      const match2Deadline = new Date(now.getTime() + 23 * 60 * 60 * 1000); // 23 hours from now
      const m2Res = await client.query(
        `INSERT INTO matches (team_home, team_away, match_time, deadline, status)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        ["Real Madrid", "Barcelona", match2Time, match2Deadline, "upcoming"]
      );
      const m2Id = m2Res.rows[0].id;

      // Match 3: Liverpool vs Arsenal (Closed/Live - past deadline)
      const match3Time = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 hours ago
      const match3Deadline = new Date(now.getTime() - 3 * 60 * 60 * 1000); // 3 hours ago
      const m3Res = await client.query(
        `INSERT INTO matches (team_home, team_away, match_time, deadline, status)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        ["Liverpool", "Arsenal", match3Time, match3Deadline, "upcoming"] // status upcoming in DB but past deadline
      );
      const m3Id = m3Res.rows[0].id;

      // Match 4: Chelsea vs Tottenham (Resulted - past deadline and scored)
      const match4Time = new Date(now.getTime() - 5 * 60 * 60 * 1000); // 5 hours ago
      const match4Deadline = new Date(now.getTime() - 6 * 60 * 60 * 1000); // 6 hours ago
      const m4Res = await client.query(
        `INSERT INTO matches (team_home, team_away, match_time, deadline, status)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        ["Chelsea", "Tottenham", match4Time, match4Deadline, "resulted"]
      );
      const m4Id = m4Res.rows[0].id;

      console.log("Seeded matches. Inserting questions for each match...");

      const matches = [
        { id: m1Id, home: "Man United", away: "Man City" },
        { id: m2Id, home: "Real Madrid", away: "Barcelona" },
        { id: m3Id, home: "Liverpool", away: "Arsenal" },
        { id: m4Id, home: "Chelsea", away: "Tottenham" },
      ];

      for (const match of matches) {
        // Winner Question
        const qWinner = await client.query(
          `INSERT INTO questions (match_id, type, label, points) 
           VALUES ($1, $2, $3, $4) RETURNING id`,
          [match.id, "winner", "Match Winner", 2]
        );
        const qWinnerId = qWinner.rows[0].id;

        // Score Question
        const qScore = await client.query(
          `INSERT INTO questions (match_id, type, label, points) 
           VALUES ($1, $2, $3, $4) RETURNING id`,
          [match.id, "score", "Exact Scoreline", 4]
        );
        const qScoreId = qScore.rows[0].id;

        // Scorer Question
        const qScorer = await client.query(
          `INSERT INTO questions (match_id, type, label, points) 
           VALUES ($1, $2, $3, $4) RETURNING id`,
          [match.id, "scorer", "First Goalscorer", 2]
        );
        const qScorerId = qScorer.rows[0].id;

        // Seed result and prediction for Match 4 (Chelsea vs Tottenham - resulted)
        if (match.id === m4Id) {
          // Correct results: Winner = Tottenham, Score = 0 - 2, Scorer = Heung-min Son
          await client.query(
            `INSERT INTO results (match_id, question_id, correct_answer) VALUES ($1, $2, $3)`,
            [m4Id, qWinnerId, "Tottenham"]
          );
          await client.query(
            `INSERT INTO results (match_id, question_id, correct_answer) VALUES ($1, $2, $3)`,
            [m4Id, qScoreId, "0 - 2"]
          );
          await client.query(
            `INSERT INTO results (match_id, question_id, correct_answer) VALUES ($1, $2, $3)`,
            [m4Id, qScorerId, "Heung-min Son"]
          );

          if (userId) {
            // Seed a prediction for standard user: Winner = Tottenham, Score = 0 - 2, Scorer = Harry Kane (wrong scorer)
            await client.query(
              `INSERT INTO predictions (user_id, match_id, question_id, answer) VALUES ($1, $2, $3, $4)`,
              [userId, m4Id, qWinnerId, "Tottenham"]
            );
            await client.query(
              `INSERT INTO predictions (user_id, match_id, question_id, answer) VALUES ($1, $2, $3, $4)`,
              [userId, m4Id, qScoreId, "0 - 2"]
            );
            await client.query(
              `INSERT INTO predictions (user_id, match_id, question_id, answer) VALUES ($1, $2, $3, $4)`,
              [userId, m4Id, qScorerId, "Harry Kane"]
            );

            // Compute score: Winner correct (2) + Score correct (4) + Scorer wrong (0) = 6 points
            await client.query(
              `INSERT INTO scores (user_id, match_id, points) VALUES ($1, $2, $3)`,
              [userId, m4Id, 6]
            );
          }

          if (adminId) {
            // Seed perfect predictions for admin: Winner = Tottenham, Score = 0 - 2, Scorer = Heung-min Son
            await client.query(
              `INSERT INTO predictions (user_id, match_id, question_id, answer) VALUES ($1, $2, $3, $4)`,
              [adminId, m4Id, qWinnerId, "Tottenham"]
            );
            await client.query(
              `INSERT INTO predictions (user_id, match_id, question_id, answer) VALUES ($1, $2, $3, $4)`,
              [adminId, m4Id, qScoreId, "0 - 2"]
            );
            await client.query(
              `INSERT INTO predictions (user_id, match_id, question_id, answer) VALUES ($1, $2, $3, $4)`,
              [adminId, m4Id, qScorerId, "Heung-min Son"]
            );

            // Compute score: Winner correct (2) + Score correct (4) + Scorer correct (2) + Bonus (3) = 11 points
            await client.query(
              `INSERT INTO scores (user_id, match_id, points) VALUES ($1, $2, $3)`,
              [adminId, m4Id, 11]
            );
          }
        }

        // Seed a prediction for user for Match 3 (Liverpool vs Arsenal - closed, but not resulted)
        if (match.id === m3Id && userId) {
          await client.query(
            `INSERT INTO predictions (user_id, match_id, question_id, answer) VALUES ($1, $2, $3, $4)`,
            [userId, m3Id, qWinnerId, "Liverpool"]
          );
          await client.query(
            `INSERT INTO predictions (user_id, match_id, question_id, answer) VALUES ($1, $2, $3, $4)`,
            [userId, m3Id, qScoreId, "2 - 1"]
          );
          await client.query(
            `INSERT INTO predictions (user_id, match_id, question_id, answer) VALUES ($1, $2, $3, $4)`,
            [userId, m3Id, qScorerId, "Mohamed Salah"]
          );
        }
      }

      console.log("Seeded database successfully with matches, questions, and sample user predictions!");
    } else {
      console.log("Matches database table not empty, skipping seeding.");
    }
  } catch (err) {
    console.error("Migration/Seeding failed:", err);
    process.exit(1);
  } finally {
    await client.end();
    console.log("Database connection closed.");
  }
}

migrate();
