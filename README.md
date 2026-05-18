# PixelMill - Free AI Image Generator

A free, unlimited AI image generation website built with Next.js 15.

## Features

- 🎨 **100% Free** - No hidden costs, unlimited generations
- 🔓 **No Sign Up** - Start creating immediately  
- ⚡ **Fast Results** - Get images in seconds
- 🔒 **Private** - No data collection or tracking
- 🌐 **Multi-language Ready** - Supports multiple languages
- 📱 **Responsive Design** - Works on all devices

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **AI Model**: Pollinations.ai (FLUX.1)
- **Hosting**: Vercel (free)

## Getting Started

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000
```

### Build for Production

```bash
npm run build
npm start
```

## Deployment to Vercel

### Option 1: One-Click Deploy (Recommended for Beginners)

1. Go to [vercel.com](https://vercel.com) and sign up with GitHub
2. Click "Add New Project"
3. Import this project from GitHub
4. Click "Deploy" - Vercel handles everything automatically!

### Option 2: Manual Deploy

1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in project directory
3. Follow the prompts
4. For production: `vercel --prod`

## Environment Variables

No environment variables required for the free tier!

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── page.tsx         # Home page (generator)
│   ├── gallery/         # Gallery page
│   ├── pricing/         # Pricing page
│   └── api/             # API routes
├── components/          # React components
│   ├── generator/       # Generator UI components
│   ├── gallery/         # Gallery components
│   └── layout/          # Header, Footer
└── lib/                 # Utilities
```

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [Pollinations.ai](https://pollinations.ai) - Free AI image generation

## License

MIT License - feel free to use for your own projects!
