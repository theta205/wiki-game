"use client"

import { useState, useEffect, useReducer } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { GameStatsModal } from "@/components/game-stats-modal"
import { ShareResults } from "@/components/share-results"
import { ConfettiEffect } from "@/components/confetti-effect"
import { hasPlayedToday, getTodayGameState, saveTodayGameState, updateGameStats } from "@/lib/game-storage"
import { Lightbulb, Trophy, ExternalLink, BarChart3, AlertCircle, Star, Target, Clock } from "lucide-react"

interface GameData {
  sentences: string[]
  articleTitle: string
  articleUrl: string
  thumbnail?: string
  category?: string
  difficulty?: string
}

interface GameState {
  gameData: GameData | null
  revealedCount: number
  guess: string
  guesses: string[]
  gameStatus: "loading" | "playing" | "won" | "lost" | "completed"
  error: string | null
}

type GameAction =
  | { type: "SET_LOADING" }
  | { type: "SET_GAME_DATA"; payload: GameData }
  | { type: "SET_ERROR"; payload: string }
  | { type: "UPDATE_GUESS"; payload: string }
  | { type: "ADD_GUESS"; payload: string }
  | { type: "REVEAL_SENTENCE" }
  | { type: "WIN_GAME" }
  | { type: "LOSE_GAME" }
  | { type: "SET_COMPLETED" }
  | { type: "RESET_GAME" }

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, gameStatus: "loading", error: null }

    case "SET_GAME_DATA":
      return {
        ...state,
        gameData: action.payload,
        gameStatus: "playing",
        revealedCount: 1,
        error: null,
      }

    case "SET_ERROR":
      return { ...state, error: action.payload, gameStatus: "loading" }

    case "UPDATE_GUESS":
      return { ...state, guess: action.payload }

    case "ADD_GUESS":
      return {
        ...state,
        guesses: [...state.guesses, action.payload],
        guess: "",
      }

    case "REVEAL_SENTENCE":
      return {
        ...state,
        revealedCount: state.revealedCount + 1,
        guess: "",
      }

    case "WIN_GAME":
      return { ...state, gameStatus: "won" }

    case "LOSE_GAME":
      return { ...state, gameStatus: "lost" }

    case "SET_COMPLETED":
      return { ...state, gameStatus: "completed" }

    case "RESET_GAME":
      return {
        ...state,
        revealedCount: 1,
        guess: "",
        guesses: [],
        gameStatus: "loading",
        error: null,
      }

    default:
      return state
  }
}

const initialState: GameState = {
  gameData: null,
  revealedCount: 1,
  guess: "",
  guesses: [],
  gameStatus: "loading",
  error: null,
}

export function WikiGuessGame() {
  const [state, dispatch] = useReducer(gameReducer, initialState)
  const [showStats, setShowStats] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    initializeGame()
  }, [])

  // Trigger confetti on win
  useEffect(() => {
    if (state.gameStatus === "won") {
      setShowConfetti(true)
    }
  }, [state.gameStatus])

  const initializeGame = async () => {
    // Check if already played today
    if (hasPlayedToday()) {
      dispatch({ type: "SET_COMPLETED" })
      return
    }

    // Check for existing game state
    const savedState = getTodayGameState()
    if (savedState && !savedState.completed) {
      // Resume existing game
      await fetchDailyArticle()
      return
    }

    // Start new game
    await fetchDailyArticle()
  }

  const fetchDailyArticle = async () => {
    dispatch({ type: "SET_LOADING" })

    try {
      const response = await fetch("/api/daily-article")
      if (!response.ok) {
        throw new Error(`Failed to fetch article: ${response.status}`)
      }

      const data = await response.json()
      dispatch({ type: "SET_GAME_DATA", payload: data })

      // Save initial state
      saveTodayGameState({
        sentencesRevealed: 1,
        guesses: [],
      })
    } catch (error) {
      console.error("Failed to fetch daily article:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to load today's challenge. Please try again." })
    }
  }

  const handleGuess = async () => {
    if (!state.guess.trim() || !state.gameData) return

    const currentGuess = state.guess.trim()
    dispatch({ type: "ADD_GUESS", payload: currentGuess })

    try {
      const response = await fetch("/api/check-guess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guess: currentGuess,
          articleTitle: state.gameData.articleTitle,
        }),
      })

      const { isCorrect } = await response.json()

      if (isCorrect) {
        dispatch({ type: "WIN_GAME" })

        // Update stats and save completion
        updateGameStats(true, state.revealedCount)
        saveTodayGameState({
          completed: true,
          won: true,
          sentencesRevealed: state.revealedCount,
          guesses: [...state.guesses, currentGuess],
        })
      } else {
        // Check if we should reveal next sentence or end game
        const nextRevealedCount = state.revealedCount + 1
        if (nextRevealedCount > state.gameData.sentences.length) {
          dispatch({ type: "LOSE_GAME" })

          // Update stats and save completion
          updateGameStats(false, state.revealedCount)
          saveTodayGameState({
            completed: true,
            won: false,
            sentencesRevealed: state.revealedCount,
            guesses: [...state.guesses, currentGuess],
          })
        } else {
          dispatch({ type: "REVEAL_SENTENCE" })

          // Save progress
          saveTodayGameState({
            sentencesRevealed: nextRevealedCount,
            guesses: [...state.guesses, currentGuess],
          })
        }
      }
    } catch (error) {
      console.error("Failed to check guess:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to check your guess. Please try again." })
    }
  }

  const handleRevealSentence = () => {
    if (!state.gameData || state.revealedCount >= state.gameData.sentences.length) return

    dispatch({ type: "REVEAL_SENTENCE" })
    saveTodayGameState({
      sentencesRevealed: state.revealedCount + 1,
      guesses: state.guesses,
    })
  }

  const resetGame = () => {
    dispatch({ type: "RESET_GAME" })
    fetchDailyArticle()
  }

  const getPerformanceMessage = () => {
    if (!state.gameData) return ""

    const percentage = (state.revealedCount / state.gameData.sentences.length) * 100

    if (state.gameStatus === "won") {
      if (percentage <= 20) return "Incredible! You're a Wikipedia wizard!"
      if (percentage <= 40) return "Excellent work! Very impressive!"
      if (percentage <= 60) return "Great job! Well done!"
      if (percentage <= 80) return "Nice work! You got it!"
      return "You did it! Better luck next time for a quicker guess!"
    }

    return "Don't worry, tomorrow brings a new challenge!"
  }

  const progressPercentage = state.gameData ? (state.revealedCount / state.gameData.sentences.length) * 100 : 0

  // Loading state
  if (state.gameStatus === "loading") {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">{state.error || "Loading today's Wikipedia challenge..."}</p>
          {state.error && (
            <Button onClick={fetchDailyArticle} className="mt-4">
              Try Again
            </Button>
          )}
        </div>
      </div>
    )
  }

  // Already completed today
  if (state.gameStatus === "completed") {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2 text-balance">WikiGuess Daily</h1>
          <p className="text-muted-foreground text-lg">Guess the Wikipedia article from progressive sentence reveals</p>
        </div>

        <Card>
          <CardContent className="text-center py-12">
            <Trophy className="w-16 h-16 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">You've already played today!</h2>
            <p className="text-muted-foreground mb-6">Come back tomorrow for a new Wikipedia challenge.</p>
            <Button onClick={() => setShowStats(true)}>
              <BarChart3 className="w-4 h-4 mr-2" />
              View Statistics
            </Button>
          </CardContent>
        </Card>

        <GameStatsModal open={showStats} onOpenChange={setShowStats} />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <ConfettiEffect trigger={showConfetti} />

      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-4 mb-2">
          <h1 className="text-4xl font-bold text-foreground text-balance">WikiGuess Daily</h1>
          <Button variant="outline" size="sm" onClick={() => setShowStats(true)}>
            <BarChart3 className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-muted-foreground text-lg">Guess the Wikipedia article from progressive sentence reveals</p>
      </div>

      {state.error && (
        <Card className="mb-6 border-destructive">
          <CardContent className="flex items-center gap-2 pt-6">
            <AlertCircle className="w-5 h-5 text-destructive" />
            <p className="text-destructive">{state.error}</p>
          </CardContent>
        </Card>
      )}

      {state.gameStatus === "playing" && state.gameData && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl flex items-center gap-2">
                Today's Challenge
                {state.gameData.category && (
                  <Badge variant="outline" className="text-xs">
                    {state.gameData.category}
                  </Badge>
                )}
              </CardTitle>
              <Badge variant="secondary">
                {state.revealedCount} of {state.gameData.sentences.length} sentences
              </Badge>
            </div>
            <Progress value={progressPercentage} className="w-full" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted/50 p-6 rounded-lg">
              <div className="space-y-4">
                {state.gameData.sentences.slice(0, state.revealedCount).map((sentence, index) => (
                  <p key={index} className="text-foreground leading-relaxed">
                    <span className="text-primary font-medium">{index + 1}.</span> {sentence}
                  </p>
                ))}
              </div>
            </div>

            {state.guesses.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium text-sm text-muted-foreground">Previous guesses:</h3>
                <div className="flex flex-wrap gap-2">
                  {state.guesses.map((guess, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {guess}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter your guess for the article title..."
                  value={state.guess}
                  onChange={(e) => dispatch({ type: "UPDATE_GUESS", payload: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && handleGuess()}
                  className="flex-1"
                />
                <Button onClick={handleGuess} disabled={!state.guess.trim()}>
                  Submit Guess
                </Button>
              </div>

              {state.revealedCount < state.gameData.sentences.length && (
                <Button variant="outline" onClick={handleRevealSentence} className="w-full bg-transparent">
                  <Lightbulb className="w-4 h-4 mr-2" />
                  Reveal Next Sentence
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {(state.gameStatus === "won" || state.gameStatus === "lost") && state.gameData && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {state.gameStatus === "won" ? (
                <>
                  <Trophy className="w-6 h-6 text-primary" />
                  <span className="text-primary">Congratulations!</span>
                </>
              ) : (
                <>
                  <Target className="w-6 h-6 text-muted-foreground" />
                  <span>Game Over</span>
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted/50 p-6 rounded-lg">
              <div className="text-center mb-4">
                <p className="text-2xl font-bold text-primary mb-2">{state.gameData.articleTitle}</p>
                {state.gameData.category && (
                  <Badge variant="outline" className="mb-3">
                    {state.gameData.category}
                  </Badge>
                )}
                <p className="text-lg text-muted-foreground mb-3">{getPerformanceMessage()}</p>

                <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>
                      {state.revealedCount} sentence{state.revealedCount !== 1 ? "s" : ""} revealed
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Target className="w-4 h-4" />
                    <span>
                      {state.guesses.length} guess{state.guesses.length !== 1 ? "es" : ""} made
                    </span>
                  </div>
                  {state.gameStatus === "won" && (
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-primary" />
                      <span className="text-primary font-medium">Success!</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <ShareResults
              won={state.gameStatus === "won"}
              sentencesRevealed={state.revealedCount}
              totalSentences={state.gameData.sentences.length}
              articleTitle={state.gameData.articleTitle}
              category={state.gameData.category || "General"}
            />

            <div className="flex gap-2">
              <Button asChild variant="outline" className="flex-1 bg-transparent">
                <a href={state.gameData.articleUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Read Full Article
                </a>
              </Button>
              <Button onClick={() => setShowStats(true)} className="flex-1">
                <BarChart3 className="w-4 h-4 mr-2" />
                View Statistics
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="text-center text-sm text-muted-foreground">
        <p>A new Wikipedia article challenge every day!</p>
      </div>

      <GameStatsModal open={showStats} onOpenChange={setShowStats} />
    </div>
  )
}
