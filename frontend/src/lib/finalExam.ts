export interface ExamQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

export const PASS_THRESHOLD_PCT = 70;

export const FINAL_EXAM_QUESTIONS: ExamQuestion[] = [
  {
    question: "A candlestick with a long lower wick and small body suggests:",
    options: [
      "Price fell sharply then recovered before the close",
      "The asset stopped trading",
      "Volume was zero for the period",
    ],
    correctIndex: 0,
  },
  {
    question: "Once resistance is broken, it often becomes:",
    options: ["New support", "Permanently irrelevant", "A stop-loss order"],
    correctIndex: 0,
  },
  {
    question: "Position sizing exists mainly to:",
    options: [
      "Limit how much any single trade can hurt the account",
      "Guarantee a profitable trade",
      "Increase leverage automatically",
    ],
    correctIndex: 0,
  },
  {
    question: "An RSI reading of 82 is typically read as:",
    options: ["Overbought", "Oversold", "A buy signal with certainty"],
    correctIndex: 0,
  },
  {
    question: "MACD crossing above its signal line is generally read as:",
    options: ["Bullish momentum building", "A guaranteed reversal", "A volatility measure only"],
    correctIndex: 0,
  },
  {
    question: "Narrow Bollinger Bands usually indicate:",
    options: ["Low current volatility", "The market is closed", "Maximum historical volatility"],
    correctIndex: 0,
  },
  {
    question: "Fibonacci retracement levels are mainly used to spot:",
    options: [
      "Potential support/resistance during a pullback",
      "A company's exact earnings date",
      "Guaranteed reversal points",
    ],
    correctIndex: 0,
  },
  {
    question: "Which trading style typically holds positions for days to weeks?",
    options: ["Swing trading", "Scalping", "High-frequency trading"],
    correctIndex: 0,
  },
  {
    question: "In Smart Money Concepts, a 'liquidity pool' refers to:",
    options: [
      "A cluster of resting orders (like stop-losses) that can attract price",
      "A pool of staked cryptocurrency",
      "A type of moving average",
    ],
    correctIndex: 0,
  },
  {
    question: "In the Wyckoff Method, 'accumulation' describes:",
    options: [
      "Large players quietly buying before a markup",
      "A bearish candlestick pattern",
      "An order to close all positions",
    ],
    correctIndex: 0,
  },
];
