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
    body: "A candlestick summarises price action for one period: it opens at one price and closes at another, with a body spanning the two. Wicks mark the high and low. Green body = close above open (bullish). Red body = close below open (bearish). Patterns like Doji, Hammer, Engulfing, and Shooting Star are the foundation of all price-action reading.",
    resources: {
      books: [
        { title: "The Candlestick Bible", author: "Geno Auriemma" },
        { title: "Japanese Candlestick Charting Techniques", author: "Steve Nison" },
      ],
      videos: [{ title: "Candlestick patterns explained", searchQuery: "candlestick chart patterns explained for beginners" }],
    },
    quiz: {
      question: "What does a long lower wick with a small body at the top usually suggest?",
      options: [
        "Price fell sharply then recovered before the close (Hammer — potential reversal)",
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
    body: "Support is a price zone where buyers have historically stepped in, causing price to bounce. Resistance is the opposite — where sellers dominate. Once broken, old resistance often becomes new support (role reversal). Drawing horizontal lines at swing highs and lows is the simplest way to identify these levels.",
    resources: {
      books: [
        { title: "Technical Analysis of the Financial Markets", author: "John J. Murphy" },
        { title: "Price Action Trading Course", author: "Johnathon Fox" },
      ],
      videos: [{ title: "Support and resistance explained", searchQuery: "support and resistance trading explained" }],
    },
    quiz: {
      question: "What often happens to a resistance level once price breaks through it?",
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
    body: "Risk management is about controlling losses before thinking about profits. Core rules: never risk more than 1-2% of capital per trade; always set a stop-loss before entering; size your position so the stop-loss determines the dollar risk, not the other way around. A trader who loses 50% needs a 100% gain just to break even.",
    resources: {
      books: [
        { title: "Trading in the Zone", author: "Mark Douglas" },
        { title: "The Disciplined Trader", author: "Mark Douglas" },
      ],
      videos: [{ title: "Risk management for traders", searchQuery: "trading risk management position sizing explained" }],
    },
    quiz: {
      question: "Why do professional traders emphasise position sizing?",
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
    body: "RSI measures momentum on a 0-100 scale. Below 30 is traditionally 'oversold' (potential bounce); above 70 is 'overbought' (potential pullback). However, in strong trends RSI can remain extreme for a long time. More useful signals include RSI divergence — when price makes a new high but RSI does not, signalling weakening momentum.",
    resources: {
      books: [
        { title: "New Concepts in Technical Trading Systems", author: "J. Welles Wilder" },
        { title: "Technical Analysis of the Financial Markets", author: "John J. Murphy" },
      ],
      videos: [{ title: "RSI indicator explained", searchQuery: "RSI relative strength index indicator divergence explained" }],
    },
    quiz: {
      question: "Price makes a new high but RSI makes a lower high. This is called:",
      options: ["Bearish RSI divergence — a warning of weakening momentum", "A buy signal", "A support level"],
      correctIndex: 0,
    },
  },
  {
    id: "macd",
    title: "MACD & Moving Averages",
    level: "intermediate",
    category: "Indicators",
    body: "MACD (Moving Average Convergence Divergence) subtracts the 26-period EMA from the 12-period EMA to measure momentum. When MACD crosses above its signal line (9-period EMA of MACD), that signals bullish momentum. The histogram shows the distance between the two lines — growing bars mean accelerating momentum.",
    resources: {
      books: [
        { title: "Technical Analysis of the Financial Markets", author: "John J. Murphy" },
        { title: "Come Into My Trading Room", author: "Alexander Elder" },
      ],
      videos: [{ title: "MACD indicator explained", searchQuery: "MACD indicator tutorial explained beginner" }],
    },
    quiz: {
      question: "A MACD line crossing above its signal line is typically read as:",
      options: ["Bullish momentum building", "Bearish momentum", "No signal at all"],
      correctIndex: 0,
    },
  },
  {
    id: "bollinger",
    title: "Bollinger Bands & Volatility",
    level: "intermediate",
    category: "Indicators",
    body: "Bollinger Bands surround price with a moving average ± 2 standard deviations. When the bands squeeze tight, volatility is low and a big move is often coming (but direction is unknown). When price tags the upper band it is stretched relative to recent history — not a sell signal alone, but context for caution.",
    resources: {
      books: [
        { title: "Bollinger on Bollinger Bands", author: "John Bollinger" },
      ],
      videos: [{ title: "Bollinger Bands explained", searchQuery: "Bollinger Bands squeeze breakout explained" }],
    },
    quiz: {
      question: "What does a Bollinger Band squeeze indicate?",
      options: [
        "Low volatility — a large move may be approaching",
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
    body: "Fibonacci retracement levels (23.6%, 38.2%, 50%, 61.8%, 78.6%) mark likely zones where a pullback within a trend may find support or resistance before the trend resumes. Draw from the swing low to the swing high in an uptrend. The 61.8% (golden ratio) level is the most watched by institutional players.",
    resources: {
      books: [
        { title: "Fibonacci Analysis", author: "Constance Brown" },
        { title: "Price Action Trading Course", author: "Johnathon Fox" },
      ],
      videos: [{ title: "Fibonacci retracement explained", searchQuery: "Fibonacci retracement how to use trading" }],
    },
    quiz: {
      question: "Which Fibonacci level is called the 'golden ratio' and is most watched by institutional traders?",
      options: ["61.8%", "38.2%", "23.6%"],
      correctIndex: 0,
    },
  },
  {
    id: "strategy-styles",
    title: "Trading Styles: Scalping to Position",
    level: "advanced",
    category: "Strategies",
    body: "Your timeframe determines everything. Scalping (seconds–minutes) requires the tightest spreads and fastest execution. Day trading (same-day closure) avoids overnight risk. Swing trading (days–weeks) catches the body of a trend. Position trading (weeks–months) is the most patient — fewest signals, highest reward-per-trade potential.",
    resources: {
      books: [
        { title: "Trading for a Living", author: "Alexander Elder" },
        { title: "The Candlestick Bible", author: "Geno Auriemma" },
      ],
      videos: [{ title: "Trading styles compared", searchQuery: "scalping vs day trading vs swing trading explained" }],
    },
    quiz: {
      question: "Which trading style typically holds positions for days to weeks?",
      options: ["Swing trading", "Scalping", "Position trading"],
      correctIndex: 0,
    },
  },
  {
    id: "smart-money",
    title: "Smart Money Concepts & ICT",
    level: "advanced",
    category: "Strategies",
    body: "Smart Money Concepts (SMC) and Inner Circle Trader (ICT) methodology focus on institutional order flow. Key concepts: Order Blocks (candles before a big move — institutions left orders there), Fair Value Gaps (imbalances price returns to fill), Liquidity sweeps (stop hunts above/below swing highs-lows before reversing), and Market Structure (breaks of structure as trend confirmation).",
    resources: {
      books: [
        { title: "Trading Price Action Trends", author: "Al Brooks" },
        { title: "Price Action Trading Course", author: "Johnathon Fox" },
      ],
      videos: [{ title: "Smart Money Concepts explained", searchQuery: "smart money concepts ICT order blocks fair value gap" }],
    },
    quiz: {
      question: "What is an 'Order Block' in Smart Money Concepts?",
      options: [
        "The last opposing candle before a large directional move — where institutions placed orders",
        "A literal block on an exchange order book",
        "A type of candlestick pattern",
      ],
      correctIndex: 0,
    },
  },
  {
    id: "elliott-wave",
    title: "Elliott Wave Theory",
    level: "advanced",
    category: "Strategies",
    body: "Elliott Wave Theory proposes markets move in 5-wave impulse sequences (waves 1-5 in trend direction) followed by 3-wave corrections (waves A-B-C). Wave 3 is always the strongest and longest. Wave 4 never overlaps wave 1 in a valid impulse. Subjectivity is the main criticism — two analysts can count the same chart differently.",
    resources: {
      books: [
        { title: "Elliott Wave Principle: Key to Market Behavior", author: "A.J. Frost and Robert Prechter" },
        { title: "Mastering Elliott Wave", author: "Glenn Neely" },
      ],
      videos: [{ title: "Elliott Wave Theory explained", searchQuery: "Elliott Wave theory complete guide trading" }],
    },
    quiz: {
      question: "In a valid Elliott impulse wave, which rule must always hold?",
      options: [
        "Wave 4 cannot overlap the price territory of Wave 1",
        "Wave 2 must be the shortest wave",
        "Wave 5 is always the longest",
      ],
      correctIndex: 0,
    },
  },
  {
    id: "wyckoff",
    title: "The Wyckoff Method",
    level: "advanced",
    category: "Strategies",
    body: "The Wyckoff Method analyses the battle between supply and demand using price and volume. Accumulation phases (large operators quietly buying) show decreasing volume on down-swings and increasing volume on up-swings inside a range. Distribution is the reverse. The Spring (false breakdown at support) and the Upthrust (false breakout at resistance) are the highest-probability entries.",
    resources: {
      books: [
        { title: "Charting the Stock Market: The Wyckoff Method", author: "Jack K. Hutson" },
        { title: "The Wyckoff Methodology in Depth", author: "Rubén Villahermosa" },
      ],
      videos: [{ title: "Wyckoff Method explained", searchQuery: "Wyckoff method accumulation spring upthrust trading" }],
    },
    quiz: {
      question: "In Wyckoff analysis, a 'Spring' refers to:",
      options: [
        "A false break below support that signals accumulation is complete",
        "A bullish candlestick pattern",
        "A sudden increase in trading volume",
      ],
      correctIndex: 0,
    },
  },
];
