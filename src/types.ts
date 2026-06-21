export interface UserProfile {
  id: string;
  name: string;
  email: string;
  mobile?: string;
  country: string;
  isPaid: boolean;
  points: number;
  accuracy: number; // percentage
  predictionsCompleted: number;
  badge: "Bronze Predictor" | "Silver Predictor" | "Gold Predictor" | "Platinum Predictor" | "World Champion";
  rank: number;
  referralCode: string;
  referredCount: number;
  dailyCheckInChain: number;
  lastCheckIn?: string;
  picture?: string;
  googleVerified?: boolean;
  authMethod?: string;
  role?: string;
}

export interface Match {
  id: string;
  teamA: string;
  teamB: string;
  flagA: string;
  flagB: string;
  status: "upcoming" | "live" | "completed";
  scoreA: number;
  scoreB: number;
  startTime: string;
  nptTime?: string;
  group: string;
  timeline: MatchEvent[];
  possessionA: number; // e.g., 55 for 55%
  locked: boolean;
  highlightsUrl?: string;
  customWinnerQuestion?: string;
  is_hidden?: boolean;
}

export interface MatchEvent {
  id: string;
  time: number; // minute
  type: "goal" | "card" | "substitution" | "var" | "corner" | "kickoff" | "fulltime";
  team?: "A" | "B";
  detail: string;
}

export interface Prediction {
  matchId: string;
  userId: string;
  predictedWinner: "A" | "B" | "draw" | "";
  predictedScoreA: number;
  predictedScoreB: number;
  firstGoalTeam: "A" | "B" | "none" | "";
  firstGoalScorer: string;
  totalGoals: number;
  possession: number; // predicted team A possession %
  manOfTheMatch: string;
  status: "pending" | "processed";
  pointsGranted: number;
  winnerCorrect?: boolean;
  scoreCorrect?: boolean;
}

export interface LiveQuestion {
  id: string;
  matchId: string;
  text: string;
  options: string[];
  points: number;
  expiresAt: string;
  status: "active" | "completed" | "canceled";
  correctAnswer?: string;
}

export interface DishHomeQuestion {
  id: string;
  text: string;
  options: string[];
  points: number;
  deadline: string;
  correctAnswer?: string;
}

export interface LeaderboardEntry {
  userId: string;
  name: string;
  country: string;
  points: number;
  accuracy: number;
  badge: string;
  rank: number;
}

export interface Team {
  name: string;
  flag: string;
  group: string;
  fifaRanking: number;
  coach: string;
  squad: string[];
  stats: { played: number; won: number; drawn: number; lost: number; goalsFor: number; goalsAgainst: number };
  previousWC: string;
  perfHistory: number[];
}

export interface ChatMessage {
  id: string;
  userName: string;
  country: string;
  message: string;
  timestamp: string;
  sticker?: string;
  reactions: Record<string, number>;
}
