"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { getGameStats } from "@/lib/game-storage"
import { BarChart3, Trophy, Target, Flame } from "lucide-react"

interface GameStatsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GameStatsModal({ open, onOpenChange }: GameStatsModalProps) {
  const stats = getGameStats()
  const winRate = stats.gamesPlayed > 0 ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Your Statistics
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">{stats.gamesPlayed}</div>
              <div className="text-sm text-muted-foreground">Games Played</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">{winRate}%</div>
              <div className="text-sm text-muted-foreground">Win Rate</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary flex items-center justify-center gap-1">
                <Flame className="w-5 h-5" />
                {stats.currentStreak}
              </div>
              <div className="text-sm text-muted-foreground">Current Streak</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary flex items-center justify-center gap-1">
                <Trophy className="w-5 h-5" />
                {stats.maxStreak}
              </div>
              <div className="text-sm text-muted-foreground">Best Streak</div>
            </div>
          </div>

          {stats.gamesWon > 0 && (
            <div>
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Guess Distribution
              </h3>
              <div className="space-y-2">
                {stats.sentenceDistribution.map((count, index) => {
                  const percentage = stats.gamesWon > 0 ? (count / stats.gamesWon) * 100 : 0
                  return (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-sm w-8">{index + 1}</span>
                      <div className="flex-1 bg-muted rounded-sm h-6 relative">
                        <div
                          className="bg-primary h-full rounded-sm transition-all duration-300"
                          style={{ width: `${Math.max(percentage, count > 0 ? 8 : 0)}%` }}
                        />
                        <span className="absolute inset-0 flex items-center justify-end pr-2 text-xs font-medium">
                          {count}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <Button onClick={() => onOpenChange(false)} className="w-full">
          Close
        </Button>
      </DialogContent>
    </Dialog>
  )
}
