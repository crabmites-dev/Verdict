// backend/server.js
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import xss from 'xss-clean';
import rateLimit from 'express-rate-limit';
import 'dotenv/config';

// Importation de toutes nos routes sécurisées
import authRoutes from './routes/authRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import juryModuleRoutes from './routes/juryRoutes.js';
import publicVoteRoutes from './routes/publicVoteRoute.js';
import adminRoutes from './routes/adminRoutes.js';
import exportRoutes from './routes/exportRoutes.js';
import resultRoutes from './routes/resultRoutes.js';

const app = express();

// ==========================================
//      SECTION SÉCURITÉ ET MIDDLEWARES      //
// ==========================================

// 1. Helmet : Configure les en-têtes HTTP pour sécuriser les requêtes
app.use(helmet());

// 2. XSS-Clean : Nettoie automatiquement les req.body, req.query et req.params contre les injections HTML/JS
app.use(xss());

// 3. Configuration stricte de CORS
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));

app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// 4. Rate Limiting global
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { message: 'Too many requests from this IP, please try again after 15 minutes.' }
});
app.use('/api/', globalLimiter);

// 5. Rate Limiting Spécifique
const strictLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: { message: 'Too many attempts. Action locked for one hour to prevent fraud.' }
});
app.use('/api/auth/login', strictLimiter);
app.use('/api/auth/register', strictLimiter);
app.use('/api/public/vote', strictLimiter);

// ==========================================
//            DÉCLARATION DES ROUTES         //
// ==========================================

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/jury-panel', juryModuleRoutes);
app.use('/api/public', publicVoteRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/exports', exportRoutes);
app.use('/api/results', resultRoutes);

// Gestion globale des routes introuvables (Erreur 404)
app.use((req, res) => {
    res.status(404).json({ message: 'Requested API resource not found.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Secure Server running on port ${PORT}`);
});
