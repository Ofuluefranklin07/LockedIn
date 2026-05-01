# LockIn - Command Center

A high-intensity academic discipline and focus tracking system.

## Local Setup

To run this project locally, follow these steps:

### Prerequisites

- **Node.js**: Ensure you have Node.js (v18 or higher) installed.
- **npm**: Usually comes with Node.js.

### 1. Clone the repository
```bash
git clone <your-repository-url>
cd <project-directory>
```

### 2. Install Dependencies

Run the following command to install all necessary packages:

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory and add your environment variables (refer to `.env.example`). You will need:
- `GEMINI_API_KEY`: For the AI Coach features.
- Firebase configuration (already included in `firebase-applet-config.json`).

### 4. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

## Key Packages Used

- **React 19**: Frontend framework.
- **Vite**: Build tool and dev server.
- **Firebase**: Authentication and Firestore database.
- **Tailwind CSS**: Styling.
- **Motion (framer-motion)**: Animations and transitions.
- **Lucide React**: Icon library.
- **Google Generative AI SDK**: Powering the AI Coach.
- **Recharts**: Data visualization for Analytics.
