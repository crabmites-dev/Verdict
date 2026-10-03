import pool from "../config/db.js";

export const getActivePublicPolls = async (req, res) => {
    try {
        const queryText = `
            SELECT 
                e.id AS event_id,
                e.title AS event_title,
                e.description AS event_description,
                e.end_date AS event_closes_at,
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
            message: 'An error occurred while fetching available voting events.' 
        });
    }
};

export const castPublicVote = async (req, res) => {
    // vote_identifier ou voter_identifier
    const category_id = req.body.category_id;
    const candidate_id = req.body.candidate_id;
    const voter_identifier = req.body.voter_identifier || req.body.vote_identifier;

    if (!category_id || !candidate_id || !voter_identifier) {
        return res.status(400).json({ message: 'Il y a un champ de vote manquant. Tous les champs sont requis !' });
    }

    try {
        const eventCheckQuery = `
            SELECT e.id AS event_id, e.status, e.start_date, e.end_date 
            FROM categories c
            INNER JOIN events e ON c.event_id = e.id
            WHERE c.id = $1
        `;

        const eventCheck = await pool.query(eventCheckQuery, [category_id]);

        if (eventCheck.rows.length === 0) {
            return res.status(404).json({ message: 'La catégorie ou l\'événement spécifié n\'existe pas.' });
        }

        const { status, start_date, end_date } = eventCheck.rows[0];
        const now = new Date();

        if (status !== 'active' || now < new Date(start_date) || now > new Date(end_date)) {
            return res.status(400).json({ message: 'Le vote est actuellement clos ou pas encore actif pour cet événement.' });
        }

        const insertVote = `
            INSERT INTO public_votes (category_id, candidate_id, voter_identifier)
            VALUES ($1, $2, $3) 
            RETURNING id, category_id, candidate_id, voter_identifier, voted_at
        `;

        const { rows } = await pool.query(insertVote, [category_id, candidate_id, voter_identifier]);

        return res.status(200).json({ message: 'Votre vote a été enregistré avec succès et sécurisé.', vote: rows[0] });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ message: 'Prévention de la fraude : vous avez déjà voté dans cette catégorie.' });
        }

        if (error.code === '23503') {
            return res.status(404).json({ message: 'L\'ID du candidat ou de la catégorie est invalide.' });
        }

        console.error('Une erreur est survenue lors du vote public : ', error);
        return res.status(500).json({ message: 'Une erreur serveur est survenue.' });
    }
};