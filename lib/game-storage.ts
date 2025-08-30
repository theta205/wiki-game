interface GameStats {
  gamesPlayed: number
  gamesWon: number
  currentStreak: number
  maxStreak: number
  lastPlayedDate: string
  sentenceDistribution: number[] // Index represents sentences needed to win
}

interface DailyGameState {
  date: string
  completed: boolean
  won: boolean
  sentencesRevealed: number
  guesses: string[]
}

const STORAGE_KEYS = {
  STATS: "wikiguess-stats",
  DAILY_STATE: "wikiguess-daily-state",
}

export function getGameStats(): GameStats {
  if (typeof window === "undefined") {
    return {
      gamesPlayed: 0,
      gamesWon: 0,
      currentStreak: 0,
      maxStreak: 0,
      lastPlayedDate: "",
      sentenceDistribution: [0, 0, 0, 0, 0, 0, 0, 0],
    }
  }

  const stored = localStorage.getItem(STORAGE_KEYS.STATS)
  if (!stored) {
    return {
      gamesPlayed: 0,
      gamesWon: 0,
      currentStreak: 0,
      maxStreak: 0,
      lastPlayedDate: "",
      sentenceDistribution: [0, 0, 0, 0, 0, 0, 0, 0],
    }
  }

  return JSON.parse(stored)
}

export function updateGameStats(won: boolean, sentencesRevealed: number): void {
  if (typeof window === "undefined") return

  const stats = getGameStats()
  const today = new Date().toISOString().split("T")[0]

  stats.gamesPlayed += 1
  stats.lastPlayedDate = today

  if (won) {
    stats.gamesWon += 1
    stats.currentStreak += 1
    stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak)

    // Update sentence distribution (0-indexed, so subtract 1)
    const index = Math.min(sentencesRevealed - 1, stats.sentenceDistribution.length - 1)
    stats.sentenceDistribution[index] += 1
  } else {
    stats.currentStreak = 0
  }

  localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats))
}

export function getTodayGameState(): DailyGameState | null {
  if (typeof window === "undefined") return null

  const stored = localStorage.getItem(STORAGE_KEYS.DAILY_STATE)
  if (!stored) return null

  const state = JSON.parse(stored)
  const today = new Date().toISOString().split("T")[0]

  // Return null if it's not today's game
  if (state.date !== today) return null

  return state
}

export function saveTodayGameState(state: Partial<DailyGameState>): void {
  if (typeof window === "undefined") return

  const today = new Date().toISOString().split("T")[0]
  const currentState = getTodayGameState() || {
    date: today,
    completed: false,
    won: false,
    sentencesRevealed: 1,
    guesses: [],
  }

  const updatedState = { ...currentState, ...state }
  localStorage.setItem(STORAGE_KEYS.DAILY_STATE, JSON.stringify(updatedState))
}

export function hasPlayedToday(): boolean {
  const state = getTodayGameState()
  return state?.completed || false
}
