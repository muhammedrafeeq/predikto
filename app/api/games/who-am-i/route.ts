import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/gameAuth";
import { query } from "@/lib/db";

// ─── Player pool (30 players, 6 progressive clues each) ─────────────────────
interface Player {
  name: string;
  aliases: string[]; // alternative accepted names
  clues: [string, string, string, string, string, string];
}

const PLAYERS: Player[] = [
  {
    name: "Lionel Messi",
    aliases: ["messi", "leo messi"],
    clues: [
      "I was born in a city on the banks of the Paraná River in South America.",
      "I left my home country as a child for a European club that paid for my medical treatment.",
      "I won my first Ballon d'Or before turning 23 years old.",
      "I have won La Liga more than 10 times with the same club.",
      "I finally won the FIFA World Cup in 2022 in Qatar.",
      "I wear the number 10 and play for Inter Miami in MLS.",
    ],
  },
  {
    name: "Cristiano Ronaldo",
    aliases: ["ronaldo", "cr7", "cristiano"],
    clues: [
      "I was born on an island in the Atlantic Ocean belonging to Portugal.",
      "I was sold to the Premier League at age 18 by my first professional club.",
      "I have scored more than 700 career club goals.",
      "I won the UEFA Champions League with two different clubs.",
      "I share the record for most Ballon d'Or awards alongside my biggest rival.",
      "I currently play for Al Nassr in Saudi Arabia.",
    ],
  },
  {
    name: "Pelé",
    aliases: ["pele", "edson arantes"],
    clues: [
      "I was born in a small town in the state of Minas Gerais, Brazil.",
      "I scored my first World Cup goal at the age of 17.",
      "I won three FIFA World Cup medals — a record never since equalled.",
      "I spent almost my entire club career at Santos FC in Brazil.",
      "I finished my career at New York Cosmos in the USA.",
      "I am widely considered the greatest footballer of the 20th century, nicknamed 'The King'.",
    ],
  },
  {
    name: "Zinedine Zidane",
    aliases: ["zidane", "zizou"],
    clues: [
      "I was born in Marseille, France, to Algerian immigrant parents.",
      "I was named the best player of the 1998 FIFA World Cup.",
      "My transfer fee of €77.5 million was a world record in 2001.",
      "I was sent off in my final professional match — the 2006 World Cup Final.",
      "I managed the same club I played for and won three consecutive Champions Leagues.",
      "My nickname is 'Zizou' and I am considered France's greatest ever player.",
    ],
  },
  {
    name: "Ronaldo Nazário",
    aliases: ["ronaldo", "r9", "ronaldo nazario", "il fenomeno"],
    clues: [
      "I grew up in a poor neighbourhood in Rio de Janeiro, Brazil.",
      "I won the FIFA World Player of the Year award three times.",
      "I scored both goals in the 2002 World Cup Final against Germany.",
      "I was nicknamed 'Il Fenomeno' (The Phenomenon) during my career.",
      "I played for clubs including PSV, Barcelona, Inter Milan, and Real Madrid.",
      "Knee injuries plagued my career, yet I won two World Cups with Brazil.",
    ],
  },
  {
    name: "Johan Cruyff",
    aliases: ["cruyff", "johan"],
    clues: [
      "I was born in Amsterdam and grew up near my local club's training ground.",
      "I invented the 'Cruyff Turn' during the 1974 World Cup.",
      "I won three consecutive European Cups with my club in the 1970s.",
      "I declined to play in the 1978 World Cup for personal reasons.",
      "As a manager I led my club to the European Cup with a philosophy called 'Total Football'.",
      "I am considered the greatest Dutch footballer of all time and wore the number 14.",
    ],
  },
  {
    name: "Franz Beckenbauer",
    aliases: ["beckenbauer", "der kaiser"],
    clues: [
      "I was born in Munich, Germany, in 1945.",
      "I am the only person to have won the World Cup as both captain and manager.",
      "I revolutionised the sweeper (libero) position in football.",
      "I won three consecutive European Cups with my club in the mid-1970s.",
      "I was nicknamed 'Der Kaiser' (The Emperor).",
      "I managed West Germany to the 1990 World Cup title in Italy.",
    ],
  },
  {
    name: "Ronaldinho",
    aliases: ["ronaldinho", "ronaldinho gaucho"],
    clues: [
      "I was born in Porto Alegre in the state of Rio Grande do Sul, Brazil.",
      "I won the FIFA World Cup with Brazil in 2002 but did not start the final.",
      "I scored a lob over David Seaman at Wembley during a World Cup qualifier.",
      "I won back-to-back FIFA World Player of the Year awards in 2004 and 2005.",
      "I was known for my huge smile, dazzling tricks, and elastico dribbles.",
      "I won the UEFA Champions League with Barcelona in 2006.",
    ],
  },
  {
    name: "Kylian Mbappé",
    aliases: ["mbappe", "kylian mbappe"],
    clues: [
      "I was born in a suburb of Paris, France, in December 1998.",
      "I scored in the 2018 FIFA World Cup Final, becoming only the second teenager to do so.",
      "I grew up supporting Real Madrid as a child.",
      "I spent most of my career at Paris Saint-Germain before a long-awaited move.",
      "I won the Golden Boot at the 2022 World Cup with 8 goals, yet finished on the losing side.",
      "I signed for Real Madrid in 2024 on a free transfer and wear the number 9.",
    ],
  },
  {
    name: "Thierry Henry",
    aliases: ["henry", "thierry"],
    clues: [
      "I was born in Les Ulis, a suburb of Paris, France.",
      "I was converted from a left winger into a centre-forward by my club manager.",
      "I became Arsenal's all-time leading scorer with 228 goals.",
      "I was involved in a controversial handball incident in a World Cup play-off.",
      "I won the FIFA World Cup in 1998 and Euro 2000 with France.",
      "I was nicknamed 'Va Va Voom' and am considered Arsenal's greatest ever player.",
    ],
  },
  {
    name: "Marco van Basten",
    aliases: ["van basten", "marco"],
    clues: [
      "I was born in Utrecht, Netherlands, in 1964.",
      "I scored one of the greatest goals in history — a volley from an acute angle — in the Euro 1988 Final.",
      "I won three consecutive Ballon d'Or awards from 1988 to 1992.",
      "My career was ended prematurely by a serious ankle injury aged 28.",
      "I played alongside Ruud Gullit and Frank Rijkaard at AC Milan.",
      "I am considered the greatest Dutch striker of all time.",
    ],
  },
  {
    name: "Luka Modrić",
    aliases: ["modric", "luka"],
    clues: [
      "I was born in Zadar, Croatia, and grew up during the Croatian War of Independence.",
      "I was named the best player in the world in 2018, ending a decade of Messi/Ronaldo dominance.",
      "I left Tottenham Hotspur for Real Madrid in 2012.",
      "I led Croatia to their first ever World Cup Final in 2018.",
      "I have won the UEFA Champions League five times with Real Madrid.",
      "I am known for my tireless engine, dribbling, and precise passing from central midfield.",
    ],
  },
  {
    name: "Neymar",
    aliases: ["neymar", "neymar jr"],
    clues: [
      "I was born in Mogi das Cruzes in São Paulo state, Brazil.",
      "I lit up the 2014 World Cup on home soil before suffering a back injury in the quarter-final.",
      "My transfer from Barcelona to PSG in 2017 cost a world-record €222 million.",
      "I have won the Copa Libertadores and the UEFA Champions League.",
      "I am Brazil's all-time leading scorer.",
      "I am known for my flamboyant dribbling, skill moves, and flair on the left wing.",
    ],
  },
  {
    name: "Robert Lewandowski",
    aliases: ["lewandowski", "lewy"],
    clues: [
      "I was born in Warsaw, Poland, in 1988.",
      "I scored 5 goals in 9 minutes as a substitute in a Bundesliga match in 2015.",
      "I scored 41 Bundesliga goals in a single season, breaking a 49-year-old record.",
      "I left Bayern Munich after 8 seasons to join a Spanish club.",
      "I finally won the Ballon d'Or in 2023 after being denied in 2020 when the award was cancelled.",
      "I am Poland's all-time leading scorer and play as a clinical central striker.",
    ],
  },
  {
    name: "Erling Haaland",
    aliases: ["haaland", "erling"],
    clues: [
      "I was born in Leeds, England, to a Norwegian father who also played professional football.",
      "I scored in the FIFA World Youth Championship Final in 2019.",
      "I scored 36 Premier League goals in my debut season — a new record.",
      "I scored a hat-trick in my first Champions League game.",
      "I joined Manchester City from Borussia Dortmund in 2022.",
      "I am known for my extraordinary pace, power, and prolific goal-scoring as a centre-forward.",
    ],
  },
  {
    name: "Gianluigi Buffon",
    aliases: ["buffon", "gigi buffon"],
    clues: [
      "I was born in Carrara, Italy, in 1978.",
      "I won the FIFA World Cup with Italy in 2006 as their first-choice goalkeeper.",
      "I spent 17 seasons at Juventus, winning 10 Serie A titles.",
      "I was considered the world's best goalkeeper for over a decade.",
      "I played in the Champions League Final at age 39 with Juventus.",
      "I am Italy's most-capped player of all time.",
    ],
  },
  {
    name: "Andrés Iniesta",
    aliases: ["iniesta", "andres"],
    clues: [
      "I was born in Fuentealbilla, a small village in Castilla-La Mancha, Spain.",
      "I joined Barcelona's La Masia academy at age 12.",
      "I scored the winning goal in the 2010 FIFA World Cup Final in extra time.",
      "I won Euro 2008, the 2010 World Cup, and Euro 2012 with Spain.",
      "I spent my entire European career at Barcelona, winning 9 La Liga titles.",
      "I moved to Vissel Kobe in Japan in 2018.",
    ],
  },
  {
    name: "Xavi Hernández",
    aliases: ["xavi", "xavi hernandez"],
    clues: [
      "I was born in Terrassa, near Barcelona, and joined La Masia as a child.",
      "I was central to the Spanish national team's era of dominance (2008–2012).",
      "I won the FIFA Club World Cup twice with Barcelona.",
      "I am considered one of the greatest midfielders of all time for my passing and vision.",
      "I finished my playing career at Al Sadd in Qatar.",
      "I returned to manage Barcelona in 2021.",
    ],
  },
  {
    name: "Virgil van Dijk",
    aliases: ["van dijk", "virgil"],
    clues: [
      "I was born in Breda, Netherlands, and began my career in Dutch football.",
      "My transfer to Liverpool in January 2018 cost £75 million — a record for a defender.",
      "I was runner-up for the Ballon d'Or in 2019, the highest ever for a defender.",
      "I played a crucial role as Liverpool won the Champions League in 2018–19.",
      "I am known for my commanding aerial ability, pace, and calm on the ball.",
      "I captain the Netherlands national team.",
    ],
  },
  {
    name: "Didier Drogba",
    aliases: ["drogba", "didier"],
    clues: [
      "I was born in Abidjan, Ivory Coast, and moved to France as a young child.",
      "I am the first African player to score in multiple Champions League finals.",
      "I scored the equaliser and then converted the winning penalty in the 2012 Champions League Final.",
      "I won the Premier League four times and the FA Cup four times with Chelsea.",
      "I used my fame to help negotiate a ceasefire in the Ivorian civil war.",
      "I am Ivory Coast's all-time leading scorer.",
    ],
  },
  {
    name: "Wayne Rooney",
    aliases: ["rooney", "wayne"],
    clues: [
      "I was born in Croxteth, Liverpool, and grew up supporting Everton.",
      "I became the youngest player to score in the Premier League at age 16.",
      "I am Manchester United's all-time leading scorer.",
      "I scored a bicycle kick that was voted the Premier League's greatest ever goal.",
      "I am England's all-time leading scorer with 53 international goals.",
      "I later managed Derby County and DC United.",
    ],
  },
  {
    name: "Sadio Mané",
    aliases: ["mane", "sadio"],
    clues: [
      "I was born in Sédhiou, a rural area of Senegal.",
      "I left home as a teenager to pursue my dream against my family's wishes.",
      "I scored the fastest hat-trick in Premier League history for Southampton.",
      "I won the CAF African Player of the Year award three times.",
      "I won the Champions League and the Premier League with Liverpool.",
      "I joined Bayern Munich in 2022 and won the Bundesliga in my debut season.",
    ],
  },
  {
    name: "Kevin De Bruyne",
    aliases: ["de bruyne", "kevin"],
    clues: [
      "I was born in Drongen, Belgium, in 1991.",
      "I failed to break into Chelsea's first team and was sold to Wolfsburg.",
      "I set a Premier League record with 20 assists in the 2019–20 season.",
      "I have been named PFA Players' Player of the Year twice.",
      "I won six Premier League titles with Manchester City under Pep Guardiola.",
      "I am widely considered the best playmaker in the world, capable of playing multiple midfield roles.",
    ],
  },
  {
    name: "Karim Benzema",
    aliases: ["benzema", "karim"],
    clues: [
      "I was born in Lyon, France, to parents of Algerian descent.",
      "I won the Ballon d'Or in 2022 after a remarkable Champions League campaign.",
      "I was excluded from the French national team for eight years due to a personal dispute.",
      "I won the UEFA Champions League five times with Real Madrid.",
      "I became Real Madrid's second all-time leading scorer behind Cristiano Ronaldo.",
      "I joined Al Ittihad in Saudi Arabia in 2023.",
    ],
  },
  {
    name: "Harry Kane",
    aliases: ["kane", "harry"],
    clues: [
      "I was born in Walthamstow, London, and had loan spells before breaking through.",
      "I was the top scorer at the 2018 FIFA World Cup with 6 goals.",
      "I surpassed Wayne Rooney to become England's all-time leading scorer.",
      "I spent my entire Premier League career at Tottenham Hotspur without winning a trophy.",
      "I moved to Bayern Munich in 2023 for a British transfer record fee.",
      "I am known for my movement, clinical finishing, and creative link-up play.",
    ],
  },
  {
    name: "Luis Suárez",
    aliases: ["suarez", "luis"],
    clues: [
      "I was born in Salto, Uruguay, in 1987.",
      "I was banned for biting an opponent on three separate occasions in my career.",
      "I won the Premier League Golden Boot in 2013–14 with 31 goals — a joint record.",
      "I formed the MSN attacking trio at Barcelona alongside Messi and Neymar.",
      "I was controversially sent off for a deliberate handball in the 2010 World Cup quarter-final.",
      "I am Uruguay's all-time leading scorer.",
    ],
  },
  {
    name: "Gareth Bale",
    aliases: ["bale", "gareth"],
    clues: [
      "I was born in Cardiff, Wales, and began my career as a left-back.",
      "My transfer to Real Madrid in 2013 broke the world record at €100 million.",
      "I scored a famous bicycle kick in the 2018 Champions League Final.",
      "I won the Champions League four times with Real Madrid.",
      "I helped Wales reach Euro 2016, their first major tournament since 1958.",
      "I retired from football in January 2023 after returning to the MLS.",
    ],
  },
  {
    name: "Paul Pogba",
    aliases: ["pogba", "paul"],
    clues: [
      "I was born in Lagny-sur-Marne, France, to Guinean parents.",
      "I left Manchester United as a youth player and joined Juventus, where I flourished.",
      "My return to Manchester United in 2016 cost a then world-record £89 million.",
      "I won the FIFA World Cup with France in 2018, scoring in the final.",
      "I won four consecutive Serie A titles with Juventus.",
      "I am known for my physical power, long-range shooting, and creative passing from deep midfield.",
    ],
  },
  {
    name: "Sergio Agüero",
    aliases: ["aguero", "kun aguero", "kun"],
    clues: [
      "I was born in Quilmes, Buenos Aires, and began my career at Independiente.",
      "I became the youngest player to play in the Argentine Primera División at 15 years and 35 days.",
      "I scored the most dramatic goal in Premier League history with seconds remaining.",
      "I scored 260 goals for Manchester City, making me their all-time leading scorer.",
      "I won five Premier League titles with Manchester City.",
      "I retired in December 2021 after being diagnosed with a cardiac condition.",
    ],
  },
  {
    name: "Eusébio",
    aliases: ["eusebio", "eusébio"],
    clues: [
      "I was born in Maputo, Mozambique (then Lourenço Marques), in 1942.",
      "I was the top scorer at the 1966 FIFA World Cup with 9 goals.",
      "I am considered Portugal's greatest ever player.",
      "I spent most of my career at Benfica, winning 11 Portuguese league titles.",
      "I was nicknamed 'The Black Panther' for my explosive pace and power.",
      "There is a famous statue of me outside Benfica's stadium, Estádio da Luz.",
    ],
  },
];

function getTodayRef(): number {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  return parseInt(`${y}${m}${d}`, 10);
}

function getTodayPlayer(): Player {
  const ref = getTodayRef();
  const index = ref % PLAYERS.length;
  return PLAYERS[index];
}

const POINTS_BY_CLUE: Record<number, number> = { 1: 15, 2: 12, 3: 9, 4: 6, 5: 3, 6: 1 };

function fuzzyMatch(guess: string, player: Player): boolean {
  const g = guess.trim().toLowerCase();
  if (!g) return false;
  const targets = [player.name.toLowerCase(), ...player.aliases.map((a) => a.toLowerCase())];
  return targets.some((t) => t === g || t.includes(g) || g.includes(t));
}

export async function GET(_req: NextRequest) {
  try {
    await requireAuth();
    const player = getTodayPlayer();
    return NextResponse.json({ played: false, clues: player.clues });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e.message ?? "Error" }, { status: e.status ?? 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const { guess, cluesRevealed } = body as { guess: string; cluesRevealed: number };

    if (typeof guess !== "string" || typeof cluesRevealed !== "number") {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const player = getTodayPlayer();
    const correct = fuzzyMatch(guess, player);
    const clueNum = Math.max(1, Math.min(6, cluesRevealed));
    const isLastClue = clueNum >= 6;

    if (correct) {
      const points = POINTS_BY_CLUE[clueNum] ?? 1;
      await query(
        `INSERT INTO game_scores (user_id, game_type, reference_id, points, metadata, played_at)
         VALUES ($1, 'who_am_i', $2, $3, $4, NOW())`,
        [user.userId, Date.now(), points, JSON.stringify({ cluesRevealed: clueNum, correct: true, guess })]
      );
      return NextResponse.json({ correct: true, points, playerName: player.name, gameOver: true });
    }

    // Wrong guess — if last clue, game over with 0 pts
    if (isLastClue) {
      await query(
        `INSERT INTO game_scores (user_id, game_type, reference_id, points, metadata, played_at)
         VALUES ($1, 'who_am_i', $2, 0, $3, NOW())`,
        [user.userId, Date.now(), JSON.stringify({ cluesRevealed: clueNum, correct: false, guess })]
      );
      return NextResponse.json({ correct: false, points: 0, playerName: player.name, gameOver: true });
    }

    // Still has more clues to reveal — don't save yet, return next clue number
    return NextResponse.json({
      correct: false,
      gameOver: false,
      nextClueNumber: clueNum + 1,
    });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e.message ?? "Error" }, { status: e.status ?? 500 });
  }
}
