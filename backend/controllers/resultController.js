// backend/controllers/resultController.js
import pool from '../config/db.js';

/**
 * @desc    Calculate, consolidate, and store results for a specific category
 * @route   POST /api/results/consolidate/:categoryId
 */
export const categoryResults = async (req, res) => {
    const { categoryId } = req.params;

    try {
        // 1. Exécution de la grande requête SQL d'agrégation mathématique
        const calculationQuery = `
            WITH jury_agg AS (
                SELECT c.category_id, r.candidate_id,
                       ROUND(SUM(r.rating_value * (cr.weight::numeric / 100)) / COUNT(DISTINCT r.juror_id), 2) AS avg_jury_score
                FROM jury_ratings r
                INNER JOIN criteria cr ON r.criteria_id = cr.id
                INNER JOIN candidates c ON r.candidate_id = c.id
                WHERE c.category_id = $1
                GROUP BY c.category_id, r.candidate_id
            ),
            public_agg AS (
                SELECT candidate_id, COUNT(id) AS votes_count,
                       ROUND((COUNT(id)::numeric / NULLIF(SUM(COUNT(id)) OVER (), 0)) * 100, 2) AS public_percentage
                FROM public_votes
                WHERE category_id = $1
                GROUP BY candidate_id
            )
            SELECT c.id AS candidate_id, c.category_id,
                   COALESCE(j.avg_jury_score, 0.00) AS jury_score,
                   COALESCE(p.public_percentage, 0.00) AS public_score,
                   ROUND(CASE 
                        WHEN cat.vote_mode = 'jury_only' THEN COALESCE(j.avg_jury_score, 0.00)
                        WHEN cat.vote_mode = 'public_only' THEN COALESCE(p.public_percentage, 0.00)
                        ELSE (COALESCE(j.avg_jury_score, 0.00) * (cat.jury_weight::numeric / 100)) + 
                             (COALESCE(p.public_percentage, 0.00) * ((100 - cat.jury_weight)::numeric / 100))
                   END, 2) AS final_score,
                   RANK() OVER (
                        ORDER BY 
                            ROUND(CASE 
                                WHEN cat.vote_mode = 'jury_only' THEN COALESCE(j.avg_jury_score, 0.00)
                                WHEN cat.vote_mode = 'public_only' THEN COALESCE(p.public_percentage, 0.00)
                                ELSE (COALESCE(j.avg_jury_score, 0.00) * (cat.jury_weight::numeric / 100)) + 
                                     (COALESCE(p.public_percentage, 0.00) * ((100 - cat.jury_weight)::numeric / 100))
                            END, 2) DESC, 
                            COALESCE(j.avg_jury_score, 0.00) DESC
                   ) AS rank_position
            FROM candidates c
            INNER JOIN categories cat ON c.category_id = cat.id
            LEFT JOIN jury_agg j ON c.id = j.candidate_id
            LEFT JOIN public_agg p ON c.id = p.candidate_id
            WHERE c.category_id = $1
        `;

        const { rows } = await pool.query(calculationQuery, [categoryId]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'No candidates found in this category to calculate results.' });
        }

        // 2. Sauvegarde ou mise à jour (Upsert) des résultats dans la table 'results'
        for (const row of rows) {
            const upsertResultQuery = `
                INSERT INTO results (category_id, candidate_id, jury_score, public_score, final_score, rank_position, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
                ON CONFLICT (category_id, candidate_id)
                DO UPDATE SET 
                    jury_score = EXCLUDED.jury_score,
                    public_score = EXCLUDED.public_score,
                    final_score = EXCLUDED.final_score,
                    rank_position = EXCLUDED.rank_position,
                    updated_at = CURRENT_TIMESTAMP
            `;
            await pool.query(upsertResultQuery, [
                categoryId, 
                row.candidate_id, 
                row.jury_score, 
                row.public_score, 
                row.final_score, 
                row.rank_position
            ]);
        }

        return res.status(200).json({ 
            message: 'Results calculated and consolidated successfully in database.',
            results: rows 
        });

    } catch (error) {
        console.error('Consolidate results error:', error);
        return res.status(500).json({ message: 'Server error while calculating metrics.' });
    }
};

/**
 * @desc    Get consolidated results for a category (Dashboard view)
 * @route   GET /api/results/category/:categoryId
 */
export const getCategoryResults = async (req, res) => {
    const { categoryId } = req.params;

    try {
        const queryText = `
            SELECT r.rank_position, c.name AS candidate_name, r.jury_score, r.public_score, r.final_score, r.updated_at
            FROM results r
            INNER JOIN candidates c ON r.candidate_id = c.id
            WHERE r.category_id = $1
            ORDER BY r.rank_position ASC
        `;
        const { rows } = await pool.query(queryText, [categoryId]);
        
        return res.status(200).json({ results: rows });
    } catch (error) {
        console.error('Get category results error:', error);
        return res.status(500).json({ message: 'Server error while fetching results.' });
    }
};
