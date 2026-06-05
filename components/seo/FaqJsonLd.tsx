export default function FaqJsonLd() {
  const faqs = [
    {
      question: "What is Skorio?",
      answer: "Skorio is a free FIFA World Cup 2026 sports prediction game where you predict match scores, winners, and man of the match to earn points and compete on the global leaderboard."
    },
    {
      question: "How do I earn points on Skorio?",
      answer: "Earn 2 points for predicting the correct match winner or draw, 2 points for the correct man of the match, 4 points for the exact scoreline, and a 3-point bonus for getting all three correct."
    },
    {
      question: "Is Skorio free to play?",
      answer: "Yes, Skorio is completely free to play. Sign up, predict FIFA World Cup 2026 matches, and compete with friends."
    },
    {
      question: "What games are available on Skorio?",
      answer: "Skorio offers match score predictions, formation predictor, first goal timer, bracket predictor, penalty challenge, sports trivia quiz, and who am I football quiz."
    },
    {
      question: "Can I create my own contest on Skorio?",
      answer: "Yes, you can create private prediction contests and invite friends to compete in your own sports prediction league."
    },
    {
      question: "What is the formation predictor on Skorio?",
      answer: "The formation predictor lets you pick your ideal starting XI and formation for World Cup 2026 matches before they kick off."
    },
    {
      question: "What is the first goal timer game?",
      answer: "The first goal timer game lets you predict the exact minute the first goal will be scored in a World Cup 2026 match."
    },
    {
      question: "How does the bracket predictor work?",
      answer: "The bracket predictor lets you predict the entire FIFA World Cup 2026 knockout stage bracket — from round of 16 all the way to the final."
    },
  ];

  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map((faq) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
