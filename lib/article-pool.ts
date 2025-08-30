export interface ArticleCategory {
  name: string
  articles: string[]
  weight: number // Higher weight = more likely to be selected
}

export const ARTICLE_CATEGORIES: ArticleCategory[] = [
  {
    name: "Science & Technology",
    articles: [
      "Albert Einstein",
      "Marie Curie",
      "Isaac Newton",
      "Charles Darwin",
      "Nikola Tesla",
      "DNA",
      "Photosynthesis",
      "Black hole",
      "Quantum mechanics",
      "Artificial intelligence",
      "Internet",
      "Computer",
      "Electricity",
      "Antibiotics",
      "Telescope",
      "Microscope",
      "Periodic table",
      "Theory of relativity",
      "Evolution",
      "Genetics",
    ],
    weight: 25,
  },
  {
    name: "History & Culture",
    articles: [
      "Ancient Rome",
      "Ancient Egypt",
      "World War II",
      "Renaissance",
      "Industrial Revolution",
      "French Revolution",
      "American Civil War",
      "Cold War",
      "Medieval period",
      "Byzantine Empire",
      "Silk Road",
      "Crusades",
      "Age of Exploration",
      "Colonialism",
      "Enlightenment",
      "Reformation",
      "Russian Revolution",
      "Great Depression",
      "Holocaust",
      "Berlin Wall",
    ],
    weight: 20,
  },
  {
    name: "Geography & Nature",
    articles: [
      "Amazon rainforest",
      "Mount Everest",
      "Sahara Desert",
      "Great Barrier Reef",
      "Antarctica",
      "Pacific Ocean",
      "Nile River",
      "Grand Canyon",
      "Yellowstone National Park",
      "Galapagos Islands",
      "Himalayas",
      "Arctic",
      "Volcano",
      "Earthquake",
      "Climate change",
      "Ecosystem",
      "Biodiversity",
      "Coral reef",
      "Rainforest",
      "Tundra",
    ],
    weight: 20,
  },
  {
    name: "Arts & Literature",
    articles: [
      "Leonardo da Vinci",
      "William Shakespeare",
      "Ludwig van Beethoven",
      "Pablo Picasso",
      "Vincent van Gogh",
      "Mozart",
      "Michelangelo",
      "Renaissance art",
      "Impressionism",
      "Classical music",
      "Opera",
      "Poetry",
      "Novel",
      "Theater",
      "Cinema",
      "Photography",
      "Sculpture",
      "Architecture",
      "Dance",
      "Literature",
    ],
    weight: 15,
  },
  {
    name: "Landmarks & Monuments",
    articles: [
      "Great Wall of China",
      "Pyramids of Giza",
      "Taj Mahal",
      "Machu Picchu",
      "Colosseum",
      "Stonehenge",
      "Eiffel Tower",
      "Statue of Liberty",
      "Big Ben",
      "Sydney Opera House",
      "Christ the Redeemer",
      "Petra",
      "Angkor Wat",
      "Acropolis of Athens",
      "Tower of London",
      "Notre-Dame de Paris",
      "Sagrada Familia",
      "Mount Rushmore",
      "Golden Gate Bridge",
      "Brooklyn Bridge",
    ],
    weight: 10,
  },
  {
    name: "Space & Astronomy",
    articles: [
      "Solar System",
      "Moon",
      "Mars",
      "Jupiter",
      "Saturn",
      "Sun",
      "Milky Way",
      "Universe",
      "Big Bang",
      "International Space Station",
      "Apollo 11",
      "Moon landing",
      "Hubble Space Telescope",
      "NASA",
      "Astronaut",
      "Satellite",
      "Comet",
      "Asteroid",
      "Galaxy",
      "Constellation",
    ],
    weight: 10,
  },
]

export function getAllArticles(): string[] {
  return ARTICLE_CATEGORIES.flatMap((category) => category.articles)
}

export function getWeightedRandomCategory(seed: number): ArticleCategory {
  const totalWeight = ARTICLE_CATEGORIES.reduce((sum, cat) => sum + cat.weight, 0)
  let randomValue = seed % totalWeight

  for (const category of ARTICLE_CATEGORIES) {
    randomValue -= category.weight
    if (randomValue < 0) {
      return category
    }
  }

  // Fallback to first category
  return ARTICLE_CATEGORIES[0]
}

export function getDailyArticleSelection(date: string): { title: string; category: string } {
  // Create multiple hash values from the date for better distribution
  let hash1 = 0
  let hash2 = 0

  for (let i = 0; i < date.length; i++) {
    const char = date.charCodeAt(i)
    hash1 = ((hash1 << 5) - hash1 + char) & 0x7fffffff
    hash2 = ((hash2 << 3) + hash2 + char) & 0x7fffffff
  }

  // Select category based on weighted distribution
  const selectedCategory = getWeightedRandomCategory(hash1)

  // Select article from category
  const articleIndex = hash2 % selectedCategory.articles.length
  const selectedArticle = selectedCategory.articles[articleIndex]

  return {
    title: selectedArticle,
    category: selectedCategory.name,
  }
}

// Utility function to get articles for the next N days (for testing/preview)
export function getUpcomingArticles(days = 7): Array<{ date: string; title: string; category: string }> {
  const articles = []
  const today = new Date()

  for (let i = 0; i < days; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    const dateString = date.toISOString().split("T")[0]

    const selection = getDailyArticleSelection(dateString)
    articles.push({
      date: dateString,
      ...selection,
    })
  }

  return articles
}
