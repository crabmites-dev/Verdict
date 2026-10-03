import pool from "../config/db";

export const getStats = async (req, res) => {
     try {
       const eventsQuery = `
            SELECT status, COUNT(*) AS count
            FROM events 
            GROUP BY status
       ` 

       const totalPublicVote = 'SELECT COUNT(*) AS total_votes FROM public_votes'

       const juryActivity = `
            SELECT
                (SELECT COUNT(*) FROM jury_rating) AS submitted_ratings,
                (SELECT COUNT(*) FROM users WHERE role = 'jury') AS total_jurors
       `

       const eventsResults = await pool.query(eventsQuery)
       const publicVotesResults = await pool.query(totalPublicVote)
       const juryActivityResult = await pool.query(juryActivity)
    
       return res.status(200).json({
            message: 'Dashboard statistics fetched successfully.',
            data: {
                event_distribution: eventsResult.rows,
                total_public_votes: parseInt(publicVotesResult.rows[0].total_votes, 10),
                jury_activity: {
                    submitted_ratings: parseInt(juryActivityResult.rows[0].submitted_ratings, 10),
                    total_registered_jurors: parseInt(juryActivityResult.rows[0].total_jurors, 10)
                }
            }
        });
       
    } catch (error) {
        console.error('Get dashboard stats error:', error);
        return res.status(500).json({ message: 'Server error while compiling dashboard metrics.' });
    }
}

export const getAuditLog = async (req, res) => {
    try {
        // Requête SQL native unifiée (UNION) pour extraire chronologiquement 
        // l'historique complet des votes du public et des jurés
        const auditQuery = `
            SELECT 
                'public_vote' AS action_type,
                voter_identifier AS actor_identity,
                candidate_id,
                category_id,
                voted_at AS timestamp
            FROM public_votes
            
            UNION ALL
            
            SELECT 
                'jury_rating' AS action_type,
                u.email AS actor_identity,
                r.candidate_id,
                c.category_id,
                r.voted_at AS timestamp
            FROM jury_ratings r
            INNER JOIN users u ON r.juror_id = u.id
            INNER JOIN criteria c ON r.criteria_id = c.id
            
            ORDER BY timestamp DESC
            LIMIT 500
        `;

        const { rows } = await pool.query(auditQuery);

        return res.status(200).json({
            message: 'Audit log retrieved successfully.',
            logs: rows
        });
    } catch (error) {
        console.error('Get audit log error:', error);
        return res.status(500).json({ message: 'Server error while fetching audit trail.' });
    }
};