import pool from "../config/db.js";
import crypto from 'crypto';

export const createEvent = async (req, res) => {
    const title = req.body.title?.trim();
    const description = req.body.description?.trim();
    const { start_date, end_date } = req.body;
    // Mode d'authentification hybride : 'open_public', 'restricted_token' ou 'restricted_otp'
    const auth_mode = req.body.auth_mode || 'open_public';
    const create_by = req.user.id;

    if (!title || !start_date || !end_date) {
        return res.status(400).json({ message: 'Veuillez renseigner tous les champs obligatoires' });
    }

    const validModes = ['open_public', 'restricted_token', 'restricted_otp'];
    if (!validModes.includes(auth_mode)) {
        return res.status(400).json({ 
            message: `Mode d'authentification invalide. Choisissez parmi: ${validModes.join(', ')}` 
        });
    }

    try {
        const insertQuery = `
            INSERT INTO events (title, description, start_date, end_date, status, created_by, auth_mode) 
            VALUES ($1, $2, $3, $4, 'draft', $5, $6) 
            RETURNING id, title, description, start_date, end_date, status, created_by, auth_mode
        `;

        const { rows } = await pool.query(insertQuery, [title, description, start_date, end_date, create_by, auth_mode]); 

        return res.status(201).json({ message: 'Votre événement a été créé avec succès !', event: rows[0] });
    } catch (error) {
        if (error.constraint === 'check_events_date' || error.constraint === 'check_event_dates') {
            return res.status(400).json({ message: 'La date de fin doit strictement être postérieure à celle du début' });
        }

        console.error('Une erreur est survenue lors de la création de l\'événement:', error);
        return res.status(500).json({ message: 'Erreur serveur' });
    }
};

export const getAllEvents = async (req, res) => {
    try {
        const result = 'SELECT * FROM events ORDER BY created_at DESC';

        const { rows } = await pool.query(result);

        return res.status(200).json({ events: rows });
    } catch (error) {
        console.error('Une erreur est survenue lors du chargement des événements:', error);
        return res.status(500).json({ message: 'Erreur serveur' });
    }
};

export const updateEvents = async (req, res) => {
    const { id } = req.params;
    const title = req.body.title?.trim();
    const description = req.body.description?.trim();
    const { start_date, end_date, status, auth_mode } = req.body;

    if (!title || !start_date || !end_date) {
        return res.status(400).json({ message: 'Veuillez renseigner tous les champs obligatoires' });
    }

    try {
        const updateQuery = `
            UPDATE events 
            SET title = $1, 
                description = $2, 
                start_date = $3, 
                end_date = $4, 
                status = COALESCE($5, status),
                auth_mode = COALESCE($6, auth_mode)
            WHERE id = $7 
            RETURNING id, title, description, start_date, end_date, status, auth_mode
        `;

        const { rows, rowCount } = await pool.query(updateQuery, [title, description, start_date, end_date, status, auth_mode, id]);

        if (rowCount === 0) {
            return res.status(404).json({ message: 'Événement introuvable' });
        }

        return res.status(200).json({ message: 'Événement modifié avec succès', event: rows[0] });
    } catch (error) {
        if (error.constraint === 'check_events_date' || error.constraint === 'check_event_dates') {
            return res.status(400).json({ message: 'La date de fin doit strictement être postérieure à celle du début' });
        }
        console.error('Update event error:', error);
        return res.status(500).json({ message: 'Erreur serveur' });
    }
};

export const closeEvents = async (req, res) => {
    const { id } = req.params;

    try {
        const closeQuery = `
            UPDATE events 
            SET status = 'closed', end_date = NOW() 
            WHERE id = $1 AND status = 'active' 
            RETURNING id, title, status, end_date
        `;

        const { rows, rowCount } = await pool.query(closeQuery, [id]); 

        if (rowCount === 0) {
            return res.status(404).json({ message: 'Événement actif introuvable ou déjà fermé' });
        }

        return res.status(200).json({ message: 'Événement fermé avec succès. La fenêtre de vote est désormais fermée', event: rows[0] });
    } catch (error) {
        console.error('Une erreur est survenue lors de la fermeture: ', error);
        return res.status(500).json({ message: 'Une erreur est survenue' });
    }
};

export const launchEvents = async (req, res) => {
    const { id } = req.params;

    try {
        const launchQuery = `
            UPDATE events 
            SET status = 'active'
            WHERE id = $1
            RETURNING id, title, status, start_date, end_date
        `;

        const { rows, rowCount } = await pool.query(launchQuery, [id]); 

        if (rowCount === 0) {
            return res.status(404).json({ message: 'Événement introuvable' });
        }

        return res.status(200).json({ message: 'Scrutin ouvert avec succès ! Les votes sont désormais ouverts.', event: rows[0] });
    } catch (error) {
        console.error('Une erreur est survenue lors de l\'ouverture du scrutin: ', error);
        return res.status(500).json({ message: 'Une erreur est survenue lors de l\'activation' });
    }
};

/**
 * @desc    Générer ou importer des jetons de vote uniques pour une élection fermée (Admin only)
 * @route   POST /api/events/:id/voter-tokens
 */
export const generateVoterTokens = async (req, res) => {
    const { id } = req.params;
    // voters: tableau d'objets [{ email, ref }] ou count: nombre de tokens anonymes à générer
    const { voters, count } = req.body;

    try {
        const eventCheck = await pool.query('SELECT id, title, auth_mode FROM events WHERE id = $1', [id]);
        if (eventCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Événement introuvable.' });
        }

        const event = eventCheck.rows[0];
        const insertedTokens = [];

        if (Array.isArray(voters) && voters.length > 0) {
            // Import d'une liste électorale nominative / avec emails
            for (const v of voters) {
                const token = crypto.randomBytes(24).toString('hex');
                const email = v.email ? v.email.trim().toLowerCase() : null;
                const ref = v.ref ? String(v.ref).trim() : null;

                const q = `
                    INSERT INTO event_voter_tokens (event_id, voter_email, voter_ref, token)
                    VALUES ($1, $2, $3, $4)
                    RETURNING id, voter_email, voter_ref, token, is_used
                `;
                const { rows } = await pool.query(q, [id, email, ref, token]);
                insertedTokens.push(rows[0]);
            }
        } else {
            // Génération par lot de jetons anonymes à usage unique
            const totalToGenerate = parseInt(count, 10) || 10;
            for (let i = 0; i < totalToGenerate; i++) {
                const token = crypto.randomBytes(24).toString('hex');
                const q = `
                    INSERT INTO event_voter_tokens (event_id, token)
                    VALUES ($1, $2)
                    RETURNING id, token, is_used
                `;
                const { rows } = await pool.query(q, [id, token]);
                insertedTokens.push(rows[0]);
            }
        }

        return res.status(201).json({
            message: `${insertedTokens.length} jetons de vote générés avec succès pour "${event.title}".`,
            total: insertedTokens.length,
            tokens: insertedTokens
        });

    } catch (error) {
        console.error('generateVoterTokens error:', error);
        return res.status(500).json({ message: 'Erreur lors de la génération des jetons de vote.' });
    }
};

/**
 * @desc    Obtenir la liste et les statistiques des jetons de vote (Admin only)
 * @route   GET /api/events/:id/voter-tokens
 */
export const getVoterTokens = async (req, res) => {
    const { id } = req.params;

    try {
        const { rows } = await pool.query(`
            SELECT id, voter_email, voter_ref, token, is_used, used_at, created_at 
            FROM event_voter_tokens 
            WHERE event_id = $1 
            ORDER BY created_at DESC
        `, [id]);

        const stats = {
            total: rows.length,
            used: rows.filter(r => r.is_used).length,
            remaining: rows.filter(r => !r.is_used).length
        };

        return res.status(200).json({ stats, tokens: rows });
    } catch (error) {
        console.error('getVoterTokens error:', error);
        return res.status(500).json({ message: 'Erreur serveur lors de la récupération des jetons.' });
    }
};