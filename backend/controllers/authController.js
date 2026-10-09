import pool from "../config/db.js";
import bcrypt from 'bcrypt';
import { OAuth2Client } from "google-auth-library";
import jwt from 'jsonwebtoken';

const cookieOption = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
    maxAge: 24 * 60 * 60 * 1000
};

const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRESIN || '24h'
    });
};

const generateResetCode = () => {
    return String(Math.floor(100000 + Math.random() * 900000));
};

const clientGoogle = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleLogin = async (req, res) => {
    const { idToken } = req.body;

    if (!idToken) {
        return res.status(400).json({ message: 'Le token google est requis' });
    }

    try {
        const ticket = await clientGoogle.verifyIdToken({
            idToken: idToken,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        const { email, name } = payload;
        const cleanEmail = email.trim().toLowerCase();

        const userResult = await pool.query('SELECT id, name, email, role FROM users WHERE email = $1', [cleanEmail]);

        let user;

        if (userResult.rows.length === 0) {
            const randomPassword = await bcrypt.hash(Math.random().toString(36), 10);
            // Toute nouvelle organisation s'enregistrant devient Administrateur de son espace
            const insertUser = 'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role';
            const newUser = await pool.query(insertUser, [name, cleanEmail, randomPassword, 'admin']);
            user = newUser.rows[0];
        } else {
            user = userResult.rows[0];
        }

        const token = generateToken(user.id);
        res.cookie('token', token, cookieOption);

        return res.status(200).json({
            message: 'Connecté avec succès !',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Google Auth Error:', error);
        return res.status(400).json({ message: 'Invalid Google token or authentication failed.' });
    }
};

/**
 * @desc    Inscription d'un nouvel espace Administrateur (Institution / Organisation)
 *          Les jurés sont invités par l'admin, et les votants n'ont pas de compte.
 * @route   POST /api/auth/register
 */
export const register = async (req, res) => {
    const name = req.body.name?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;
    
    // Sécurité SaaS : l'inscription publique crée obligatoirement un compte 'admin' d'organisation
    const role = 'admin';

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Veuillez remplir tous les champs obligatoires.' });
    }

    if (password.length < 6) {
        return res.status(400).json({ message: 'Le mot de passe doit comporter au moins 6 caractères.' });
    }

    try {
        const userExist = await pool.query('SELECT id FROM users WHERE email = $1', [email]);

        if (userExist.rows.length > 0) {
            return res.status(409).json({ message: 'Un compte avec cette adresse e-mail existe déjà.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await pool.query(
            'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
            [name, email, hashedPassword, role]
        );

        const createdUser = newUser.rows[0];
        const token = generateToken(createdUser.id);
        res.cookie('token', token, cookieOption);

        return res.status(201).json({
            message: 'Espace administrateur créé avec succès.',
            token,
            user: {
                id: createdUser.id,
                name: createdUser.name,
                email: createdUser.email,
                role: createdUser.role
            }
        });

    } catch (error) {
        console.error('Une erreur est survenue lors de l\'inscription: ', error);
        return res.status(500).json({ message: 'Erreur serveur.' });
    }
};

export const login = async (req, res) => {
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;

    if (!email || !password) {
        return res.status(400).json({ message: 'Veuillez remplir tous les champs obligatoires.' });
    }

    try {
        const checkUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (checkUser.rows.length === 0) {
            return res.status(404).json({ message: 'Utilisateur introuvable.' });
        }

        const user = checkUser.rows[0];
        const passwordHash = user.password_hash || user.password;
        const isMatch = await bcrypt.compare(password, passwordHash);

        if (!isMatch) {
            return res.status(400).json({ message: 'Identifiants invalides.' });
        }

        const token = generateToken(user.id);
        res.cookie('token', token, cookieOption);

        return res.status(200).json({
            message: 'Connexion réussie.',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Une erreur est survenue lors de la connexion: ', error);
        return res.status(500).json({ message: 'Erreur serveur.' });
    }
};

export const getMe = async (req, res) => {
    try {
        const userResult = await pool.query('SELECT id, name, email, role FROM users WHERE id = $1', [req.user.id]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'Utilisateur introuvable.' });
        }
        return res.json({ user: userResult.rows[0] });
    } catch (error) {
        console.error('Une erreur est survenue dans getMe: ', error);
        return res.status(500).json({ message: 'Erreur serveur.' });
    }
};

export const forgotPassword = async (req, res) => {
    const email = req.body.email?.trim().toLowerCase();

    if (!email) {
        return res.status(400).json({ message: 'Veuillez renseigner votre adresse e-mail.' });
    }

    try {
        const user = await pool.query('SELECT id FROM users WHERE email = $1', [email]);

        if (user.rows.length === 0) {
            return res.status(200).json({ message: 'Si ce compte existe, un code a été envoyé.' });
        }

        const userId = user.rows[0].id;
        const code = generateResetCode();
        const codeHash = await bcrypt.hash(code, 10);
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

        await pool.query('DELETE FROM password_reset_codes WHERE user_id = $1', [userId]);
        await pool.query(
            'INSERT INTO password_reset_codes (user_id, email, code_hash, expires_at) VALUES ($1, $2, $3, $4)',
            [userId, email, codeHash, expiresAt]
        );

        return res.status(200).json({ 
            message: 'Si ce compte existe, un code de réinitialisation a été généré.',
            ...(process.env.NODE_ENV !== 'production' && { devResetCode: code })
        });

    } catch (error) {
        console.error('Erreur forgotPassword: ', error);
        return res.status(500).json({ message: 'Une erreur est survenue lors de la demande de réinitialisation.' });
    }
};

export const resetPassword = async (req, res) => {
    const email = req.body.email?.trim().toLowerCase();
    const { code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
        return res.status(400).json({ message: 'Veuillez remplir tous les champs obligatoires.' });
    }

    try {
        const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [email]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'Utilisateur introuvable.' });
        }

        const userId = userResult.rows[0].id;

        const codeResult = await pool.query(
            'SELECT * FROM password_reset_codes WHERE user_id = $1 AND email = $2 AND expires_at > NOW() ORDER BY expires_at DESC LIMIT 1',
            [userId, email]
        );

        if (codeResult.rows.length === 0) {
            return res.status(400).json({ message: 'Code expiré ou inexistant. Demandez un nouveau code.' });
        }

        const codeRows = codeResult.rows[0];
        const isValid = await bcrypt.compare(String(code).trim(), codeRows.code_hash);

        if (!isValid) {
            return res.status(400).json({ message: 'Code invalide.' });
        }

        const passwordHash = await bcrypt.hash(newPassword, 10);

        await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, userId]);
        await pool.query('DELETE FROM password_reset_codes WHERE user_id = $1', [userId]);

        return res.status(200).json({ message: 'Mot de passe réinitialisé avec succès !' });
    } catch (error) {
        console.error('Erreur resetPassword: ', error);
        return res.status(500).json({ message: 'Erreur serveur.' });
    }
};

export const logout = async (req, res) => {  
    res.clearCookie('token', cookieOption);
    return res.status(200).json({ message: 'Déconnexion réussie.' });
};