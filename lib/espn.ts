import { query } from "@/lib/db";

export interface EspnMatch {
  id: string;
  espnId?: string;
  status: "live" | "upcoming" | "finished";
  statusDetail: string;
  matchTime: string;
  teamHome: string;
  teamHomeLogo: string;
  teamHomeCode: string;
  scoreHome: number;
  teamAway: string;
  teamAwayLogo: string;
  teamAwayCode: string;
  scoreAway: number;
  league: string;
  round: string;
}

export interface MatchStat {
  label: string;
  homeValue: string;
  awayValue: string;
}

export interface NewsArticle {
  headline: string;
  description: string;
  link?: string;
  image?: string;
}

export interface H2hMatch {
  date: string;
  homeTeam: string;
  awayTeam: string;
  score: string;
}

export interface EspnEventDetail {
  match: EspnMatch;
  venue?: string;
  stats: MatchStat[];
  keyEvents: Array<{
    id: string;
    text: string;
    type: string;
    clock: string;
    period: number;
    teamId?: string;
  }>;
  commentary: Array<{
    text: string;
    clock: string;
  }>;
  rosters: Array<{
    teamName: string;
    teamLogo: string;
    players: Array<{
      id: string;
      name: string;
      jersey?: string;
      position?: string;
      starter?: boolean;
    }>;
  }>;
  news: NewsArticle[];
  h2h: H2hMatch[];
}

const LEAGUE_ENDPOINTS = [
  { slug: "all", name: "All Matches", url: "https://site.api.espn.com/apis/site/v2/sports/soccer/all/scoreboard" },
  { slug: "eng.1", name: "Premier League", url: "https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard" },
  { slug: "esp.1", name: "La Liga", url: "https://site.api.espn.com/apis/site/v2/sports/soccer/esp.1/scoreboard" },
  { slug: "usa.1", name: "MLS", url: "https://site.api.espn.com/apis/site/v2/sports/soccer/usa.1/scoreboard" },
  { slug: "uefa.champions", name: "UEFA Champions League", url: "https://site.api.espn.com/apis/site/v2/sports/soccer/uefa.champions/scoreboard" },
  { slug: "ger.1", name: "Bundesliga", url: "https://site.api.espn.com/apis/site/v2/sports/soccer/ger.1/scoreboard" },
  { slug: "ita.1", name: "Serie A", url: "https://site.api.espn.com/apis/site/v2/sports/soccer/ita.1/scoreboard" },
  { slug: "fra.1", name: "Ligue 1", url: "https://site.api.espn.com/apis/site/v2/sports/soccer/fra.1/scoreboard" },
];

let cacheData: { matches: EspnMatch[]; timestamp: number } | null = null;
const CACHE_TTL_MS = 10000; // 10 seconds live refresh

export async function fetchLiveMatches(): Promise<EspnMatch[]> {
  const now = Date.now();
  if (cacheData && now - cacheData.timestamp < CACHE_TTL_MS) {
    return cacheData.matches;
  }

  try {
    const responses = await Promise.allSettled(
      LEAGUE_ENDPOINTS.map(async (l) => {
        const res = await fetch(l.url, { next: { revalidate: 10 } });
        if (!res.ok) return null;
        const data = await res.json();
        const leagueName = data.leagues?.[0]?.name || l.name;
        return { data, defaultLeague: leagueName };
      })
    );

    const matchesMap = new Map<string, EspnMatch>();

    for (const r of responses) {
      if (r.status !== "fulfilled" || !r.value) continue;
      const { data, defaultLeague } = r.value;
      const events = data.events || [];

      for (const e of events) {
        if (!e || matchesMap.has(String(e.id))) continue;

        const c = e.competitions?.[0];
        if (!c || !c.competitors || c.competitors.length < 2) continue;

        const homeComp = c.competitors.find((x: any) => x.homeAway === "home") || c.competitors[0];
        const awayComp = c.competitors.find((x: any) => x.homeAway === "away") || c.competitors[1];

        const state = c.status?.type?.state;
        const status: "live" | "upcoming" | "finished" =
          state === "in" ? "live" : state === "post" ? "finished" : "upcoming";

        const statusDetail = c.status?.type?.shortDetail || (status === "finished" ? "FT" : "VS");

        const parsedMatch: EspnMatch = {
          id: String(e.id),
          espnId: String(e.id),
          status,
          statusDetail,
          matchTime: e.date,
          teamHome: homeComp.team?.displayName || homeComp.team?.name || "Home Team",
          teamHomeLogo: homeComp.team?.logo || "/icon-192.png",
          teamHomeCode: homeComp.team?.abbreviation || homeComp.team?.displayName?.slice(0, 3).toUpperCase() || "HOM",
          scoreHome: parseInt(homeComp.score ?? "0", 10),
          teamAway: awayComp.team?.displayName || awayComp.team?.name || "Away Team",
          teamAwayLogo: awayComp.team?.logo || "/icon-192.png",
          teamAwayCode: awayComp.team?.abbreviation || awayComp.team?.displayName?.slice(0, 3).toUpperCase() || "AWY",
          scoreAway: parseInt(awayComp.score ?? "0", 10),
          league: defaultLeague,
          round: defaultLeague,
        };

        matchesMap.set(parsedMatch.id, parsedMatch);
      }
    }

    const matches = Array.from(matchesMap.values()).sort((a, b) => {
      const statusScore = (s: string) => (s === "live" ? 0 : s === "upcoming" ? 1 : 2);
      if (statusScore(a.status) !== statusScore(b.status)) {
        return statusScore(a.status) - statusScore(b.status);
      }
      return new Date(a.matchTime).getTime() - new Date(b.matchTime).getTime();
    });

    // Background sync to PostgreSQL database
    syncMatchesToDb(matches).catch(() => {});

    cacheData = { matches, timestamp: now };
    return matches;
  } catch (error) {
    console.error("ESPN Live Matches fetch error, falling back to DB:", error);
    return getMatchesFromDb();
  }
}

async function syncMatchesToDb(matches: EspnMatch[]): Promise<void> {
  if (!matches || matches.length === 0) return;

  try {
    const espnIds = matches.map((m) => m.id);
    const existingRes = await query(
      `SELECT espn_id, score_home, score_away, status, status_detail FROM matches WHERE espn_id = ANY($1)`,
      [espnIds]
    );

    const existingMap = new Map<string, { score_home: number; score_away: number; status: string; status_detail: string }>();
    for (const r of existingRes.rows) {
      existingMap.set(r.espn_id, {
        score_home: r.score_home,
        score_away: r.score_away,
        status: r.status,
        status_detail: r.status_detail,
      });
    }

    // Only update matches that are NEW or have changed scores/status
    const toUpdate = matches.filter((m) => {
      const dbMatch = existingMap.get(m.id);
      if (!dbMatch) return true; // New match
      return (
        dbMatch.score_home !== m.scoreHome ||
        dbMatch.score_away !== m.scoreAway ||
        dbMatch.status !== m.status ||
        dbMatch.status_detail !== m.statusDetail
      );
    });

    if (toUpdate.length === 0) return; // 0 DB queries needed if unchanged!

    for (const m of toUpdate) {
      try {
        const deadline = new Date(new Date(m.matchTime).getTime() - 60 * 60 * 1000);
        await query(
          `INSERT INTO matches (espn_id, team_home, team_away, team_home_logo, team_away_logo, score_home, score_away, match_time, deadline, status, status_detail, league, round, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
           ON CONFLICT (espn_id) DO UPDATE SET
             team_home_logo = EXCLUDED.team_home_logo,
             team_away_logo = EXCLUDED.team_away_logo,
             score_home = EXCLUDED.score_home,
             score_away = EXCLUDED.score_away,
             status = EXCLUDED.status,
             status_detail = EXCLUDED.status_detail,
             match_time = EXCLUDED.match_time,
             updated_at = NOW()`,
          [
            m.id,
            m.teamHome,
            m.teamAway,
            m.teamHomeLogo,
            m.teamAwayLogo,
            m.scoreHome,
            m.scoreAway,
            m.matchTime,
            deadline,
            m.status,
            m.statusDetail,
            m.league,
            m.round,
          ]
        );
      } catch {}
    }
  } catch {}
}

async function getMatchesFromDb(): Promise<EspnMatch[]> {
  try {
    const res = await query(
      `SELECT espn_id, team_home, team_away, team_home_logo, team_away_logo, score_home, score_away, match_time, status, status_detail, league
       FROM matches
       WHERE espn_id IS NOT NULL
       ORDER BY match_time ASC`
    );
    return res.rows.map((r: any) => ({
      id: r.espn_id,
      espnId: r.espn_id,
      status: r.status,
      statusDetail: r.status_detail || (r.status === "finished" ? "FT" : "VS"),
      matchTime: r.match_time,
      teamHome: r.team_home,
      teamHomeLogo: r.team_home_logo || "/icon-192.png",
      teamHomeCode: r.team_home.slice(0, 3).toUpperCase(),
      scoreHome: r.score_home ?? 0,
      teamAway: r.team_away,
      teamAwayLogo: r.team_away_logo || "/icon-192.png",
      teamAwayCode: r.team_away.slice(0, 3).toUpperCase(),
      scoreAway: r.score_away ?? 0,
      league: r.league || "Football",
      round: r.league || "Football",
    }));
  } catch {
    return [];
  }
}

async function fetchSoccerNews(): Promise<NewsArticle[]> {
  try {
    const res = await fetch("https://site.api.espn.com/apis/site/v2/sports/soccer/all/news", {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.articles || []).map((a: any) => ({
      headline: a.headline || "Football News",
      description: a.description || a.story || "",
      link: a.links?.web?.href,
      image: a.images?.[0]?.url,
    }));
  } catch {
    return [];
  }
}

export async function fetchEspnMatchDetail(matchId: string): Promise<EspnEventDetail | null> {
  let espnEventId = matchId;

  // If matchId is a numerical database ID, look up its espn_id
  if (!matchId.includes("-") && !isNaN(Number(matchId))) {
    try {
      const dbMatch = await query(`SELECT espn_id, details_json FROM matches WHERE id = $1 OR espn_id = $2`, [
        parseInt(matchId, 10),
        matchId,
      ]);
      if (dbMatch.rows[0]?.espn_id) {
        espnEventId = dbMatch.rows[0].espn_id;
      }
    } catch {}
  }

  try {
    const [summaryRes, globalNews] = await Promise.all([
      fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/all/summary?event=${espnEventId}`, {
        next: { revalidate: 10 },
      }),
      fetchSoccerNews(),
    ]);

    if (!summaryRes.ok) {
      return getDetailFromDb(espnEventId);
    }
    const data = await summaryRes.json();

    const headerComp = data.header?.competitions?.[0];
    if (!headerComp) return getDetailFromDb(espnEventId);

    const homeComp = headerComp.competitors?.find((x: any) => x.homeAway === "home") || headerComp.competitors?.[0];
    const awayComp = headerComp.competitors?.find((x: any) => x.homeAway === "away") || headerComp.competitors?.[1];

    const state = headerComp.status?.type?.state;
    const status: "live" | "upcoming" | "finished" =
      state === "in" ? "live" : state === "post" ? "finished" : "upcoming";

    const statusDetail = headerComp.status?.type?.shortDetail || (status === "finished" ? "FT" : "VS");

    const match: EspnMatch = {
      id: String(espnEventId),
      espnId: String(espnEventId),
      status,
      statusDetail,
      matchTime: headerComp.date || new Date().toISOString(),
      teamHome: homeComp?.team?.displayName || "Home Team",
      teamHomeLogo: homeComp?.team?.logo || "/icon-192.png",
      teamHomeCode: homeComp?.team?.abbreviation || "HOM",
      scoreHome: parseInt(homeComp?.score ?? "0", 10),
      teamAway: awayComp?.team?.displayName || "Away Team",
      teamAwayLogo: awayComp?.team?.logo || "/icon-192.png",
      teamAwayCode: awayComp?.team?.abbreviation || "AWY",
      scoreAway: parseInt(awayComp?.score ?? "0", 10),
      league: data.header?.league?.name || "Live Football",
      round: data.header?.league?.name || "Match",
    };

    const venue = data.gameInfo?.venue?.fullName;

    const homeStats = Array.isArray(data.boxscore?.teams?.[0]?.statistics) ? data.boxscore.teams[0].statistics : [];
    const awayStats = Array.isArray(data.boxscore?.teams?.[1]?.statistics) ? data.boxscore.teams[1].statistics : [];
    const stats: MatchStat[] = homeStats.map((hs: any) => {
      const as = awayStats.find((x: any) => x.name === hs.name);
      return {
        label: hs.label || hs.name,
        homeValue: String(hs.displayValue ?? "0"),
        awayValue: String(as?.displayValue ?? "0"),
      };
    });

    const rawKeyEvents = Array.isArray(data.keyEvents) ? data.keyEvents : [];
    const keyEvents = rawKeyEvents.map((e: any) => ({
      id: String(e.id || Math.random()),
      text: e.text || e.type?.text || "Event",
      type: e.type?.type || "event",
      clock: e.clock?.displayValue || (e.period?.number ? `P${e.period.number}` : ""),
      period: e.period?.number || 1,
      teamId: e.team?.id,
    }));

    const rawCommentary = Array.isArray(data.commentary) ? data.commentary : [];
    const commentary = rawCommentary.map((c: any) => ({
      text: c.text || "",
      clock: c.clock?.displayValue || "",
    }));

    const rawRosters = Array.isArray(data.rosters) ? data.rosters : [];
    const rosters = rawRosters.map((r: any) => ({
      teamName: r.team?.displayName || "",
      teamLogo: r.team?.logo || "",
      players: (Array.isArray(r.roster) ? r.roster : []).map((a: any) => ({
        id: String(a.athlete?.id || Math.random()),
        name: a.athlete?.displayName || a.athlete?.fullName || "Player",
        jersey: a.jersey,
        position: a.position?.displayName || a.position?.abbreviation,
        starter: a.starter ?? true,
      })),
    }));

    const rawNews = Array.isArray(data.news)
      ? data.news
      : Array.isArray(data.news?.articles)
      ? data.news.articles
      : Array.isArray(data.articles)
      ? data.articles
      : [];

    const matchNews: NewsArticle[] = rawNews.map((n: any) => ({
      headline: n.headline || "Match Update",
      description: n.description || n.story || "",
      link: n.links?.web?.href,
      image: n.images?.[0]?.url,
    }));
    const news = matchNews.length > 0 ? matchNews : globalNews;

    const rawH2h = Array.isArray(data.headToHeadGames) ? data.headToHeadGames : [];
    const h2h: H2hMatch[] = rawH2h.map((g: any) => {
      const home = g.competitions?.[0]?.competitors?.[0];
      const away = g.competitions?.[0]?.competitors?.[1];
      return {
        date: g.date ? new Date(g.date).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }) : "",
        homeTeam: home?.team?.displayName || "Home",
        awayTeam: away?.team?.displayName || "Away",
        score: `${home?.score ?? 0} - ${away?.score ?? 0}`,
      };
    });

    const resultDetail: EspnEventDetail = { match, venue, stats, keyEvents, commentary, rosters, news, h2h };

    // Persist details_json into PostgreSQL
    saveDetailToDb(espnEventId, resultDetail).catch(() => {});

    return resultDetail;
  } catch (error) {
    console.error(`ESPN Detail fetch error for match ${espnEventId}:`, error);
    return getDetailFromDb(espnEventId);
  }
}

async function saveDetailToDb(espnId: string, detail: EspnEventDetail): Promise<void> {
  try {
    await query(
      `UPDATE matches
       SET details_json = $1,
           score_home = $2,
           score_away = $3,
           status = $4,
           status_detail = $5,
           updated_at = NOW()
       WHERE espn_id = $6`,
      [JSON.stringify(detail), detail.match.scoreHome, detail.match.scoreAway, detail.match.status, detail.match.statusDetail, espnId]
    );
  } catch {}
}

async function getDetailFromDb(espnId: string): Promise<EspnEventDetail | null> {
  try {
    const res = await query(`SELECT details_json FROM matches WHERE espn_id = $1 OR id::text = $2`, [espnId, espnId]);
    if (res.rows[0]?.details_json && Object.keys(res.rows[0].details_json).length > 0) {
      return res.rows[0].details_json as EspnEventDetail;
    }
  } catch {}
  return null;
}
