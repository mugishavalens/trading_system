export interface Lesson {
  id: string;
  title: string;
  level: "beginner" | "intermediate" | "advanced";
  body: string;
  quiz: {
    question: string;
    options: string[];
    correctIndex: number;
  };
}

export const LESSONS: Lesson[] = [
  {
    id: "candlesticks",
    title: "Reading Candlesticks",
    level: "beginner",
    body: "A candlestick summarizes price action for one time period: it opens at one price and closes at another, with a body spanning the two. Wicks above and below the body mark the high and low reached during that period. A green (or hollow) body means the close was higher than the open; a red (or filled) body means the close was lower.",
    quiz: {
      question: "What does a long lower wick with a small body usually suggest?",
      options: [
        "Price fell sharply then recovered before the close",
        "Price never moved during the period",
        "The asset is halted",
      ],
      correctIndex: 0,
    },
  },
  {
    id: "support-resistance",
    title: "Support & Resistance",
    level: "beginner",
    body: "Support is a price area where falling prices have tended to stop and bounce, because buyers step in. Resistance is the opposite — a price area where rising prices have tended to stall, because sellers step in. Once broken, old resistance often becomes new support, and vice versa.",
    quiz: {
      question: "What often happens to resistance once price breaks through it?",
      options: [
        "It becomes new support",
        "It disappears from the chart entirely",
        "It always becomes the all-time high",
      ],
      correctIndex: 0,
    },
  },
  {
    id: "risk-management",
    title: "Risk Management Basics",
    level: "beginner",
    body: "Risk management is about controlling how much any single trade can hurt you — through position sizing (only risking a small % of capital per trade), stop-losses (capping downside automatically), and diversification (not concentrating in one asset). Professional traders focus as much on managing losses as picking winners.",
    quiz: {
      question: "Why do professional traders emphasize position sizing?",
      options: [
        "So no single trade can seriously damage the account",
        "So they can guarantee a profit every time",
        "It has no real effect on outcomes",
      ],
      correctIndex: 0,
    },
  },
  {
    id: "rsi",
    title: "RSI (Relative Strength Index)",
    level: "intermediate",
    body: "RSI measures the speed and size of recent price moves on a 0-100 scale. Readings below 30 are often read as 'oversold' (a potential bounce); above 70 as 'overbought' (a potential pullback). It's a momentum gauge, not a certainty — strong trends can stay overbought or oversold for a long time.",
    quiz: {
      question: "An RSI reading of 85 is typically read as:",
      options: ["Overbought", "Oversold", "Neutral"],
      correctIndex: 0,
    },
  },
  {
    id: "macd",
    title: "MACD & Moving Averages",
    level: "intermediate",
    body: "MACD compares a fast EMA (12-period) to a slow EMA (26-period) to gauge momentum, plotted against a signal line (9-period EMA of the MACD line). When MACD crosses above its signal line, that's often read as bullish momentum building; crossing below, bearish.",
    quiz: {
      question: "A MACD line crossing above its signal line is typically read as:",
      options: ["Bullish momentum", "Bearish momentum", "No signal at all"],
      correctIndex: 0,
    },
  },
  {
    id: "bollinger",
    title: "Bollinger Bands & Volatility",
    level: "intermediate",
    body: "Bollinger Bands plot a moving average with upper/lower bands a set number of standard deviations away. Bands widen when volatility rises and narrow when it falls. Price pressing the upper band suggests it's relatively 'stretched' versus its recent range; the lower band, the opposite.",
    quiz: {
      question: "What does it mean when Bollinger Bands are very narrow?",
      options: [
        "Volatility is currently low",
        "The asset is halted from trading",
        "Volatility is at its highest ever",
      ],
      correctIndex: 0,
    },
  },
  {
    id: "strategy-styles",
    title: "Trading Styles: Scalping to Position Trading",
    level: "advanced",
    body: "Trading styles differ mainly by holding period: scalping (seconds to minutes, many small trades), day trading (positions closed same day), swing trading (days to weeks, riding a trend), and position trading (weeks to months, focused on the big picture). Each demands different risk tolerance, time commitment, and indicator choices.",
    quiz: {
      question: "Which style typically holds positions for days to weeks?",
      options: ["Swing trading", "Scalping", "Position trading"],
      correctIndex: 0,
    },
  },
  {
    id: "smart-money",
    title: "Smart Money Concepts & ICT (Intro)",
    level: "advanced",
    body: "Smart Money Concepts and ICT (Inner Circle Trader) methodology focus on how large institutional players may move price — looking at liquidity pools (clusters of stop-losses), order blocks (areas of past institutional activity), and market structure shifts, rather than traditional indicators alone.",
    quiz: {
      question: "What is a 'liquidity pool' in this context?",
      options: [
        "A cluster of resting orders (like stop-losses) that can attract price",
        "A literal pool of cryptocurrency",
        "A type of candlestick pattern",
      ],
      correctIndex: 0,
    },
  },
];
