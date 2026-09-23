import pool from "../config/db";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken' 

const router = express()

const cookieOption = {
    httpOnly: 'true',
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
    maxAge: 24  * 60 * 60 * 1000
}

const generateToken = (id) => {
    return jwt.sign({id}= userId, process.env.NODE_ENV, {expiresIn: '30d'})
}

const generateResetCode = () => { String(Math.floor(100000 + Math.random() * 900000)) }

const register = async (req, res) => {
    const name = req.body.name?.trim()
    const email = req.body.email?.trim().toLowerCase()
    const password = req.body.password
    const role = req.body.role|| 'public'

    if(!name || !email || !password || !role) {
        return res.status(400).json({message: 'Veillez remplir tous les champs '})
    }
    
    try {
        const userExist = await pool.query('SELECT id FROM users WHERE email = $1', [email])
    
        if(userExist.rows[0].lenght > 0) {
            return res.status(409).json({message: 'L\'utilisateur existe deja'})
        }
    
        const hashedPassword = await bcrypt.hash(password, 10)

        const newUser = await pool.query('INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURN *', [name, email, hashedPassword, role])
        
        const userId = newUser.rows[0].id

        const token = generateToken(userId)
        res.cookie('token', token, cookieOption)

        return res.status(201).json({
            message: 'Utilisateur crée avec succes',
            user : {
                id: userId,
                name,
                email
            }
        }) 
    
    } catch (error) {
        return res.status(500).json({message: 'Erreur serveur'})
        console.error('Une erreur est survenue: ',err)
    }

}

const login = async (req, res) => {
    const email = req.body.email?.trim()
    const password = req.body.password

    if(!email || !password) {
        return res.status(400).json({message: 'Veillez remplir tous les champs obligatoires'})
    }

    try {
        const checkUser = await pool.query('SELECT * FROM users WHERE email = $1', [email])

        if(checkUser.rows.length === 0) {
            return res.status(404).json({message: 'Utilisateur introuvable'})
        }

        const user = checkUser.rows[0] 

        const checkPassword = bcrypt.compare(password, user.password)

        if(!checkPassword) {
            return res.status(400).json({message: 'Identifiants invalides'})
        }

        const token = generateToken(user.id)

        res.cookie('token', token,cookieOption)

        return res.status(200).json({message: 'Connection reussie'})
    } catch (error) {
        return res.status(500).json({message: 'Erreur serveur'})
        console.error('Une erreur est survenue: ',err) 
    }
} 

const getMe = async (req,res) => {
    try {
        const userResult = await pool.query('SELECT name, email FROM users WHERE id = $1', [req.user.id])
        if(userResult.rows.length === 0) {
            return res.status(404).json({message: 'Utilisateur introuvable'})
        }
        return res.json({user: userResult.rows[0]})
    } catch (error) {
        return res.status(500).json({message: 'Erreur serveur'})
        console.error('Une erreur est survenue: ',err) 
    }
} 

export const forgotPassword = async (req, res) => {
    const {email} = req.body

    if(!email) {
        return res.status(400).json({message: 'Veillez remplir tous les champs obligatoires'})
    }

    try {
        const user = await pool.query ('SELECT id FROM users WHERE email = $1', [email])

        if(user.rows.length === 0) {
            return res.status(200).json({message: 'Si ce compte existe, un code a été envoyé par e-mail.'})
        }

        const userId = user.rows[0].id
        const code = generateResetCode()
        const codeHash = await bcrypt.hash(code, 10)
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

        await pool.query('DELETE FROM password_reset_codes WHERE user_id = $1', [userId])
        await pool.query('INSERT INTO password_reset_codes (user_id, email, code_hash, expires_at) VALUES ($1, $2, $3, $4)',
            [userId, email, codeHash, expiresAt])

    } catch (error) {
        console.error('Une erreur est survenue', error)
        return res.status(500).json({ message: formatMailError(error) })
    }
}

export const resetPassword = async (req, res) => {
    const {email, code, newPassword} = req.body

    if(!email || !code || !newPassword) {
        return res.status(400).json({message: 'Veillez remplir tous les champs obligatoires'})
    }

    try {
        const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [email])

        if (userResult.rows.length === 0) {
            return res.status(404).json({message: 'Utilisateur introuvable'})
        }

        const userId = userResult.rows[0].id

        const codeResult = await pool.query('SELECT * FROM reset_password_code WHERE user_id = $1 AND email = $2 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1', [userId, email])

        if (codeResult.rows.length === 0 ) {
            return res.status(400).json({ message: 'Code expiré. Demandez un nouveau code.' })
        }

        const codeRows = codeResult.rows[0]

        const isValid = await bcrypt.compare(String(code).trim(), codeRows.code_hash)

        if(!isValid) {
            return res.status(404).json({message: 'Code invalide'})
        }

        const passwordHash = await bcrypt.hash(newPassword, 10)

        await pool.query('UPDATE users SET password = $1 WHERE id = $2',[passwordHash, userId]) 
        await pool.query('DELETE FROM password_reset_codes WHERE user_id = $1', [userId])

        return res.status(200).json({message: 'Mot de passe réinialisé avec succès !'})
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: 'Erreur serveur' })
    }
}

export const logout = async (req, res) => {  
        res.cookie('', token, {...cookieOption, maxAge:1})
        return res.status(200).json({message: 'Deconexion reussie'})
}