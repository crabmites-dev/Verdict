import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

export const protect = async (req, res, next) => {  
    try {
        const token = req.cookies?.token;
    
        if (!token) {
            return res.status(401).json({ message: 'Token introuvable. Veuillez vous connecter.' });
        }
    
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
        const userResult = await pool.query('SELECT id, name, email, role FROM users WHERE id = $1', [decoded.id]);
    
        if (userResult.rows.length === 0) {
            return res.status(401).json({ message: 'Utilisateur non autorisé ou introuvable.' });
        }
    
        req.user = userResult.rows[0];
        next();
        
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'La session a expiré.' });
        }

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Le token est invalide.' });
        }

        console.error('Erreur serveur authMiddleware: ', error);
        return res.status(500).json({ message: 'Une erreur s\'est produite lors de l\'authentification.' });
    }
};

export const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à accéder à cette ressource.' });
        }
        return next();
    };
};
