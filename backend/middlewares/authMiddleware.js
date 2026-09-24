import jwt from 'jsonwebtoken'
import pool from '../config/db'

export const protect = async (req, res, next) => {  
    try {
        const token = req.cookies.token
    
        if(!token) {
            return res.status(400).json({message: 'Le token est introuvable'})
        }
    
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
        const userResult = await pool.query('SELECT id, name, email FROM users WHERE email = $1', [decoded.id])
    
        if(userResult.rows.length === 0) {
            return res.status(401).json({message: 'Pas autorise'})
        }
    
        req.user = userResult.rows[0]
    
        next()
        
    } catch (error) {
        return res.status(500).json({message: 'Erreur serveur'})
    }
}
