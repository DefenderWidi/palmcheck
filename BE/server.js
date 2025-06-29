import express from 'express';
import cors from 'cors';
import locationsRouter from './routes/locations.js';

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/locations', locationsRouter);

// Start server
app.listen(PORT, () => {
  console.log(`✅ Backend running at http://localhost:${PORT}`);
});
