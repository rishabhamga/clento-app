# AI SDR Platform

AI-powered Sales Development Representative platform for automated lead generation and multichannel outreach. This platform finds ideal leads, enriches their data, and engages them via LinkedIn and email with AI-crafted messages.

## Features

- **Lead Sourcing**: Search millions of B2B contacts using ZoomInfo and Apollo APIs
- **AI-Powered Outreach**: Generate personalized emails and LinkedIn messages using GPT-4
- **Multi-Channel Automation**: Automate sequences across email and LinkedIn
- **Reply Handling**: AI-powered reply classification and suggested responses
- **Campaign Management**: Create and manage outreach campaigns with analytics

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI Framework**: Chakra UI, SaaS UI
- **Authentication**: Clerk
- **Database**: Supabase (PostgreSQL)
- **AI**: OpenAI GPT-4
- **Email**: Gmail API / SMTP
- **LinkedIn**: PhantomBuster integration
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Clerk account
- OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ai-sdr-platform
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your actual API keys and configuration.

4. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

See `.env.example` for all required environment variables. Key variables include:

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Your Clerk publishable key
- `CLERK_SECRET_KEY` - Your Clerk secret key
- `OPENAI_API_KEY` - Your OpenAI API key

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run tests
- `npm run type-check` - Run TypeScript type checking

### Project Structure

```
src/
├── app/                 # Next.js App Router pages
├── components/          # Reusable React components
├── lib/                # Utility libraries and configurations
├── hooks/              # Custom React hooks
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── test/               # Test setup and utilities
```

## Deployment

The application is configured for deployment on Vercel with automatic CI/CD via GitHub Actions.

1. Connect your repository to Vercel
2. Set up environment variables in Vercel dashboard
3. Configure GitHub secrets for the workflow
4. Push to main branch to trigger deployment

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

[MIT License](LICENSE)
