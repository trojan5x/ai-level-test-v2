# AI Level Test

A sophisticated React-based assessment tool that evaluates users' AI proficiency through scenario-based questions. Built as a viral engagement tool for LearnTube's educational platform.

## 🎯 Overview

The AI Level Test is a 3-minute assessment that measures:
- **AI Level** (0-4): User's technical AI competency
- **AI Relationship Status**: How users interact with AI (Single, Casual, Committed, Merged, Complicated)

Based on research from BCG, Anthropic & MIT Media Lab.

## ✨ Features

### Core Assessment
- 6 comprehensive scenario-based questions
- Real-time scoring with advanced algorithms
- Personalized insights and recommendations
- Mobile-first responsive design

### Premium User Experience
- Smooth fade-in animations throughout
- Perfect circular level number display
- Auto-scroll functionality for multi-step questions
- Premium loading screens with particle effects

### Data Collection & Analytics
- Lead capture with WhatsApp integration (+91 India-first)
- Intent tracking for product interest
- Comprehensive analytics events
- Supabase backend integration

### Advanced Features
- LLM-powered scoring for subjective questions (Gemini Flash-Lite)
- Canvas-generated shareable result cards
- Web Share API with multi-tier fallbacks
- Progressive Web App (PWA) support

### SEO & Social Optimization
- Complete Open Graph and Twitter Card metadata
- Structured JSON-LD data
- Optimized social sharing images
- SVG favicon with modern browser support

## 🛠 Technology Stack

### Frontend
- **React 18**: Modern functional components with hooks
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first styling with custom animations
- **PostCSS**: CSS processing and optimization

### Backend & Data
- **Supabase**: Backend-as-a-Service
  - PostgreSQL database
  - Real-time subscriptions
  - Edge Functions for LLM scoring
- **Gemini 3.1 Flash-Lite**: LLM for advanced response evaluation

### APIs & Integrations
- **Canvas API**: Dynamic image generation for sharing
- **Web Share API**: Native sharing with fallbacks
- **Performance API**: Paint timing and CLS monitoring

### Database Schema
- `ai_level_leads`: User information and results
- `ai_level_intents`: Product interest tracking
- `ai_level_analytics`: Event tracking and funnel metrics

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase account and project setup

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ai-level-test.git
cd ai-level-test
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Create .env file with your Supabase credentials
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start development server:
```bash
npm run dev
```

5. Build for production:
```bash
npm run build
```

## 📊 Scoring Algorithm

### Level Computation (0-4)
- **Level 0**: Non-User (total ≤ 4)
- **Level 1**: Experimenter (total ≤ 7)
- **Level 2**: Functional User (fails gatekeepers)
- **Level 3**: Effective Practitioner (passes all checks)
- **Level 4+**: AI-Native Performer (≥18 points + deep analysis)

### Gatekeeper Signals
1. **Artifact Effect** (Item 3): Substance vs polish detection
2. **Conversation Fork** (Item 4): Iteration vs formatting preference
3. **Follow-up Depth** (Item 6): Critical thinking vs surface requests

### Relationship Status
Based on user interaction patterns, restraint signals, and AI dependency indicators.

## 📱 Mobile Optimization

- iPhone SE compatibility (single-fold lead capture)
- Keyboard-aware UI adjustments
- Touch-optimized tap targets (48px minimum)
- Performance targets: <1s paint time, zero layout shifts

## 🔧 Development Features

### Animation System
- Staggered entrance animations
- Custom CSS keyframes for premium effects
- Hardware-accelerated transforms
- Responsive timing for mobile

### Auto-scroll Implementation
- Smart scrolling for multi-step questions
- Timing coordination with animations
- Mobile viewport optimization

### Error Prevention
- Duplicate record prevention with upsert logic
- Loading states for API calls
- Fallback mechanisms for LLM scoring

## 🌐 Deployment

The application is deployed at: `https://ai-level.learntube.ai`

### Production Checklist
- [x] Supabase database configured
- [x] LLM scoring edge function deployed
- [x] Social sharing images optimized
- [x] SEO metadata complete
- [x] Analytics tracking implemented
- [x] PWA manifest configured

## 📈 Analytics Events

- `test_started`: User begins assessment
- `item_completed`: Each question completion
- `lead_captured`: Contact information submitted
- `reveal_viewed`: Results screen viewed
- `product_reserved`: Interest in certification/learning
- `share_initiated`: Social sharing attempted
- `share_completed`: Share successfully executed

## 🤝 Contributing

This is a production application. For contributions, please follow the established coding standards and testing protocols.

## 📄 License

Private repository - All rights reserved to LearnTube.

---

Built with ❤️ by the LearnTube team