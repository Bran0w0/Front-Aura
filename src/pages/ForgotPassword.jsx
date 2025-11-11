import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authForgotPassword } from "../lib/api";
import LogoAura from "../components/LogoAura";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

  async function onSubmit(e) {
    e?.preventDefault();
    try {
      setLoading(true);
      setError("");
      await authForgotPassword({ email });
      setSent(true);
      navigate("/reset-password", { state: { email } });
    } catch (e) {
      setError(e?.response?.data?.detail || e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-[100dvh] flex items-center justify-center bg-[#040B17] text-white p-6 overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-48 -left-48 h-[22rem] w-[22rem] rounded-full bg-[#33AACD]/18 blur-[80px]" />
        <div className="absolute -bottom-52 -right-52 h-[26rem] w-[26rem] rounded-full bg-blue-600/18 blur-[80px]" />
      </div>

      <div className="w-full max-w-lg relative">
        <div className="rounded-[28px] border border-white/10 bg-white/4 backdrop-blur-2xl ring-1 ring-inset ring-white/5 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
          <div className="p-6 sm:p-8">
            <div className="flex flex-col items-center text-center space-y-4">
              <LogoAura className="h-10" />
              <div>
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Recupera tu contraseña</h1>
                <p className="mt-1 text-gray-300">Ingresa tu correo para enviar un código</p>
              </div>
            </div>

            <form className="mt-8 space-y-5" onSubmit={onSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-200">Correo electrónico</label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M3 7l9 6 9-6" strokeLinecap="round" strokeLinejoin="round" />
                      <rect x="3" y="5" width="18" height="14" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-2xl bg-[#000A14]/80 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#33AACD]/60 focus:border-transparent"
                    type="email"
                    placeholder="tucorreo@ejemplo.com"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="relative w-full overflow-hidden rounded-2xl px-4 py-3 font-medium disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer transition focus:outline-none focus:ring-2 focus:ring-[#33AACD]/50 hover:brightness-110 active:brightness-95 hover:shadow-[0_8px_24px_rgba(51,170,205,0.35)]"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-[#33AACD] via-sky-500 to-blue-600" />
                <span className="relative block text-center">{loading ? "Enviando…" : "Enviar código"}</span>
              </button>
            </form>

            <div className="mt-6 text-center text-sm">
              <button onClick={() => navigate("/login")} className="text-blue-400 hover:text-blue-300 cursor-pointer">¿Ya tienes una cuenta? Inicia Sesión</button>
            </div>

            {error && (
              <div className="mt-4 text-sm text-red-400 text-center">{error}</div>
            )}
            {sent && (
              <div className="mt-4 text-sm text-emerald-400 text-center">Te enviamos un código a tu correo</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

