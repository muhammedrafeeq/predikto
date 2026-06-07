import { query } from "./db";
import { dropMultipleCards, PlayerCardData } from "./cardDrop";

export interface DailyLoginResult {
  currentStreak: number;
  longestStreak: number;
  alreadyLoggedIn: boolean;
  droppedCards: PlayerCardData[];
}

/**
 * Checks the login status for a user today and records a login if not already done.
 * Updates the streak count and drops the cards if it is a new login today.
 */
export async function recordDailyLogin(userId: number): Promise<DailyLoginResult> {
  // 1. Get database server dates (today and yesterday) to stay consistent with PG server time
  const datesRes = await query<{ today: string; yesterday: string }>(
    `SELECT CURRENT_DATE::text as today, (CURRENT_DATE - INTERVAL '1 day')::date::text as yesterday`
  );
  const { today, yesterday } = datesRes.rows[0];

  // 2. Fetch the user's login streak
  const streakRes = await query<{
    current_streak: number;
    longest_streak: number;
    last_login_date: string | null;
  }>(
    `SELECT current_streak, longest_streak, last_login_date::text 
     FROM daily_login_streaks 
     WHERE user_id = $1`,
    [userId]
  );

  // If no entry exists, create one and reward them
  if (streakRes.rows.length === 0) {
    await query(
      `INSERT INTO daily_login_streaks (user_id, current_streak, longest_streak, last_login_date)
       VALUES ($1, 1, 1, CURRENT_DATE)`,
      [userId]
    );

    // Reward: 2 normal drops
    const droppedCards = await dropMultipleCards(userId, "daily_login", 2);

    return {
      currentStreak: 1,
      longestStreak: 1,
      alreadyLoggedIn: false,
      droppedCards,
    };
  }

  const { current_streak, longest_streak, last_login_date } = streakRes.rows[0];

  // If already logged in today, do not award again
  if (last_login_date === today) {
    return {
      currentStreak: current_streak,
      longestStreak: longest_streak,
      alreadyLoggedIn: true,
      droppedCards: [],
    };
  }

  let newStreak = 1;
  let newLongest = longest_streak;

  if (last_login_date === yesterday) {
    // Continued streak
    newStreak = current_streak + 1;
    newLongest = Math.max(longest_streak, newStreak);

    await query(
      `UPDATE daily_login_streaks 
       SET current_streak = $1, longest_streak = $2, last_login_date = CURRENT_DATE 
       WHERE user_id = $3`,
      [newStreak, newLongest, userId]
    );
  } else {
    // Streak broken (last login was before yesterday)
    await query(
      `UPDATE daily_login_streaks 
       SET current_streak = 1, last_login_date = CURRENT_DATE 
       WHERE user_id = $1`,
      [userId]
    );
    newStreak = 1;
  }

  // Determine rewards
  let droppedCards: PlayerCardData[] = [];
  if (newStreak % 7 === 0) {
    // Day 7 streak reward: 1 guaranteed Rare+ card and 1 normal drop
    // Pass day7Index = 0 so the first drop gets the Rare+ boost
    droppedCards = await dropMultipleCards(userId, "daily_login", 2, undefined, 0);
  } else {
    // Normal reward: 2 normal drops
    droppedCards = await dropMultipleCards(userId, "daily_login", 2);
  }

  return {
    currentStreak: newStreak,
    longestStreak: newLongest,
    alreadyLoggedIn: false,
    droppedCards,
  };
}

/**
 * Get the current daily login streak information for a user.
 */
export async function getStreakInfo(userId: number) {
  const datesRes = await query<{ today: string }>(
    `SELECT CURRENT_DATE::text as today`
  );
  const { today } = datesRes.rows[0];

  const streakRes = await query<{
    current_streak: number;
    longest_streak: number;
    last_login_date: string | null;
  }>(
    `SELECT current_streak, longest_streak, last_login_date::text 
     FROM daily_login_streaks 
     WHERE user_id = $1`,
    [userId]
  );

  if (streakRes.rows.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      alreadyLoggedIn: false,
    };
  }

  const { current_streak, longest_streak, last_login_date } = streakRes.rows[0];

  return {
    currentStreak: current_streak,
    longestStreak: longest_streak,
    alreadyLoggedIn: last_login_date === today,
  };
}
