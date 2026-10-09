import { useState, useEffect } from "react";
import {
  Vote,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Key,
  Clock,
  Sparkles,
  User,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Fingerprint,
  Building2,
  Lock
} from "lucide-react";
import axios from "axios";
import { useSearchParams, Link } from "react-router-dom";

export default function VoterScreen() {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get("token") || "";

  const [loading, setLoading] = useState(true);
  const [activePolls, setActivePolls] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [pollDetails, setPollDetails] = useState(null);

  // Gestion des jetons pour les scrutins restreints
  const [voterToken, setVoterToken] = useState(tokenFromUrl);
  const [tokenVerified, setTokenVerified] = useState(false);
  const [verifyingToken, setVerifyingToken] = useState(false);
  const [tokenError, setTokenError] = useState("");

  // Sélection du candidat et émission du vote
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [submittingVote, setSubmittingVote] = useState(false);
  const [voteReceipt, setVoteReceipt] = useState(null);
  const [voteError, setVoteError] = useState("");

  // Génération d'une empreinte matérielle client simple et stable pour le mode grand public
  const getClientFingerprint = () => {
    let fp = localStorage.getItem("verdict_device_fingerprint");
    if (!fp) {
      const navInfo = `${navigator.userAgent}_${navigator.language}_${window.screen.width}x${window.screen.height}_${new Date().getTimezoneOffset()}`;
      // Hash simple côté client
      let hash = 0;
      for (let i = 0; i < navInfo.length; i++) {
        hash = (hash << 5) - hash + navInfo.charCodeAt(i);
        hash |= 0;
      }
      fp = `dev_${Math.abs(hash)}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem("verdict_device_fingerprint", fp);
    }
    return fp;
  };

  // Chargement des scrutins actifs
  const fetchPolls = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:5000/api/public/active-polls");
      const polls = res.data?.polls || [];
      setActivePolls(polls);

      // Si un token est passé dans l'URL, on le vérifie immédiatement
      if (tokenFromUrl) {
        verifyToken(tokenFromUrl);
      } else if (polls.length > 0) {
        selectEvent(polls[0]);
      }
    } catch (err) {
      console.error("fetchPolls error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Vérification du jeton d'émargement
  const verifyToken = async (tok) => {
    if (!tok.trim()) return;
    setVerifyingToken(true);
    setTokenError("");
    try {
      const res = await axios.post("http://localhost:5000/api/public/verify-token", {
        token: tok.trim()
      });
      setTokenVerified(true);
      const ev = res.data?.event;
      // Charger les détails du scrutin lié à ce jeton
      if (ev) {
        fetchPollDetails(ev.id);
      }
    } catch (err) {
      setTokenVerified(false);
      setTokenError(err.response?.data?.message || "Jeton de vote invalide ou déjà consommé.");
    } finally {
      setVerifyingToken(false);
    }
  };

  // Sélection d'un événement
  const selectEvent = (ev) => {
    setSelectedEvent(ev);
    setSelectedCandidate(null);
    setVoteReceipt(null);
    setVoteError("");
    fetchPollDetails(ev.id);
  };

  // Chargement des candidats et catégories pour un événement
  const fetchPollDetails = async (eventId) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/public/poll-details/${eventId}`);
      const data = res.data;
      setPollDetails(data);
      if (data.categories?.length > 0) {
        setSelectedCategory(data.categories[0]);
      }
    } catch (err) {
      console.error("fetchPollDetails error:", err);
    }
  };

  useEffect(() => {
    fetchPolls();
  }, []);

  // Émission définitive du vote
  const handleCastVote = async () => {
    if (!selectedCandidate || !selectedCategory) return;

    setSubmittingVote(true);
    setVoteError("");

    const payload = {
      category_id: selectedCategory.id,
      candidate_id: selectedCandidate.id
    };

    // Selon le mode, on joint le jeton ou l'empreinte de sécurité
    if (pollDetails?.event?.auth_mode === "restricted_token") {
      payload.voter_token = voterToken.trim();
    } else {
      payload.voter_identifier = getClientFingerprint();
    }

    try {
      const res = await axios.post("http://localhost:5000/api/public/vote", payload);
      setVoteReceipt({
        ...res.data?.vote,
        candidateName: selectedCandidate.name,
        categoryName: selectedCategory.name,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      const msg = err.response?.data?.message;
      setVoteError(msg || "Une erreur est survenue lors de l'enregistrement de votre vote.");
    } finally {
      setSubmittingVote(false);
    }
  };

  const isRestricted = pollDetails?.event?.auth_mode === "restricted_token";

  return (
    <div className="min-h-screen bg-base-200 text-base-content flex flex-col font-sans selection:bg-primary selection:text-primary-content">
      
      {/* HEADER ÉLECTEUR ÉPURÉ */}
      <header className="sticky top-0 z-40 bg-base-100/90 backdrop-blur-md border-b border-base-300 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-primary text-primary-content flex items-center justify-center shadow-xs">
            <Vote className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-lg tracking-tight font-display">
              VERDICT<span className="text-primary">.</span>
            </span>
            <span className="text-[10px] font-bold tracking-widest uppercase text-base-content/50 -mt-1">
              Portail Officiel des Suffrages
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-success/10 text-success text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Scrutin Sécurisé & Anonyme</span>
          </div>

          <Link to="/login" className="btn btn-ghost btn-xs text-xs font-semibold normal-case text-base-content/60 hover:text-base-content">
            Espace Jury / Admin →
          </Link>
        </div>
      </header>

      {/* CONTENU PRINCIPAL */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 md:p-8 space-y-6">

        {/* 1. ÉCRAN DE CONFIRMATION / RÉCÉPISSÉ APRÈS VOTE RÉUSSI */}
        {voteReceipt ? (
          <div className="max-w-xl mx-auto my-8 bg-base-100 rounded-3xl p-8 sm:p-10 border border-base-300 shadow-xl text-center space-y-6 animate-in zoom-in-95 duration-300">
            <div className="h-20 w-20 rounded-full bg-success/10 text-success mx-auto flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="badge badge-success badge-sm font-semibold text-white">Émargement Certifié</span>
              <h1 className="text-2xl font-bold font-display">Votre suffrage a été comptabilisé !</h1>
              <p className="text-xs text-base-content/60 max-w-md mx-auto">
                Votre voix a été scellée dans l'urne électronique avec empreinte cryptographique. Le principe de vote unique et secret est garanti.
              </p>
            </div>

            {/* Fiche Récépissé Officielle */}
            <div className="bg-base-200/60 p-5 rounded-2xl border border-base-300 text-left text-xs space-y-2.5 font-mono">
              <div className="flex justify-between border-b border-base-300 pb-2">
                <span className="text-base-content/50">Candidat choisi :</span>
                <span className="font-bold text-base-content">{voteReceipt.candidateName}</span>
              </div>
              <div className="flex justify-between border-b border-base-300 pb-2">
                <span className="text-base-content/50">Catégorie :</span>
                <span className="font-semibold text-base-content">{voteReceipt.categoryName}</span>
              </div>
              <div className="flex justify-between border-b border-base-300 pb-2">
                <span className="text-base-content/50">Horodatage officiel :</span>
                <span className="text-base-content">{new Date(voteReceipt.timestamp).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-base-content/50">ID Scellé :</span>
                <span className="text-primary font-bold">#VDT-{voteReceipt.id}-{Math.random().toString(36).substring(2, 7).toUpperCase()}</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  setVoteReceipt(null);
                  setSelectedCandidate(null);
                  fetchPolls();
                }}
                className="btn btn-outline border-base-300 hover:bg-base-200 rounded-2xl text-xs font-semibold normal-case"
              >
                Retour aux scrutins disponibles
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* 2. EN-TÊTE DU SCRUTIN ACTIF */}
            <div className="bg-base-100 rounded-3xl p-6 sm:p-8 border border-base-300 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>
                      {isRestricted ? "Scrutin Institutionnel Privé" : "Consultation & Scrutin Ouvert"}
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display">
                    {pollDetails?.event?.title || "Sélectionnez votre scrutin"}
                  </h1>
                  {pollDetails?.event?.description && (
                    <p className="text-xs sm:text-sm text-base-content/60 max-w-2xl">
                      {pollDetails.event.description}
                    </p>
                  )}
                </div>

                {/* Sélecteur de scrutins si plusieurs sont actifs */}
                {activePolls.length > 1 && !tokenFromUrl && (
                  <div className="bg-base-200 p-2.5 rounded-2xl border border-base-300 min-w-[240px]">
                    <label className="text-[10px] font-bold text-base-content/50 uppercase tracking-wider block mb-1">
                      Changer d'Élection
                    </label>
                    <select
                      value={pollDetails?.event?.id || ""}
                      onChange={(e) => {
                        const ev = activePolls.find((p) => String(p.id) === e.target.value);
                        if (ev) selectEvent(ev);
                      }}
                      className="select select-bordered select-xs w-full rounded-xl bg-base-100 font-semibold"
                    >
                      {activePolls.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* BARRE D'ÉTAT DU SCRUTIN RESTREINT (JETON REQUIS) */}
              {isRestricted && (
                <div className="p-4 rounded-2xl bg-base-200/80 border border-base-300 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-base-content">
                    <Key className="w-4 h-4 text-primary" />
                    <span>Authentification par Jeton d'Émargement</span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <input
                      type="text"
                      placeholder="Collez votre jeton unique (reçu par email ou sur invitation)..."
                      value={voterToken}
                      onChange={(e) => setVoterToken(e.target.value)}
                      disabled={tokenVerified}
                      className="input input-bordered input-sm w-full rounded-xl text-xs font-mono bg-base-100"
                    />
                    {!tokenVerified ? (
                      <button
                        onClick={() => verifyToken(voterToken)}
                        disabled={verifyingToken || !voterToken.trim()}
                        className="btn btn-primary btn-sm rounded-xl text-xs normal-case font-semibold shrink-0 cursor-pointer"
                      >
                        {verifyingToken ? "Vérification..." : "Valider le jeton"}
                      </button>
                    ) : (
                      <span className="badge badge-success badge-sm font-semibold text-white shrink-0 gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Jeton Certifié
                      </span>
                    )}
                  </div>

                  {tokenError && (
                    <div className="text-xs text-error font-medium flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4" />
                      <span>{tokenError}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Onglets des catégories si le scrutin en comporte plusieurs */}
              {pollDetails?.categories?.length > 1 && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-base-200">
                  {pollDetails.categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategory(cat);
                        setSelectedCandidate(null);
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        selectedCategory?.id === cat.id
                          ? "bg-primary text-primary-content shadow-xs"
                          : "bg-base-200 text-base-content/70 hover:text-base-content"
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 3. GRILLE DES CANDIDATS DE LA CATÉGORIE SÉLECTIONNÉE */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <span className="text-xs font-bold text-base-content/50 uppercase tracking-wider">
                  Candidats en lice ({selectedCategory?.candidates?.length || 0})
                </span>
                <span className="text-xs text-base-content/60">
                  Cliquez sur un candidat pour voter
                </span>
              </div>

              {voteError && (
                <div className="alert alert-error shadow-sm rounded-2xl py-3 px-4 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{voteError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {selectedCategory?.candidates?.map((candidate) => {
                  const isSelected = selectedCandidate?.id === candidate.id;

                  return (
                    <div
                      key={candidate.id}
                      onClick={() => setSelectedCandidate(candidate)}
                      className={`bg-base-100 rounded-3xl p-5 border transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden ${
                        isSelected
                          ? "border-primary ring-2 ring-primary/20 shadow-lg shadow-primary/5 bg-primary/5"
                          : "border-base-300 hover:border-base-content/30 shadow-xs"
                      }`}
                    >
                      {/* Pastille de sélection */}
                      <div className="absolute top-4 right-4">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                            isSelected
                              ? "bg-primary text-primary-content"
                              : "border border-base-300 bg-base-200/50 group-hover:border-primary/50"
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="w-4 h-4" />}
                        </div>
                      </div>

                      {/* Photo / Avatar */}
                      <div className="flex items-center gap-4 mb-4">
                        <div className="h-16 w-16 rounded-2xl bg-base-200 border border-base-300 flex items-center justify-center overflow-hidden shrink-0 font-extrabold text-xl">
                          {candidate.photo_url ? (
                            <img src={candidate.photo_url} alt={candidate.name} className="h-full w-full object-cover" />
                          ) : (
                            <User className="w-8 h-8 text-base-content/30" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-base font-display group-hover:text-primary transition-colors">
                            {candidate.name}
                          </h3>
                          <span className="text-[11px] text-base-content/50 block">
                            Catégorie : {selectedCategory.name}
                          </span>
                        </div>
                      </div>

                      {/* Bio / Programme */}
                      <p className="text-xs text-base-content/60 leading-relaxed mb-4 line-clamp-3">
                        {candidate.bio_program || "Aucune biographie fournie pour ce candidat."}
                      </p>

                      {/* Bouton d'action */}
                      <button
                        type="button"
                        className={`w-full py-2.5 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-1.5 ${
                          isSelected
                            ? "bg-primary text-primary-content shadow-xs"
                            : "bg-base-200 text-base-content/70 group-hover:bg-primary group-hover:text-primary-content"
                        }`}
                      >
                        {isSelected ? "Sélectionné pour mon vote" : "Choisir ce candidat"}
                      </button>
                    </div>
                  );
                })}
              </div>

              {(!selectedCategory?.candidates || selectedCategory.candidates.length === 0) && (
                <div className="bg-base-100 rounded-3xl p-12 text-center text-xs text-base-content/50 border border-base-300">
                  Aucun candidat enregistré pour cette catégorie pour le moment.
                </div>
              )}
            </div>

            {/* 4. BARRE INFÉRIEURE FIXE DE VALIDATION DU SUFFRAGE */}
            {selectedCandidate && (
              <div className="sticky bottom-6 z-30 animate-in slide-in-from-bottom-4 duration-300">
                <div className="bg-base-100/95 backdrop-blur-md rounded-3xl p-4 sm:p-5 border border-primary/30 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3 text-xs">
                    <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
                      <Vote className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-base-content/60 block">Vous vous apprêtez à voter pour :</span>
                      <strong className="text-sm text-base-content font-display">{selectedCandidate.name}</strong>{" "}
                      <span className="text-primary font-medium">({selectedCategory?.name})</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                      onClick={() => setSelectedCandidate(null)}
                      className="btn btn-ghost btn-sm rounded-xl text-xs normal-case w-1/2 sm:w-auto"
                    >
                      Changer
                    </button>
                    <button
                      onClick={handleCastVote}
                      disabled={submittingVote || (isRestricted && !tokenVerified)}
                      className="btn btn-primary btn-sm rounded-xl font-semibold shadow-md shadow-primary/20 text-xs normal-case px-6 gap-2 w-1/2 sm:w-auto cursor-pointer"
                    >
                      {submittingVote ? (
                        <span className="loading loading-spinner loading-xs" />
                      ) : (
                        <>
                          <span>Confirmer & Émarger</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

      </main>

      {/* FOOTER DISCRET */}
      <footer className="w-full max-w-5xl mx-auto py-6 px-6 text-center text-[11px] text-base-content/50 border-t border-base-300 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>&copy; {new Date().getFullYear()} Verdict Voting Systems • Dépouillement conforme RGPD</span>
        <div className="flex items-center gap-3">
          <span>Garantie Anonymat</span>
          <span>•</span>
          <span>Horodatage Certifié</span>
        </div>
      </footer>

    </div>
  );
}
