# CanvasConnect 🎨

CanvasConnect is a real-time collaborative canvas application that allows multiple users to draw, edit, and interact on a shared digital space simultaneously. Built with modern web technologies, it offers a seamless and responsive experience for brainstorming, diagramming, and collaborative design.

## 🚀 Features

* **Real-time Collaboration**: See changes made by other users instantly using WebSockets and Yjs (CRDT).
* **Interactive Canvas**: Draw, move, and edit elements on a smooth, infinite canvas.
* **Modern UI**: A sleek, responsive, and intuitive user interface built with React and Tailwind CSS.
* **Persistent Storage**: Canvas state is securely saved in a MongoDB database.
* **Responsive Design**: Works seamlessly across desktops and tablets.

## 🛠️ Technology Stack

### Frontend
* **Framework**: [React 18](https://react.dev/) with [Vite](https://vitejs.dev/)
* **Language**: TypeScript
* **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [Shadcn UI](https://ui.shadcn.com/)
* **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
* **Collaboration**: [Yjs](https://yjs.dev/), y-websocket
* **Routing & Data Fetching**: React Router, React Query

### Backend
* **Runtime**: [Node.js](https://nodejs.org/)
* **Framework**: [Express](https://expressjs.com/)
* **Database**: [MongoDB](https://www.mongodb.com/) (via Mongoose)
* **Real-time Communication**: WebSockets (`ws`)
* **Collaboration Protocols**: y-protocols, yjs

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your machine:
* [Node.js](https://nodejs.org/) (v18 or higher recommended)
* [npm](https://www.npmjs.com/) or [Bun](https://bun.sh/)
* A [MongoDB](https://www.mongodb.com/) database (local or Atlas)

## ⚙️ Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/CanvasConnect.git
cd CanvasConnect
```

### 2. Backend Setup
Navigate to the backend directory and install dependencies:
```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory and add your environment variables:
```env
PORT=3001
MONGO_URI=your_mongodb_connection_string
```

Start the backend server:
```bash
# For development with nodemon
npm run dev

# For production
npm start
```

### 3. Frontend Setup
Open a new terminal window, navigate to the frontend directory, and install dependencies:
```bash
cd frontend
npm install  # or bun install
```

Create a `.env` file in the `frontend` directory and configure the backend URL:
```env
VITE_SERVER_URL=http://localhost:3001 # Or your deployed backend URL
```

Start the frontend development server:
```bash
npm run dev # or bun dev
```

## 💻 Usage

1. Ensure the backend server is running (e.g., on `http://localhost:3001`).
2. Ensure the frontend development server is running (usually on `http://localhost:5173`).
3. Open your browser and navigate to the frontend URL.
4. Start drawing and invite others to join the collaborative session!

## 📁 Project Structure

```
CanvasConnect/
├── backend/                # Node.js & Express server
│   ├── models/             # Mongoose database models
│   ├── routes/             # API endpoints
│   ├── ws/                 # WebSocket handling logic
│   └── index.js            # Entry point for the server
└── frontend/               # React Vite application
    ├── src/                # Source code (Components, Hooks, Pages)
    ├── public/             # Static assets
    └── vite.config.ts      # Vite configuration
```

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page if you want to contribute.

## 📝 License

This project is licensed under the ISC License.
