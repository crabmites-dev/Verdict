import pool from "../config/db";

export const getActivePublicPolls = async (req, res) => {
    try {
       const queryText = `SELECT 
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

        const {rows}= await pool.query(queryText)

        if (rows.length === 0) {
            return res.status(200).json({message: 'Aucun vote active n\'est dispinible pour le moment', polls:[]})
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
}