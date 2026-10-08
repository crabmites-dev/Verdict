import { useState } from "react";
import {Lock, Mail, Shield, AlertCircle, Eye, EyeOff, 
    ArrowRight, ShieldCheck, Fingerprint, 
  Sparkles, CheckCircle2, Building2, User
} from 'lucide-react'
import axios from "axios";
import { Link } from "react-router-dom";

export default function Register() {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [role, setRole] = useState('public')
    const [success, setSuccess] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setSucces('')

        if(!name.trim() || !email.trim() || !password) {
            setError('Veillez renseigner tous les champs obligatoires !')
            return
        }
        try {
            setLoading(true)
            await axios.post('http://localhost:5000/api/auth/register', {name, email, password, role}, {withCredentials: true} )
            setSucces('Votre compte a été créé avec succès !')

            setName('')
            setEmail('')
            setPassword('')
            setRole('')
        } catch (err) {
            const serverMessage = err.response?.data?.message
            setError(serverMessage || 'Une erreur est survenue lors de la création de votre compte')
        } finally {
            setLoading(false)
        }
    }

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
            <span>Enregistrement sécurisé & Accréditations</span>
          </div>

          <h2 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-base-content leading-tight font-display">
            Rejoignez l'infrastructure de délibération <span className="text-primary underline decoration-primary/30 decoration-wavy">académique</span>.
          </h2>

          <p className="mt-4 text-base-content/70 text-sm xl:text-base leading-relaxed">
            Créez votre identité numérique pour participer aux scrutins ou administrer les collèges de vote de votre établissement.
          </p>

          {/* Cartes d'indicateurs de confiance */}
          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-base-200/60 border border-base-300 shadow-xs">
              <div className="flex items-center gap-2 text-primary text-xs font-bold mb-1.5">
                <ShieldCheck className="w-4 h-4" />
                Accès Partitionné
              </div>
              <p className="text-xs text-base-content/60 leading-relaxed">
                Rôles stricts pour jurés, administrateurs et votants du grand public.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-base-200/60 border border-base-300 shadow-xs">
              <div className="flex items-center gap-2 text-success text-xs font-bold mb-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Vérification d'Origine
              </div>
              <p className="text-xs text-base-content/60 leading-relaxed">
                Validation stricte compatible avec les emails institutionnels.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Gauche */}
        <div className="relative z-10 pt-6 border-t border-base-300 flex items-center justify-between text-xs text-base-content/50">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-base-content/40" />
            <span>Déployé pour universités, comités et jurys</span>
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
        </div>

        {/* Carte Formulaire Centrale */}
        <div className="w-full max-w-md mx-auto my-auto py-4">
          
          <div className="bg-base-100 p-8 sm:p-10 rounded-3xl border border-base-300 shadow-xl shadow-base-content/5">
            
            {/* Titre & Sous-titre */}
            <div className="mb-6 text-center sm:text-left">
              <h1 className="text-2xl font-bold tracking-tight text-base-content font-display">
                Création de profil
              </h1>
              <p className="text-xs sm:text-sm text-base-content/60 mt-1.5">
                Inscrivez-vous pour accéder à vos droits de vote ou de notation.
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

            {/* Formulaire classique */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Nom complet */}
              <div className="form-control space-y-1.5">
                <label className="text-xs font-semibold text-base-content/80">
                  Nom complet
                </label>
                <div className="relative flex items-center">
                  <User className="w-4 h-4 text-base-content/40 absolute left-3.5 pointer-events-none" />
                  <input
                    type="text"
                    required
                    placeholder="Ex: Dr. Jean Dupont"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input input-bordered w-full pl-10 rounded-2xl text-sm focus:input-primary transition-all bg-base-100 h-11"
                  />
                </div>
              </div>

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
                    placeholder="nom@universite.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input input-bordered w-full pl-10 rounded-2xl text-sm focus:input-primary transition-all bg-base-100 h-11"
                  />
                </div>
              </div>

              {/* Type de Profil / Rôle */}
              <div className="form-control space-y-1.5">
                <label className="text-xs font-semibold text-base-content/80">
                  Type d'accréditation requis
                </label>
                <div className="relative flex items-center">
                  <Shield className="w-4 h-4 text-base-content/40 absolute left-3.5 pointer-events-none z-10" />
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="select select-bordered w-full pl-10 rounded-2xl text-sm focus:select-primary transition-all bg-base-100 h-11 font-medium"
                  >
                    <option value="public">Grand Public / Étudiant / Électeur</option>
                    <option value="jury">Membre du Jury Externe ou Interne</option>
                    <option value="admin">Administrateur du Scrutin</option>
                  </select>
                </div>
              </div>

              {/* Mot de passe */}
              <div className="form-control space-y-1.5">
                <label className="text-xs font-semibold text-base-content/80">
                  Mot de passe
                </label>
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

              {/* Bouton d'Inscription */}
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full rounded-2xl text-sm font-semibold shadow-md shadow-primary/20 flex items-center justify-center gap-2 normal-case mt-3 h-11 min-h-[44px]"
              >
                {loading ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  <>
                    <span>Créer mon compte</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Lien Retour au Login */}
            <div className="text-center mt-6 pt-5 border-t border-base-300">
              <p className="text-xs text-base-content/70">
                Déjà inscrit sur la plateforme ?{" "}
                <a href="#" className="link link-primary link-hover font-semibold">
                  Se connecter
                </a>
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
