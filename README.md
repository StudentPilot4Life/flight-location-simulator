# Flight Location Simulator

A local web application that generates and broadcasts simulated GPS location data to Electronic Flight Bags (EFBs) like ForeFlight. Perfect for aviation content creators who need realistic flight demonstrations for video recordings.

## Project Setup

This project uses:
- React 19 with TypeScript
- Vite for fast development and building
- Modern ES modules

## Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm (comes with Node.js)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/StudentPilot4Life/flight-location-simulator.git
cd flight-location-simulator
```

2. Install dependencies:
```bash
npm install
```

### Development

Start the development server:
```bash
npm run dev
```

This will start the application on http://localhost:3000 and automatically open it in your browser.

### Building for Production

Build the application:
```bash
npm run build
```

The built files will be in the `dist` directory.

Preview the production build:
```bash
npm run preview
```

## Project Structure

```
flight-location-simulator/
├── src/
│   ├── components/     # React components
│   ├── services/       # Business logic and services
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Utility functions
│   ├── App.tsx         # Main App component
│   ├── main.tsx        # Application entry point
│   └── index.css       # Global styles
├── public/             # Static assets
├── index.html          # HTML entry point
├── vite.config.ts      # Vite configuration
├── tsconfig.json       # TypeScript configuration
└── package.json        # Project dependencies and scripts

```

## Roadmap

See [roadmap.md](roadmap.md) for the detailed product roadmap and planned features.

## License

ISC
