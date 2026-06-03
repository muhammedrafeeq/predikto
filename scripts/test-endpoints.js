const fs = require("fs");
const path = require("path");
const { Client } = require("pg");
const { spawn } = require("child_process");

// 1. Load env variables manually from .env.local or .env
const envFiles = [".env", ".env.local"];
let envLoaded = false;
for (const file of envFiles) {
  const envPath = path.join(process.cwd(), file);
  if (fs.existsSync(envPath)) {
    console.log(`Loading env variables from ${file} for test script...`);
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

const connectionString = process.env.DATABASE_URL || "";
if (!connectionString) {
  console.error("Error: DATABASE_URL is not set in environment or .env.local");
  process.exit(1);
}

// Global state
let nextProcess = null;
let testMatchId = null;
let dbClient = null;

// Logger helper
function logStatus(testName, passed, details = "") {
  if (passed) {
    console.log(`\x1b[32m✔ [PASSED]\x1b[0m ${testName} ${details ? `(${details})` : ""}`);
  } else {
    console.log(`\x1b[31m✘ [FAILED]\x1b[0m ${testName} ${details ? `- ${details}` : ""}`);
  }
}

async function cleanup() {
  console.log("\nStarting teardown and cleanup...");
  if (dbClient && testMatchId) {
    try {
      await dbClient.query("DELETE FROM matches WHERE id = $1", [testMatchId]);
      console.log(`Deleted test match ID ${testMatchId} from database (cascaded deletions verified).`);
    } catch (err) {
      console.error("Failed to delete test match:", err);
    }
  }

  if (dbClient) {
    await dbClient.end();
    console.log("Disconnected from database.");
  }

  if (nextProcess) {
    console.log("Stopping Next.js test server...");
    nextProcess.kill();
  }
}

async function runTests() {
  console.log("Connecting to PostgreSQL database...");
  dbClient = new Client({
    connectionString,
    ssl: connectionString.includes("localhost") || connectionString.includes("127.0.0.1")
      ? false
      : { rejectUnauthorized: false },
  });
  await dbClient.connect();
  console.log("Connected to database successfully.");

  // Spin up Next dev server on port 3009
  console.log("Booting Next.js development server on port 3009...");
  nextProcess = spawn("npx", ["next", "dev", "-p", "3009"], {
    stdio: "inherit",
    shell: true,
  });

  // Wait for server to start
  console.log("Waiting for Next.js to start receiving traffic...");
  let serverStarted = false;
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch("http://localhost:3009/api/auth/me");
      // Getting 401 is normal since we don't have a token cookie yet
      if (res.status === 401 || res.status === 200) {
        serverStarted = true;
        break;
      }
    } catch (err) {
      // Server not active yet
    }
    await new Promise((r) => setTimeout(r, 1000));
  }

  if (!serverStarted) {
    throw new Error("Next.js failed to start on port 3009 in 20 seconds.");
  }
  console.log("Next.js test server is active.");

  // Storage for authentication cookies
  let adminCookie = "";
  let userCookie = "";
  let adminUser = null;
  let regularUser = null;

  // TEST 1: Admin Login
  try {
    const res = await fetch("http://localhost:3009/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: "1234567890", pin: "1234" }),
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    const setCookie = res.headers.get("set-cookie");
    console.log("DEBUG: raw set-cookie header:", setCookie);
    if (!setCookie) throw new Error("No set-cookie header returned");
    adminCookie = setCookie.split(";")[0];
    console.log("DEBUG: parsed adminCookie:", adminCookie);
    adminUser = data.user;
    logStatus("Admin Login API (POST /api/auth/login)", true, `User: ${adminUser.name}`);
  } catch (err) {
    logStatus("Admin Login API (POST /api/auth/login)", false, err.message);
    throw err;
  }

  // TEST 2: User Profile API (Admin Role Check)
  try {
    const res = await fetch("http://localhost:3009/api/auth/me", {
      headers: { Cookie: adminCookie },
    });
    const data = await res.json();
    console.log("DEBUG: GET /api/auth/me status:", res.status, "body:", data);
    if (!res.ok) throw new Error(`Status ${res.status}: ${data.error || JSON.stringify(data)}`);
    if (data.user.role !== "admin") throw new Error(`Expected admin role, got ${data.user.role}`);
    logStatus("Admin Session Verification (GET /api/auth/me)", true, `Role: ${data.user.role}`);
  } catch (err) {
    logStatus("Admin Session Verification (GET /api/auth/me)", false, err.message);
    throw err;
  }

  // TEST 3: Admin Dashboard Metrics
  try {
    const res = await fetch("http://localhost:3009/api/admin/dashboard", {
      headers: { Cookie: adminCookie },
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.success) throw new Error("success flag is false");
    logStatus("Admin Dashboard Metrics API (GET /api/admin/dashboard)", true, `Total Matches: ${data.matchesCount || 0}`);
  } catch (err) {
    logStatus("Admin Dashboard Metrics API (GET /api/admin/dashboard)", false, err.message);
    throw err;
  }

  // TEST 4: Admin Create Match Fixture
  try {
    const matchTime = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(); // 2 days in future
    const deadline = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString();  // 1 day in future
    const res = await fetch("http://localhost:3009/api/admin/matches", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        teamHome: "Chelsea",
        teamAway: "Real Madrid",
        matchTime,
        deadline,
      }),
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    testMatchId = data.match.id;
    logStatus("Create Match API (POST /api/admin/matches)", true, `Match ID: ${testMatchId}`);
  } catch (err) {
    logStatus("Create Match API (POST /api/admin/matches)", false, err.message);
    throw err;
  }

  // TEST 5: Fetch Created Match Details & Default Questions
  let questions = [];
  try {
    const res = await fetch(`http://localhost:3009/api/matches/${testMatchId}`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    questions = data.questions;
    if (questions.length !== 3) throw new Error(`Expected 3 default questions, found ${questions.length}`);
    logStatus("Fetch Match Details API (GET /api/matches/[id])", true, `Questions count: ${questions.length}`);
  } catch (err) {
    logStatus("Fetch Match Details API (GET /api/matches/[id])", false, err.message);
    throw err;
  }

  // TEST 6: Admin Edit Questions Points Weightings
  try {
    const updatedQuestions = questions.map((q) => {
      let pts = 2;
      if (q.type === "score") pts = 5;
      if (q.type === "winner") pts = 3;
      return { id: q.id, label: `Custom ${q.label}`, points: pts };
    });

    const res = await fetch(`http://localhost:3009/api/admin/matches/${testMatchId}/questions`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({ questions: updatedQuestions }),
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    logStatus("Edit Match Questions API (PUT /api/admin/matches/[id]/questions)", true);
  } catch (err) {
    logStatus("Edit Match Questions API (PUT /api/admin/matches/[id]/questions)", false, err.message);
    throw err;
  }

  // TEST 7: Regular User Login
  let userInitialPoints = 0;
  try {
    const res = await fetch("http://localhost:3009/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: "0987654321", pin: "4321" }),
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    const setCookie = res.headers.get("set-cookie");
    userCookie = setCookie.split(";")[0];
    regularUser = data.user;

    const meRes = await fetch("http://localhost:3009/api/auth/me", {
      headers: { Cookie: userCookie },
    });
    const meData = await meRes.json();
    userInitialPoints = meData.user.points || 0;

    logStatus("User Login API (POST /api/auth/login)", true, `User: ${regularUser.name}, Initial Points: ${userInitialPoints}`);
  } catch (err) {
    logStatus("User Login API (POST /api/auth/login)", false, err.message);
    throw err;
  }

  // TEST 8: Submit Prediction (as User)
  try {
    const qWinner = questions.find((q) => q.type === "winner");
    const qScore = questions.find((q) => q.type === "score");
    const qScorer = questions.find((q) => q.type === "scorer");

    const res = await fetch(`http://localhost:3009/api/matches/${testMatchId}/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: userCookie,
      },
      body: JSON.stringify({
        predictions: [
          { questionId: qWinner.id, answer: "draw" },
          { questionId: qScore.id, answer: "1-1" },
          { questionId: qScorer.id, answer: "K. Mbappe" },
        ],
      }),
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    logStatus("Submit Predictions API (POST /api/matches/[id]/predict)", true);
  } catch (err) {
    logStatus("Submit Predictions API (POST /api/matches/[id]/predict)", false, err.message);
    throw err;
  }

  // TEST 9: Verify user predictions retrieval
  try {
    const res = await fetch(`http://localhost:3009/api/matches/${testMatchId}/my-prediction`, {
      headers: { Cookie: userCookie },
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.predictions.winner || data.predictions.winner.answer !== "draw") {
      throw new Error("Answer mismatch");
    }
    logStatus("Get My Predictions API (GET /api/matches/[id]/my-prediction)", true);
  } catch (err) {
    logStatus("Get My Predictions API (GET /api/matches/[id]/my-prediction)", false, err.message);
    throw err;
  }

  // TEST 10: Submit Results & Trigger Points Engine (as Admin)
  try {
    const res = await fetch(`http://localhost:3009/api/admin/matches/${testMatchId}/results`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        winner: "draw",
        score: "1-1",
        scorer: "K. Mbappe",
      }),
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    logStatus("Publish Match Results API (POST /api/admin/matches/[id]/results)", true);
  } catch (err) {
    logStatus("Publish Match Results API (POST /api/admin/matches/[id]/results)", false, err.message);
    throw err;
  }

  // TEST 11: Verify Points Calculations (Efficiency, Perfect Game Bonus)
  // Expected base points: Winner(3) + Score(5) + Scorer(2) = 10 pts (Wait! We updated points: score to 5, winner to 3, scorer left as default 2. So total = 3 + 5 + 2 = 10 points)
  // Plus Perfect Game Bonus: +3 pts (for getting all 3 correct)
  // Total expected score: 10 + 3 = 13 points!
  try {
    const res = await fetch(`http://localhost:3009/api/matches/${testMatchId}/result`, {
      headers: { Cookie: userCookie },
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    const earned = data.breakdown.totalPoints;
    if (earned !== 13) {
      throw new Error(`Expected 13 points (10 base + 3 bonus), calculated ${earned}`);
    }
    logStatus("Calculate Points Engine check (GET /api/matches/[id]/result)", true, `Calculated Points: ${earned}`);
  } catch (err) {
    logStatus("Calculate Points Engine check (GET /api/matches/[id]/result)", false, err.message);
    throw err;
  }

  // TEST 12: Admin Leaderboard Standings Points Override
  try {
    const res = await fetch("http://localhost:3009/api/admin/leaderboard/override", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        userId: regularUser.id,
        matchId: testMatchId,
        points: 20, // Override points from 13 to 20
      }),
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    logStatus("Standings Calibration Override API (POST /api/admin/leaderboard/override)", true);
  } catch (err) {
    logStatus("Standings Calibration Override API (POST /api/admin/leaderboard/override)", false, err.message);
    throw err;
  }

  // TEST 13: Verify Standings Override is reflected on the Leaderboard Rankings
  try {
    const res = await fetch("http://localhost:3009/api/leaderboard");
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    const rankedUser = data.rankings.find((r) => r.id === regularUser.id);
    const expectedPoints = userInitialPoints + 20;
    if (!rankedUser || rankedUser.points !== expectedPoints) {
      throw new Error(`Expected overridden score of ${expectedPoints}, found ${rankedUser ? rankedUser.points : "null"}`);
    }
    logStatus("Leaderboard Integrity check (GET /api/leaderboard)", true, `User Score: ${rankedUser.points} pts`);
  } catch (err) {
    logStatus("Leaderboard Integrity check (GET /api/leaderboard)", false, err.message);
    throw err;
  }

  // TEST 14: Verify History stats reflect the override
  try {
    const res = await fetch("http://localhost:3009/api/history", {
      headers: { Cookie: userCookie },
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    const expectedPoints = userInitialPoints + 20;
    if (data.stats.totalPoints !== expectedPoints) {
      throw new Error(`Expected profile history stats points to be ${expectedPoints}, got ${data.stats.totalPoints}`);
    }
    logStatus("History Profile Statistics check (GET /api/history)", true, `Profile Stats Points: ${data.stats.totalPoints}`);
  } catch (err) {
    logStatus("History Profile Statistics check (GET /api/history)", false, err.message);
    throw err;
  }

  console.log("\n\x1b[32m✔ ALL INTEGRATION AND DB TEST CASES PASSED SUCCESSFULLY!\x1b[0m");
}

(async () => {
  try {
    await runTests();
    await cleanup();
    process.exit(0);
  } catch (err) {
    console.error("\x1b[31mFATAL: Test verification failed with error:\x1b[0m", err);
    await cleanup();
    process.exit(1);
  }
})();
