import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import routes from './routes/index.js';
import path from 'path';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files
app.use('/uploads', express.static('uploads'));

app.use('/api', routes);

app.get('/', (req, res) => {
    res.send('Rumah Dinar POS API is running');
});

// Global Fallback to debug 404s
app.use((req, res) => {
    console.log(`[Global Fallback] Unmatched Request: ${req.method} ${req.url}`);
    res.status(404).json({
        error: "Route not found (Global Catch-All)",
        path: req.url,
        method: req.method,
        registeredRoutes: ["/api/transactions", "/api/masters", "/api/items"]
    });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
