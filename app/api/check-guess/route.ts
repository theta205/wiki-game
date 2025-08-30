import { type NextRequest, NextResponse } from "next/server"

function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, "") // Remove punctuation
    .replace(/\s+/g, " ") // Normalize whitespace
}

function calculateSimilarity(str1: string, str2: string): number {
  const s1 = normalizeString(str1)
  const s2 = normalizeString(str2)

  // Exact match
  if (s1 === s2) return 1.0

  // Check if one contains the other
  if (s1.includes(s2) || s2.includes(s1)) return 0.8

  // Simple word overlap scoring
  const words1 = s1.split(" ")
  const words2 = s2.split(" ")

  const commonWords = words1.filter(
    (word) => words2.includes(word) && word.length > 2, // Ignore very short words
  )

  const maxWords = Math.max(words1.length, words2.length)
  if (maxWords === 0) return 0

  return commonWords.length / maxWords
}

export async function POST(request: NextRequest) {
  try {
    const { guess, articleTitle } = await request.json()

    if (!guess || !articleTitle) {
      return NextResponse.json({ error: "Missing guess or articleTitle" }, { status: 400 })
    }

    const similarity = calculateSimilarity(guess, articleTitle)

    // Consider it correct if similarity is high enough
    const isCorrect = similarity >= 0.7

    return NextResponse.json({
      isCorrect,
      similarity,
      normalizedGuess: normalizeString(guess),
      normalizedTitle: normalizeString(articleTitle),
    })
  } catch (error) {
    console.error("Error checking guess:", error)
    return NextResponse.json({ error: "Failed to check guess" }, { status: 500 })
  }
}
