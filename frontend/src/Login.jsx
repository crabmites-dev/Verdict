import { useState, useEffect } from "react";
import { 
  Lock, 
  Mail, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  Fingerprint, 
  Sparkles,
  CheckCircle2,
  Building2,
  UserCheck,
  Vote
} from "lucide-react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();

  const handleAuthSuccess = (userData) => {
    localStorage.setItem("verdict_user", JSON.stringify(userData));
    const userRole = userData?.role;
    setTimeout(() => {
      if (userRole === "admin") {
        navigate("/admin");
      } else if (userRole === "jury") {
        navigate("/jury");
      } else {
        navigate("/");
      }
    }, 800);
  };

  // Initialisation du client Google Identity Services
  useEffect(() => {
    const clientId = "517412292411-q9fr8gpn78s5ce7f1k7494tuh2gdiscv.apps.googleusercontent.com";
    if (window.google?.accounts?.id) {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response) => {
          try {
            setLoading(true);
            setError("");
            const res = await axios.post(
              "http://localhost:5000/api/auth/googleLogin",
              { idToken: response.credential },
              { withCredentials: true }
            );
            setSuccess("Connexion Google réussie ! Redirection...");
            handleAuthSuccess(res.data?.user);
          } catch (err) {
            setError(err.response?.data?.message || "Échec de l'authentification Google.");
          } finally {
            setLoading(false);
          }
        }
      });
    }
  }, []);

  const handleGoogleLogin = () => {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    } else {
      setError("Le service Google Identity est en cours de chargement. Veuillez patienter ou réessayer.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim() || !password) {
      setError("Veuillez renseigner votre adresse e-mail et votre mot de passe.");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(
        "http://localhost:5000/api/auth/login",
        { email: email.trim(), password },
        { withCredentials: true }
      );

      setSuccess("Authentification réussie. Redirection vers votre espace...");
      handleAuthSuccess(res.data?.user);

    } catch (err) {
      const serverMessage = err.response?.data?.message;
      setError(serverMessage || "Échec de connexion. Vérifiez vos identifiants ou contactez votre administrateur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-base-200 text-base-content selection:bg-primary selection:text-primary-content relative overflow-hidden font-sans">
      
      {/* ======================================================== */}
      {/* SECTION GAUCHE : Vitrine Identité & Confiance (Thème Winter) */}
      {/* ======================================================== */}
      <div className="hidden lg:flex lg:w-[48%] xl:w-[50%] flex-col justify-between p-12 xl:p-16 relative bg-base-100 border-r border-base-300">
        
        <div className="absolute inset-0 bg-grid-winter opacity-60 pointer-events-none" />

        {/* Header Branding */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-xs">
            <Fingerprint className="w-5 h-5 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-xl tracking-tight text-base-content font-display">
              VERDICT<span className="text-primary">.</span>
            </span>
            <span className="text-[10px] font-bold tracking-widest uppercase text-base-content/50 -mt-1">
              Decision & Voting OS
            </span>
          </div>
        </div>

        {/* Message Clé / Value Proposition */}
        <div className="relative z-10 max-w-lg my-auto py-10">
          
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Portail Sécurisé Administrateurs & Jurys</span>
          </div>

          <h2 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-base-content leading-tight font-display">
            Pilotez vos scrutins et délibérations avec une <span className="text-primary underline decoration-primary/30 decoration-wavy">intégrité totale</span>.
          </h2>

          <p className="mt-4 text-base-content/70 text-sm xl:text-base leading-relaxed">
            Configurez les collèges électoraux, émettez les jetons d'émargement uniques et suivez les barèmes du jury en temps réel.
          </p>

          {/* Cartes d'indicateurs de confiance */}
          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-base-200/60 border border-base-300 shadow-xs">
              <div className="flex items-center gap-2 text-primary text-xs font-bold mb-1.5">
                <ShieldCheck className="w-4 h-4" />
                Audit Trail Certifié
              </div>
              <p className="text-xs text-base-content/60 leading-relaxed">
                Traçabilité inviolable de chaque émargement et notation des jurés.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-base-200/60 border border-base-300 shadow-xs">
              <div className="flex items-center gap-2 text-success text-xs font-bold mb-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Zéro Inscription Votant
              </div>
              <p className="text-xs text-base-content/60 leading-relaxed">
                Les électeurs votent sans compte via lien ou empreinte anti-fraude.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Gauche */}
        <div className="relative z-10 pt-6 border-t border-base-300 flex items-center justify-between text-xs text-base-content/50">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-base-content/40" />
            <span>Infrastructure institutionnelle de scrutin</span>
          </div>
          <span className="font-mono text-base-content/40">v2.4.0</span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECTION DROITE : Formulaire Pro avec Thème Winter        */}
      {/* ======================================================== */}
      <div className="w-full lg:w-[52%] xl:w-[50%] flex flex-col justify-between p-6 sm:p-10 md:p-14 lg:p-12 xl:p-16 relative z-10 bg-base-200/50">
        
        {/* Brand Mobile */}
        <div className="flex lg:hidden items-center justify-between mb-8">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary text-primary-content flex items-center justify-center shadow-sm">
              <Fingerprint className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg tracking-tight text-base-content font-display">VERDICT</span>
          </div>
          <span className="text-xs font-medium text-base-content/60 px-2.5 py-1 rounded-lg bg-base-100 border border-base-300 shadow-xs">
            Espace Gestion
          </span>
        </div>

        {/* Carte Formulaire Centrale */}
        <div className="w-full max-w-md mx-auto my-auto py-4">
          
          {/* Bannière d'orientation pour les Votants ordinaires */}
          <div className="mb-6 p-4 rounded-2xl bg-primary/10 border border-primary/20 flex items-start gap-3 shadow-xs">
            <div className="h-8 w-8 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0 mt-0.5">
              <Vote className="w-4 h-4" />
            </div>
            <div className="flex-1 text-xs">
              <span className="font-bold text-base-content block mb-0.5">
                Vous venez pour voter à un scrutin ?
              </span>
              <span className="text-base-content/70 block leading-relaxed">
                Les électeurs n'ont pas besoin de se connecter ici. Vous votez directement via votre lien d'invitation ou sur la page de scrutin.
              </span>
            </div>
          </div>

          <div className="bg-base-100 p-8 sm:p-10 rounded-3xl border border-base-300 shadow-xl shadow-base-content/5">
            
            {/* Titre & Sous-titre */}
            <div className="mb-6 text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-base-200 text-[11px] font-semibold text-base-content/70 mb-2">
                <UserCheck className="w-3.5 h-3.5 text-primary" />
                <span>Accès Gestionnaires & Jurys</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-base-content font-display">
                Connexion à l'espace
              </h1>
              <p className="text-xs sm:text-sm text-base-content/60 mt-1">
                Authentifiez-vous pour gérer les scrutins ou délibérer.
              </p>
            </div>

            {/* Alertes dynamiques */}
            {error && (
              <div className="alert alert-error shadow-xs rounded-2xl py-3 px-4 text-xs sm:text-sm flex items-start gap-2.5 mb-5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-snug">{error}</span>
              </div>
            )}

            {success && (
              <div className="alert alert-success shadow-xs rounded-2xl py-3 px-4 text-xs sm:text-sm flex items-start gap-2.5 mb-5">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-snug">{success}</span>
              </div>
            )}

            {/* Bouton Google SSO */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="btn btn-outline border-base-300 hover:border-base-content/20 hover:bg-base-200/60 text-base-content w-full rounded-2xl flex items-center justify-center gap-3 font-medium text-sm transition-all shadow-xs normal-case h-11 min-h-[44px] cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.3 1 3.4 3.7 1.4 7.6l3.8 2.9C6.1 7.8 8.8 5 12 5z" />
                <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.4c-.3 1.5-1.1 2.7-2.4 3.6l3.7 2.9c2.2-2 3.8-5 3.8-8.7z" />
                <path fill="#FBBC05" d="M5.2 10.5c-.2-.7-.3-1.4-.3-2.2s.1-1.5.3-2.2L1.4 3.2C.5 5 0 7.1 0 9.3s.5 4.3 1.4 6.1l3.8-2.9z" />
                <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.2 0-5.9-2.2-6.8-5.2L1.4 16C3.4 19.9 7.3 23 12 23z" />
              </svg>
              <span>Connexion avec Google Workspace</span>
            </button>

            {/* Séparateur */}
            <div className="divider text-[11px] text-base-content/40 uppercase tracking-widest my-5">ou identifiant</div>

            {/* Formulaire classique */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Adresse e-mail */}
              <div className="form-control space-y-1.5">
                <label className="text-xs font-semibold text-base-content/80">
                  Adresse e-mail institutionnelle
                </label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-base-content/40 absolute left-3.5 pointer-events-none" />
                  <input
                    type="email"
                    required
                    placeholder="admin@organisation.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input input-bordered w-full pl-10 rounded-2xl text-sm focus:input-primary transition-all bg-base-100 h-11"
                  />
                </div>
              </div>

              {/* Mot de passe */}
              <div className="form-control space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-base-content/80">
                    Mot de passe
                  </label>
                  <a href="#" className="text-xs link link-hover link-primary font-medium">
                    Oublié ?
                  </a>
                </div>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-base-content/40 absolute left-3.5 pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input input-bordered w-full pl-10 pr-10 rounded-2xl text-sm focus:input-primary transition-all bg-base-100 h-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 p-1 text-base-content/40 hover:text-base-content transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Option session */}
              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="checkbox checkbox-primary checkbox-xs rounded-md"
                  />
                  <span className="text-xs text-base-content/70">
                    Garder ma session active 30 jours
                  </span>
                </label>
              </div>

              {/* Bouton de Connexion */}
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full rounded-2xl text-sm font-semibold shadow-md shadow-primary/20 flex items-center justify-center gap-2 normal-case mt-3 h-11 min-h-[44px]"
              >
                {loading ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  <>
                    <span>Accéder au tableau de bord</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Lien Créer un espace organisateur */}
            <div className="text-center mt-6 pt-5 border-t border-base-300">
              <p className="text-xs text-base-content/70">
                Vous représentez une institution ?{" "}
                <Link to="/register" className="link link-primary link-hover font-semibold">
                  Créer un espace organisateur
                </Link>
              </p>
            </div>

          </div>

        </div>

        {/* Footer Discret */}
        <div className="w-full max-w-md mx-auto pt-4 flex items-center justify-between text-[11px] text-base-content/50">
          <span>&copy; {new Date().getFullYear()} Verdict Systems Inc.</span>
          <div className="flex items-center gap-3">
            <a href="#" className="hover:text-base-content transition-colors">Sécurité</a>
            <span>•</span>
            <a href="#" className="hover:text-base-content transition-colors">Confidentialité</a>
            <span>•</span>
            <a href="#" className="hover:text-base-content transition-colors">Support</a>
          </div>
        </div>

      </div>

    </div>
  );
}