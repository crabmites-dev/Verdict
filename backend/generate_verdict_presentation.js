import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

const outputPath = path.resolve('..', 'VERDICT_PRESENTATION_OFFICIELLE.pdf');
const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 45, bottom: 45, left: 45, right: 45 },
  bufferPages: true
});

const writeStream = fs.createWriteStream(outputPath);
doc.pipe(writeStream);

// Couleurs de la charte Verdict
const COLOR_PRIMARY = '#4f46e5';    // Indigo moderne
const COLOR_SECONDARY = '#0f172a';  // Ardoise sombre / Dark slate
const COLOR_ACCENT = '#10b981';     // Émeraude succès
const COLOR_TEXT = '#334155';       // Gris foncé texte de lecture
const COLOR_MUTED = '#64748b';      // Gris secondaire
const COLOR_LIGHT_BG = '#f8fafc';   // Fond carte doux
const COLOR_BORDER = '#e2e8f0';     // Bordure claire
const COLOR_PURPLE = '#7c3aed';     // Violet juré

function drawHeaderBand(title, category = "DOSSIER OFFICIEL DE PRÉSENTATION") {
  doc.rect(45, doc.y, 505, 3).fill(COLOR_PRIMARY);
  doc.y += 10;
  doc.font('Helvetica-Bold').fontSize(8).fillColor(COLOR_PRIMARY).text(category.toUpperCase(), { characterSpacing: 1.5 });
  doc.font('Helvetica-Bold').fontSize(16).fillColor(COLOR_SECONDARY).text(title);
  doc.moveDown(0.8);
}

function drawSectionTitle(title, iconSymbol = "■") {
  doc.moveDown(0.6);
  const currentY = doc.y;
  doc.rect(45, currentY + 2, 4, 15).fill(COLOR_PRIMARY);
  doc.font('Helvetica-Bold').fontSize(13).fillColor(COLOR_SECONDARY).text(`   ${title}`, 50, currentY);
  doc.moveDown(0.6);
}

function drawSubsectionTitle(title) {
  doc.font('Helvetica-Bold').fontSize(11).fillColor(COLOR_PRIMARY).text(title);
  doc.moveDown(0.3);
}

function drawParagraph(text) {
  doc.font('Helvetica').fontSize(9.5).fillColor(COLOR_TEXT).lineGap(3).text(text, { align: 'justify' });
  doc.moveDown(0.5);
}

function drawBullet(title, desc) {
  const startX = 55;
  const bulletY = doc.y;
  doc.circle(startX + 2, bulletY + 5, 2.5).fill(COLOR_PRIMARY);
  doc.font('Helvetica-Bold').fontSize(9.5).fillColor(COLOR_SECONDARY).text(title + " : ", startX + 12, bulletY, { continued: true });
  doc.font('Helvetica').fontSize(9.5).fillColor(COLOR_TEXT).text(desc, { align: 'justify', lineGap: 2 });
  doc.moveDown(0.35);
}

function drawCallout(title, text, borderColor = COLOR_PRIMARY, bgColor = COLOR_LIGHT_BG) {
  const startY = doc.y;
  const padding = 12;
  const width = 505;
  
  // Estimation de hauteur
  doc.font('Helvetica-Bold').fontSize(10);
  const titleHeight = doc.heightOfString(title, { width: width - (padding * 2) });
  doc.font('Helvetica').fontSize(9);
  const textHeight = doc.heightOfString(text, { width: width - (padding * 2) });
  const boxHeight = titleHeight + textHeight + (padding * 2) + 4;

  doc.roundedRect(45, startY, width, boxHeight, 8).fill(bgColor);
  doc.roundedRect(45, startY, width, boxHeight, 8).lineWidth(1).stroke(COLOR_BORDER);
  doc.rect(45, startY, 4, boxHeight).fill(borderColor);

  doc.font('Helvetica-Bold').fontSize(10).fillColor(borderColor).text(title, 45 + padding + 4, startY + padding);
  doc.font('Helvetica').fontSize(9).fillColor(COLOR_TEXT).lineGap(2).text(text, 45 + padding + 4, startY + padding + titleHeight + 4, { width: width - (padding * 2) - 8, align: 'justify' });
  
  doc.y = startY + boxHeight + 10;
}

// ========================================================
// PAGE 1 : COUVERTURE & VISION STRATÉGIQUE
// ========================================================
doc.rect(0, 0, 595.28, 841.89).fill('#ffffff');

// Bande décorative supérieure
doc.rect(0, 0, 595.28, 12).fill(COLOR_PRIMARY);

doc.y = 80;
// Badge
doc.roundedRect(45, doc.y, 200, 22, 11).fill('#e0e7ff');
doc.font('Helvetica-Bold').fontSize(8.5).fillColor(COLOR_PRIMARY).text("PLATEFORME SAAS DE GOUVERNANCE", 55, doc.y + 6);

doc.y = 120;
doc.font('Helvetica-Bold').fontSize(38).fillColor(COLOR_SECONDARY).text("VERDICT.", { characterSpacing: 1 });
doc.font('Helvetica-Bold').fontSize(18).fillColor(COLOR_PRIMARY).text("L'Excellence du Scrutin Électronique & de la Délibération");

doc.moveDown(0.5);
doc.font('Helvetica').fontSize(11).fillColor(COLOR_MUTED).lineGap(4).text(
  "Livre blanc & Guide complet : Architecture hybride, sécurité mathématique anti-fraude, gouvernance des jurés et délibérations institutionnelles en temps réel.",
  { width: 505 }
);

doc.moveDown(1.5);
doc.moveTo(45, doc.y).lineTo(550, doc.y).lineWidth(1).stroke(COLOR_BORDER);
doc.moveDown(1.5);

drawSectionTitle("1. Pourquoi VERDICT ? La Fin du Dilemme Électoral");
drawParagraph(
  "Dans les universités, les grandes entreprises, les hackathons, les festivals culturels et les comités scientifiques, organiser une élection ou un concours fait systématiquement face à un paradoxe critique :"
);

drawBullet(
  "Le mur de la friction et l'abandon massif",
  "Imposer aux votants la création d'un compte avec mot de passe génère un taux d'abandon supérieur à 65%. Les électeurs oublient leurs identifiants, abandonnent face aux liens de confirmation par email ou refusent de confier des données personnelles pour un scrutin ponctuel."
);
drawBullet(
  "La vulnérabilité du vote sans inscription",
  "À l'inverse, ouvrir un sondage ouvert sans barrière expose immédiatement le scrutin aux votes multiples, à la navigation privée, aux bots de clics et aux fraudes par changement d'IP, détruisant toute crédibilité institutionnelle."
);
drawBullet(
  "La séparation artificielle Jury / Public",
  "La majorité des outils existants ne gèrent soit que des sondages grand public simples, soit que des formulaires lourds. Aucun ne réunit sur une seule plateforme un collège de jurés experts notant sur barème pondéré et un suffrage populaire certifié."
);

drawParagraph(
  "VERDICT a été conçu pour résoudre définitivement ce problème grâce à une architecture hybride propriétaire : Zéro compte requis pour les votants, intégrité mathématique absolue, et gouvernance hermétique réservée aux organisateurs et jurés accrédités."
);

drawCallout(
  "LE PARADIGME FONDAMENTAL DE VERDICT",
  "1. Aucun votant n'a besoin de créer un compte ni de retenir un mot de passe.\n2. Seuls les Organisateurs (Admins) et les Membres du Jury disposent d'un compte cryptographique.\n3. Chaque suffrage est infalsifiable, horodaté et mathématiquement protégé contre les votes multiples.",
  COLOR_PRIMARY,
  '#f5f3ff'
);

// ========================================================
// PAGE 2 : ARCHITECTURE TECHNIQUE ET MODES DE VOTE
// ========================================================
doc.addPage();
drawHeaderBand("ARCHITECTURE TECHNIQUE & SÉCURITÉ ANTI-FRAUDE", "MÉCANIQUE DE SCRUTIN HYBRIDE");

drawSectionTitle("2. Les Deux Modes de Scrutin : Public vs Restreint");
drawParagraph(
  "Lors de la création d'un scrutin, l'administrateur choisit la modalité d'accès aux urnes selon le contexte de l'événement :"
);

drawSubsectionTitle("Mode 1 : Scrutin Grand Public Ouvert (open_public)");
drawParagraph(
  "Idéal pour : Prix du public, concours d'innovation ouverts, hackathons, festivals, compétitions artistiques."
);
drawBullet(
  "Empreinte numérique (Device Fingerprint)",
  "Au chargement de l'urne électronique, le terminal de l'électeur synthétise une empreinte matérielle non-intrusive (résolution d'écran, sous-système audio WebGL, fuseau horaire, plateforme OS, canvas hardware)."
);
drawBullet(
  "Salage serveur & Hachage SHA-256",
  "Le backend combine cette empreinte, l'adresse IP de connexion, l'identifiant de l'élection et un sel secret serveur ultra-robuste : voter_hash = SHA256(fingerprint + IP + event_id + secret_salt)."
);
drawBullet(
  "Contrainte d'unicité SQL atomique",
  "La table PostgreSQL applique la règle stricte UNIQUE(category_id, voter_identifier). Si le votant tente de voter une 2ème fois (même en navigation privée ou après redémarrage), la base de données rejette la transaction instantanément avec un code HTTP 409."
);

doc.moveDown(0.5);
drawSubsectionTitle("Mode 2 : Scrutin Universitaire & Entreprise Restreint (restricted_token)");
drawParagraph(
  "Idéal pour : Élections de doyens, conseils d'administration, délégués syndicaux, comités d'entreprise, jurys d'examens officiels."
);
drawBullet(
  "Émargement par Jetons Cryptographiques",
  "L'administrateur génère par lot ou importe une liste d'émargement. Le système forge des jetons aléatoires de 48 caractères hexadécimaux (24 octets de haute entropie cryptographique)."
);
drawBullet(
  "Distribution 1-Clic",
  "Chaque électeur reçoit un lien de vote direct inviolable (ex: https://verdict.app/vote?token=a8f5c3...). L'urne s'ouvre sans aucune saisie requise."
);
drawBullet(
  "Consommation atomique SELECT FOR UPDATE",
  "Lors du vote, une transaction SQL exclusive verrouille le jeton au niveau de la ligne de base de données. Dès que le bulletin est déposé, is_used passe à TRUE et used_at est horodaté. Le jeton devient définitivement inutilisable."
);

drawCallout(
  "TRANSPARENCE POUR L'ÉLECTEUR : LE RÉCÉPISSÉ D'URNE SCELLÉ",
  "Dès la validation de son vote, l'électeur reçoit un reçu officiel horodaté comprenant le titre du scrutin, la catégorie, le candidat choisi, le mode d'authentification certifié, ainsi qu'une clé d'intégrité de transaction scellée.",
  COLOR_ACCENT,
  '#f0fdf4'
);

// ========================================================
// PAGE 3 : LE COLLÈGE DU JURY & LES DÉLIBÉRATIONS
// ========================================================
doc.addPage();
drawHeaderBand("LE COLLÈGE DU JURY & LA PONDÉRATION SCIENTIFIQUE", "DÉLIBÉRATION MIXTE & BARÈMES");

drawSectionTitle("3. Fonctionnement du Jury Professionnel & Sécurité Anti-Intrusion");
drawParagraph(
  "Dans les délibérations académiques et professionnelles, la décision ne repose pas uniquement sur la popularité, mais sur une évaluation qualitative multicritères. VERDICT intègre un module de jury entièrement sécurisé :"
);

drawBullet(
  "Accréditation Nominative Hermétique",
  "L'inscription publique ne permet JAMAIS de créer un compte Juré. Seul l'administrateur peut accréditer un membre du jury pour un scrutin spécifique. La table event_jurors consigne formellement chaque habilitation."
);
drawBullet(
  "Contrôle d'accès strict (Zero-Trust)",
  "Même si un utilisateur détient un compte juré sur la plateforme, l'API backend vérifie à chaque notation qu'il figure expressément dans le collège mandaté pour ce scrutin précis. Tout intrus est stoppé net avec une erreur 403 Forbidden."
);
drawBullet(
  "Génération automatique d'accès",
  "L'admin invite un juré par son email. Verdict crée immédiatement son profil et fournit un mot de passe temporaire chiffré par Bcrypt pour transmission directe."
);

doc.moveDown(0.5);
drawSectionTitle("4. Les 3 Modes de Délibération par Catégorie");
drawParagraph(
  "Chaque événement peut comporter plusieurs catégories avec des règles de délibération indépendantes :"
);

drawBullet(
  "Mode 100% Suffrage Public (public_only)",
  "Le classement final découle exclusivement des voix exprimées par les votants. Idéal pour les prix d'audience."
);
drawBullet(
  "Mode 100% Jury Professionnel (jury_only)",
  "Seuls les jurés accrédités évaluent les candidats sur la grille critériée. Le public ne peut pas voter."
);
drawBullet(
  "Mode Mixte Hybride (mixed)",
  "L'administrateur définit un curseur de pondération (ex: 60% Jury / 40% Public). Le moteur de résultats consolide automatiquement la note moyenne du jury et le pourcentage des suffrages publics pour calculer une note finale sur 20 points."
);

drawSubsectionTitle("Grille d'Évaluation Interactive du Juré (JuryDashboard)");
drawParagraph(
  "L'interface juré offre une ergonomie split-view pensée pour le direct : à gauche la liste des candidats avec badge d'avancement (En attente / Noté), à droite les critères configurés (ex: Faisabilité technique, Éloquence, Respect du cahier des charges) pilotés par des réglettes DaisyUI (range sliders) avec calcul de la moyenne pondérée en temps réel."
);

// ========================================================
// PAGE 4 : TABLEAU DE BORD ADMINISTRATEUR & EXPORTS
// ========================================================
doc.addPage();
drawHeaderBand("TABLEAU DE BORD ORGANISATEUR & CONTRÔLE LIVE", "ADMINISTRATION SAAS MODERNE");

drawSectionTitle("5. L'Espace Administrateur (Inspiré FinSpirit)");
drawParagraph(
  "L'administrateur pilote l'ensemble de ses scrutins depuis un tableau de bord SaaS moderne, ergonomique et entièrement responsive (Desktop, Tablette et Smartphone) :"
);

drawBullet(
  "Sidebar Latérale Élégante",
  "Navigation rapide entre : Vue d'ensemble, Scrutins & Événements, Jetons d'Émargement, Candidats & Critères, et Collège des Jurés, avec badges numériques en temps réel."
);
drawBullet(
  "Tiroir Mobile Drawer Responsive",
  "Sur smartphone, la sidebar se transforme en tiroir tactile animé avec bouton hamburger et overlay estompé pour un confort d'utilisation absolu sur le terrain."
);
drawBullet(
  "Analytics & Monitoring Live (Recharts)",
  "Visualisation instantanée de l'affluence horaire par courbe lissée (AreaChart avec gradients) et ventilation des modes d'authentification (PieChart interactif)."
);
drawBullet(
  "Gestion du Cycle de Vie des Urnes",
  "Création de scrutin -> Ajout des catégories et candidats -> Définition des critères -> Passage de l'état Brouillon à 'Ouvrir le Vote' -> Clôture manuelle ou automatique selon la date limite."
);

doc.moveDown(0.5);
drawSectionTitle("6. Procès-Verbaux & Exports Officiels Immuables");
drawParagraph(
  "Pour répondre aux exigences de conformité légale, académique et d'audit, VERDICT génère des documents institutionnels en un clic :"
);

drawBullet(
  "Procès-Verbal Officiel en PDF Imprimable",
  "Généré côté serveur avec PDFKit. Comporte l'en-tête de l'élection, la date et l'heure certifiées de délibération, le tableau exhaustif des rangs (vainqueur surligné, note jury, part du public, note finale) et les zones officielles d'émargement et de signature du président du jury."
);
drawBullet(
  "Extraction Brute des Suffrages en CSV (UTF-8)",
  "Export complet compatible nativement avec Microsoft Excel grâce à l'intégration du BOM UTF-8 et séparateurs point-virgule pour traitement statistique et archivage."
);

// ========================================================
// PAGE 5 : PALMARÈS GRAND PUBLIC & STACK TECHNIQUE
// ========================================================
doc.addPage();
drawHeaderBand("EXPÉRIENCE ÉLECTEUR & STACK TECHNOLOGIQUE", "SYNTHÈSE DE DÉPLOIEMENT");

drawSectionTitle("7. L'Écran des Résultats & Podium Dynamique (/results)");
drawParagraph(
  "La proclamation des résultats est un moment fort. L'écran public propose une scénographie soignée :"
);
drawBullet("Podium Olympique à 3 Paliers", "Mise en scène visuelle de la 1ère place (Or), 2ème place (Argent) et 3ème place (Bronze) avec photos, scores finaux et animations douces.");
drawBullet("Tableau Complet des Mentions", "Détail transparent pour l'ensemble des compétiteurs avec filtre par catégorie.");
drawBullet("Lien de Partage & Export Citoyen", "Possibilité pour tout électeur de télécharger le rapport certifié ou de copier le lien officiel du scrutin.");

doc.moveDown(0.5);
drawSectionTitle("8. Stack Technologique de Pointe");

drawBullet("Frontend", "React 19, Vite 8, DaisyUI 5 (Thème light 'Winter' épuré et corporate), Tailwind CSS, Lucide Icons, Recharts.");
drawBullet("Backend", "Node.js 24, Express 5 (Architecture modulaire REST API, sanitization native).");
drawBullet("Base de Données", "PostgreSQL relationnel hébergé sur Neon Serverless, transactions ACID atomiques avec verrous SELECT FOR UPDATE.");
drawBullet("Authentification & Sécurité", "JSON Web Tokens (JWT) stockés en cookies HttpOnly sécurisés, Google Identity Services (GIS OAuth 2.0), hachage Bcrypt salé 10 rounds, SHA-256 anti-fraude.");

doc.moveDown(1);
drawCallout(
  "RÉSUMÉ POUR VOS PARTENAIRES & UTILISATEURS",
  "VERDICT remplace les urnes en carton archaïques, les formulaires Google Forms vulnérables aux tricheries, et les logiciels électoraux lourds et coûteux. C'est l'alliance parfaite entre simplicité d'usage pour le citoyen et rigueur mathématique pour l'organisateur.",
  COLOR_SECONDARY,
  '#f1f5f9'
);

// Numérotation des pages automatique
const range = doc.bufferedPageRange();
for (let i = range.start; i < range.start + range.count; i++) {
  doc.switchToPage(i);
  doc.font('Helvetica').fontSize(8).fillColor(COLOR_MUTED).text(
    `VERDICT — Plateforme de Scrutin & Délibération  |  Page ${i + 1} sur ${range.count}`,
    45,
    800,
    { align: 'center', width: 505 }
  );
}

doc.end();

writeStream.on('finish', () => {
  console.log(`Document PDF généré avec succès dans : ${outputPath}`);
});
