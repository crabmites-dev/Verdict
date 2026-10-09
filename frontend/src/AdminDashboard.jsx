import { useState, useEffect } from "react";
import {
  Vote,
  Users,
  ShieldCheck,
  TrendingUp,
  Plus,
  Key,
  Download,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  FileText,
  Search,
  Filter,
  RefreshCw,
  Eye,
  LogOut,
  Sliders,
  ChevronRight,
  Sparkles,
  Award,
  Layers,
  Activity,
  Send,
  Copy,
  Check,
  UserPlus,
  Tag,
  ListPlus,
  Play
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "events" | "tokens" | "candidates"
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [tokenStats, setTokenStats] = useState({ total: 0, used: 0, remaining: 0 });
  const [copiedToken, setCopiedToken] = useState(null);

  // Données de gestion Événement (Catégories, Candidats, Critères)
  const [categories, setCategories] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [criteriaList, setCriteriaList] = useState([]);
  const [selectedCategoryForCriteria, setSelectedCategoryForCriteria] = useState(null);

  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [showCriteriaModal, setShowCriteriaModal] = useState(false);

  const [newTokenCount, setNewTokenCount] = useState(25);
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    start_date: "",
    end_date: "",
    auth_mode: "open_public" // "open_public" | "restricted_token"
  });

  const [newCategory, setNewCategory] = useState({
    name: "",
    vote_mode: "mixed", // "public_only" | "jury_only" | "mixed"
    jury_weight: 50
  });

  const [newCandidate, setNewCandidate] = useState({
    category_id: "",
    name: "",
    photo_url: "",
    bio_program: ""
  });

  const [newCriterion, setNewCriterion] = useState({
    category_id: "",
    label: "",
    weight: 20,
    min_scale: 0,
    max_scale: 20
  });

  const [notification, setNotification] = useState({ type: "", message: "" });

  const showToast = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification({ type: "", message: "" }), 4000);
  };

  // Chargement des catégories et candidats liés à un événement
  const fetchEventStructure = async (eventId) => {
    if (!eventId) return;
    try {
      const [catsRes, candsRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/jury-panel/categories/event/${eventId}`, { withCredentials: true }),
        axios.get(`http://localhost:5000/api/jury-panel/candidates/event/${eventId}`, { withCredentials: true })
      ]);
      const fetchedCats = catsRes.data?.categories || [];
      setCategories(fetchedCats);
      setCandidates(candsRes.data?.candidates || []);

      if (fetchedCats.length > 0) {
        setSelectedCategoryForCriteria(fetchedCats[0]);
        fetchCriteria(fetchedCats[0].id);
      } else {
        setSelectedCategoryForCriteria(null);
        setCriteriaList([]);
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des catégories et candidats:", err);
    }
  };

  // Chargement des critères pour une catégorie
  const fetchCriteria = async (categoryId) => {
    if (!categoryId) return;
    try {
      const res = await axios.get(`http://localhost:5000/api/jury-panel/criteria/category/${categoryId}`, { withCredentials: true });
      setCriteriaList(res.data?.criteria || []);
    } catch (err) {
      console.error("Erreur critères:", err);
    }
  };

  // Chargement des données du tableau de bord
  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, eventsRes] = await Promise.all([
        axios.get("http://localhost:5000/api/admin/dashboard-stats", { withCredentials: true }),
        axios.get("http://localhost:5000/api/events", { withCredentials: true })
      ]);

      setStats(statsRes.data?.data);
      const evList = eventsRes.data?.events || [];
      setEvents(evList);

      if (evList.length > 0) {
        const curEvent = selectedEvent ? evList.find(e => e.id === selectedEvent.id) || evList[0] : evList[0];
        setSelectedEvent(curEvent);
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  // Chargement des jetons d'un événement
  const fetchTokens = async (eventId) => {
    if (!eventId) return;
    try {
      const res = await axios.get(`http://localhost:5000/api/events/${eventId}/voter-tokens`, { withCredentials: true });
      setTokens(res.data?.tokens || []);
      setTokenStats(res.data?.stats || { total: 0, used: 0, remaining: 0 });
    } catch (err) {
      console.error("Error fetching tokens:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      fetchTokens(selectedEvent.id);
      fetchEventStructure(selectedEvent.id);
    }
  }, [selectedEvent]);

  // Création d'événement
  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/api/events", newEvent, { withCredentials: true });
      showToast("success", "Événement créé avec succès !");
      setShowCreateModal(false);
      setNewEvent({
        title: "",
        description: "",
        start_date: "",
        end_date: "",
        auth_mode: "open_public"
      });
      fetchData();
    } catch (err) {
      showToast("error", err.response?.data?.message || "Erreur lors de la création.");
    }
  };

  // Ouvrir / Lancer un scrutin (passer de draft à active)
  const handleLaunchEvent = async (eventId) => {
    try {
      await axios.patch(`http://localhost:5000/api/events/${eventId}/launch`, {}, { withCredentials: true });
      showToast("success", "Le scrutin est désormais OUVERT et accessible aux électeurs !");
      fetchData();
    } catch (err) {
      showToast("error", err.response?.data?.message || "Erreur lors de l'activation.");
    }
  };

  // Création d'une catégorie
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!selectedEvent) return;
    try {
      await axios.post("http://localhost:5000/api/jury-panel/categories", {
        eventId: selectedEvent.id,
        name: newCategory.name,
        vote_mode: newCategory.vote_mode,
        jury_weight: newCategory.jury_weight
      }, { withCredentials: true });
      showToast("success", `Catégorie "${newCategory.name}" créée avec succès !`);
      setShowCategoryModal(false);
      setNewCategory({ name: "", vote_mode: "mixed", jury_weight: 50 });
      fetchEventStructure(selectedEvent.id);
    } catch (err) {
      showToast("error", err.response?.data?.message || "Erreur lors de la création de la catégorie.");
    }
  };

  // Création d'un candidat
  const handleCreateCandidate = async (e) => {
    e.preventDefault();
    if (!newCandidate.category_id) {
      showToast("error", "Veuillez sélectionner une catégorie.");
      return;
    }
    try {
      await axios.post("http://localhost:5000/api/jury-panel/candidates", {
        category_id: newCandidate.category_id,
        name: newCandidate.name,
        photo_url: newCandidate.photo_url || null,
        bio_program: newCandidate.bio_program || null
      }, { withCredentials: true });
      showToast("success", `Candidat "${newCandidate.name}" inscrit avec succès !`);
      setShowCandidateModal(false);
      setNewCandidate({ category_id: "", name: "", photo_url: "", bio_program: "" });
      fetchEventStructure(selectedEvent.id);
    } catch (err) {
      showToast("error", err.response?.data?.message || "Erreur lors de l'inscription du candidat.");
    }
  };

  // Création d'un critère de notation
  const handleCreateCriterion = async (e) => {
    e.preventDefault();
    if (!selectedCategoryForCriteria) {
      showToast("error", "Aucune catégorie sélectionnée.");
      return;
    }
    try {
      await axios.post("http://localhost:5000/api/jury-panel/criteria", {
        category_id: selectedCategoryForCriteria.id,
        label: newCriterion.label,
        weight: newCriterion.weight,
        min_scale: newCriterion.min_scale,
        max_scale: newCriterion.max_scale
      }, { withCredentials: true });
      showToast("success", `Critère "${newCriterion.label}" ajouté !`);
      setShowCriteriaModal(false);
      setNewCriterion({
        category_id: "",
        label: "",
        weight: 20,
        min_scale: 0,
        max_scale: 20
      });
      fetchCriteria(selectedCategoryForCriteria.id);
    } catch (err) {
      showToast("error", err.response?.data?.message || "Erreur lors de l'ajout du critère.");
    }
  };

  // Génération de jetons
  const handleGenerateTokens = async (e) => {
    e.preventDefault();
    if (!selectedEvent) return;
    try {
      await axios.post(
        `http://localhost:5000/api/events/${selectedEvent.id}/voter-tokens`,
        { count: newTokenCount },
        { withCredentials: true }
      );
      showToast("success", `${newTokenCount} jetons uniques générés avec succès !`);
      setShowTokenModal(false);
      fetchTokens(selectedEvent.id);
    } catch (err) {
      showToast("error", err.response?.data?.message || "Erreur lors de la génération.");
    }
  };

  // Clôturer un événement
  const handleCloseEvent = async (eventId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir clore définitivement la fenêtre de vote pour cet événement ?")) return;
    try {
      await axios.patch(`http://localhost:5000/api/events/${eventId}/close`, {}, { withCredentials: true });
      showToast("success", "Le scrutin a été clôturé avec succès.");
      fetchData();
    } catch (err) {
      showToast("error", err.response?.data?.message || "Erreur de clôture.");
    }
  };

  // Déconnexion
  const handleLogout = async () => {
    try {
      await axios.post("http://localhost:5000/api/auth/logout", {}, { withCredentials: true });
    } catch (e) {
      // ignore
    }
    localStorage.removeItem("verdict_user");
    navigate("/login");
  };

  // Données de graphiques simulées et dynamiques
  const votesOverTime = [
    { hour: "08h", public: 120, jury: 5 },
    { hour: "10h", public: 340, jury: 18 },
    { hour: "12h", public: 680, jury: 32 },
    { hour: "14h", public: 920, jury: 48 },
    { hour: "16h", public: 1450, jury: 64 },
    { hour: "18h", public: 1890, jury: 82 },
    { hour: "20h", public: 2150, jury: 94 }
  ];

  const distributionModeData = [
    { name: "Public Ouvert", value: events.filter(e => e.auth_mode === "open_public").length || 3, color: "#0069ff" },
    { name: "Émargement Restreint", value: events.filter(e => e.auth_mode === "restricted_token").length || 2, color: "#10b981" }
  ];

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

      {/* ======================================================== */}
      {/* NAVIGATION SUPÉRIEURE (HEADER SAAS)                      */}
      {/* ======================================================== */}
      <header className="sticky top-0 z-40 bg-base-100/90 backdrop-blur-md border-b border-base-300 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-8">
          {/* Logo Brand */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-primary text-primary-content flex items-center justify-center shadow-xs">
              <Vote className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-tight font-display">
                VERDICT<span className="text-primary">.</span>
              </span>
              <span className="text-[10px] font-bold tracking-widest uppercase text-base-content/50 -mt-1">
                Espace Administration
              </span>
            </div>
          </div>

          {/* Navigation Onglets */}
          <nav className="hidden md:flex items-center gap-1 bg-base-200/80 p-1 rounded-2xl border border-base-300 text-xs font-semibold">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeTab === "overview" ? "bg-base-100 text-primary shadow-xs" : "text-base-content/60 hover:text-base-content"
              }`}
            >
              Vue Générale
            </button>
            <button
              onClick={() => setActiveTab("events")}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeTab === "events" ? "bg-base-100 text-primary shadow-xs" : "text-base-content/60 hover:text-base-content"
              }`}
            >
              Scrutins & Événements ({events.length})
            </button>
            <button
              onClick={() => setActiveTab("tokens")}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeTab === "tokens" ? "bg-base-100 text-primary shadow-xs" : "text-base-content/60 hover:text-base-content"
              }`}
            >
              Jetons d'Émargement
            </button>
            <button
              onClick={() => setActiveTab("candidates")}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeTab === "candidates" ? "bg-base-100 text-primary shadow-xs" : "text-base-content/60 hover:text-base-content"
              }`}
            >
              Candidats & Critères ({candidates.length})
            </button>
          </nav>
        </div>

        {/* Actions d'en-tête */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary btn-sm rounded-xl font-semibold gap-1.5 shadow-xs normal-case cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nouveau Scrutin</span>
          </button>

          <button
            onClick={fetchData}
            title="Rafraîchir les métriques"
            className="btn btn-ghost btn-circle btn-sm text-base-content/60 hover:text-base-content cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <div className="h-5 w-px bg-base-300 mx-1" />

          <button
            onClick={handleLogout}
            className="btn btn-ghost btn-sm rounded-xl text-error gap-1.5 normal-case font-medium hover:bg-error/10 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Déconnexion</span>
          </button>
        </div>
      </header>

      {/* ======================================================== */}
      {/* CORPS PRINCIPAL DU TABLEAU DE BORD                       */}
      {/* ======================================================== */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-8">
        
        {/* BANNIÈRE RÉSUMÉ & SÉLECTEUR D'ÉVÉNEMENT */}
        <div className="bg-base-100 rounded-3xl p-6 sm:p-8 border border-base-300 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Gouvernance & Dépouillement Cryptographique Actif</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display">
              Centre de Contrôle des Votes
            </h1>
            <p className="text-sm text-base-content/60">
              Supervisez les taux de participation, générez les listes d'émargement et exportez les procès-verbaux certifiés.
            </p>
          </div>

          {/* Sélecteur d'événement actif */}
          {events.length > 0 && (
            <div className="bg-base-200/80 p-3 rounded-2xl border border-base-300 min-w-[280px]">
              <label className="text-[11px] font-bold text-base-content/50 uppercase tracking-wider block mb-1.5">
                Scrutin Sélectionné
              </label>
              <select
                value={selectedEvent?.id || ""}
                onChange={(e) => {
                  const ev = events.find(item => String(item.id) === e.target.value);
                  setSelectedEvent(ev);
                }}
                className="select select-bordered select-sm w-full rounded-xl bg-base-100 font-semibold"
              >
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title} ({ev.status.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* CONTENU SELON L'ONGLET ACTIF                             */}
        {/* ======================================================== */}

        {/* 1. VUE GÉNÉRALE & ANALYTIQUES */}
        {activeTab === "overview" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            
            {/* 4 CARTES KPI STATISTIQUES */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              
              <div className="bg-base-100 p-5 rounded-3xl border border-base-300 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-base-content/50 uppercase tracking-wider block">
                    Suffrages Exprimés
                  </span>
                  <span className="text-3xl font-extrabold font-display mt-1 block">
                    {stats?.total_public_votes?.toLocaleString() || "0"}
                  </span>
                  <span className="text-xs text-success font-medium flex items-center gap-1 mt-1">
                    <TrendingUp className="w-3.5 h-3.5" /> +14.2% participation
                  </span>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <Vote className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-base-100 p-5 rounded-3xl border border-base-300 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-base-content/50 uppercase tracking-wider block">
                    Évaluations Jurés
                  </span>
                  <span className="text-3xl font-extrabold font-display mt-1 block">
                    {stats?.jury_activity?.submitted_ratings || "0"}
                  </span>
                  <span className="text-xs text-base-content/60 font-medium mt-1 block">
                    {stats?.jury_activity?.total_registered_jurors || 0} jurés accrédités
                  </span>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <Award className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-base-100 p-5 rounded-3xl border border-base-300 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-base-content/50 uppercase tracking-wider block">
                    Scrutins Totaux
                  </span>
                  <span className="text-3xl font-extrabold font-display mt-1 block">
                    {events.length}
                  </span>
                  <span className="text-xs text-primary font-medium mt-1 block">
                    {events.filter(e => e.status === "active").length} en cours de vote
                  </span>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-sky-500/10 text-sky-600 flex items-center justify-center">
                  <Layers className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-base-100 p-5 rounded-3xl border border-base-300 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-base-content/50 uppercase tracking-wider block">
                    Jetons d'Émargement
                  </span>
                  <span className="text-3xl font-extrabold font-display mt-1 block">
                    {tokenStats.total}
                  </span>
                  <span className="text-xs text-base-content/60 font-medium mt-1 block">
                    {tokenStats.used} consommés ({tokenStats.remaining} restants)
                  </span>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <Key className="w-6 h-6" />
                </div>
              </div>

            </div>

            {/* SECTION GRAPHIQUES : RECHARTS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Graphique 1 : Dynamique temporelle des votes */}
              <div className="lg:col-span-2 bg-base-100 p-6 sm:p-7 rounded-3xl border border-base-300 shadow-xs">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-base font-bold font-display">Affluence & Dépouillement en Temps Réel</h3>
                    <p className="text-xs text-base-content/60">Évolution de la participation tout au long du scrutin</p>
                  </div>
                  <span className="badge badge-success badge-sm gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Live
                  </span>
                </div>

                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={votesOverTime} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorPublic" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0069ff" stopOpacity={0.35}/>
                          <stop offset="95%" stopColor="#0069ff" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="hour" stroke="#94a3b8" fontSize={12} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0" }} />
                      <Area type="monotone" dataKey="public" name="Votes Public" stroke="#0069ff" strokeWidth={3} fillOpacity={1} fill="url(#colorPublic)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Graphique 2 : Répartition des modes de scrutin */}
              <div className="bg-base-100 p-6 sm:p-7 rounded-3xl border border-base-300 shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold font-display mb-1">Architecture des Scrutins</h3>
                  <p className="text-xs text-base-content/60 mb-6">Répartition par modalité d'authentification</p>
                  
                  <div className="h-52 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={distributionModeData}
                          innerRadius={55}
                          outerRadius={75}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {distributionModeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-base-200 text-xs">
                  {distributionModeData.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-base-content/70">{item.name}</span>
                      </div>
                      <span className="font-bold">{item.value} scrutin(s)</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* ACCÈS RAPIDES AUX PROCÈS-VERBAUX (EXPORTS PDF & CSV) */}
            <div className="bg-base-100 p-6 sm:p-8 rounded-3xl border border-base-300 shadow-xs">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-base font-bold font-display">Exportation & Délibérations Officielles</h3>
                  <p className="text-xs text-base-content/60">Téléchargez les résultats consolidés au format institutionnel certifié</p>
                </div>
                {selectedEvent && (
                  <span className="text-xs px-3 py-1 rounded-full bg-base-200 font-medium">
                    Pour l'événement : <strong>{selectedEvent.title}</strong>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <a
                  href={selectedEvent ? `http://localhost:5000/api/exports/category/1/pdf` : "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="p-5 rounded-2xl bg-base-200/60 hover:bg-base-200 border border-base-300 transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="h-11 w-11 rounded-xl bg-error/10 text-error flex items-center justify-center">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold group-hover:text-primary transition-colors">
                        Procès-Verbal Officiel (PDF)
                      </h4>
                      <p className="text-xs text-base-content/60">Génère un rapport signé avec synthèse des notes et rangs</p>
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-base-content/40 group-hover:text-primary transition-transform group-hover:translate-y-0.5" />
                </a>

                <a
                  href={selectedEvent ? `http://localhost:5000/api/exports/category/1/csv` : "#"}
                  className="p-5 rounded-2xl bg-base-200/60 hover:bg-base-200 border border-base-300 transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="h-11 w-11 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold group-hover:text-primary transition-colors">
                        Extraction Brute des Suffrages (CSV)
                      </h4>
                      <p className="text-xs text-base-content/60">Compatible Excel avec encodage UTF-8 et métriques détaillées</p>
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-base-content/40 group-hover:text-primary transition-transform group-hover:translate-y-0.5" />
                </a>
              </div>
            </div>

          </div>
        )}

        {/* 2. GESTION DES ÉVÉNEMENTS & SCRUTINS */}
        {activeTab === "events" && (
          <div className="bg-base-100 rounded-3xl border border-base-300 shadow-xs p-6 sm:p-8 space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold font-display">Registre des Scrutins</h2>
                <p className="text-xs text-base-content/60">Configurez les dates, clôturez les urnes et contrôlez les accès</p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn btn-primary btn-sm rounded-xl font-semibold gap-1.5 normal-case"
              >
                <Plus className="w-4 h-4" />
                Créer un Scrutin
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="table table-zebra w-full text-xs">
                <thead>
                  <tr className="border-b border-base-300 text-base-content/50 uppercase text-[10px] tracking-wider">
                    <th>Titre & Modalité</th>
                    <th>Mode d'Émargement</th>
                    <th>Statut</th>
                    <th>Période de Vote</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((ev) => (
                    <tr key={ev.id} className="hover">
                      <td className="font-semibold text-sm">
                        <div className="font-bold text-base-content">{ev.title}</div>
                        <div className="text-[11px] text-base-content/50 font-normal truncate max-w-xs">{ev.description || "Aucune description"}</div>
                      </td>
                      <td>
                        <span className={`badge badge-sm font-semibold ${
                          ev.auth_mode === "restricted_token" ? "badge-success text-white" : "badge-outline badge-primary"
                        }`}>
                          {ev.auth_mode === "restricted_token" ? "Jeton Unique (Restreint)" : "Grand Public"}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-sm ${
                          ev.status === "active" ? "badge-success text-white" : ev.status === "draft" ? "badge-warning" : "badge-neutral"
                        }`}>
                          {ev.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="font-mono text-base-content/70">
                        {new Date(ev.start_date).toLocaleDateString()} → {new Date(ev.end_date).toLocaleDateString()}
                      </td>
                      <td className="text-right space-x-2">
                        {ev.status === "draft" && (
                          <button
                            onClick={() => handleLaunchEvent(ev.id)}
                            className="btn btn-success btn-xs rounded-lg text-white normal-case gap-1"
                          >
                            <Play className="w-3 h-3" />
                            Ouvrir le Vote
                          </button>
                        )}
                        {ev.status === "active" && (
                          <button
                            onClick={() => handleCloseEvent(ev.id)}
                            className="btn btn-error btn-outline btn-xs rounded-lg normal-case"
                          >
                            Clôturer
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedEvent(ev);
                            setActiveTab("candidates");
                          }}
                          className="btn btn-ghost btn-xs rounded-lg text-primary normal-case"
                        >
                          Candidats ({candidates.filter(c => c.category_id && categories.some(cat => cat.id === c.category_id && cat.event_id === ev.id)).length || "Config"}) →
                        </button>
                        <button
                          onClick={() => {
                            setSelectedEvent(ev);
                            setActiveTab("tokens");
                          }}
                          className="btn btn-ghost btn-xs rounded-lg text-base-content/60 normal-case"
                        >
                          Jetons →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. GESTION DES JETONS D'ÉMARGEMENT */}
        {activeTab === "tokens" && (
          <div className="bg-base-100 rounded-3xl border border-base-300 shadow-xs p-6 sm:p-8 space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold font-display">
                  Jetons Uniques d'Émargement ({selectedEvent?.title || "Scrutin"})
                </h2>
                <p className="text-xs text-base-content/60">
                  Générez et distribuez des liens de vote à usage unique pour universités et comités
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowTokenModal(true)}
                  className="btn btn-primary btn-sm rounded-xl font-semibold gap-1.5 normal-case"
                >
                  <Key className="w-4 h-4" />
                  Générer des Jetons
                </button>
              </div>
            </div>

            {/* Métriques Jetons */}
            <div className="grid grid-cols-3 gap-4 bg-base-200/50 p-4 rounded-2xl border border-base-300">
              <div className="text-center">
                <span className="text-[11px] font-bold text-base-content/50 uppercase">Total Émis</span>
                <p className="text-2xl font-bold font-display mt-0.5">{tokenStats.total}</p>
              </div>
              <div className="text-center border-x border-base-300">
                <span className="text-[11px] font-bold text-success uppercase">Votes Exprimés</span>
                <p className="text-2xl font-bold text-success font-display mt-0.5">{tokenStats.used}</p>
              </div>
              <div className="text-center">
                <span className="text-[11px] font-bold text-warning uppercase">En Attente</span>
                <p className="text-2xl font-bold text-warning font-display mt-0.5">{tokenStats.remaining}</p>
              </div>
            </div>

            {/* Table des Jetons */}
            <div className="overflow-x-auto max-h-96">
              <table className="table table-zebra table-pin-rows w-full text-xs">
                <thead>
                  <tr className="border-b border-base-300 text-base-content/50 uppercase text-[10px]">
                    <th>Jeton Cryptographique</th>
                    <th>Lien de Vote Direct</th>
                    <th>Statut</th>
                    <th>Date d'Émargement</th>
                  </tr>
                </thead>
                <tbody>
                  {tokens.map((tk) => {
                    const voteUrl = `http://localhost:5173/vote?token=${tk.token}`;
                    return (
                      <tr key={tk.id}>
                        <td className="font-mono text-xs text-primary font-bold">
                          {tk.token.substring(0, 16)}...
                        </td>
                        <td>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(voteUrl);
                              setCopiedToken(tk.id);
                              setTimeout(() => setCopiedToken(null), 2000);
                            }}
                            className="btn btn-ghost btn-xs rounded-lg gap-1.5 text-base-content/70 hover:text-primary normal-case"
                          >
                            {copiedToken === tk.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-success" />
                                <span className="text-success">Copié !</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copier le lien</span>
                              </>
                            )}
                          </button>
                        </td>
                        <td>
                          <span className={`badge badge-xs font-semibold ${tk.is_used ? "badge-error text-white" : "badge-success text-white"}`}>
                            {tk.is_used ? "Utilisé / Clos" : "Valide"}
                          </span>
                        </td>
                        <td className="font-mono text-base-content/60">
                          {tk.used_at ? new Date(tk.used_at).toLocaleString() : "—"}
                        </td>
                      </tr>
                    );
                  })}
                  {tokens.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-base-content/50">
                        Aucun jeton généré pour cet événement. Cliquez sur "Générer des Jetons".
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. GESTION DES CANDIDATS, CATÉGORIES & CRITÈRES */}
        {activeTab === "candidates" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Barre d'action supérieure */}
            <div className="bg-base-100 rounded-3xl border border-base-300 shadow-xs p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-1.5">
                  <Tag className="w-3.5 h-3.5" />
                  <span>Structure de Délibération</span>
                </div>
                <h2 className="text-xl font-bold font-display">
                  Candidats & Critères de Notation — {selectedEvent?.title || "Scrutin"}
                </h2>
                <p className="text-xs text-base-content/60">
                  Configurez les catégories électorales, associez les candidats et définissez les barèmes du jury.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={() => setShowCategoryModal(true)}
                  className="btn btn-outline btn-primary btn-sm rounded-xl font-semibold gap-1.5 normal-case"
                >
                  <Tag className="w-4 h-4" />
                  + Catégorie
                </button>
                <button
                  onClick={() => {
                    if (categories.length === 0) {
                      showToast("error", "Créez d'abord au moins une catégorie.");
                      return;
                    }
                    setShowCandidateModal(true);
                  }}
                  className="btn btn-primary btn-sm rounded-xl font-semibold gap-1.5 normal-case"
                >
                  <UserPlus className="w-4 h-4" />
                  + Candidat
                </button>
              </div>
            </div>

            {/* Grille : Catégories & Candidats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Colonne 1 & 2 : Liste des Candidats par Catégorie */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-base-100 rounded-3xl border border-base-300 shadow-xs p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold font-display flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary" />
                      Candidats Enregistrés ({candidates.length})
                    </h3>
                    <span className="text-xs text-base-content/50">
                      {categories.length} catégorie(s) configurée(s)
                    </span>
                  </div>

                  {candidates.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-base-200 rounded-2xl p-6">
                      <Users className="w-10 h-10 text-base-content/30 mx-auto mb-3" />
                      <p className="text-sm font-semibold text-base-content/70">Aucun candidat pour ce scrutin</p>
                      <p className="text-xs text-base-content/50 mt-1 max-w-sm mx-auto">
                        Créez une catégorie (ex: Prix de l'Innovation, Meilleur Projet) puis ajoutez-y vos candidats.
                      </p>
                      <button
                        onClick={() => {
                          if (categories.length === 0) setShowCategoryModal(true);
                          else setShowCandidateModal(true);
                        }}
                        className="btn btn-primary btn-sm rounded-xl mt-4 font-semibold normal-case"
                      >
                        {categories.length === 0 ? "Créer une première catégorie" : "Ajouter un candidat"}
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {candidates.map((cand) => (
                        <div
                          key={cand.candidate_id}
                          className="p-4 rounded-2xl bg-base-200/50 border border-base-300 flex items-start gap-3.5 hover:border-primary/50 transition-colors"
                        >
                          <img
                            src={cand.photo_url || `https://api.dicebear.com/7.x/shapes/svg?seed=${cand.candidate_name}`}
                            alt={cand.candidate_name}
                            className="w-12 h-12 rounded-xl object-cover border border-base-300 shrink-0 bg-base-100"
                          />
                          <div className="flex-1 min-w-0">
                            <span className="badge badge-xs badge-primary font-semibold mb-1">
                              {cand.category_name}
                            </span>
                            <h4 className="text-sm font-bold truncate text-base-content">
                              {cand.candidate_name}
                            </h4>
                            <p className="text-xs text-base-content/60 line-clamp-2 mt-0.5">
                              {cand.bio_program || "Aucune description de programme"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Colonne 3 : Barème et Critères Jury */}
              <div className="space-y-4">
                <div className="bg-base-100 rounded-3xl border border-base-300 shadow-xs p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold font-display flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-primary" />
                        Grille du Jury
                      </h3>
                      <p className="text-xs text-base-content/50">Critères & barèmes de notation</p>
                    </div>
                    {selectedCategoryForCriteria && (
                      <button
                        onClick={() => setShowCriteriaModal(true)}
                        className="btn btn-ghost btn-xs text-primary font-bold normal-case gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Critère
                      </button>
                    )}
                  </div>

                  {/* Sélecteur de catégorie active pour les critères */}
                  {categories.length > 0 && (
                    <div className="form-control">
                      <label className="text-[11px] font-bold text-base-content/50 uppercase tracking-wider mb-1">
                        Catégorie Ciblée
                      </label>
                      <select
                        value={selectedCategoryForCriteria?.id || ""}
                        onChange={(e) => {
                          const cat = categories.find(c => c.id === parseInt(e.target.value, 10));
                          setSelectedCategoryForCriteria(cat);
                          if (cat) fetchCriteria(cat.id);
                        }}
                        className="select select-bordered select-sm rounded-xl font-medium"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.vote_mode === "mixed" ? `Mixte jury ${c.jury_weight}%` : c.vote_mode})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Liste des critères */}
                  <div className="space-y-2 pt-2">
                    {criteriaList.map((crit) => (
                      <div
                        key={crit.id}
                        className="p-3 rounded-xl bg-base-200/60 border border-base-300 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-base-content">{crit.label}</div>
                          <div className="text-[10px] text-base-content/50">
                            Barème : {crit.min_scale} à {crit.max_scale} pts
                          </div>
                        </div>
                        <span className="badge badge-sm badge-neutral font-mono font-bold">
                          Poids {crit.weight}%
                        </span>
                      </div>
                    ))}

                    {criteriaList.length === 0 && (
                      <div className="text-center py-6 text-base-content/50 text-xs">
                        {categories.length === 0 ? "Aucune catégorie disponible." : "Aucun critère défini pour cette catégorie."}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ======================================================== */}
      {/* MODAL : CRÉATION D'UN NOUVEAU SCRUTIN                    */}
      {/* ======================================================== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-base-100 rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-base-300 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold font-display mb-1">Créer un Nouveau Scrutin</h3>
            <p className="text-xs text-base-content/60 mb-6">Paramétrez les critères et le type d'accès aux urnes.</p>

            <form onSubmit={handleCreateEvent} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold block mb-1">Titre de l'élection / concours</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Élection du Doyen 2026 / Hackathon Final"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="input input-bordered w-full rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Description / Contexte</label>
                <textarea
                  rows={2}
                  placeholder="Description succincte du scrutin..."
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="textarea textarea-bordered w-full rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Date & Heure Début</label>
                  <input
                    type="datetime-local"
                    required
                    value={newEvent.start_date}
                    onChange={(e) => setNewEvent({ ...newEvent, start_date: e.target.value })}
                    className="input input-bordered w-full rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Date & Heure Fin</label>
                  <input
                    type="datetime-local"
                    required
                    value={newEvent.end_date}
                    onChange={(e) => setNewEvent({ ...newEvent, end_date: e.target.value })}
                    className="input input-bordered w-full rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Mode d'accès et d'authentification</label>
                <select
                  value={newEvent.auth_mode}
                  onChange={(e) => setNewEvent({ ...newEvent, auth_mode: e.target.value })}
                  className="select select-bordered w-full rounded-xl font-medium"
                >
                  <option value="open_public">Grand Public (Sécurisé par Empreinte Numérique IP/Device)</option>
                  <option value="restricted_token">Universitaire / Entreprise (Jetons uniques d'émargement)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-base-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-ghost btn-sm rounded-xl normal-case"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm rounded-xl font-semibold normal-case px-5"
                >
                  Créer l'Événement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL : NOUVELLE CATÉGORIE                              */}
      {/* ======================================================== */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-base-100 rounded-3xl p-6 sm:p-8 max-w-md w-full border border-base-300 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold font-display mb-1">Ajouter une Catégorie</h3>
            <p className="text-xs text-base-content/60 mb-5">
              Pour le scrutin : <strong>{selectedEvent?.title}</strong>
            </p>

            <form onSubmit={handleCreateCategory} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold block mb-1">Nom de la catégorie</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Meilleur Projet Numérique, Prix du Public"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  className="input input-bordered w-full rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Mode de Délibération</label>
                <select
                  value={newCategory.vote_mode}
                  onChange={(e) => setNewCategory({ ...newCategory, vote_mode: e.target.value })}
                  className="select select-bordered w-full rounded-xl font-medium"
                >
                  <option value="mixed">Mixte (Vote Public + Barème Jury)</option>
                  <option value="public_only">100% Suffrage Public</option>
                  <option value="jury_only">100% Jury Professionnel</option>
                </select>
              </div>

              {newCategory.vote_mode === "mixed" && (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-semibold">Poids du Jury</label>
                    <span className="font-mono font-bold text-primary">{newCategory.jury_weight}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="90"
                    step="5"
                    value={newCategory.jury_weight}
                    onChange={(e) => setNewCategory({ ...newCategory, jury_weight: parseInt(e.target.value, 10) })}
                    className="range range-primary range-sm"
                  />
                  <div className="text-[10px] text-base-content/50 mt-1 flex justify-between">
                    <span>Public: {100 - newCategory.jury_weight}%</span>
                    <span>Jury: {newCategory.jury_weight}%</span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-base-200">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="btn btn-ghost btn-sm rounded-xl normal-case"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm rounded-xl font-semibold normal-case px-5"
                >
                  Créer la Catégorie
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL : NOUVEAU CANDIDAT                                */}
      {/* ======================================================== */}
      {showCandidateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-base-100 rounded-3xl p-6 sm:p-8 max-w-md w-full border border-base-300 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold font-display mb-1">Inscrire un Candidat</h3>
            <p className="text-xs text-base-content/60 mb-5">
              Associez le candidat à sa catégorie de compétition.
            </p>

            <form onSubmit={handleCreateCandidate} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold block mb-1">Catégorie</label>
                <select
                  required
                  value={newCandidate.category_id}
                  onChange={(e) => setNewCandidate({ ...newCandidate, category_id: e.target.value })}
                  className="select select-bordered w-full rounded-xl font-medium"
                >
                  <option value="">Sélectionnez une catégorie...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">Nom du candidat / Titre du projet</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Sophie Martin / Projet SolarGreen"
                  value={newCandidate.name}
                  onChange={(e) => setNewCandidate({ ...newCandidate, name: e.target.value })}
                  className="input input-bordered w-full rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">URL de la photo ou du logo (optionnel)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={newCandidate.photo_url}
                  onChange={(e) => setNewCandidate({ ...newCandidate, photo_url: e.target.value })}
                  className="input input-bordered w-full rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Description / Programme</label>
                <textarea
                  rows={2}
                  placeholder="Points clés du programme ou de la candidature..."
                  value={newCandidate.bio_program}
                  onChange={(e) => setNewCandidate({ ...newCandidate, bio_program: e.target.value })}
                  className="textarea textarea-bordered w-full rounded-xl text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-base-200">
                <button
                  type="button"
                  onClick={() => setShowCandidateModal(false)}
                  className="btn btn-ghost btn-sm rounded-xl normal-case"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm rounded-xl font-semibold normal-case px-5"
                >
                  Inscrire le Candidat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL : NOUVEAU CRITÈRE DU JURY                         */}
      {/* ======================================================== */}
      {showCriteriaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-base-100 rounded-3xl p-6 sm:p-8 max-w-md w-full border border-base-300 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold font-display mb-1">Ajouter un Critère de Notation</h3>
            <p className="text-xs text-base-content/60 mb-5">
              Pour la catégorie : <strong>{selectedCategoryForCriteria?.name}</strong>
            </p>

            <form onSubmit={handleCreateCriterion} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold block mb-1">Intitulé du critère</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Clarté de la présentation, Faisabilité technique"
                  value={newCriterion.label}
                  onChange={(e) => setNewCriterion({ ...newCriterion, label: e.target.value })}
                  className="input input-bordered w-full rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Poids relatif (en %)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  required
                  value={newCriterion.weight}
                  onChange={(e) => setNewCriterion({ ...newCriterion, weight: parseInt(e.target.value, 10) || 10 })}
                  className="input input-bordered w-full rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Note Min</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newCriterion.min_scale}
                    onChange={(e) => setNewCriterion({ ...newCriterion, min_scale: parseInt(e.target.value, 10) || 0 })}
                    className="input input-bordered w-full rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Note Max</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newCriterion.max_scale}
                    onChange={(e) => setNewCriterion({ ...newCriterion, max_scale: parseInt(e.target.value, 10) || 20 })}
                    className="input input-bordered w-full rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-base-200">
                <button
                  type="button"
                  onClick={() => setShowCriteriaModal(false)}
                  className="btn btn-ghost btn-sm rounded-xl normal-case"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm rounded-xl font-semibold normal-case px-5"
                >
                  Ajouter le Critère
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showTokenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-base-100 rounded-3xl p-6 sm:p-8 max-w-md w-full border border-base-300 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold font-display mb-1">Générer des Jetons d'Émargement</h3>
            <p className="text-xs text-base-content/60 mb-5">
              Chaque jeton permet d'émettre un vote unique et inviolable.
            </p>

            <form onSubmit={handleGenerateTokens} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold block mb-1">Nombre de jetons à créer</label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  required
                  value={newTokenCount}
                  onChange={(e) => setNewTokenCount(parseInt(e.target.value, 10) || 1)}
                  className="input input-bordered w-full rounded-xl text-sm"
                />
              </div>

              <div className="p-3 rounded-xl bg-base-200 text-xs text-base-content/70">
                💡 Vous pourrez ensuite copier chaque lien direct de vote pour le transmettre aux électeurs via email ou messagerie interne.
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-base-200">
                <button
                  type="button"
                  onClick={() => setShowTokenModal(false)}
                  className="btn btn-ghost btn-sm rounded-xl normal-case"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm rounded-xl font-semibold normal-case px-5"
                >
                  Générer {newTokenCount} Jetons
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
