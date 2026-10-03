import pool from "../config/db.js";

export const createCriterion = async (req, res) => {
    const { category_id, weight, min_scale, max_scale } = req.body;
    const label = req.body.label?.trim();

    if (!category_id || !label || weight === undefined) {
        return res.status(400).json({ message: 'Veuillez remplir tous les champs obligatoires' });
    }

    try {
        const insertQuery = 'INSERT INTO criteria (category_id, label, weight, min_scale, max_scale) VALUES ($1, $2, $3, $4, $5) RETURNING id, category_id, label, weight, min_scale, max_scale';

        const { rows } = await pool.query(insertQuery, [
            category_id, 
            label,
            parseInt(weight, 10),
            min_scale !== undefined ? parseInt(min_scale, 10) : 0,
            max_scale !== undefined ? parseInt(max_scale, 10) : 20
        ]);

        return res.status(201).json({ message: 'Le critère d\'évaluation a été créé avec succès', criterion: rows[0] });

    } catch (error) {
        if (error.constraint === 'check_criteria_scale') {
            return res.status(400).json({ message: 'La note maximale doit être supérieure à la note minimale' });
        }
        if (error.code === '23503') {
            return res.status(404).json({ message: 'La catégorie n\'existe pas' });
        }
        console.error('Erreur survenue lors de la création du critère:', error);
        return res.status(500).json({ message: 'Erreur serveur' }); 
    }
};

export const getCriteriaByCategorie = async (req, res) => {
    const { categoryId, category_id } = req.params;
    const catId = categoryId || category_id;

    try {
        const queryText = 'SELECT id, label, weight, min_scale, max_scale FROM criteria WHERE category_id = $1 ORDER BY label ASC';

        const { rows } = await pool.query(queryText, [catId]);
        
        return res.status(200).json({ criteria: rows });
    } catch (error) {
        console.error('Une erreur est survenue lors de la récupération des critères:', error);
        return res.status(500).json({ message: 'Erreur serveur' });
    }
};

export const submitJuryRating = async (req, res) => {
    const { criteria_id, candidate_id, rating_value } = req.body;
    const juror_id = req.user.id;

    if (!criteria_id || !candidate_id || rating_value === undefined) {
        return res.status(400).json({ message: 'Veuillez renseigner les champs obligatoires.' });
    }

    try {
        const criteriaCheck = await pool.query('SELECT min_scale, max_scale FROM criteria WHERE id = $1', [criteria_id]);

        if (criteriaCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Critère d\'évaluation introuvable' });
        }

        const { min_scale, max_scale } = criteriaCheck.rows[0];
        const numericValue = parseFloat(rating_value);

        if (numericValue < min_scale || numericValue > max_scale) {
            return res.status(400).json({ 
                message: `Note invalide. La valeur doit être comprise entre ${min_scale} et ${max_scale}.` 
            });
        }

        const upsertQuery = `
            INSERT INTO jury_ratings (criteria_id, candidate_id, juror_id, rating_value)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (criteria_id, candidate_id, juror_id) 
            DO UPDATE SET rating_value = EXCLUDED.rating_value, voted_at = CURRENT_TIMESTAMP
            RETURNING id, criteria_id, candidate_id, juror_id, rating_value, voted_at
        `;

        const { rows } = await pool.query(upsertQuery, [criteria_id, candidate_id, juror_id, numericValue]);

        return res.status(200).json({
            message: 'Note du jury enregistrée avec succès.',
            rating: rows[0]
        });
    } catch (error) {
        if (error.code === '23503') {
            return res.status(404).json({ message: 'Échec de liaison des ressources. Vérifiez l\'ID du critère ou du candidat.' });
        }
        console.error('Submit jury rating error:', error);
        return res.status(500).json({ message: 'Erreur serveur lors de la soumission de la note.' });
    }
};
