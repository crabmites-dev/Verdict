// backend/controllers/exportController.js
import PDFDocument from 'pdfkit';
import pool from '../config/db.js';

/**
 * @desc    Export category results as an Excel-compatible CSV file (Admin only)
 * @route   GET /api/exports/category/:categoryId/csv
 */
export const exportCategoryCSV = async (req, res) => {
    const { categoryId } = req.params;

    try {
        // Récupération du classement et des scores détaillés
        const queryText = `
            SELECT r.rank_position, c.name AS candidate_name, r.jury_score, r.public_score, r.final_score
            FROM results r
            INNER JOIN candidates c ON r.candidate_id = c.id
            WHERE r.category_id = $1
            ORDER BY r.rank_position ASC
        `;
        const { rows } = await pool.query(queryText, [categoryId]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'No consolidated results found for this category.' });
        }

        // Configuration des headers HTTP pour forcer le téléchargement du fichier CSV
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="results_category_${categoryId}.csv"`);

        // Ajout du BOM UTF-8 pour que Microsoft Excel lise correctement les accents (é, è, à)
        res.write('\uFEFF');

        // Écriture de la ligne d'en-tête (Header) avec séparateur point-virgule
        res.write('Rank;Candidate Name;Jury Score (Avg);Public Score (%);Final Score\n');

        // Écriture des lignes de données
        rows.forEach(row => {
            const escapedName = (row.candidate_name || '').replace(/"/g, '""');
            res.write(`${row.rank_position};"${escapedName}";${row.jury_score};${row.public_score};${row.final_score}\n`);
        });

        return res.end();

    } catch (error) {
        console.error('CSV Export Error:', error);
        return res.status(500).json({ message: 'Server error during CSV data extraction.' });
    }
};

/**
 * @desc    Export category results as an official printable PDF Document (Admin only)
 * @route   GET /api/exports/category/:categoryId/pdf
 */
export const exportCategoryPDF = async (req, res) => {
    const { categoryId } = req.params;

    try {
        // Récupération des informations de la catégorie et de l'événement lié
        const infoQuery = `
            SELECT cat.name AS category_name, e.title AS event_title 
            FROM categories cat
            INNER JOIN events e ON cat.event_id = e.id
            WHERE cat.id = $1
        `;
        const infoResult = await pool.query(infoQuery, [categoryId]);

        if (infoResult.rows.length === 0) {
            return res.status(404).json({ message: 'Category not found.' });
        }

        const { category_name, event_title } = infoResult.rows[0];

        // Récupération des scores et rangs
        const dataQuery = `
            SELECT r.rank_position, c.name AS candidate_name, r.jury_score, r.public_score, r.final_score
            FROM results r
            INNER JOIN candidates c ON r.candidate_id = c.id
            WHERE r.category_id = $1
            ORDER BY r.rank_position ASC
        `;
        const { rows } = await pool.query(dataQuery, [categoryId]);

        // Initialisation du flux PDF
        const doc = new PDFDocument({ margin: 50 });

        // Configuration des headers HTTP pour le téléchargement du PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="official_report_${categoryId}.pdf"`);
        doc.pipe(res);

        // --- DESIGN DU DOCUMENT PDF ---
        // En-tête officiel
        doc.fillColor('#1A365D').fontSize(22).text('OFFICIAL VOTING REPORT', { align: 'center' });
        doc.moveDown(0.5);
        doc.fillColor('#4A5568').fontSize(12).text(`Event: ${event_title}`, { align: 'center' });
        doc.text(`Category: ${category_name}`, { align: 'center' });
        doc.text(`Generated on: ${new Date().toLocaleDateString('en-US')}`, { align: 'center' });
        doc.moveDown(2);

        // Ligne de séparation esthétique
        doc.moveTo(50, 140).lineTo(562, 140).stroke('#CBD5E0');
        doc.moveDown(1);

        // Dessin du Tableau de Résultats
        let tableTop = 160;
        doc.fillColor('#2D3748').fontSize(11);
        
        // En-têtes du tableau
        doc.font('Helvetica-Bold');
        doc.text('Rank', 50, tableTop);
        doc.text('Candidate Name', 100, tableTop);
        doc.text('Jury Score', 280, tableTop);
        doc.text('Public (%)', 380, tableTop);
        doc.text('Final Score', 480, tableTop);
        
        doc.moveTo(50, tableTop + 15).lineTo(562, tableTop + 15).stroke('#718096');
        
        // Lignes du tableau
        let yPosition = tableTop + 25;
        doc.font('Helvetica');

        rows.forEach(row => {
            // Mise en valeur textuelle du vainqueur (Rang 1)
            if (parseInt(row.rank_position, 10) === 1) {
                doc.font('Helvetica-Bold').fillColor('#2F855A'); // Couleur verte
            } else {
                doc.font('Helvetica').fillColor('#2D3748');
            }

            doc.text(String(row.rank_position), 50, yPosition);
            doc.text(String(row.candidate_name || ''), 100, yPosition);
            doc.text(String(row.jury_score ?? '0.00'), 280, yPosition);
            doc.text(`${row.public_score ?? '0.00'} %`, 380, yPosition);
            doc.text(String(row.final_score ?? '0.00'), 480, yPosition);

            yPosition += 25;
        });

        // Zone de signatures officielles en bas de page
        doc.font('Helvetica-Oblique').fillColor('#718096');
        doc.text('Certified authentic and closed by the institutional election board.', 50, 650);
        doc.moveDown(1);
        doc.font('Helvetica-Bold').text('Signature / Stamp:', 50, 680);

        // Clôture définitive du flux de données PDF
        doc.end();

    } catch (error) {
        console.error('PDF Export Error:', error);
        return res.status(500).json({ message: 'Server error during PDF report compilation.' });
    }
};
