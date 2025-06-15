# CryptoBuddy - Your AI-Powered Financial Sidekick!

CryptoBuddy is a rule-based chatbot that provides cryptocurrency investment advice based on predefined data. It offers insights about trending, sustainable, and profitable cryptocurrencies.

## Live Demo
Check out the live application: [CryptoBuddy](https://cryptobuddy-frontend.onrender.com/)

## Features

- Clean, modern chat interface
- Real-time responses to cryptocurrency queries
- Information about trending cryptocurrencies
- Sustainable cryptocurrency recommendations
- Profitable cryptocurrency suggestions
- Responsive design for all devices

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd cryptobuddy
```

2. Install dependencies for both frontend and backend:
```bash
npm run install-all
```

## Running the Application

1. Start the development server:
```bash
npm run dev
```

This will start both the backend server (on port 5000) and the frontend development server (on port 3000).

2. Open your browser and navigate to:
```
http://localhost:3000
```

## Usage

1. Type your questions about cryptocurrencies in the chat input
2. Ask about:
   - Trending cryptocurrencies
   - Sustainable cryptocurrencies
   - Profitable cryptocurrencies
3. Get instant responses with cryptocurrency recommendations

## Deployment

### Backend Deployment (Heroku)

1. Create a new Heroku app
2. Set up the following environment variables:
   - `PORT`: (Heroku will set this automatically)
3. Deploy using Heroku CLI:
```bash
heroku create
git push heroku main
```

### Frontend Deployment (Vercel)

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy to Vercel:
```bash
cd client
vercel
```

## Security

- Input sanitization is implemented to prevent XSS attacks
- CORS is enabled for secure cross-origin requests
- No sensitive data is stored or transmitted

## Disclaimer

⚠️ Crypto investing is risky—always do your own research! The advice provided by CryptoBuddy is based on predefined rules and should not be considered as financial advice.

## License

MIT License 

### Contributors:

**Lead Architect** : Cpt. Njenga