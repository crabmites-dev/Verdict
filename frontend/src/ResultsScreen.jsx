import { useState, useEffect } from "react";
import {
  Trophy,
  Award,
  Vote,
  Sparkles,
  RefreshCw,
  Medal,
  Users,
  CheckCircle2,
  Calendar,
  ChevronRight,
  TrendingUp,
  Download,
  Share2,
  Check
} from "lucide-react";
import axios from "axios";
import { useParams, Link } from "react-router-dom";

export default function ResultsScreen() {
  const { categoryId } = useParams();
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [results, setResults] = useState([]);
  const [activePolls, setActivePolls] = useState([]);
  const [selectedCatId, setSelectedCatId] = useState(categoryId || "1");
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState("");

  // Récupérer les catégories actives
  const fetchPolls = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/public/active-polls");
      setActivePolls(res.data?.polls || []);
    } catch (e) {}
  };

  // Récupérer ou consolider les résultats
  const fetchResults = async (catId) => {
    setLoading(true);
    try {
      // 1. Calcul/mise à jour automatique des métriques
      try {
        await axios.post(`http://localhost:5000/api/results/calculate/${catId}`, {}, { withCredentials: true });
      } catch (err) {
        // En consultation publique sans session jury/admin, l'accès au calcul peut échouer, on passe directement à la lecture
      }

      // 2. Récupérer les résultats stockés
      const res = await axios.get(`http://localhost:5000/api/results/category/${catId}`);
      setResults(res.data?.results || []);
    } catch (err) {
      console.error("fetchResults error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolls();
  }, []);

  useEffect(() => {
    if (selectedCatId) {
      fetchResults(selectedCatId);
    }
  }, [selectedCatId]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Les 3 premiers pour le podium
  const top1 = results.find((r) => parseInt(r.rank_position, 10) === 1);
  const top2 = results.find((r) => parseInt(r.rank_position, 10) === 2);
  const top3 = results.find((r) => parseInt(r.rank_position, 10) === 3);

  return (
    <div className="min-h-screen bg-base-200 text-base-content flex flex-col font-sans selection:bg-primary selection:text-primary-content">
      
      {/* HEADER OFFICIEL */}
      <header className="sticky top-0 z-40 bg-base-100/90 backdrop-blur-md border-b border-base-300 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shadow-xs">
            <Trophy className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-lg tracking-tight font-display">
              VERDICT<span className="text-primary">.</span>
            </span>
            <span className="text-[10px] font-bold tracking-widest uppercase text-base-content/50 -mt-1">
              Tableau Officiel des Résultats
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleShare}
            className="btn btn-ghost btn-sm rounded-xl gap-1.5 normal-case text-xs font-semibold cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copied ? "Lien copié !" : "Partager"}</span>
          </button>

          <Link to="/vote" className="btn btn-primary btn-sm rounded-xl gap-1.5 normal-case text-xs font-semibold shadow-xs">
            <Vote className="w-3.5 h-3.5" />
            <span>Accéder au Vote</span>
          </Link>
        </div>
      </header>

      {/* CONTENU PRINCIPAL */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 md:p-8 space-y-8">
        
        {/* BANNIÈRE TITRE */}
        <div className="bg-base-100 rounded-3xl p-6 sm:p-8 border border-base-300 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Dépouillement Certifié & Classement Consolidé</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display">
              Palmarès & Délibération Officielle
            </h1>
            <p className="text-xs sm:text-sm text-base-content/60 max-w-xl">
              Calcul mathématique certifié intégrant le vote pondéré du jury et les suffrages du grand public.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchResults(selectedCatId)}
              className="btn btn-ghost btn-circle btn-sm"
              title="Actualiser les résultats"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>

            <a
              href={`http://localhost:5000/api/exports/category/${selectedCatId}/pdf`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-outline border-base-300 btn-sm rounded-xl gap-1.5 normal-case text-xs font-semibold hover:bg-base-200"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Procès-Verbal (PDF)</span>
            </a>
          </div>
        </div>

        {/* PODIUM VISUEL DES 3 PREMIERS LAURÉATS */}
        {results.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 items-end pt-4 pb-2">
            
            {/* 2ÈME PLACE */}
            {top2 && (
              <div className="order-2 md:order-1 bg-base-100 rounded-3xl p-6 border border-base-300 shadow-sm text-center relative flex flex-col items-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-200 text-slate-700 font-extrabold flex items-center justify-center text-lg mb-3 shadow-inner">
                  2
                </div>
                <h3 className="font-bold text-base font-display">{top2.candidate_name}</h3>
                <span className="text-xs text-base-content/50 mt-0.5">2ème Lauréat</span>
                <div className="mt-4 pt-3 border-t border-base-200 w-full flex justify-around text-xs">
                  <div>
                    <span className="text-[10px] text-base-content/50 uppercase block">Jury</span>
                    <span className="font-bold text-primary">{top2.jury_score || "—"}</span>
                  </div>
                  <div className="border-x border-base-200 px-3">
                    <span className="text-[10px] text-base-content/50 uppercase block">Public</span>
                    <span className="font-bold">{top2.public_score}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-base-content/50 uppercase block">Total</span>
                    <span className="font-black text-amber-600 font-display">{top2.final_score}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 1ÈRE PLACE (VAINQUEUR AU CENTRE, PLUS HAUT ET VALORISÉ) */}
            {top1 && (
              <div className="order-1 md:order-2 bg-gradient-to-b from-amber-500/10 via-base-100 to-base-100 rounded-3xl p-8 border-2 border-amber-400 shadow-xl text-center relative flex flex-col items-center transform md:-translate-y-4">
                <div className="absolute -top-4 px-3 py-1 bg-amber-500 text-white rounded-full text-[11px] font-bold flex items-center gap-1 shadow-sm">
                  <Trophy className="w-3.5 h-3.5" /> VAINQUEUR OFFICIEL
                </div>
                <div className="w-16 h-16 rounded-2xl bg-amber-400 text-white font-black flex items-center justify-center text-2xl mb-3 shadow-md mt-2">
                  1
                </div>
                <h3 className="font-extrabold text-xl font-display text-base-content">{top1.candidate_name}</h3>
                <span className="text-xs text-amber-600 font-semibold mt-0.5">Grand Lauréat du Scrutin</span>

                <div className="mt-5 pt-4 border-t border-base-200 w-full flex justify-around text-xs">
                  <div>
                    <span className="text-[10px] text-base-content/50 uppercase block">Jury</span>
                    <span className="font-bold text-primary text-sm">{top1.jury_score || "—"}</span>
                  </div>
                  <div className="border-x border-base-200 px-3">
                    <span className="text-[10px] text-base-content/50 uppercase block">Public</span>
                    <span className="font-bold text-sm">{top1.public_score}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-base-content/50 uppercase block">Score Final</span>
                    <span className="font-black text-amber-600 text-base font-display">{top1.final_score}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 3ÈME PLACE */}
            {top3 && (
              <div className="order-3 bg-base-100 rounded-3xl p-6 border border-base-300 shadow-sm text-center relative flex flex-col items-center">
                <div className="w-12 h-12 rounded-2xl bg-amber-700/20 text-amber-800 font-extrabold flex items-center justify-center text-lg mb-3 shadow-inner">
                  3
                </div>
                <h3 className="font-bold text-base font-display">{top3.candidate_name}</h3>
                <span className="text-xs text-base-content/50 mt-0.5">3ème Lauréat</span>
                <div className="mt-4 pt-3 border-t border-base-200 w-full flex justify-around text-xs">
                  <div>
                    <span className="text-[10px] text-base-content/50 uppercase block">Jury</span>
                    <span className="font-bold text-primary">{top3.jury_score || "—"}</span>
                  </div>
                  <div className="border-x border-base-200 px-3">
                    <span className="text-[10px] text-base-content/50 uppercase block">Public</span>
                    <span className="font-bold">{top3.public_score}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-base-content/50 uppercase block">Total</span>
                    <span className="font-black text-amber-600 font-display">{top3.final_score}</span>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* TABLEAU COMPLET DE TOUS LES CANDIDATS */}
        <div className="bg-base-100 rounded-3xl p-6 sm:p-8 border border-base-300 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-base-200">
            <h2 className="text-base font-bold font-display">Classement Général Exhaustif</h2>
            <span className="text-xs text-base-content/50 font-mono">
              {results.length} candidat(s) consolidé(s)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="table table-zebra w-full text-xs">
              <thead>
                <tr className="border-b border-base-300 text-base-content/50 uppercase text-[10px] tracking-wider">
                  <th className="w-16 text-center">Rang</th>
                  <th>Candidat / Projet</th>
                  <th className="text-center">Note Jury (Moyenne)</th>
                  <th className="text-center">Suffrages Publics</th>
                  <th className="text-right">Score Final Consolidé</th>
                </tr>
              </thead>
              <tbody>
                {results.map((row) => {
                  const isWinner = parseInt(row.rank_position, 10) === 1;

                  return (
                    <tr key={row.rank_position} className={isWinner ? "bg-amber-500/5 font-semibold" : ""}>
                      <td className="text-center">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-xl font-bold text-xs ${
                          isWinner
                            ? "bg-amber-400 text-white shadow-xs"
                            : parseInt(row.rank_position, 10) === 2
                            ? "bg-slate-200 text-slate-700"
                            : parseInt(row.rank_position, 10) === 3
                            ? "bg-amber-700/20 text-amber-800"
                            : "bg-base-200 text-base-content/60"
                        }`}>
                          {row.rank_position}
                        </span>
                      </td>
                      <td>
                        <div className="font-bold text-sm text-base-content">{row.candidate_name}</div>
                        <div className="text-[11px] text-base-content/50">Dépouillement certifié</div>
                      </td>
                      <td className="text-center font-mono text-primary font-bold">
                        {row.jury_score || "0.00"}
                      </td>
                      <td className="text-center font-mono">
                        <span className="badge badge-sm badge-ghost font-semibold">
                          {row.public_score}%
                        </span>
                      </td>
                      <td className="text-right font-mono font-black text-sm text-amber-600">
                        {row.final_score}
                      </td>
                    </tr>
                  );
                })}

                {results.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-base-content/50 text-xs">
                      Aucun résultat consolidé pour cette catégorie pour le moment.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>

      {/* FOOTER */}
      <footer className="w-full max-w-5xl mx-auto py-6 px-6 text-center text-[11px] text-base-content/50 border-t border-base-300 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>&copy; {new Date().getFullYear()} Verdict Voting Systems • Délibération finale certifiée</span>
        <div className="flex items-center gap-3">
          <span>Formule Pondérée Mathématique</span>
          <span>•</span>
          <span>Procès-Verbal Inviolable</span>
        </div>
      </footer>

    </div>
  );
}
