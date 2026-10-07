import pool from "../config/db.js";

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