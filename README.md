# YouTube Thumbnail Performance Analyzer

Interactive canvas for analyzing viral YouTube thumbnails with real-time metrics, engagement data, and performance insights. Built for content creators who want data-driven thumbnail strategies.

## 🚀 Features

- **Interactive Canvas**: Drag thumbnails around, leave comments, organize visually
- **Performance-Based Sorting**: Sort by views, engagement rate, likes, comments, recency
- **Real-Time Analytics**: Comprehensive performance metrics and insights
- **Viral Detection**: Automatic badges for high-performing content (VIRAL, HOT, ENGAGED)
- **Professional Design**: Clean design system with semantic colors and typography
- **API Safety**: Built-in rate limiting and usage tracking

## 🛠️ Tech Stack

- **React 19** - Modern React with concurrent features
- **PixiJS v8** - High-performance 2D graphics rendering
- **YouTube Data API v3** - Real-time video metrics and data
- **Tailwind CSS** - Professional design system implementation

## 📋 Prerequisites

1. **YouTube Data API Key**
   - Go to [Google Cloud Console](https://console.developers.google.com/)
   - Create a new project or select existing one
   - Enable YouTube Data API v3
   - Create credentials (API Key)
   - Restrict the key to YouTube Data API v3

## 🏃‍♂️ Quick Start

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd thumbnail-canvas-prototype
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env and add your YouTube API key:
   # REACT_APP_YOUTUBE_API_KEY=your_youtube_api_key_here
   ```

3. **Run Development Server**
   ```bash
   npm start
   ```

4. **Open Browser**
   Navigate to `http://localhost:3000`

## 🌐 Deployment

### Vercel (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Set Environment Variables**
   ```bash
   vercel env add REACT_APP_YOUTUBE_API_KEY
   # Paste your YouTube API key when prompted
   ```

4. **Redeploy**
   ```bash
   vercel --prod
   ```

### Manual Build

```bash
npm run build
# Deploy the 'build' folder to your hosting provider
```

## 🔒 API Safety Features

- **Rate Limiting**: 100 requests/hour, 1000 requests/day (configurable)
- **Usage Tracking**: Monitor API consumption in real-time
- **Error Handling**: Graceful fallbacks for API failures
- **Environment Validation**: Ensures API key is configured

## 📊 Usage

1. **Import Videos**: Search for videos or paste channel URLs
2. **Sort by Performance**: Choose from views, engagement, likes, recency
3. **Analyze Thumbnails**: Click info button for detailed analytics
4. **Visual Organization**: Drag thumbnails to create mood boards
5. **Add Comments**: Leave notes on successful design patterns

## 🎯 Performance Metrics

- **Engagement Rate**: (Likes + Comments) / Views × 100
- **Performance Badges**: VIRAL (1M+ views), HOT (100K+ views), ENGAGED (2%+ engagement)
- **Daily Averages**: Views per day since publication
- **Ratios**: Like-to-view and comment-to-view ratios

## ⚙️ Configuration

Environment variables (optional):
```bash
REACT_APP_MAX_REQUESTS_PER_HOUR=100
REACT_APP_MAX_REQUESTS_PER_DAY=1000
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Inspired by Greg Isenberg and Riley Brown's MCP workflow demonstration
- Built with modern React and PixiJS for optimal performance
- Design system following professional UI/UX principles
