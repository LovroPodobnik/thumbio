// Mock YouTube thumbnail data with realistic performance metrics
export const mockThumbnails = [
  {
    id: "1",
    title: "This CAMERA changed YouTube FOREVER 📸",
    channelName: "Marques Brownlee",
    thumbnail: "https://picsum.photos/320/180?random=1&grayscale",
    publishedAt: "2024-05-15T10:30:00Z",
    metrics: {
      viewCount: 2400000,
      likeCount: 45000,
      commentCount: 1730,
      publishedDaysAgo: 42
    },
    colors: ["#FF6B35", "#004E89", "#FFFFFF"],
    detectedText: ["THIS CAMERA", "CHANGED YOUTUBE"],
    faces: 1,
    dominantEmotion: "excited",
    x: 100,
    y: 100
  },
  {
    id: "2", 
    title: "The TRUTH About iPhone 16 Pro Max",
    channelName: "Unbox Therapy",
    thumbnail: "https://picsum.photos/320/180?random=2&grayscale",
    publishedAt: "2024-05-20T14:15:00Z",
    metrics: {
      viewCount: 1800000,
      likeCount: 32000,
      commentCount: 890,
      publishedDaysAgo: 37
    },
    colors: ["#000000", "#FFFFFF", "#007AFF"],
    detectedText: ["THE TRUTH", "IPHONE 16"],
    faces: 1,
    dominantEmotion: "surprised",
    x: 480,
    y: 100
  },
  {
    id: "3",
    title: "I Built the FASTEST Gaming PC for $5000",
    channelName: "Linus Tech Tips",
    thumbnail: "https://picsum.photos/320/180?random=3&grayscale",
    publishedAt: "2024-05-25T16:45:00Z",
    metrics: {
      viewCount: 3200000,
      likeCount: 78000,
      commentCount: 2340,
      publishedDaysAgo: 32
    },
    colors: ["#FF0000", "#000000", "#FFFF00"],
    detectedText: ["FASTEST", "GAMING PC", "$5000"],
    faces: 2,
    dominantEmotion: "happy",
    x: 860,
    y: 100
  },
  {
    id: "4",
    title: "Tesla FSD 13 is INCREDIBLE (First Drive)",
    channelName: "Tesla Raj",
    thumbnail: "https://picsum.photos/320/180?random=4&grayscale",
    publishedAt: "2024-06-01T09:20:00Z",
    metrics: {
      viewCount: 890000,
      likeCount: 23000,
      commentCount: 567,
      publishedDaysAgo: 25
    },
    colors: ["#E31E24", "#FFFFFF", "#000000"],
    detectedText: ["TESLA FSD 13", "INCREDIBLE"],
    faces: 1,
    dominantEmotion: "amazed",
    x: 1240,
    y: 100
  },
  {
    id: "5",
    title: "Why Everyone is WRONG About AI",
    channelName: "Veritasium",
    thumbnail: "https://picsum.photos/320/180?random=5&grayscale",
    publishedAt: "2024-06-05T11:30:00Z",
    metrics: {
      viewCount: 4200000,
      likeCount: 89000,
      commentCount: 3450,
      publishedDaysAgo: 21
    },
    colors: ["#FF6B35", "#1E3A8A", "#FFFFFF"],
    detectedText: ["EVERYONE IS WRONG", "ABOUT AI"],
    faces: 1,
    dominantEmotion: "serious",
    x: 1620,
    y: 100
  },
  {
    id: "6",
    title: "React 19 Changes EVERYTHING (New Features)",
    channelName: "Web Dev Simplified",
    thumbnail: "https://picsum.photos/320/180?random=6&grayscale",
    publishedAt: "2024-06-10T13:45:00Z",
    metrics: {
      viewCount: 567000,
      likeCount: 18900,
      commentCount: 423,
      publishedDaysAgo: 16
    },
    colors: ["#61DAFB", "#282C34", "#FFFFFF"],
    detectedText: ["REACT 19", "CHANGES EVERYTHING"],
    faces: 1,
    dominantEmotion: "confident",
    x: 100,
    y: 480
  },
  {
    id: "7",
    title: "The $1 Million Dollar Coding Challenge",
    channelName: "Fireship",  
    thumbnail: "https://picsum.photos/320/180?random=7&grayscale",
    publishedAt: "2024-06-12T15:20:00Z",
    metrics: {
      viewCount: 1200000,
      likeCount: 67000,
      commentCount: 1890,
      publishedDaysAgo: 14
    },
    colors: ["#FF4500", "#000000", "#FFFFFF"],
    detectedText: ["$1 MILLION", "CODING CHALLENGE"],
    faces: 0,
    dominantEmotion: null,
    x: 480,
    y: 480
  },
  {
    id: "8",
    title: "Apple's SECRET New Product Revealed!",
    channelName: "iJustine",
    thumbnail: "https://picsum.photos/320/180?random=8&grayscale", 
    publishedAt: "2024-06-15T12:10:00Z",
    metrics: {
      viewCount: 2100000,
      likeCount: 43000,
      commentCount: 1245,
      publishedDaysAgo: 11
    },
    colors: ["#007AFF", "#FFFFFF", "#FF3B30"],
    detectedText: ["APPLE'S SECRET", "NEW PRODUCT"],
    faces: 1,
    dominantEmotion: "excited",
    x: 860,
    y: 480
  },
  {
    id: "9",
    title: "I Tried Coding for 100 Days Straight",
    channelName: "ForrestKnight",
    thumbnail: "https://picsum.photos/320/180?random=9&grayscale",
    publishedAt: "2024-06-18T18:30:00Z", 
    metrics: {
      viewCount: 780000,
      likeCount: 34000,
      commentCount: 890,
      publishedDaysAgo: 8
    },
    colors: ["#00D4AA", "#1A1A1A", "#FFFFFF"],
    detectedText: ["100 DAYS", "STRAIGHT CODING"],
    faces: 1,
    dominantEmotion: "determined",
    x: 1240,
    y: 480
  },
  {
    id: "10",
    title: "This JavaScript Feature Will BLOW Your Mind",
    channelName: "Kevin Powell",
    thumbnail: "https://picsum.photos/320/180?random=10&grayscale",
    publishedAt: "2024-06-20T20:45:00Z",
    metrics: {
      viewCount: 345000,
      likeCount: 12000,
      commentCount: 234,
      publishedDaysAgo: 6
    },
    colors: ["#F7DF1E", "#000000", "#FFFFFF"],
    detectedText: ["JAVASCRIPT", "BLOW YOUR MIND"],
    faces: 1,
    dominantEmotion: "amazed",
    x: 1620,
    y: 480
  }
];

// Helper functions for metrics calculations
export const calculateMetrics = (thumbnail) => {
  const { viewCount, likeCount, commentCount, publishedDaysAgo } = thumbnail.metrics;
  
  return {
    viewsPerDay: Math.round(viewCount / publishedDaysAgo),
    likeRatio: ((likeCount / viewCount) * 100).toFixed(2),
    commentsPerThousandViews: ((commentCount / viewCount) * 1000).toFixed(1),
    engagementScore: Math.round(((likeCount + commentCount) / viewCount) * 10000) / 100
  };
};

// Generate additional mock comments for each thumbnail
export const mockComments = {
  "1": [
    {
      id: "c1",
      thumbnailId: "1",
      content: "Love the bright orange background - really pops!",
      author: { name: "Sarah Designer", avatar: "SD" },
      x: 50,
      y: 20,
      createdAt: "2024-06-24T10:30:00Z",
      status: "open"
    }
  ],
  "2": [
    {
      id: "c2", 
      thumbnailId: "2",
      content: "The contrast between phone and text could be stronger",
      author: { name: "Mike Creative", avatar: "MC" },
      x: 80,
      y: 40,
      createdAt: "2024-06-24T11:15:00Z", 
      status: "open"
    }
  ],
  "5": [
    {
      id: "c3",
      thumbnailId: "5", 
      content: "Perfect example of click-worthy headline + face combo",
      author: { name: "Alex Content", avatar: "AC" },
      x: 60,
      y: 30,
      createdAt: "2024-06-24T09:45:00Z",
      status: "resolved"
    }
  ]
};