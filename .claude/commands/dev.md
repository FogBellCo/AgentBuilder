Start both the Vite frontend dev server and the backend API server for local development.

1. Start the backend server first (in background): `cd server && npm run dev`
2. Start the Vite frontend dev server (in background): `npm run dev` (from the project root)
3. Wait a few seconds for both to be ready
4. Confirm both are running by checking that http://localhost:5173/AgentBuilder/ (frontend) and http://localhost:3001/api/health (backend) respond

The frontend runs on port 5173 and proxies /api requests to the backend on port 3001.
