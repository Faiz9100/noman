export type UserRole = "admin" | "superadmin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export type PlayerRole = "Batsman" | "Bowler" | "All-Rounder" | "Wicket-Keeper";
export type PlayerStatus = "Available" | "Sold" | "Unsold";

export interface PlayerStats {
  matches?: number;
  runs?: number;
  wickets?: number;
  average?: number;
  strikeRate?: number;
  economy?: number;
}

export interface Player {
  _id: string;
  name: string;
  role: PlayerRole;
  country: string;
  age?: number;
  battingStyle?: string;
  bowlingStyle?: string;
  basePrice: number;
  photoUrl?: string;
  status: PlayerStatus;
  soldPrice?: number;
  team?: Pick<Team, "_id" | "name" | "shortName">;
  stats?: PlayerStats;
}

export interface Team {
  _id: string;
  name: string;
  shortName: string;
  logoUrl?: string;
  color?: string;
  owner: string;
  purseTotal: number;
  purseRemaining: number;
  maxPlayers: number;
  players: Player[];
  gradient?: string;
  glow?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  count?: number;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface AuctionHistoryEntry {
  _id: string;
  auction: string;
  player: Pick<Player, "_id" | "name" | "role" | "country" | "photoUrl">;
  team?: Pick<Team, "_id" | "name" | "shortName"> | null;
  status: "Sold" | "Unsold";
  price?: number;
  round: number;
  soldAt: string; // ISO timestamp
}

// --- Real-time auction engine -------------------------------------------

export type AuctionStatus = "draft" | "live" | "paused" | "completed" | "closed";
export type TimerStatus = "idle" | "running" | "paused" | "expired";

export interface TimerSnapshot {
  total: number;
  remaining: number;
  status: TimerStatus;
}

export type LotPlayer = Pick<Player, "_id" | "name" | "role" | "country" | "basePrice" | "status" | "stats" | "photoUrl">;
export type LotTeam = Pick<Team, "_id" | "name" | "shortName" | "purseRemaining">;

export interface Auction {
  _id: string;
  name: string;
  season?: string;
  status: AuctionStatus;
  rounds: number;
  currentRound: number;
  bidTimerSeconds: number;
  bidIncrements: number[];
  currentPlayer?: LotPlayer | null;
  currentBid: number;
  leadingTeam?: LotTeam | null;
  biddingOpen: boolean;
  startedAt?: string;
  endedAt?: string;
  timer: TimerSnapshot;
}

export interface EngineBid {
  _id: string;
  auction: string;
  player: Pick<Player, "_id" | "name" | "role">;
  team: Pick<Team, "_id" | "name" | "shortName">;
  amount: number;
  round: number;
  createdAt: string;
}

export interface LotClosedPayload {
  result: "sold" | "unsold";
  player: LotPlayer;
  team?: LotTeam;
  price?: number;
}

export interface CsvImportResult {
  createdCount: number;
  totalRows: number;
  errors: { row: number; message: string }[];
}

export interface SocketAck<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface DashboardStats {
  totalPlayers: number;
  playersSold: number;
  playersUnsold: number;
  remainingPlayers: number;
  highestBid: {
    amount: number;
    player: Pick<Player, "_id" | "name">;
    team: Pick<Team, "_id" | "name" | "shortName">;
  } | null;
  averageBid: number;
  auctionProgressPct: number;
  richestTeam: Pick<Team, "_id" | "name" | "shortName" | "purseRemaining"> | null;
  lowestBudgetTeam: Pick<Team, "_id" | "name" | "shortName" | "purseRemaining"> | null;
  upcomingPlayer: Player | null;
  recentPurchases: AuctionHistoryEntry[];
}
