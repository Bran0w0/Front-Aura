import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { authConfirmReset } from "../lib/api";
import LogoAura from "../components/LogoAura";

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const preEmail = location.state?.email;
    if (preEmail) setEmail(preEmail);
  }, [location.state]);

  const hasMinLen = password.length >= 8;
  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const pwSecure = hasMinLen && hasLetter && hasNumber;
  const passwordsMatch = password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;

  async function onSubmit(e) {
    e?.preventDefault();
    if (!passwordsMatch) {
      setError("Las contraseñas no coinciden");
      return;
    }
    try {
      setLoading(true);
      setError("");
      await authConfirmReset({ email, code, new_password: password });
      alert("Tu contraseña fue restablecida. Inicia sesión.");
      navigate("/login", { replace: true });
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
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Restablecer contraseña</h1>
                <p className="mt-1 text-gray-300">Ingresa el código y tu nueva contraseña</p>
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

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-200">Código de confirmación</label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M12 3l3 7h7l-5.5 4 2.5 7-7-4.5L5.5 21 8 14 3 10h7z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-2xl bg-[#000A14]/80 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#33AACD]/60 focus:border-transparent"
                    type="text"
                    placeholder="Código enviado a tu correo"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-200">Nueva contraseña</label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="4" y="11" width="16" height="9" rx="2" ry="2" />
                      <path d="M8 11V8a4 4 0 118 0v3" />
                    </svg>
                  </span>
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-14 py-3 rounded-2xl bg-[#000A14]/80 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#33AACD]/60 focus:border-transparent"
                    type={showPassword ? "text" : "password"}
                    placeholder="Ingresa tu nueva contraseña"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-gray-200"
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M3 3l18 18" strokeLinecap="round" />
                        <path d="M10.58 10.58A2 2 0 0012 14a2 2 0 001.42-.58" />
                        <path d="M9.88 5.52A9.77 9.77 0 0112 5c5 0 9.27 3.11 10.94 7.5a11.85 11.85 0 01-3.17 4.46" />
                        <path d="M6.1 6.1A11.93 11.93 0 001.06 12.5C2.73 16.89 7 20 12 20a11.5 11.5 0 004.12-.76" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M1.06 12.5C2.73 8.11 7 5 12 5s9.27 3.11 10.94 7.5C21.27 16.89 17 20 12 20S2.73 16.89 1.06 12.5z" />
                        <circle cx="12" cy="12.5" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                {pwSecure && (
                  <div className="mt-2 flex items-center gap-2 text-emerald-400 text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span>La contraseña es segura</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-200">Confirmar contraseña</label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="4" y="11" width="16" height="9" rx="2" ry="2" />
                      <path d="M8 11V8a4 4 0 118 0v3" />
                    </svg>
                  </span>
                  <input
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-12 pr-14 py-3 rounded-2xl bg-[#000A14]/80 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#33AACD]/60 focus:border-transparent"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Repite tu nueva contraseña"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((s) => !s)}
                    className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-gray-200"
                    aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showConfirmPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M3 3l18 18" strokeLinecap="round" />
                        <path d="M10.58 10.58A2 2 0 0012 14a2 2 0 001.42-.58" />
                        <path d="M9.88 5.52A9.77 9.77 0 0112 5c5 0 9.27 3.11 10.94 7.5a11.85 11.85 0 01-3.17 4.46" />
                        <path d="M6.1 6.1A11.93 11.93 0 001.06 12.5C2.73 16.89 7 20 12 20a11.5 11.5 0 004.12-.76" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M1.06 12.5C2.73 8.11 7 5 12 5s9.27 3.11 10.94 7.5C21.27 16.89 17 20 12 20S2.73 16.89 1.06 12.5z" />
                        <circle cx="12" cy="12.5" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                {passwordsMatch && (
                  <div className="mt-2 flex items-center gap-2 text-emerald-400 text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span>Las contraseñas coinciden</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="relative w-full overflow-hidden rounded-2xl px-4 py-3 font-medium disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer transition focus:outline-none focus:ring-2 focus:ring-[#33AACD]/50 hover:brightness-110 active:brightness-95 hover:shadow-[0_8px_24px_rgba(51,170,205,0.35)]"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-[#33AACD] via-sky-500 to-blue-600" />
                <span className="relative block text-center">{loading ? "Restableciendo…" : "Restablecer contraseña"}</span>
              </button>
            </form>

            <div className="mt-6 text-center text-sm">
              <button onClick={() => navigate("/login")} className="text-blue-400 hover:text-blue-300 cursor-pointer">¿Ya tienes una cuenta? Inicia Sesión</button>
            </div>

            {error && (
              <div className="mt-4 text-sm text-red-400 text-center">{error}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

