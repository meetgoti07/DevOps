require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const menuRoutes = require('./routes/menuRoutes');

const app = express();
const PORT = process.env.PORT || 8082;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
    // Collapse trailing slashes so API routes accept both `/path` and `/path/`
    if (req.path.length > 1 && req.path.endsWith('/')) {
        const trimmedPath = req.path.replace(/\/+$/, '');
        req.url = trimmedPath + req.url.slice(req.path.length);
    }
    next();
});

// Routes
app.use('/api/menu', menuRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        service: 'Menu Service',
        timestamp: new Date().toISOString()
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        message: 'Route not found',
        path: req.originalUrl
    });
});

app.listen(PORT, () => {
    console.log(`Menu Service running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
