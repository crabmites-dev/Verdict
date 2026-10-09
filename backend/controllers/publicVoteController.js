import pool from "../config/db.js";
import crypto from 'crypto';

/**
 * @desc    Récupérer les scrutins actifs avec leur mode d'accès (public ou restreint)
 * @route   GET /api/public/active-polls
 */
export const getActivePublicPolls = async (req, res) => {
    try {
        const queryText = `
            SELECT 
                e.id AS event_id,
                e.title AS event_title,
                e.description AS event_description,
                e.end_date AS event_closes_at,
                e.auth_mode,
                c.id AS category_id,
                c.name AS category_name,
                c.vote_mode
            FROM events e
            INNER JOIN categories c ON e.id = c.event_id
            WHERE e.status = 'active'
              AND c.vote_mode IN ('public_only', 'mixed')
              AND NOW() BETWEEN e.start_date AND e.end_date
            ORDER BY e.end_date ASC, c.name ASC
        `;

        const { rows } = await pool.query(queryText);

        if (rows.length === 0) {
            return res.status(200).json({ message: 'Aucun vote actif n\'est disponible pour le moment', polls: [] });
        }

        const formattedPolls = rows.reduce((acc, row) => {
            let event = acc.find(e => e.id === row.event_id);
            if (!event) {
                event = {
                    id: row.event_id,
                    title: row.event_title,
                    description: row.event_description,
                    closes_at: row.event_closes_at,
                    auth_mode: row.auth_mode || 'open_public',
                    categories: []
                };
                acc.push(event);
            }
            event.categories.push({
                id: row.category_id,
                name: row.category_name,
                vote_mode: row.vote_mode
            });
            return acc;
        }, []);

        return res.status(200).json({
            message: 'Active public polls retrieved successfully.',
            polls: formattedPolls
        });

    } catch (error) {
        console.error('Get active public polls error:', error);
        return res.status(500).json({ 
            message: 'Une erreur est survenue lors de la récupération des scrutins disponibles.' 
        });
    }
};

/**
 * @desc    Récupérer les détails complets d'un scrutin (catégories et candidats) pour l'espace de vote
 * @route   GET /api/public/poll-details/:eventId
 */
export const getPollDetails = async (req, res) => {
    const { eventId } = req.params;

    try {
        const eventRes = await pool.query(`
            SELECT id, title, description, start_date, end_date, status, auth_mode 
            FROM events 
            WHERE id = $1
        `, [eventId]);

        if (eventRes.rows.length === 0) {
            return res.status(404).json({ message: 'Scrutin introuvable.' });
        }

        const event = eventRes.rows[0];

        // Récupérer les catégories qui autorisent le vote public ('public_only' ou 'mixed')
        const categoriesRes = await pool.query(`
            SELECT id, name, vote_mode, jury_weight 
            FROM categories 
            WHERE event_id = $1 AND vote_mode IN ('public_only', 'mixed')
            ORDER BY name ASC
        `, [eventId]);

        const categoriesWithCandidates = [];

        for (const cat of categoriesRes.rows) {
            const candidatesRes = await pool.query(`
                SELECT id, name, photo_url, bio_program 
                FROM candidates 
                WHERE category_id = $1 
                ORDER BY name ASC
            `, [cat.id]);

            categoriesWithCandidates.push({
                ...cat,
                candidates: candidatesRes.rows
            });
        }

        return res.status(200).json({
            event,
            categories: categoriesWithCandidates
        });

    } catch (error) {
        console.error('getPollDetails error:', error);
        return res.status(500).json({ message: 'Erreur lors du chargement des détails du scrutin.' });
    }
};

/**
 * @desc    Vérifier la validité d'un jeton ou d'un lien d'émargement avant de voter
 * @route   POST /api/public/verify-token
 */
export const verifyVoterToken = async (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).json({ message: 'Le jeton de vote est requis.' });
    }

    try {
        const query = `
            SELECT t.id, t.event_id, t.voter_email, t.voter_ref, t.is_used,
                   e.title AS event_title, e.status, e.start_date, e.end_date, e.auth_mode
            FROM event_voter_tokens t
            INNER JOIN events e ON t.event_id = e.id
            WHERE t.token = $1
        `;
        const { rows } = await pool.query(query, [token.trim()]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Jeton de vote invalide ou introuvable.' });
        }

        const voterToken = rows[0];

        if (voterToken.is_used) {
            return res.status(409).json({ message: 'Ce jeton a déjà été utilisé pour voter. Le scrutin est clôturé pour cet émargement.' });
        }

        const now = new Date();
        if (voterToken.status !== 'active' || now < new Date(voterToken.start_date) || now > new Date(voterToken.end_date)) {
            return res.status(400).json({ message: 'Ce scrutin n\'est pas actif ou la période de vote est expirée.' });
        }

        return res.status(200).json({
            valid: true,
            event: {
                id: voterToken.event_id,
                title: voterToken.event_title,
                auth_mode: voterToken.auth_mode
            },
            voter_ref: voterToken.voter_ref
        });

    } catch (error) {
        console.error('verifyVoterToken error:', error);
        return res.status(500).json({ message: 'Erreur lors de la vérification du jeton.' });
    }
};

/**
 * @desc    Émettre un vote (Supporte mode grand public et mode restreint / token d'émargement)
 * @route   POST /api/public/vote
 */
export const castPublicVote = async (req, res) => {
    const { category_id, candidate_id } = req.body;
    const voter_token = req.body.voter_token || req.body.token; // Pour scrutin restreint
    const client_fingerprint = req.body.voter_identifier || req.body.fingerprint; // Pour scrutin grand public

    if (!category_id || !candidate_id) {
        return res.status(400).json({ message: 'La catégorie et le candidat sont requis pour voter.' });
    }

    const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || '127.0.0.1';

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Récupération des informations de la catégorie et de l'événement associé
        const eventCheckQuery = `
            SELECT e.id AS event_id, e.status, e.start_date, e.end_date, e.auth_mode 
            FROM categories c
            INNER JOIN events e ON c.event_id = e.id
            WHERE c.id = $1
        `;
        const eventCheck = await client.query(eventCheckQuery, [category_id]);

        if (eventCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'La catégorie ou l\'événement spécifié n\'existe pas.' });
        }

        const { event_id, status, start_date, end_date, auth_mode } = eventCheck.rows[0];
        const now = new Date();

        if (status !== 'active' || now < new Date(start_date) || now > new Date(end_date)) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Le vote est actuellement clos ou pas encore actif pour cet événement.' });
        }

        let effectiveVoterIdentifier = null;

        // 2. Gestion selon le mode d'authentification de l'élection
        if (auth_mode === 'restricted_token' || auth_mode === 'restricted_otp') {
            // Mode Universitaire / Entreprise avec Jeton Unique
            if (!voter_token) {
                await client.query('ROLLBACK');
                return res.status(403).json({ 
                    message: 'Ce scrutin requiert un jeton d\'accès unique (fourni par votre organisation).' 
                });
            }

            // Vérification et verrouillage du jeton (SELECT FOR UPDATE) pour empêcher tout vote simultané
            const tokenQuery = `
                SELECT id, is_used 
                FROM event_voter_tokens 
                WHERE token = $1 AND event_id = $2 
                FOR UPDATE
            `;
            const tokenResult = await client.query(tokenQuery, [voter_token.trim(), event_id]);

            if (tokenResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ message: 'Jeton de vote invalide pour cette élection.' });
            }

            const tokenRow = tokenResult.rows[0];
            if (tokenRow.is_used) {
                await client.query('ROLLBACK');
                return res.status(409).json({ message: 'Ce jeton d\'émargement a déjà été consommé.' });
            }

            // Marquer le jeton comme utilisé
            await client.query(`
                UPDATE event_voter_tokens 
                SET is_used = TRUE, used_at = CURRENT_TIMESTAMP 
                WHERE id = $1
            `, [tokenRow.id]);

            // L'identifiant sécurisé est un hash du token (garantissant le secret du vote tout en assurant l'unicité)
            effectiveVoterIdentifier = `token_${crypto.createHash('sha256').update(voter_token).digest('hex').substring(0, 32)}`;

        } else {
            // Mode Grand Public : combinaison Fingerprint matériel + IP saltée
            if (!client_fingerprint) {
                await client.query('ROLLBACK');
                return res.status(400).json({ message: 'L\'empreinte de sécurité du navigateur est requise.' });
            }

            // Hachage cryptographique combiné anti-fraude
            const salt = process.env.JWT_SECRET || 'verdict_salt';
            const raw = `${client_fingerprint}_${clientIp}_${event_id}_${salt}`;
            effectiveVoterIdentifier = `pub_${crypto.createHash('sha256').update(raw).digest('hex').substring(0, 32)}`;
        }

        // 3. Enregistrement du vote avec contrainte UNIQUE (category_id, voter_identifier)
        const insertVote = `
            INSERT INTO public_votes (category_id, candidate_id, voter_identifier)
            VALUES ($1, $2, $3) 
            RETURNING id, category_id, candidate_id, voter_identifier, voted_at
        `;
        const { rows } = await client.query(insertVote, [category_id, candidate_id, effectiveVoterIdentifier]);

        await client.query('COMMIT');

        return res.status(200).json({ 
            message: 'Votre vote a été enregistré avec succès et sécurisé.', 
            vote: {
                id: rows[0].id,
                category_id: rows[0].category_id,
                candidate_id: rows[0].candidate_id,
                voted_at: rows[0].voted_at
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');

        if (error.code === '23505') {
            return res.status(409).json({ 
                message: 'Prévention de la fraude : vous avez déjà exprimé votre voix dans cette catégorie.' 
            });
        }

        if (error.code === '23503') {
            return res.status(404).json({ message: 'L\'ID du candidat ou de la catégorie est invalide.' });
        }

        console.error('castPublicVote error:', error);
        return res.status(500).json({ message: 'Une erreur serveur est survenue lors du dépouillement.' });
    } finally {
        client.release();
    }
};