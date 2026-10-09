import React from "react";
import { Link } from "react-router-dom";
import {
  Vote,
  ShieldCheck,
  Scale,
  Award,
  Users,
  CheckCircle2,
  ArrowRight,
  Fingerprint,
  Lock,
  BarChart3,
  Sparkles,
  ChevronRight
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-base-100 text-base-content flex flex-col font-sans selection:bg-primary selection:text-primary-content">
      
      {/* ======================================================== */}
      {/* BARRE DE NAVIGATION SUPÉRIEURE                           */}
      {/* ======================================================== */}
      <header className="sticky top-0 z-40 bg-base-100/90 backdrop-blur-md border-b border-base-200">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="h-10 w-10 rounded-2xl bg-primary text-primary-content flex items-center justify-center shadow-xs transition-transform group-hover:scale-105">
              <Vote className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xl tracking-tight font-display text-base-content">
                VERDICT<span className="text-primary">.</span>
              </span>
              <span className="text-[10px] font-bold tracking-widest uppercase text-base-content/50 -mt-1">
                Plateforme de Scrutin & Délibération
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-base-content/70">
            <a href="#features" className="hover:text-primary transition-colors">Fonctionnalités</a>
            <a href="#security" className="hover:text-primary transition-colors">Architecture Anti-Fraude</a>
            <Link to="/vote" className="hover:text-primary transition-colors">Participer à un Vote</Link>
            <Link to="/results" className="hover:text-primary transition-colors">Palmarès & Résultats</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="btn btn-ghost btn-sm rounded-xl font-semibold text-sm normal-case hover:bg-base-200"
            >
              Connexion
            </Link>
            <Link
              to="/vote"
              className="btn btn-primary btn-sm rounded-xl font-semibold text-sm normal-case shadow-xs px-4"
            >
              Voter maintenant
            </Link>
          </div>
        </div>
      </header>

      {/* ======================================================== */}
      {/* SECTION HÉROS PRINCIPALE                                */}
      {/* ======================================================== */}
      <section className="relative overflow-hidden pt-16 pb-24 md:pt-24 md:pb-32 bg-radial from-primary/5 via-base-100 to-base-100">
        <div className="max-w-5xl mx-auto px-6 text-center space-y-8">
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold animate-in fade-in duration-500">
            <Sparkles className="w-4 h-4" />
            <span>Architecture Hybride : Grand Public & Émargement Universitaire</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight font-display text-base-content leading-tight">
            La solution moderne pour vos votes, jurys et délibérations
          </h1>

          <p className="text-lg sm:text-xl text-base-content/70 max-w-2xl mx-auto font-normal leading-relaxed">
            Éliminez la friction pour les électeurs. Donnez à vos comités et administrateurs un outil infaillible, transparent et certifié.
          </p>

          {/* Boutons d'action héro */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/vote"
              className="btn btn-primary btn-lg rounded-2xl font-bold shadow-md hover:shadow-lg normal-case w-full sm:w-auto px-8 gap-2"
            >
              <Vote className="w-5 h-5" />
              <span>Accéder à l'Urne Électronique</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/register"
              className="btn btn-outline btn-lg rounded-2xl font-bold normal-case w-full sm:w-auto px-8 gap-2 bg-base-100 hover:bg-base-200 hover:text-base-content hover:border-base-300"
            >
              <span>Créer un Espace Organisateur</span>
            </Link>
          </div>

          {/* Métriques de confiance */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-16 max-w-4xl mx-auto border-t border-base-200">
            <div>
              <p className="text-3xl font-extrabold font-display text-primary">0</p>
              <p className="text-xs font-semibold text-base-content/60 mt-1 uppercase tracking-wider">Inscription pour voter</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold font-display text-primary">100%</p>
              <p className="text-xs font-semibold text-base-content/60 mt-1 uppercase tracking-wider">Anti-Fraude Déterministe</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold font-display text-primary">Bi-mode</p>
              <p className="text-xs font-semibold text-base-content/60 mt-1 uppercase tracking-wider">Suffrage & Barèmes Jury</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold font-display text-primary">PDF & CSV</p>
              <p className="text-xs font-semibold text-base-content/60 mt-1 uppercase tracking-wider">Procès-verbaux instantanés</p>
            </div>
          </div>

        </div>
      </section>

      {/* ======================================================== */}
      {/* SECTION LES 3 PROFILS / ACTEURS                          */}
      {/* ======================================================== */}
      <section id="features" className="py-20 bg-base-200/50 border-y border-base-200">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold font-display text-base-content">
              Conçu pour chaque intervenant du scrutin
            </h2>
            <p className="text-sm text-base-content/60">
              Chaque utilisateur dispose d'une interface sur mesure adaptée à son rôle institutionnel.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Carte 1 : Électeur */}
            <div className="bg-base-100 rounded-3xl p-8 border border-base-300 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-blue-500/10 text-primary flex items-center justify-center">
                  <Fingerprint className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold font-display">L'Électeur (Zéro Friction)</h3>
                <p className="text-sm text-base-content/70 leading-relaxed">
                  Aucun compte ni mot de passe exigé. Votez en 1 clic grâce à votre jeton d'émargement ou par détection d'empreinte numérique sécurisée.
                </p>
                <ul className="text-xs space-y-2 text-base-content/60 pt-2">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-success" /> Récépissé d'urne cryptographique scellé</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-success" /> Interface épurée et responsive mobile</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-success" /> Garantie d'unicité mathématique du vote</li>
                </ul>
              </div>
              <div className="pt-6">
                <Link to="/vote" className="btn btn-outline btn-sm rounded-xl w-full normal-case font-semibold">
                  Accéder à l'écran de vote →
                </Link>
              </div>
            </div>

            {/* Carte 2 : Juré */}
            <div className="bg-base-100 rounded-3xl p-8 border border-base-300 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                  <Scale className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold font-display">Le Juré (Barème & Critères)</h3>
                <p className="text-sm text-base-content/70 leading-relaxed">
                  Grille d'évaluation intuitive à curseurs pour évaluer chaque candidat selon les critères pondérés définis par l'organisation.
                </p>
                <ul className="text-xs space-y-2 text-base-content/60 pt-2">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-success" /> Calcul pondéré en temps réel</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-success" /> Certification par lot en un clic</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-success" /> Synthèse visuelle de l'avancement</li>
                </ul>
              </div>
              <div className="pt-6">
                <Link to="/jury" className="btn btn-outline btn-sm rounded-xl w-full normal-case font-semibold">
                  Espace d'évaluation Jury →
                </Link>
              </div>
            </div>

            {/* Carte 3 : Organisateur / Admin */}
            <div className="bg-base-100 rounded-3xl p-8 border border-base-300 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold font-display">L'Administrateur (Pilotage)</h3>
                <p className="text-sm text-base-content/70 leading-relaxed">
                  Tableau de bord live avec graphiques de participation, génération de jetons uniques et export de procès-verbaux officiels.
                </p>
                <ul className="text-xs space-y-2 text-base-content/60 pt-2">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-success" /> Configuration des scrutins & candidats</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-success" /> Suivi de l'affluence en direct (Recharts)</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-success" /> Export PDF signé et extraction CSV UTF-8</li>
                </ul>
              </div>
              <div className="pt-6">
                <Link to="/admin" className="btn btn-primary btn-sm rounded-xl w-full normal-case font-semibold">
                  Ouvrir le Dashboard Admin →
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* SECTION SÉCURITÉ & ANTI-FRAUDE                           */}
      {/* ======================================================== */}
      <section id="security" className="py-20 bg-base-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-base-200/60 rounded-3xl p-8 md:p-12 border border-base-300 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-semibold">
                <ShieldCheck className="w-4 h-4" />
                <span>Sécurité Cryptographique Déterministe</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold font-display">
                Comment Verdict empêche les doubles votes sans imposer de compte ?
              </h2>
              <p className="text-sm text-base-content/70 leading-relaxed">
                Notre architecture résout le dilemme classique entre friction utilisateur et sécurité de vote grâce à deux approches éprouvées :
              </p>

              <div className="space-y-4 pt-2 text-xs">
                <div className="p-4 rounded-2xl bg-base-100 border border-base-300 space-y-1">
                  <h4 className="font-bold text-sm text-base-content flex items-center gap-2">
                    <Fingerprint className="w-4 h-4 text-primary" />
                    1. Scrutin Ouvert : Empreinte Anonymisée
                  </h4>
                  <p className="text-base-content/60">
                    Calcul d'un hachage SHA-256 combinant l'empreinte matérielle du navigateur, l'IP et un sel serveur secret. Verrouillé par contrainte d'unicité SQL.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-base-100 border border-base-300 space-y-1">
                  <h4 className="font-bold text-sm text-base-content flex items-center gap-2">
                    <Lock className="w-4 h-4 text-emerald-600" />
                    2. Scrutin Restreint : Jetons Atomiques SELECT FOR UPDATE
                  </h4>
                  <p className="text-base-content/60">
                    Distribution de jetons de 48 caractères hexadécimaux consommés de façon atomique dans une transaction PostgreSQL. Tout jeton utilisé est irréversiblement clos.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-base-100 rounded-3xl p-6 sm:p-8 border border-base-300 shadow-sm space-y-6">
              <h3 className="font-bold font-display text-base text-base-content">
                Consulter les Palmarès & Résultats
              </h3>
              <p className="text-xs text-base-content/60">
                Une fois le dépouillement terminé ou en temps réel selon les règles du concours, découvrez le podium des lauréats et le classement intégral.
              </p>

              <div className="p-4 rounded-2xl bg-base-200/50 border border-base-300 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-primary block">Podium Dynamique</span>
                  <span className="text-[11px] text-base-content/50">Calcul intégrant le coefficient Jury et Public</span>
                </div>
                <Link to="/results" className="btn btn-primary btn-sm rounded-xl normal-case font-semibold">
                  Voir Palmarès
                </Link>
              </div>

              <div className="border-t border-base-200 pt-4 flex items-center justify-between text-xs text-base-content/60">
                <span>Exportation conforme RGPD</span>
                <span className="font-semibold text-success flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Données chiffrées
                </span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* PIED DE PAGE (FOOTER)                                    */}
      {/* ======================================================== */}
      <footer className="mt-auto border-t border-base-200 bg-base-100 py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-base-content/50">
          <div className="flex items-center gap-2">
            <Vote className="w-4 h-4 text-primary" />
            <span className="font-bold text-base-content">VERDICT SaaS</span>
            <span>— Plateforme de Scrutin et de Délibération</span>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/vote" className="hover:text-primary transition-colors">Voter</Link>
            <Link to="/results" className="hover:text-primary transition-colors">Palmarès</Link>
            <Link to="/login" className="hover:text-primary transition-colors">Espace Organisateur</Link>
            <Link to="/jury" className="hover:text-primary transition-colors">Espace Juré</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
