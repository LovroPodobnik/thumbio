// Generate a large dataset of thumbnails for performance testing
export const generateMockThumbnails = (count = 100) => {
  const thumbnails = [];
  const titles = [
    "Ultimate JavaScript Performance Tips",
    "React vs Vue vs Angular in 2024", 
    "Building a Million Dollar SaaS",
    "The Future of AI Development",
    "Why I Quit My $500k Job",
    "10x Your Coding Speed",
    "The Dark Side of Tech Industry",
    "From Zero to Senior Developer",
    "Machine Learning Explained Simply",
    "The Best Programming Language?",
    "How I Made $1M from YouTube",
    "Stop Making These Coding Mistakes",
    "The Truth About ChatGPT",
    "Building Apps That Scale",
    "Web Development Roadmap 2024"
  ];
  
  const channels = [
    "TechLead", "Fireship", "Traversy Media", "The Net Ninja",
    "Coding with John", "Web Dev Simplified", "Kevin Powell",
    "The Coding Train", "Ben Awad", "Theo - t3.gg"
  ];
  
  const emotions = ["excited", "surprised", "neutral", "happy", "serious"];
  
  // Grid layout with proper spacing
  const cols = 5; // 5 columns for better layout
  const spacing = 380; // Spacing between thumbnails (320px width + 60px gap)
  const startX = 100; // Starting X position
  const startY = 100; // Starting Y position
  
  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    
    // No random offset for clean grid layout
    const xOffset = 0;
    const yOffset = 0;
    
    thumbnails.push({
      id: `thumb-${i}`,
      title: titles[Math.floor(Math.random() * titles.length)] + ` #${i}`,
      channelName: channels[Math.floor(Math.random() * channels.length)],
      thumbnail: `https://picsum.photos/320/180?random=${i}`,
      publishedAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
      metrics: {
        viewCount: Math.floor(Math.random() * 5000000) + 10000,
        likeCount: Math.floor(Math.random() * 100000) + 100,
        commentCount: Math.floor(Math.random() * 5000) + 10,
        publishedDaysAgo: Math.floor(Math.random() * 90) + 1
      },
      colors: [
        `#${Math.floor(Math.random()*16777215).toString(16)}`,
        `#${Math.floor(Math.random()*16777215).toString(16)}`,
        `#${Math.floor(Math.random()*16777215).toString(16)}`
      ],
      detectedText: [
        titles[Math.floor(Math.random() * titles.length)].split(' ').slice(0, 2).join(' ').toUpperCase(),
        `#${i}`
      ],
      faces: Math.floor(Math.random() * 3),
      dominantEmotion: emotions[Math.floor(Math.random() * emotions.length)],
      x: startX + col * spacing + xOffset,
      y: startY + row * spacing + yOffset
    });
  }
  
  return thumbnails;
};

// Generate comments for the thumbnails
export const generateMockComments = (thumbnails) => {
  const comments = {
    canvas: []
  };
  
  // Add some comments to random thumbnails
  thumbnails.slice(0, 20).forEach((thumb, index) => {
    if (Math.random() > 0.5) {
      comments[thumb.id] = [{
        id: `comment-${thumb.id}-1`,
        thumbnailId: thumb.id,
        content: `Great thumbnail design! The ${thumb.colors[0]} really pops.`,
        author: { name: "Designer", avatar: "D" },
        x: thumb.x + 160,
        y: thumb.y + 90,
        createdAt: new Date().toISOString(),
        status: "open"
      }];
    }
  });
  
  // Add some canvas comments
  for (let i = 0; i < 5; i++) {
    comments.canvas.push({
      id: `canvas-comment-${i}`,
      thumbnailId: null,
      content: `General feedback point ${i + 1}`,
      author: { name: "Reviewer", avatar: "R" },
      x: Math.random() * 2000,
      y: Math.random() * 2000,
      createdAt: new Date().toISOString(),
      status: "open"
    });
  }
  
  return comments;
};