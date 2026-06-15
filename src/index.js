import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './db.js';
import { seedAdminUser } from './seed.js';
import authRoutes from './routes/auth.js';
import contactRoutes from './routes/contact.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB Database
await connectDB();

// Seed Admin User
await seedAdminUser();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/contact', contactRoutes);

// Root Endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Portfolio Backend API is running...' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
