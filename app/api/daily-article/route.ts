import { NextResponse } from "next/server"
import { getDailyArticleSelection } from "@/lib/article-pool"

function splitIntoSentences(text: string): string[] {
  // Enhanced sentence splitting with better handling of abbreviations and edge cases
  const sentences = text
    .replace(/([.!?])\s*(?=[A-Z])/g, "$1|SPLIT|") // Mark sentence boundaries
    .split("|SPLIT|")
    .map((s) => s.trim())
    .filter((s) => s.length > 15) // Filter out very short fragments
    .filter((s) => !s.match(/^[A-Z]{2,}$/)) // Filter out abbreviations
    .slice(0, 8) // Limit to 8 sentences max for game balance

  return sentences
}

function cleanWikipediaText(text: string): string {
  return text
    .replace(/<[^>]*>/g, " ") // Remove HTML tags
    .replace(/\[[^\]]*\]/g, "") // Remove citation brackets
    .replace(/$$[^)]*$$/g, "") // Remove parenthetical content that might give away the answer
    .replace(/\s+/g, " ") // Normalize whitespace
    .replace(/\b(listen|pronunciation)\b/gi, "") // Remove pronunciation guides
    .trim()
}

// Simple in-memory cache for development (in production, use Redis or similar)
const articleCache = new Map<string, any>()
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

export async function GET() {
  try {
    const today = new Date().toISOString().split("T")[0] // YYYY-MM-DD format

    // Check cache first
    const cacheKey = `article-${today}`
    const cached = articleCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json(cached.data)
    }

    const { title: articleTitle, category } = getDailyArticleSelection(today)

    // Fetch article summary from Wikipedia API
    const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(articleTitle)}`
    const response = await fetch(wikiUrl, {
      headers: {
        "User-Agent": "WikiGuessDaily/1.0 (Educational Game)",
      },
    })

    if (!response.ok) {
      throw new Error(`Wikipedia API error: ${response.status}`)
    }

    const data = await response.json()

    // Get the full article content for more sentences
    const contentUrl = `https://en.wikipedia.org/api/rest_v1/page/mobile-sections/${encodeURIComponent(articleTitle)}`
    const contentResponse = await fetch(contentUrl, {
      headers: {
        "User-Agent": "WikiGuessDaily/1.0 (Educational Game)",
      },
    })

    let sentences: string[] = []

    if (contentResponse.ok) {
      const contentData = await contentResponse.json()
      // Extract text from the first few sections, avoiding infoboxes and navigation
      const sections = contentData.sections?.slice(0, 4) || []
      let fullText = ""

      for (const section of sections) {
        if (section.text && section.line !== "References" && section.line !== "External links") {
          const cleanText = cleanWikipediaText(section.text)
          fullText += cleanText + " "
        }
      }

      sentences = splitIntoSentences(fullText)
    }

    // Fallback to summary if we couldn't get full content
    if (sentences.length < 3) {
      const summaryText = cleanWikipediaText(data.extract || "")
      sentences = splitIntoSentences(summaryText)
    }

    if (sentences.length < 2) {
      sentences = [
        `This article is about ${articleTitle}, which falls under the category of ${category}.`,
        data.extract || `${articleTitle} is a notable topic covered in Wikipedia.`,
        `You can learn more about ${articleTitle} and related topics in the ${category} field.`,
      ]
    }

    const filteredSentences = sentences.filter((sentence) => {
      const lowerSentence = sentence.toLowerCase()
      const lowerTitle = articleTitle.toLowerCase()

      // Remove sentences that contain the exact title
      if (lowerSentence.includes(lowerTitle)) {
        return false
      }

      // Remove sentences that contain key words from the title
      const titleWords = lowerTitle.split(" ").filter((word) => word.length > 3)
      const containsKeyWords = titleWords.some((word) => lowerSentence.includes(word))

      return !containsKeyWords
    })

    const finalSentences = filteredSentences.length >= 3 ? filteredSentences : sentences

    const result = {
      title: data.title || articleTitle,
      sentences: finalSentences.slice(0, 6), // Limit to 6 sentences for better game balance
      url: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(articleTitle)}`,
      thumbnail: data.thumbnail?.source,
      category: category,
      difficulty: finalSentences.length <= 4 ? "hard" : "medium", // Fewer sentences = harder
    }

    // Cache the result
    articleCache.set(cacheKey, {
      data: result,
      timestamp: Date.now(),
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching daily article:", error)

    // Enhanced fallback response
    return NextResponse.json({
      title: "Albert Einstein",
      sentences: [
        "This person was a German-born theoretical physicist who is widely held to be one of the greatest scientists of all time.",
        "This individual made groundbreaking contributions to our understanding of space, time, and gravity.",
        "The famous equation E = mc² is associated with this scientist's work on the relationship between mass and energy.",
        "This physicist received the Nobel Prize in Physics in 1921 for contributions to theoretical physics.",
        "The work of this scientist fundamentally changed our understanding of the universe at both cosmic and atomic scales.",
      ],
      url: "https://en.wikipedia.org/wiki/Albert_Einstein",
      category: "Science & Technology",
      difficulty: "medium",
    })
  }
}
