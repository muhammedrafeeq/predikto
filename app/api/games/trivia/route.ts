import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/gameAuth";
import { query } from "@/lib/db";

// ─── Question bank (50 questions) ───────────────────────────────────────────
interface TriviaQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
}

const ALL_QUESTIONS: TriviaQuestion[] = [
  { id: 1, question: "Which country has won the most FIFA World Cup titles?", options: ["Germany", "Brazil", "Italy", "Argentina"], correctIndex: 1 },
  { id: 2, question: "Who scored the 'Hand of God' goal in the 1986 World Cup?", options: ["Pelé", "Ronaldo", "Diego Maradona", "Zidane"], correctIndex: 2 },
  { id: 3, question: "Which player has won the most Ballon d'Or awards?", options: ["Cristiano Ronaldo", "Zinedine Zidane", "Lionel Messi", "Ronaldo Nazário"], correctIndex: 2 },
  { id: 4, question: "Which stadium hosted the 2014 FIFA World Cup Final?", options: ["Estádio do Maracanã", "Allianz Arena", "Camp Nou", "Wembley Stadium"], correctIndex: 0 },
  { id: 5, question: "How many players are on the field per team during a standard football match?", options: ["10", "11", "12", "9"], correctIndex: 1 },
  { id: 6, question: "Which country hosted the 2022 FIFA World Cup?", options: ["Saudi Arabia", "UAE", "Qatar", "Bahrain"], correctIndex: 2 },
  { id: 7, question: "Who is the all-time top scorer in FIFA World Cup history?", options: ["Ronaldo Nazário", "Miroslav Klose", "Just Fontaine", "Gerd Müller"], correctIndex: 1 },
  { id: 8, question: "What is the maximum duration of a standard football match?", options: ["80 minutes", "90 minutes", "100 minutes", "120 minutes"], correctIndex: 1 },
  { id: 9, question: "Which club has won the most UEFA Champions League titles?", options: ["Barcelona", "AC Milan", "Real Madrid", "Bayern Munich"], correctIndex: 2 },
  { id: 10, question: "In which year was the first FIFA World Cup held?", options: ["1926", "1930", "1934", "1938"], correctIndex: 1 },
  { id: 11, question: "Which player is nicknamed 'The Egyptian King'?", options: ["Mohamed Elneny", "Mohamed Salah", "Ayman Younes", "Amr Zaki"], correctIndex: 1 },
  { id: 12, question: "What colour card is shown for a sending off?", options: ["Yellow", "Orange", "Red", "Blue"], correctIndex: 2 },
  { id: 13, question: "Which country won the first ever FIFA World Cup in 1930?", options: ["Brazil", "Argentina", "Uruguay", "Italy"], correctIndex: 2 },
  { id: 14, question: "Who won the Golden Boot at the 2018 FIFA World Cup?", options: ["Kylian Mbappé", "Cristiano Ronaldo", "Harry Kane", "Romelu Lukaku"], correctIndex: 2 },
  { id: 15, question: "Which English club is known as 'The Red Devils'?", options: ["Arsenal", "Liverpool", "Chelsea", "Manchester United"], correctIndex: 3 },
  { id: 16, question: "How many times has France won the FIFA World Cup?", options: ["1", "2", "3", "4"], correctIndex: 1 },
  { id: 17, question: "Who was the FIFA World Cup 2022 Golden Ball winner?", options: ["Kylian Mbappé", "Lionel Messi", "Luka Modrić", "Emi Martínez"], correctIndex: 1 },
  { id: 18, question: "Which club did Cristiano Ronaldo NOT play for?", options: ["Juventus", "Real Madrid", "Chelsea", "Manchester United"], correctIndex: 2 },
  { id: 19, question: "What is the length of a standard football pitch in metres (minimum FIFA)?", options: ["90m", "95m", "100m", "105m"], correctIndex: 0 },
  { id: 20, question: "Who won Euro 2020 (played in 2021)?", options: ["France", "England", "Portugal", "Italy"], correctIndex: 3 },
  { id: 21, question: "Which player has scored the most Premier League goals all time?", options: ["Wayne Rooney", "Alan Shearer", "Andrew Cole", "Frank Lampard"], correctIndex: 1 },
  { id: 22, question: "In which city is the Camp Nou stadium located?", options: ["Madrid", "Valencia", "Seville", "Barcelona"], correctIndex: 3 },
  { id: 23, question: "Which nation did Germany beat 7–1 in the 2014 World Cup semi-final?", options: ["Argentina", "Brazil", "France", "Netherlands"], correctIndex: 1 },
  { id: 24, question: "What colour are the home shirts of the Brazilian national team?", options: ["Blue", "White", "Green", "Yellow"], correctIndex: 3 },
  { id: 25, question: "Who scored the winner in the 2022 World Cup Final penalty shootout?", options: ["Gonzalo Montiel", "Lionel Messi", "Lautaro Martínez", "Ángel Di María"], correctIndex: 0 },
  { id: 26, question: "Which club is known as 'Los Blancos'?", options: ["Atletico Madrid", "Real Madrid", "Valencia", "Juventus"], correctIndex: 1 },
  { id: 27, question: "How many World Cup titles has Germany won?", options: ["2", "3", "4", "5"], correctIndex: 2 },
  { id: 28, question: "Who was the first player to win 5 Ballon d'Or awards?", options: ["Cristiano Ronaldo", "Ronaldinho", "Lionel Messi", "Zinedine Zidane"], correctIndex: 2 },
  { id: 29, question: "What trophy is awarded to the best goalkeeper at the World Cup?", options: ["Golden Glove", "Lev Yashin Award", "Golden Boot", "Fair Play Trophy"], correctIndex: 0 },
  { id: 30, question: "In what year did Pelé win his first World Cup?", options: ["1954", "1958", "1962", "1966"], correctIndex: 1 },
  { id: 31, question: "Which club did Zinedine Zidane manage and win 3 consecutive Champions Leagues with?", options: ["Juventus", "France NT", "Real Madrid", "Olympique de Marseille"], correctIndex: 2 },
  { id: 32, question: "How many goals did Just Fontaine score in the 1958 World Cup (record)?", options: ["11", "12", "13", "14"], correctIndex: 2 },
  { id: 33, question: "What is the name of the trophy awarded to the Premier League champions?", options: ["The Cup", "The Shield", "The Premier League Trophy", "The Golden Cup"], correctIndex: 2 },
  { id: 34, question: "Which African country reached the 2010 World Cup semi-finals?", options: ["Nigeria", "Cameroon", "Ghana", "Ivory Coast"], correctIndex: 2 },
  { id: 35, question: "Who invented the 'bicycle kick' (overhead kick)?", options: ["Pelé", "Ramón Unzaga", "Johan Cruyff", "Eusébio"], correctIndex: 1 },
  { id: 36, question: "Which country hosted the 1966 FIFA World Cup?", options: ["Germany", "France", "England", "Spain"], correctIndex: 2 },
  { id: 37, question: "What number did Pelé famously wear for Brazil?", options: ["9", "10", "11", "7"], correctIndex: 1 },
  { id: 38, question: "Which club has the nickname 'The Gunners'?", options: ["Chelsea", "Arsenal", "Everton", "Tottenham"], correctIndex: 1 },
  { id: 39, question: "Who is the all-time top scorer for the Spanish national team?", options: ["Raúl", "David Villa", "Fernando Torres", "Álvaro Morata"], correctIndex: 1 },
  { id: 40, question: "How many substitutes are allowed in a standard FIFA match?", options: ["3", "4", "5", "6"], correctIndex: 2 },
  { id: 41, question: "Which World Cup had the first use of VAR (Video Assistant Referee)?", options: ["2010", "2014", "2018", "2022"], correctIndex: 2 },
  { id: 42, question: "Who won the 2021 Copa América?", options: ["Brazil", "Colombia", "Argentina", "Uruguay"], correctIndex: 2 },
  { id: 43, question: "What is the diameter of a standard football goal in metres (width)?", options: ["6.4m", "7.32m", "8m", "7m"], correctIndex: 1 },
  { id: 44, question: "Which player is nicknamed 'El Fideo' (The Noodle)?", options: ["Ángel Di María", "Gonzalo Higuaín", "Sergio Agüero", "Pablo Aimar"], correctIndex: 0 },
  { id: 45, question: "What year did Liverpool last win the First Division / Premier League before 2020?", options: ["1988", "1990", "1992", "1995"], correctIndex: 1 },
  { id: 46, question: "Which World Cup saw the introduction of the penalty shootout?", options: ["1970", "1974", "1978", "1982"], correctIndex: 1 },
  { id: 47, question: "Who scored the famous 'Scorpion kick' save in 1995?", options: ["Peter Schmeichel", "David Seaman", "René Higuita", "Jorge Campos"], correctIndex: 2 },
  { id: 48, question: "Which club has won the most La Liga titles?", options: ["Barcelona", "Real Madrid", "Atletico Madrid", "Valencia"], correctIndex: 1 },
  { id: 49, question: "In football, what does 'hat-trick' mean?", options: ["3 assists in a game", "3 goals by one player in a game", "3 yellow cards", "3 saves"], correctIndex: 1 },
  { id: 50, question: "Which player scored 17 goals in a single Premier League season (2017–18) for Mohamed Salah's record?", options: ["16 goals", "32 goals", "28 goals", "36 goals"], correctIndex: 1 },
];

// Deterministic shuffle using date seed (so everyone gets the same 10 questions per day)
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const copy = [...arr];
  let s = seed;
  for (let i = copy.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function getTodayRef(): number {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  return parseInt(`${y}${m}${d}`, 10);
}

function getTodayQuestions(): TriviaQuestion[] {
  const ref = getTodayRef();
  return seededShuffle(ALL_QUESTIONS, ref).slice(0, 10);
}

export async function GET(_req: NextRequest) {
  try {
    await requireAuth();
    const questions = getTodayQuestions().map(({ id, question, options }) => ({ id, question, options }));
    return NextResponse.json({ played: false, questions });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e.message ?? "Error" }, { status: e.status ?? 500 });
  }
}

interface AnswerInput {
  questionId: number;
  answerIndex: number;
  timeSpent: number; // seconds
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const answers: AnswerInput[] = body.answers;

    if (!Array.isArray(answers) || answers.length !== 10) {
      return NextResponse.json({ error: "Must provide exactly 10 answers" }, { status: 400 });
    }

    const todayQs = getTodayQuestions();
    const qMap = new Map(todayQs.map((q) => [q.id, q]));

    let totalPoints = 0;
    let correct = 0;

    const results = answers.map((ans) => {
      const q = qMap.get(ans.questionId);
      if (!q) return { correct: false, correctIndex: -1, points: 0 };

      const isCorrect = ans.answerIndex === q.correctIndex;
      let pts = 0;
      if (isCorrect) {
        if (ans.timeSpent < 10) pts = 3;
        else if (ans.timeSpent < 20) pts = 2;
        else pts = 1;
      }
      totalPoints += pts;
      if (isCorrect) correct++;
      return { correct: isCorrect, correctIndex: q.correctIndex, points: pts };
    });

    await query(
      `INSERT INTO game_scores (user_id, game_type, reference_id, points, metadata, played_at)
       VALUES ($1, 'trivia', $2, $3, $4, NOW())`,
      [user.userId, Date.now(), totalPoints, JSON.stringify({ correct, answers })]
    );

    return NextResponse.json({ results, totalPoints, correct });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e.message ?? "Error" }, { status: e.status ?? 500 });
  }
}
