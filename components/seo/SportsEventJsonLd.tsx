interface Props {
  homeTeam: string;
  awayTeam: string;
  matchTime: string;
  matchId: string;
}

export default function SportsEventJsonLd({ homeTeam, awayTeam, matchTime, matchId }: Props) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    "name": `${homeTeam} vs ${awayTeam} — FIFA World Cup 2026`,
    "startDate": matchTime,
    "sport": "Football",
    "url": `https://www.skorio.in/matches/${matchId}/result`,
    "organizer": {
      "@type": "Organization",
      "name": "FIFA",
      "url": "https://www.fifa.com",
    },
    "competitor": [
      { "@type": "SportsTeam", "name": homeTeam },
      { "@type": "SportsTeam", "name": awayTeam },
    ],
    "description": `Predict the ${homeTeam} vs ${awayTeam} FIFA World Cup 2026 match score on Skorio.`,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
