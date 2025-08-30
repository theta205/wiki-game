import { NextResponse } from "next/server"
import { getUpcomingArticles } from "@/lib/article-pool"

// Development endpoint to preview upcoming articles
export async function GET() {
  try {
    const upcoming = getUpcomingArticles(14) // Next 2 weeks

    return NextResponse.json({
      upcoming,
      message: "Preview of upcoming daily articles (development only)",
    })
  } catch (error) {
    console.error("Error generating article preview:", error)
    return NextResponse.json({ error: "Failed to generate preview" }, { status: 500 })
  }
}
