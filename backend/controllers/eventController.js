import pool from "../config/db.js";

export const createEvent = async (req, res) => {
    const title = req.body.title?.trim();
    const description = req.body.description?.trim();
    const { start_date, end_date } = req.body;
    const create_by = req.user.id;

    if (!title || !start_date || !end_date) {
        return res.status(400).json({ message: 'Veuillez renseigner tous les champs obligatoires' });
    }

    try {
        const insertQuery = `
            INSERT INTO events (title, description, start_date, end_date, status, created_by) 
            VALUES ($1, $2, $3, $4, 'draft', $5) 
            RETURNING id, title, description, start_date, end_date, status, created_by
        `;

        const { rows } = await pool.query(insertQuery, [title, description, start_date, end_date, create_by]); 

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
    const { start_date, end_date, status } = req.body;

    if (!title || !start_date || !end_date) {
        return res.status(400).json({ message: 'Veuillez renseigner tous les champs obligatoires' });
    }

    try {
        const updateQuery = `
            UPDATE events 
            SET title = $1, description = $2, start_date = $3, end_date = $4, status = COALESCE($5, status) 
            WHERE id = $6 
            RETURNING id, title, description, start_date, end_date, status
        `;

        const { rows, rowCount } = await pool.query(updateQuery, [title, description, start_date, end_date, status, id]);

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