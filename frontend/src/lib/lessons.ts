export type LessonCategory = "Fundamentals" | "Indicators" | "Strategies";

export interface BookResource {
  title: string;
  author: string;
}

export interface VideoResource {
  title: string;
  searchQuery: string;
}

export interface Lesson {
  id: string;
  title: string;
  level: "beginner" | "intermediate" | "advanced";
  category: LessonCategory;
  body: string;
  resources: {
    books: BookResource[];
    videos: VideoResource[];
  };
  quiz: {
    question: string;
    options: string[];
    correctIndex: number;
  };
}

export const CATEGORIES: LessonCategory[] = ["Fundamentals", "Indicators", "Strategies"];

// Search-based links (Google Books / YouTube search), not specific page/video
// URLs — guarantees every link resolves to real, relevant results instead of
// risking a dead link to a guessed ISBN or video ID.
export function bookSearchUrl(book: BookResource): string {
  const q = encodeURIComponent(`${book.title} ${book.author}`);
  return `https://www.google.com/search?tbm=bks&q=${q}`;
}

export function videoSearchUrl(video: VideoResource): string {
  const q = encodeURIComponent(video.searchQuery);
  return `https://www.youtube.com/results?search_query=${q}`;
}

export const LESSONS: Lesson[] = [
  {
    id: "candlesticks",
    title: "Reading Candlesticks",
    level: "beginner",
    category: "Fundamentals",
    body: "A candlestick summarizes price action for one time period: it opens at one price and closes at another, with a body spanning the two. Wicks above and below the body mark the high and low reached during that period. A green (or hollow) body means the close was higher than the open; a red (or filled) body means the close was lower.",
    resources: {
      books: [{ title: "Japanese Candlestick Charting Techniques", author: "Steve Nison" }],
      videos: [{ title: "Candlestick patterns explained", searchQuery: "candlestick chart patterns explained for beginners" }],
    },
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
    category: "Fundamentals",
    body: "Support is a price area where falling prices have tended to stop and bounce, because buyers step in. Resistance is the opposite — a price area where rising prices have tended to stall, because sellers step in. Once broken, old resistance often becomes new support, and vice versa.",
    resources: {
      books: [{ title: "Technical Analysis of the Financial Markets", author: "John J. Murphy" }],
      videos: [{ title: "Support and resistance explained", searchQuery: "support and resistance trading explained" }],
    },
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
    category: "Fundamentals",
    body: "Risk management is about controlling how much any single trade can hurt you — through position sizing (only risking a small % of capital per trade), stop-losses (capping downside automatically), and diversification (not concentrating in one asset). Professional traders focus as much on managing losses as picking winners.",
    resources: {
      books: [{ title: "Trading in the Zone", author: "Mark Douglas" }],
      videos: [{ title: "Risk management for traders", searchQuery: "trading risk management position sizing explained" }],
    },
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
    category: "Indicators",
    body: "RSI measures the speed and size of recent price moves on a 0-100 scale. Readings below 30 are often read as 'oversold' (a potential bounce); above 70 as 'overbought' (a potential pullback). It's a momentum gauge, not a certainty — strong trends can stay overbought or oversold for a long time.",
    resources: {
      books: [{ title: "New Concepts in Technical Trading Systems", author: "J. Welles Wilder" }],
      videos: [{ title: "RSI indicator explained", searchQuery: "RSI relative strength index indicator explained" }],
    },
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
    category: "Indicators",
    body: "MACD compares a fast EMA (12-period) to a slow EMA (26-period) to gauge momentum, plotted against a signal line (9-period EMA of the MACD line). When MACD crosses above its signal line, that's often read as bullish momentum building; crossing below, bearish.",
    resources: {
      books: [{ title: "Technical Analysis of the Financial Markets", author: "John J. Murphy" }],
      videos: [{ title: "MACD indicator explained", searchQuery: "MACD indicator tutorial explained" }],
    },
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
    category: "Indicators",
    body: "Bollinger Bands plot a moving average with upper/lower bands a set number of standard deviations away. Bands widen when volatility rises and narrow when it falls. Price pressing the upper band suggests it's relatively 'stretched' versus its recent range; the lower band, the opposite.",
    resources: {
      books: [{ title: "Bollinger on Bollinger Bands", author: "John Bollinger" }],
      videos: [{ title: "Bollinger Bands explained", searchQuery: "Bollinger Bands indicator explained" }],
    },
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
    id: "fibonacci",
    title: "Fibonacci Retracement",
    level: "intermediate",
    category: "Indicators",
    body: "Fibonacci retracement levels (23.6%, 38.2%, 50%, 61.8%) mark potential support/resistance zones during a pullback within a larger trend, based on a mathematical sequence found throughout nature. Traders watch these levels for signs a pullback is ending and the prior trend may resume.",
    resources: {
      books: [{ title: "Fibonacci Analysis", author: "Constance Brown" }],
      videos: [{ title: "Fibonacci retracement explained", searchQuery: "Fibonacci retracement trading explained" }],
    },
    quiz: {
      question: "Fibonacci retracement levels are most commonly used to identify:",
      options: [
        "Potential support/resistance during a pullback",
        "The exact moment a trend will reverse",
        "A company's earnings growth rate",
      ],
      correctIndex: 0,
    },
  },
  {
    id: "strategy-styles",
    title: "Trading Styles: Scalping to Position Trading",
    level: "advanced",
    category: "Strategies",
    body: "Trading styles differ mainly by holding period: scalping (seconds to minutes, many small trades), day trading (positions closed same day), swing trading (days to weeks, riding a trend), and position trading (weeks to months, focused on the big picture). Each demands different risk tolerance, time commitment, and indicator choices.",
    resources: {
      books: [{ title: "Trading for a Living", author: "Alexander Elder" }],
      videos: [{ title: "Trading styles compared", searchQuery: "scalping vs day trading vs swing trading explained" }],
    },
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
    category: "Strategies",
    body: "Smart Money Concepts and ICT (Inner Circle Trader) methodology focus on how large institutional players may move price — looking at liquidity pools (clusters of stop-losses), order blocks (areas of past institutional activity), and market structure shifts, rather than traditional indicators alone.",
    resources: {
      books: [{ title: "Trading Price Action Trends", author: "Al Brooks" }],
      videos: [{ title: "Smart Money Concepts explained", searchQuery: "smart money concepts ICT trading explained" }],
    },
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
  {
    id: "elliott-wave",
    title: "Elliott Wave Theory (Intro)",
    level: "advanced",
    category: "Strategies",
    body: "Elliott Wave Theory proposes that markets move in repeating cycles of 5 waves in the direction of the trend, followed by 3 corrective waves against it, reflecting crowd psychology swinging between optimism and pessimism. It's highly subjective to apply, but many traders use it as one lens among several.",
    resources: {
      books: [{ title: "Elliott Wave Principle: Key to Market Behavior", author: "A.J. Frost and Robert Prechter" }],
      videos: [{ title: "Elliott Wave Theory explained", searchQuery: "Elliott Wave theory trading explained for beginners" }],
    },
    quiz: {
      question: "In classic Elliott Wave Theory, a trending move typically unfolds in:",
      options: ["5 waves", "3 waves", "10 waves"],
      correctIndex: 0,
    },
  },
  {
    id: "wyckoff",
    title: "The Wyckoff Method (Intro)",
    level: "advanced",
    category: "Strategies",
    body: "The Wyckoff Method looks at price and volume together to infer whether large ('composite') operators are accumulating (quietly buying before a markup) or distributing (quietly selling before a markdown). Ranges before big moves are often read through this accumulation/distribution lens.",
    resources: {
      books: [{ title: "Charting the Stock Market: The Wyckoff Method", author: "Jack K. Hutson" }],
      videos: [{ title: "Wyckoff Method explained", searchQuery: "Wyckoff method accumulation distribution explained" }],
    },
    quiz: {
      question: "In Wyckoff terms, 'accumulation' refers to:",
      options: [
        "Large players quietly buying before a price markup",
        "A candlestick pattern",
        "A type of stop-loss order",
      ],
      correctIndex: 0,
    },
  },
];
