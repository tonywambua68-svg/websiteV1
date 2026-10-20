# Imara Tech - Electronics E-Commerce Website

A modern e-commerce platform built with React, TypeScript, Vite, and Node.js.

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- MongoDB (for backend)

### Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env
```
Then edit `.env` with your configuration:
- `DATABASE_URL` - Your MongoDB connection string
- `JWT_SECRET` - A secure random string for JWT tokens
- `VITE_API_BASE_URL` - API URL (default: http://localhost:3000/api)

3. **Start the backend server:**
```bash
npm run server
```

4. **Start the frontend development server (in a new terminal):**
```bash
npm run dev
```

5. **Open your browser:**
Visit `http://localhost:5173`

## 📦 Available Scripts

- `npm run dev` - Start frontend development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run server` - Start backend server
- `npm run dev:all` - Start both frontend and backend concurrently

## 🏗️ Project Structure

```
├── src/                    # Frontend source code
│   ├── components/        # Reusable UI components
│   ├── pages/            # Page components
│   ├── store/            # State management (Zustand)
│   ├── lib/              # Utilities and API clients
│   ├── types/            # TypeScript type definitions
│   ├── App.tsx           # Main app component
│   └── main.tsx          # Entry point
├── server/               # Backend server
│   ├── api/             # API routes
│   ├── models/          # Database models
│   └── server.mjs       # Express server
├── public/              # Static assets
├── index.html           # HTML entry point
├── package.json         # Dependencies
├── tsconfig.json        # TypeScript config
├── vite.config.ts       # Vite config
└── tailwind.config.js   # Tailwind CSS config
```

## 🌐 Deployment

### Cloudflare Pages

The project is configured for Cloudflare Pages deployment:

1. Push your code to GitHub
2. Connect your repository to Cloudflare Pages
3. Build settings:
   - Build command: `npm run build`
   - Output directory: `dist`

The `wrangler.toml` and `public/_redirects` files handle SPA routing.

## 🔧 Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS
- **State Management:** Zustand
- **Routing:** React Router v6
- **Backend:** Node.js, Express
- **Database:** MongoDB with Mongoose
- **Authentication:** JWT with bcrypt
- **Icons:** Lucide React

## 📝 Features

- Product browsing with search and filters
- Shopping cart functionality
- User authentication (login/register)
- Checkout flow
- Responsive design
- Admin-ready API structure

## 🔒 Environment Variables

Create a `.env` file in the root directory:

```env
# Backend
DATABASE_URL=mongodb://localhost:27017/imara-tech
JWT_SECRET=your-secret-key-here
PORT=3000

# Frontend
VITE_API_BASE_URL=http://localhost:3000/api
```

## 📄 License

MIT
