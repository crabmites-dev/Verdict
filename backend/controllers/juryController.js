import pool from "../config/db";

export const createCategorie = async (req, res) => {
    const {eventId, vote_mode, jury_weight} = req.body
    const name = req.body.name?.trim()

    if(!eventId || !vote_mode || !name) {
        return res.status(400).json({message: 'Remplir les champs obligatoires'})
    }

    try {
        const juryVote = vote_mode === 'mixed' ? parseInt(jury_weight, 10) : (vote_mode = 'jury_only ' ? 100 : 0)

        const insertQuery = 'INSERT INTO categories (event_id, name, vote_mode, jury_weight) VALUES ($1, $2, $3, $4) RETURNING id, event_id, name, vote_mode, jury_weight'

        const {rows} = await pool.query(insertQuery, [eventId, vote_mode, name, juryVote])

        return res.status(201).json({message: 'Categorie crée avec succès', category: rows[0]})
    } catch (error) {
        if (error.code === '23503'){
            return res.status(404).json({ message: 'The specified event_id does not exist.' });
        }
        console.error('Create category error:', error);
        return res.status(500).json({ message: 'Server error while creating category.' });
    }
     
}

export const getCategoriesByEvents = async (req, res) => {
    const {eventId} = req.params

    try {
        const queryText = 'SELECT event_id, name, vote_mode, jury_weight FROM categories WHERE event_id = $1 ORDER BY name DESC'

        const {rows} = await pool.query(queryText, [eventId])

        return res.status(200).json({categories: rows})
    } catch (error) {
        console.error('Get categories error:', error);
        return res.status(500).json({ message: 'Server error while fetching categories.' });
    }
}

export const createCandidate = async (req, res) => {
    const {category_id} = req.body
    const name =req.body.name?.trim()
    const photo_url = req.body.photo_url?.trim()
    const bio_program = req.body.bio_program?.trim()

    if(!category_id || !name) {
        return res.status(400).json({message: 'Le categorie et le nom du candidat sont obligatoures'})
    }

    try {
        const insertCandidate = 'INSERT INTO candidates (category_id, name, photo_url, bio_program) VALUES ($1, $2, $3, $4) RETURNING id, category_id, name, photo_url, bio_program, created_at'

        const {rows} = await pool.query(insertCandidate, [category_id, name, photo_url, bio_program])

        return res.status(200).json({message: 'Le candidat a été créé avec succès', candidate: rows[0]})
    } catch (error) {
        if (error.code === '23503') { 
            return res.status(404).json({ message: 'La catégorie parente n\'existe pas' });
        }
        console.error('Erreur lors de la creation:', error);
        return res.status(500).json({ message: 'Erreur serveur' });
    }
}

export const getCandidateByEvent = async (req, res) => {
    const {eventId} = req.body

    try {
        const queryText = `SELECT c.id AS candidate_id, c.name AS candidate_name, c.photo_url, c.bio_program, 
        cat.id AS category_id, cat.name AS name, cat.vote_mode
        FROM candidates c
        INNER JOIN categories cat ON c.categories_id = cat.id WHERE cat.event_id = $1
        ORDER BY cat.name ASC, c.name ASC
        `

        const {rows} = await pool.query(queryText, [eventId])

        return res.status(200).json({candidates: rows})
    } catch (error) {
        console.error('Une erreur est survenue:', error);
        return res.status(500).json({ message: 'Erreur serveur' });
    }
}