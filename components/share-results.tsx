"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Share2, Copy, Check } from "lucide-react"
import { toast } from "sonner"

interface ShareResultsProps {
  won: boolean
  sentencesRevealed: number
  totalSentences: number
  articleTitle: string
  category: string
}

export function ShareResults({ won, sentencesRevealed, totalSentences, articleTitle, category }: ShareResultsProps) {
  const [copied, setCopied] = useState(false)

  const generateShareText = () => {
    const date = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })

    const result = won ? `${sentencesRevealed}/${totalSentences}` : "X/6"
    const squares = Array.from({ length: totalSentences }, (_, i) => (i < sentencesRevealed ? "🟩" : "⬜")).join("")

    return `WikiGuess Daily ${date}

${result} ${won ? "✅" : "❌"}

${squares}

${won ? `I guessed "${articleTitle}" in ${sentencesRevealed} sentence${sentencesRevealed !== 1 ? "s" : ""}!` : `The answer was "${articleTitle}"`}

Category: ${category}

Play at wikiguess.daily`
  }

  const handleShare = async () => {
    const shareText = generateShareText()

    if (navigator.share) {
      try {
        await navigator.share({
          title: "WikiGuess Daily",
          text: shareText,
        })
      } catch (error) {
        // User cancelled or error occurred, fall back to copy
        handleCopy()
      }
    } else {
      handleCopy()
    }
  }

  const handleCopy = async () => {
    const shareText = generateShareText()

    try {
      await navigator.clipboard.writeText(shareText)
      setCopied(true)
      toast.success("Copied to clipboard!", {
        description: "Share your results with friends"
      })

      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error("Failed to copy", {
        description: "Please try again"
      })
    }
  }

  return (
    <div className="space-y-3">
      <div className="bg-muted/30 p-4 rounded-lg border-2 border-dashed border-muted-foreground/20">
        <pre className="text-sm whitespace-pre-wrap font-mono text-center">{generateShareText()}</pre>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleShare} className="flex-1 bg-transparent" variant="outline">
          <Share2 className="w-4 h-4 mr-2" />
          Share Results
        </Button>
        <Button onClick={handleCopy} variant="outline" className="flex-1 bg-transparent">
          {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
          {copied ? "Copied!" : "Copy"}
        </Button>
      </div>
    </div>
  )
}
