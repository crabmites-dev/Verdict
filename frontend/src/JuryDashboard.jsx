import { useState, useEffect } from "react";
import {
  Award,
  Vote,
  User,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Send,
  LogOut,
  RefreshCw,
  Info
} from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function JuryDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [board, setBoard] = useState(null); // { event, categories: [...] }
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [currentRatings, setCurrentRatings] = useState({}); // { [criterion_id]: score }
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState({ type: "", message: "" });

  const showToast = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification({ type: "", message: "" }), 4000);
  };

  // Chargement des événements disponibles pour le jury
  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:5000/api/events", { withCredentials: true });
      const evList = res.data?.events || [];
      setEvents(evList);

      if (evList.length > 0) {
        setSelectedEventId(evList[0].id);
        fetchBoard(evList[0].id);
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  // Chargement de la grille d'évaluation pour un événement
  const fetchBoard = async (eventId) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/jury-panel/evaluation-board/${eventId}`, {
        withCredentials: true
      });
      const data = res.data;
      setBoard(data);

      if (data.categories?.length > 0) {
        const firstCat = data.categories[0];
        setSelectedCategory(firstCat);
        if (firstCat.candidates?.length > 0) {
          selectCandidate(firstCat.candidates[0], firstCat);
        }
      }
    } catch (err) {
      showToast("error", err.response?.data?.message || "Erreur de chargement du barème.");
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const selectCandidate = (candidate, category) => {
    setSelectedCandidate(candidate);
    // Pré-remplir les notes déjà attribuées si elles existent
    const existingMap = {};
    if (category.myRatings) {
      category.myRatings
        .filter((r) => String(r.candidate_id) === String(candidate.id))
        .forEach((r) => {
          existingMap[r.criteria_id] = r.rating_value;
        });
    }
    // Pour les critères sans note, valeur par défaut = min_scale
    if (category.criteria) {
      category.criteria.forEach((crit) => {
        if (existingMap[crit.id] === undefined) {
          existingMap[crit.id] = Math.round((crit.min_scale + crit.max_scale) / 2);
        }
      });
    }
    setCurrentRatings(existingMap);
  };

  // Soumission des notes pour le candidat actif
  const handleSaveRatings = async () => {
    if (!selectedCandidate || !selectedCategory) return;

    const payload = Object.entries(currentRatings).map(([criteria_id, rating_value]) => ({
      criteria_id: parseInt(criteria_id, 10),
      rating_value: parseFloat(rating_value)
    }));

    try {
      setSaving(true);
      await axios.post(
        "http://localhost:5000/api/jury-panel/bulk-ratings",
        {
          candidate_id: selectedCandidate.id,
          ratings: payload
        },
        { withCredentials: true }
      );

      showToast("success", `Notes certifiées et enregistrées pour ${selectedCandidate.name} !`);
      // Rafraîchir les notes locales
      fetchBoard(selectedEventId);
    } catch (err) {
      showToast("error", err.response?.data?.message || "Erreur lors de la sauvegarde des notes.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post("http://localhost:5000/api/auth/logout", {}, { withCredentials: true });
    } catch (e) {}
    localStorage.removeItem("verdict_user");
    navigate("/login");
  };

  // Calcul de la moyenne pondérée du candidat pour prévisualisation
  const calculateTotalWeightedScore = () => {
    if (!selectedCategory?.criteria) return 0;
    let total = 0;
    selectedCategory.criteria.forEach((crit) => {
      const val = parseFloat(currentRatings[crit.id] || 0);
      const weight = parseFloat(crit.weight || 0) / 100;
      total += val * weight;
    });
    return total.toFixed(2);
  };

  return (
    <div className="min-h-screen bg-base-200 text-base-content flex flex-col font-sans selection:bg-primary selection:text-primary-content">
      
      {/* Toast Notification */}
      {notification.message && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className={`alert ${notification.type === "success" ? "alert-success" : "alert-error"} shadow-lg rounded-2xl py-3 px-5 flex items-center gap-3`}>
            {notification.type === "success" ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
            <span className="text-sm font-medium">{notification.message}</span>
          </div>
        </div>
      )}

      {/* HEADER JURY */}
      <header className="sticky top-0 z-40 bg-base-100/90 backdrop-blur-md border-b border-base-300 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-primary text-primary-content flex items-center justify-center shadow-xs">
            <Award className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-lg tracking-tight font-display">
              VERDICT<span className="text-primary">.</span>
            </span>
            <span className="text-[10px] font-bold tracking-widest uppercase text-base-content/50 -mt-1">
              Collège de Délibération des Jurés
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {events.length > 0 && (
            <select
              value={selectedEventId}
              onChange={(e) => {
                setSelectedEventId(e.target.value);
                fetchBoard(e.target.value);
              }}
              className="select select-bordered select-sm rounded-xl font-semibold bg-base-200 text-xs"
            >
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => fetchBoard(selectedEventId)}
            className="btn btn-ghost btn-circle btn-sm"
            title="Rafraîchir"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <div className="h-5 w-px bg-base-300" />

          <button
            onClick={handleLogout}
            className="btn btn-ghost btn-sm rounded-xl text-error gap-1.5 normal-case font-medium hover:bg-error/10 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Quitter</span>
          </button>
        </div>
      </header>

      {/* CONTENU PRINCIPAL */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-6">
        
        {/* BANNIÈRE CONTEXTE */}
        <div className="bg-base-100 rounded-3xl p-6 border border-base-300 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Session de Notation Certifiée & Horodatée</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold font-display">
              {board?.event?.title || "Scrutin en cours d'évaluation"}
            </h1>
            <p className="text-xs text-base-content/60">
              Attribuez vos notes selon les critères officiels. Vos évaluations sont enregistrées de façon immuable.
            </p>
          </div>

          {/* Onglets des catégories */}
          {board?.categories && board.categories.length > 0 && (
            <div className="flex flex-wrap gap-2 bg-base-200/70 p-1.5 rounded-2xl border border-base-300">
              {board.categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat);
                    if (cat.candidates?.length > 0) {
                      selectCandidate(cat.candidates[0], cat);
                    } else {
                      setSelectedCandidate(null);
                    }
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedCategory?.id === cat.id
                      ? "bg-base-100 text-primary shadow-xs"
                      : "text-base-content/60 hover:text-base-content"
                  }`}
                >
                  {cat.name} ({cat.jury_weight}% jury)
                </button>
              ))}
            </div>
          )}
        </div>

        {/* GRILLE D'ÉVALUATION SPLIT-VIEW (CANDIDATS À GAUCHE / BARÈME À DROITE) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* COLONNE GAUCHE (4/12) : LISTE DES CANDIDATS DE LA CATÉGORIE */}
          <div className="lg:col-span-4 bg-base-100 rounded-3xl p-5 border border-base-300 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-base-200">
              <span className="text-xs font-bold text-base-content/50 uppercase tracking-wider">
                Candidats ({selectedCategory?.candidates?.length || 0})
              </span>
              <span className="text-[11px] text-base-content/60 font-medium">Sélectionnez pour noter</span>
            </div>

            <div className="space-y-2">
              {selectedCategory?.candidates?.map((cand) => {
                const isSelected = selectedCandidate?.id === cand.id;
                // Vérifier si déjà noté
                const hasRatings = selectedCategory.myRatings?.some(
                  (r) => String(r.candidate_id) === String(cand.id)
                );

                return (
                  <button
                    key={cand.id}
                    onClick={() => selectCandidate(cand, selectedCategory)}
                    className={`w-full p-3.5 rounded-2xl text-left border transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? "bg-primary/10 border-primary text-primary shadow-xs"
                        : "bg-base-200/50 hover:bg-base-200 border-base-300 text-base-content"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-base-100 border border-base-300 flex items-center justify-center font-bold text-sm overflow-hidden shrink-0">
                        {cand.photo_url ? (
                          <img src={cand.photo_url} alt={cand.name} className="h-full w-full object-cover" />
                        ) : (
                          <User className="w-5 h-5 text-base-content/40" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-sm leading-snug">{cand.name}</div>
                        <div className="text-[11px] text-base-content/60 truncate max-w-[160px]">
                          {cand.bio_program || "Aucun descriptif"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {hasRatings ? (
                        <span className="badge badge-success badge-xs gap-1 text-[10px] text-white">
                          <CheckCircle2 className="w-3 h-3" /> Noté
                        </span>
                      ) : (
                        <span className="badge badge-ghost badge-xs text-[10px]">En attente</span>
                      )}
                      <ChevronRight className={`w-4 h-4 ${isSelected ? "text-primary" : "text-base-content/30"}`} />
                    </div>
                  </button>
                );
              })}

              {(!selectedCategory?.candidates || selectedCategory.candidates.length === 0) && (
                <div className="text-center py-8 text-xs text-base-content/50">
                  Aucun candidat rattaché à cette catégorie.
                </div>
              )}
            </div>
          </div>

          {/* COLONNE DROITE (8/12) : SLIDERS & GRILLE DE CRITÈRES */}
          <div className="lg:col-span-8 bg-base-100 rounded-3xl p-6 sm:p-8 border border-base-300 shadow-xs space-y-6">
            
            {selectedCandidate ? (
              <>
                {/* En-tête du candidat sélectionné */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-base-200">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-base-200 border border-base-300 flex items-center justify-center font-extrabold text-xl overflow-hidden shrink-0">
                      {selectedCandidate.photo_url ? (
                        <img src={selectedCandidate.photo_url} alt={selectedCandidate.name} className="h-full w-full object-cover" />
                      ) : (
                        <User className="w-7 h-7 text-base-content/40" />
                      )}
                    </div>
                    <div>
                      <div className="inline-flex items-center gap-1.5 text-xs text-primary font-bold">
                        <Award className="w-3.5 h-3.5" />
                        <span>Catégorie : {selectedCategory?.name}</span>
                      </div>
                      <h2 className="text-xl font-bold font-display">{selectedCandidate.name}</h2>
                      {selectedCandidate.bio_program && (
                        <p className="text-xs text-base-content/60 mt-0.5 max-w-lg">{selectedCandidate.bio_program}</p>
                      )}
                    </div>
                  </div>

                  {/* Synthèse Score Pondéré */}
                  <div className="bg-base-200/80 px-4 py-2.5 rounded-2xl border border-base-300 text-center min-w-[130px]">
                    <span className="text-[10px] font-bold text-base-content/50 uppercase tracking-wider block">
                      Score Global
                    </span>
                    <span className="text-2xl font-black font-display text-primary block">
                      {calculateTotalWeightedScore()} <span className="text-xs font-normal text-base-content/50">/ 20</span>
                    </span>
                  </div>
                </div>

                {/* Liste des critères avec curseurs interactifs (Sliders DaisyUI) */}
                <div className="space-y-6">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-base-content/50">
                    Critères d'évaluation & Barème officiel
                  </h3>

                  {selectedCategory?.criteria?.map((crit) => {
                    const currentVal = currentRatings[crit.id] !== undefined ? currentRatings[crit.id] : crit.min_scale;
                    const min = crit.min_scale || 0;
                    const max = crit.max_scale || 20;

                    return (
                      <div key={crit.id} className="p-4 rounded-2xl bg-base-200/40 border border-base-300 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-bold text-sm block">{crit.label}</span>
                            <span className="text-[11px] text-base-content/60">
                              Pondération : <strong>{crit.weight}%</strong> • Barème de {min} à {max}
                            </span>
                          </div>
                          <div className="h-9 min-w-[48px] px-3 rounded-xl bg-base-100 border border-base-300 font-extrabold text-sm flex items-center justify-center text-primary shadow-xs">
                            {currentVal} / {max}
                          </div>
                        </div>

                        {/* Curseur Range DaisyUI */}
                        <input
                          type="range"
                          min={min}
                          max={max}
                          step="0.5"
                          value={currentVal}
                          onChange={(e) => {
                            setCurrentRatings({
                              ...currentRatings,
                              [crit.id]: parseFloat(e.target.value)
                            });
                          }}
                          className="range range-primary range-sm w-full cursor-pointer"
                        />

                        <div className="flex justify-between text-[10px] text-base-content/40 font-mono px-1">
                          <span>{min} (Min)</span>
                          <span>{((min + max) / 2).toFixed(1)} (Moyen)</span>
                          <span>{max} (Max)</span>
                        </div>
                      </div>
                    );
                  })}

                  {(!selectedCategory?.criteria || selectedCategory.criteria.length === 0) && (
                    <div className="p-6 rounded-2xl bg-base-200 text-center text-xs text-base-content/60">
                      Aucun critère de notation défini par l'administrateur pour cette catégorie.
                    </div>
                  )}
                </div>

                {/* Bouton de validation */}
                <div className="pt-4 border-t border-base-200 flex items-center justify-end">
                  <button
                    onClick={handleSaveRatings}
                    disabled={saving || !selectedCategory?.criteria?.length}
                    className="btn btn-primary rounded-2xl font-semibold gap-2 shadow-md shadow-primary/20 normal-case px-6 cursor-pointer"
                  >
                    {saving ? (
                      <span className="loading loading-spinner loading-sm" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Valider & Certifier les Notes</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-16 text-base-content/50 space-y-2">
                <Sliders className="w-8 h-8 mx-auto text-base-content/30" />
                <p className="text-sm">Veuillez sélectionner un candidat dans la liste de gauche pour saisir ses notes.</p>
              </div>
            )}

          </div>

        </div>

      </main>

    </div>
  );
}
