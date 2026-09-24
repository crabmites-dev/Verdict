import pool from "../config/db";

export const createEvent = async (req, res) => {
    const title = req.body.title?.trim()
    const description = req.body.description?.trim()
    const {start_date, end_date} = req.body
    const create_by = req.user.id

    if(!title || !start_date || !end_date) {
        return res.status(400).json({message: 'Veillez renseigner tous les champs obligatoires'})
    }

    try {
        const insertQuery =  `INSERT INTO events (title, description, start_date, end_date, status, create_by) VALUES ($1, $2, $3, $4, 'draft' $5) RETURNING id, title, description, start_date, end_date, status, create_by`

        const { rows } = await pool.query(insertQuery, [title, description, start_date, end_date, create_by]) 

        return res.status(201).json({message: 'Votre evenement a été crée avec succès !', event: rows[0]})
    } catch (error) {
        if(error.constraint === 'check_events_date') {
            return res.status(400).json({message: 'La date de fin foit strictement etre postérieur à celui du début'})
        }

        console.error('Une erreur est survenue lors de la creation de l\'evenement:', err)
        return res.status(500).json({message: 'Erreur serveur'})
    }
}

export const getAllEvents = async (req,res) => {
    try {
        let result = 'SELECT * FROM events ORDER BY create_at DESC'

        const {rows} = await pool.query(result)

        return res.status(200).json({events: rows})
    } catch (error) {
        console.error('Une erreur est survenue lors du chargement des evenement:', err)
        return res.status(500).json({message: 'Erreur serveur'})
    }
}

export const updateEvents = async (req, res) => {
    const {id} = req.params
    const title = req.body.title?.trim()
    const description = req.body.description?.trim()
    const {start_date, end_date, status} = req.body

    if(!title || !description || !start_date || !end_date) {
        return res.status(400).json({message: 'Veillez renseigner tous les champs obligatoires'})
    }

    try {
        const updateQuery = 'UPDATE events SET title = $1, description = $2, start_at = $3, end_at = $4, status = $5, WHERE id = $6 RETURNING id, title, description, start_date, end_date, status'

        const {rows, rowCount} = await pool.query(insertQuery, [title, description, start_date, end_date, status, id])

        if(rowCount === 0) {
            return res.status(404).json({message: 'Evenement introuvable'})
        }

        return res.status(200).json({message: 'Evenement modifié avec succès', events: rows[0]})
    } catch (error) {
        if (error.constraint === 'check_event_dates') {
            return res.status(400).json({ message: 'La date de fin foit strictement etre postérieur à celui du début' });
        }
        console.error('Update event error:', error);
        return res.status(500).json({ message: 'Erreur serveur' });
    }
}

export const closeEvents = async (req, res) => {
    const {id} = req.params

    try {
        closeQuery = ` UPDATE events SET status = 'closed', end_date = NOW() WHERE id = $1, status = 'active' RETURNING id, title, end_date`

        const {rows, rowCount} = await pool.query(closeQuery, [id]) 

        if(rowCount === 0) {
            return res.status(404).json({message: 'Evenement introuvable'})
        }

        return res.status(200).json({message: 'Evenement fermé avec succès. La fenetre de vote est desormais fermée', event: rows[0]})
    } catch (error) {
        console.error('Une errerur est survenue lors de la fermeture: ', err)
        return res.status(500).json({ message: 'Une erreur est survenue' });
    }
}