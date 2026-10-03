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
import juryModuleRoutes from './routes/juryModuleRoutes.js';
import publicVoteRoutes from './routes/publicVoteRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import exportRoutes from './routes/exportRoutes.js';

const app = express();

// ==========================================
//      SECTION SÉCURITÉ ET MIDDLEWARES      //
// ==========================================

// 1. Helmet : Configure les en-têtes HTTP pour sécuriser les requêtes (cache la stack Express, active le X-Frame-Options)
app.use(helmet());

// 2. XSS-Clean : Nettoie automatiquement les req.body, req.query et req.params pour désactiver toute tentative d'injection HTML/JavaScript
app.use(xss());

// 3. Configuration stricte de CORS pour interdire les requêtes provenant de domaines inconnus
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000', // URL de votre application React
    credentials: true // Permet la transmission sécurisée des cookies de session
}));

app.use(express.json({ limit: '10kb' })); // Limite la taille des JSON reçus à 10ko pour éviter les attaques par déni de service (DoS)
app.use(cookieParser());

// 4. Rate Limiting : Limiteur de requêtes global pour éviter les attaques de saturation
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // Fenêtre de 15 minutes
    max: 100, // Limite chaque IP à 100 requêtes par fenêtre
    message: { message: 'Too many requests from this IP, please try again after 15 minutes.' }
});
app.use('/api/', globalLimiter);

// 5. Rate Limiting Spécifique : Protection renforcée contre la force brute sur l'authentification et le vote public
const strictLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // Fenêtre de 1 heure
    max: 10, // Limite à 10 tentatives d'inscription/connexion ou votes par heure
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

// Gestion globale des routes introuvables (Erreur 404)
app.use((req, res) => {
    res.status(404).json({ message: 'Requested API resource not found.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Secure Server running in production mode on port ${PORT}`);
});
