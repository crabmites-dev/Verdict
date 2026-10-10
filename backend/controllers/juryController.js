import pool from "../config/db.js";
import bcrypt from "bcrypt";
import crypto from "crypto";

/**
 * @desc    Inviter ou accréditer un juré pour un événement spécifique (Admin only)
 * @route   POST /api/jury-panel/events/:eventId/invite-juror
 */
export const inviteJurorToEvent = async (req, res) => {
    const { eventId } = req.params;
    const email = req.body.email?.trim().toLowerCase();
    const name = req.body.name?.trim() || "Membre du Jury";
    const providedPassword = req.body.password?.trim();

    if (!eventId || !email) {
        return res.status(400).json({ message: "L'ID de l'événement et l'adresse email sont requis." });
    }

    try {
        // 1. Vérifier si l'événement existe
        const eventCheck = await pool.query('SELECT id, title FROM events WHERE id = $1', [eventId]);
        if (eventCheck.rows.length === 0) {
            return res.status(404).json({ message: "Événement introuvable." });
        }

        // 2. Vérifier si l'utilisateur existe déjà
        const userCheck = await pool.query('SELECT id, name, email, role FROM users WHERE email = $1', [email]);
        let jurorId;
        let generatedPassword = null;

        if (userCheck.rows.length > 0) {
            jurorId = userCheck.rows[0].id;
            // S'assurer que le rôle est au minimum 'jury' (sauf s'il est déjà admin)
            if (userCheck.rows[0].role !== 'admin') {
                await pool.query("UPDATE users SET role = 'jury' WHERE id = $1", [jurorId]);
            }
        } else {
            // Créer le compte avec mot de passe fourni ou généré
            generatedPassword = providedPassword || crypto.randomBytes(4).toString('hex') + 'V!';
            const hash = await bcrypt.hash(generatedPassword, 10);

            const newUser = await pool.query(
                "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, 'jury') RETURNING id, name, email, role",
                [name, email, hash]
            );
            jurorId = newUser.rows[0].id;
        }

        // 3. Associer le juré à l'événement dans event_jurors
        const assignQuery = `
            INSERT INTO event_jurors (event_id, user_id)
            VALUES ($1, $2)
            ON CONFLICT (event_id, user_id) DO NOTHING
            RETURNING id, event_id, user_id, invited_at
        `;
        const { rows, rowCount } = await pool.query(assignQuery, [eventId, jurorId]);

        if (rowCount === 0) {
            return res.status(400).json({ message: "Ce juré est déjà accrédité pour ce scrutin." });
        }

        return res.status(201).json({
            message: `Juré accrédité avec succès pour "${eventCheck.rows[0].title}".`,
            juror: {
                id: jurorId,
                name: name,
                email: email,
                initialPassword: generatedPassword // Renvoyé pour que l'admin puisse lui transmettre si nouveau compte
            }
        });

    } catch (error) {
        console.error("Invite juror error:", error);
        return res.status(500).json({ message: "Erreur serveur lors de l'accréditation du juré." });
    }
};

/**
 * @desc    Lister les jurés accrédités pour un événement (Admin only)
 * @route   GET /api/jury-panel/events/:eventId/jurors
 */
export const getEventJurors = async (req, res) => {
    const { eventId } = req.params;

    try {
        const queryText = `
            SELECT u.id, u.name, u.email, u.role, ej.invited_at,
                   (SELECT COUNT(DISTINCT r.candidate_id) 
                    FROM jury_ratings r 
                    INNER JOIN criteria cr ON r.criteria_id = cr.id
                    INNER JOIN categories cat ON cr.category_id = cat.id
                    WHERE r.juror_id = u.id AND cat.event_id = $1) AS evaluated_candidates_count
            FROM event_jurors ej
            INNER JOIN users u ON ej.user_id = u.id
            WHERE ej.event_id = $1
            ORDER BY ej.invited_at DESC
        `;
        const { rows } = await pool.query(queryText, [eventId]);

        return res.status(200).json({ jurors: rows });
    } catch (error) {
        console.error("Get event jurors error:", error);
        return res.status(500).json({ message: "Erreur lors de la récupération des jurés." });
    }
};

/**
 * @desc    Révoquer l'accréditation d'un juré sur un événement (Admin only)
 * @route   DELETE /api/jury-panel/events/:eventId/jurors/:userId
 */
export const removeJurorFromEvent = async (req, res) => {
    const { eventId, userId } = req.params;

    try {
        const deleteQuery = 'DELETE FROM event_jurors WHERE event_id = $1 AND user_id = $2 RETURNING id';
        const { rowCount } = await pool.query(deleteQuery, [eventId, userId]);

        if (rowCount === 0) {
            return res.status(404).json({ message: "Ce juré ne fait pas partie de ce scrutin." });
        }

        return res.status(200).json({ message: "Accréditation du juré révoquée avec succès." });
    } catch (error) {
        console.error("Remove juror error:", error);
        return res.status(500).json({ message: "Erreur serveur lors de la révocation du juré." });
    }
};

export const createCategorie = async (req, res) => {
    const { eventId, vote_mode, jury_weight } = req.body;
    const name = req.body.name?.trim();

    if (!eventId || !vote_mode || !name) {
        return res.status(400).json({ message: 'Veuillez remplir tous les champs obligatoires', debugReceived: { eventId, name, vote_mode } });
    }

    try {
        const juryVote = vote_mode === 'mixed' 
            ? parseInt(jury_weight, 10) 
            : (vote_mode === 'jury_only' ? 100 : 0);

        const insertQuery = 'INSERT INTO categories (event_id, name, vote_mode, jury_weight) VALUES ($1, $2, $3, $4) RETURNING id, event_id, name, vote_mode, jury_weight';

        const { rows } = await pool.query(insertQuery, [eventId, name, vote_mode, juryVote]);

        return res.status(201).json({ message: 'Catégorie créée avec succès', category: rows[0] });
    } catch (error) {
        if (error.code === '23503') {
            return res.status(404).json({ message: 'L\'événement spécifié n\'existe pas.' });
        }
        console.error('Create category error:', error);
        return res.status(500).json({ message: 'Erreur serveur lors de la création de la catégorie.' });
    }
};

export const getCategoriesByEvents = async (req, res) => {
    const { eventId } = req.params;

    try {
        const queryText = 'SELECT id, event_id, name, vote_mode, jury_weight FROM categories WHERE event_id = $1 ORDER BY name ASC';

        const { rows } = await pool.query(queryText, [eventId]);

        return res.status(200).json({ categories: rows });
    } catch (error) {
        console.error('Get categories error:', error);
        return res.status(500).json({ message: 'Erreur serveur lors de la récupération des catégories.' });
    }
};

export const createCandidate = async (req, res) => {
    const { category_id } = req.body;
    const name = req.body.name?.trim();
    const photo_url = req.body.photo_url?.trim() || null;
    const bio_program = req.body.bio_program?.trim() || null;

    if (!category_id || !name) {
        return res.status(400).json({ message: 'La catégorie et le nom du candidat sont obligatoires' });
    }

    try {
        const insertCandidate = 'INSERT INTO candidates (category_id, name, photo_url, bio_program) VALUES ($1, $2, $3, $4) RETURNING id, category_id, name, photo_url, bio_program, created_at';

        const { rows } = await pool.query(insertCandidate, [category_id, name, photo_url, bio_program]);

        return res.status(201).json({ message: 'Le candidat a été créé avec succès', candidate: rows[0] });
    } catch (error) {
        if (error.code === '23503') { 
            return res.status(404).json({ message: 'La catégorie parente n\'existe pas.' });
        }
        console.error('Erreur lors de la création du candidat:', error);
        return res.status(500).json({ message: 'Erreur serveur' });
    }
};

export const getCandidateByEvent = async (req, res) => {
    const eventId = req.params.eventId || req.body.eventId;

    if (!eventId) {
        return res.status(400).json({ message: 'L\'ID de l\'événement est requis.' });
    }

    try {
        const queryText = `
            SELECT c.id AS candidate_id, c.name AS candidate_name, c.photo_url, c.bio_program, 
                   cat.id AS category_id, cat.name AS category_name, cat.vote_mode
            FROM candidates c
            INNER JOIN categories cat ON c.category_id = cat.id 
            WHERE cat.event_id = $1
            ORDER BY cat.name ASC, c.name ASC
        `;

        const { rows } = await pool.query(queryText, [eventId]);

        return res.status(200).json({ candidates: rows });
    } catch (error) {
        console.error('Une erreur est survenue lors de la récupération des candidats:', error);
        return res.status(500).json({ message: 'Erreur serveur' });
    }
};

/**
 * @desc    Récupérer les catégories, critères et candidats à noter pour le juré connecté
 * @route   GET /api/jury-panel/evaluation-board/:eventId
 */
export const getJuryEvaluationBoard = async (req, res) => {
    const { eventId } = req.params;
    const jurorId = req.user.id;
    const userRole = req.user.role;

    try {
        const eventQuery = `
            SELECT id, title, description, status, start_date, end_date
            FROM events
            WHERE id = $1
        `;
        const eventRes = await pool.query(eventQuery, [eventId]);

        if (eventRes.rows.length === 0) {
            return res.status(404).json({ message: 'Événement introuvable.' });
        }

        // CONTRÔLE D'ACCÈS DU JURÉ :
        // L'admin peut tout prévisualiser ; un juré doit obligatoirement avoir été accrédité par l'admin dans event_jurors
        if (userRole !== 'admin') {
            const accreditCheck = await pool.query(
                'SELECT id FROM event_jurors WHERE event_id = $1 AND user_id = $2',
                [eventId, jurorId]
            );
            if (accreditCheck.rows.length === 0) {
                return res.status(403).json({ 
                    message: "Accès refusé. Vous n'avez pas été mandaté par l'administrateur comme membre du jury pour ce scrutin." 
                });
            }
        }

        // Catégories concernées par le vote du jury ('jury_only' ou 'mixed')
        const categoriesQuery = `
            SELECT id, name, vote_mode, jury_weight
            FROM categories
            WHERE event_id = $1 AND vote_mode IN ('jury_only', 'mixed')
            ORDER BY name ASC
        `;
        const categoriesRes = await pool.query(categoriesQuery, [eventId]);

        const categoriesData = [];

        for (const cat of categoriesRes.rows) {
            const candidatesRes = await pool.query(`
                SELECT id, name, photo_url, bio_program
                FROM candidates
                WHERE category_id = $1
                ORDER BY name ASC
            `, [cat.id]);

            const criteriaRes = await pool.query(`
                SELECT id, label, weight, min_scale, max_scale
                FROM criteria
                WHERE category_id = $1
                ORDER BY id ASC
            `, [cat.id]);

            const ratingsRes = await pool.query(`
                SELECT r.id, r.candidate_id, r.criteria_id, r.rating_value, r.voted_at
                FROM jury_ratings r
                INNER JOIN criteria cr ON r.criteria_id = cr.id
                WHERE cr.category_id = $1 AND r.juror_id = $2
            `, [cat.id, jurorId]);

            categoriesData.push({
                ...cat,
                candidates: candidatesRes.rows,
                criteria: criteriaRes.rows,
                myRatings: ratingsRes.rows
            });
        }

        return res.status(200).json({
            event: eventRes.rows[0],
            categories: categoriesData
        });

    } catch (error) {
        console.error('getJuryEvaluationBoard error:', error);
        return res.status(500).json({ message: 'Erreur lors du chargement de la grille d\'évaluation.' });
    }
};

/**
 * @desc    Soumettre ou mettre à jour un ensemble de notes pour un candidat (Jury)
 * @route   POST /api/jury-panel/bulk-ratings
 */
export const submitBulkRatings = async (req, res) => {
    const { candidate_id, ratings } = req.body; // ratings: [{ criteria_id, rating_value }]
    const jurorId = req.user.id;
    const userRole = req.user.role;

    if (!candidate_id || !Array.isArray(ratings) || ratings.length === 0) {
        return res.status(400).json({ message: 'Le candidat et la liste des notes sont obligatoires.' });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Vérifier à quel événement appartient ce candidat
        const candEventCheck = await client.query(`
            SELECT cat.event_id 
            FROM candidates c
            INNER JOIN categories cat ON c.category_id = cat.id
            WHERE c.id = $1
        `, [candidate_id]);

        if (candEventCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Candidat introuvable.' });
        }

        const eventId = candEventCheck.rows[0].event_id;

        // VÉRIFICATION D'ACCRÉDITATION OBLIGATOIRE DU JURÉ
        if (userRole !== 'admin') {
            const accredit = await client.query(
                'SELECT id FROM event_jurors WHERE event_id = $1 AND user_id = $2',
                [eventId, jurorId]
            );
            if (accredit.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(403).json({ 
                    message: "Interdit : vous n'êtes pas accrédité comme juré sur ce scrutin." 
                });
            }
        }

        const savedRatings = [];

        for (const item of ratings) {
            const { criteria_id, rating_value } = item;
            const numericValue = parseFloat(rating_value);

            const critCheck = await client.query('SELECT min_scale, max_scale FROM criteria WHERE id = $1', [criteria_id]);
            if (critCheck.rows.length === 0) continue;

            const { min_scale, max_scale } = critCheck.rows[0];
            if (numericValue < min_scale || numericValue > max_scale) {
                await client.query('ROLLBACK');
                return res.status(400).json({ 
                    message: `La note pour le critère #${criteria_id} doit être comprise entre ${min_scale} et ${max_scale}.` 
                });
            }

            const upsertQuery = `
                INSERT INTO jury_ratings (criteria_id, candidate_id, juror_id, rating_value, voted_at)
                VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
                ON CONFLICT (criteria_id, candidate_id, juror_id)
                DO UPDATE SET rating_value = EXCLUDED.rating_value, voted_at = CURRENT_TIMESTAMP
                RETURNING id, criteria_id, candidate_id, juror_id, rating_value, voted_at
            `;
            const { rows } = await client.query(upsertQuery, [criteria_id, candidate_id, jurorId, numericValue]);
            savedRatings.push(rows[0]);
        }

        await client.query('COMMIT');

        return res.status(200).json({
            message: 'Toutes les notes ont été certifiées et enregistrées.',
            ratings: savedRatings
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('submitBulkRatings error:', error);
        return res.status(500).json({ message: 'Erreur serveur lors de l\'enregistrement des notes.' });
    } finally {
        client.release();
    }
};