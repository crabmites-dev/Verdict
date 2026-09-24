import jwt from 'jsonwebtoken'
import pool from '../config/db.js'

export const protect = async (req, res, next) => {  
    try {
        const token = req.cookies?.token
    
        if(!token) {
            return res.status(400).json({message: 'Le token est introuvable'})
        }
    
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
        const userResult = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [decoded.id])
    
        if(userResult.rows.length === 0) {
            return res.status(401).json({message: 'Pas autorise'})
        }
    
        req.user = userResult.rows[0]
    
        next()
        
    } catch (error) {
        if(error.name === 'TokenExpiredError') {
            return res.status(401).json({message: 'La session a expiré'})
        }

        if(error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Le token est invalide.' });
        }

        console.error('Erreur serveur: ', err)
        return res.status(500).json({ message: 'Une erreur s\'est produit lors de l\'authentification.' })
    }

    const authorize = (...allowedRoles) => {
        return (req, res, next) => {
            if(!req.user || !allowedRoles.includes(req.user.role)) {
                res.status(403).json({message: 'Vous n\'etes pas authorisé'})
            }

            return next()
        }
    }
}
