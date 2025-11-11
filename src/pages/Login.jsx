import { useEffect, useRef, useState } from "react";
import { authLoginLocal, authRegisterLocal, authLoginGoogle } from "../lib/api";
import { getDeviceId, saveTokens } from "../lib/auth";
import { useNavigate, useLocation } from "react-router-dom";
import LogoAura from "../components/LogoAura";
import { FaRegUserCircle } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // guest flow: direct navigation without overlay
  const googleBtnRef = useRef(null);
  const hiddenGoogleBtnRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/home";

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    const timer = setInterval(() => {
      if (window.google?.accounts?.id && googleBtnRef.current) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async ({ credential }) => {
            try {
              setLoading(true);
              setError("");
              const device_id = getDeviceId();
              const { data } = await authLoginGoogle({ id_token: credential, device_id });
              saveTokens(data);
              navigate(from, { replace: true });
            } catch (e) {
              setError(e?.response?.data?.detail || e.message);
            } finally {
              setLoading(false);
            }
          },
        });
        // Render oficial (oculto). Usamos un botón estilizado que dispara su click.
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: "outline",
          size: "large",
          text: "continue_with",
          width: 280,
        });
        if (hiddenGoogleBtnRef.current) {
          window.google.accounts.id.renderButton(hiddenGoogleBtnRef.current, {
            theme: "outline",
            size: "large",
            width: 1,
          });
        }
        clearInterval(timer);
      }
    }, 200);
    return () => clearInterval(timer);
  }, [from, navigate]);

  async function doRegister(e) {
    e?.preventDefault();
    try {
      setLoading(true);
      setError("");
      await authRegisterLocal({ email, password });
      alert("Registro correcto. Revisa tu correo para verificar tu cuenta.");
    } catch (e) {
      setError(e?.response?.data?.detail || e.message);
    } finally {
      setLoading(false);
    }
  }

  async function doLogin(e) {
    e?.preventDefault();
    try {
      setLoading(true);
      setError("");
      const device_id = getDeviceId();
      const { data } = await authLoginLocal({ email, password, device_id });
      saveTokens(data);
      navigate(from, { replace: true });
    } catch (e) {
      setError(e?.response?.data?.detail || e.message);
    } finally {
      setLoading(false);
    }
  }

  function handleGuest() {
    navigate('/');
  }

  return (
    <div className="relative min-h-[100dvh] flex items-center justify-center bg-[#040B17] text-white p-6 overflow-hidden">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-48 -left-48 h-[22rem] w-[22rem] rounded-full bg-[#33AACD]/18 blur-[80px]" />
        <div className="absolute -bottom-52 -right-52 h-[26rem] w-[26rem] rounded-full bg-blue-600/18 blur-[80px]" />
      </div>

      <div className="w-full max-w-lg relative">
        <div className="rounded-[28px] border border-white/10 bg-white/4 backdrop-blur-2xl ring-1 ring-inset ring-white/5 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
          <div className="p-6 sm:p-8">
            {/* Header */}
            <div className="flex flex-col items-center text-center space-y-4">
              <LogoAura className="h-10" />
              <div>
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Iniciar sesión</h1>
                <p className="mt-1 text-gray-300">Accede a tu cuenta</p>
              </div>
            </div>

            {/* Form */}
            <form className="mt-8 space-y-5" onSubmit={doLogin}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-200">Correo electrónico</label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-gray-400">
                    {/* Mail icon */}
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
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-200">Contraseña</label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-gray-400">
                    {/* Lock icon */}
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
                    placeholder="Ingresa tu contraseña"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-gray-200"
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? (
                      // Eye-off icon
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M3 3l18 18" strokeLinecap="round" />
                        <path d="M10.58 10.58A2 2 0 0012 14a2 2 0 001.42-.58" />
                        <path d="M9.88 5.52A9.77 9.77 0 0112 5c5 0 9.27 3.11 10.94 7.5a11.85 11.85 0 01-3.17 4.46" />
                        <path d="M6.1 6.1A11.93 11.93 0 001.06 12.5C2.73 16.89 7 20 12 20a11.5 11.5 0 004.12-.76" />
                      </svg>
                    ) : (
                      // Eye icon
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M1.06 12.5C2.73 8.11 7 5 12 5s9.27 3.11 10.94 7.5C21.27 16.89 17 20 12 20S2.73 16.89 1.06 12.5z" />
                        <circle cx="12" cy="12.5" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
                <label className="inline-flex items-center gap-2 text-gray-300 select-none">
                  <input type="checkbox" className="w-4 h-4 rounded-md bg-[#000A14] border border-white/10 accent-[#33AACD]" />
                  <span>Mantener sesión abierta</span>
                </label>
                <div className="text-sm text-gray-400 w-full text-center sm:w-auto sm:text-right">
                  <button type="button" onClick={() => navigate('/forgot-password')} className="hover:text-white/90 cursor-pointer">
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="relative w-full overflow-hidden rounded-2xl px-4 py-3 font-medium disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer transition focus:outline-none focus:ring-2 focus:ring-[#33AACD]/50 hover:brightness-110 active:brightness-95 hover:shadow-[0_8px_24px_rgba(51,170,205,0.35)]"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-[#33AACD] via-sky-500 to-blue-600" />
                <span className="relative block text-center">{loading ? "Accediendo…" : "Acceder"}</span>
              </button>
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs text-gray-400">o</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            {/* Google button */}
            <div className="space-y-2">
              <button
                onClick={() => {
                  const realBtn = googleBtnRef.current?.querySelector('div[role="button"]');
                  if (realBtn) realBtn.click();
                  else if (window.google?.accounts?.id) {
                    window.google.accounts.id.prompt();
                  } else {
                    setError("Google Identity no cargó. Revisa tu VITE_GOOGLE_CLIENT_ID y el script.");
                  }
                }}
                className="w-full relative flex items-center justify-center gap-3 rounded-2xl px-4 py-2.5 border border-white/10 bg-[#000A14]/80 hover:bg-[#0F1A2B]/70 cursor-pointer transition duration-200"
              >
                <FcGoogle className="h-5 w-5 shrink-0" />
                <span className="font-medium text-white">Iniciar sesión con Google</span>
              </button>

              {/* Botón oficial oculto (fallback) */}
              <div ref={googleBtnRef} className="hidden" />
              <div ref={hiddenGoogleBtnRef} className="hidden" />
            </div>

            {/* Footer actions */}
            <div className="mt-6 space-y-2 text-center">
              <div>
                <button
                  onClick={handleGuest}
                  className="w-full relative flex items-center justify-center gap-3 rounded-2xl px-4 py-2.5 border border-white/10 bg-[#000A14]/80 hover:bg-[#0F1A2B]/70 cursor-pointer transition duration-200"
                >
                  <FaRegUserCircle className="h-5 w-5" />
                  <span className="font-medium text-white">Continuar como invitado</span>
                </button>
              </div>
              <div className="text-sm">
                <button onClick={() => navigate('/register')} disabled={loading} className="text-blue-400 hover:text-blue-300 cursor-pointer">¿No tienes cuenta? Regístrate</button>
              </div>
            </div>

            {error && (
              <div className="mt-4 text-sm text-red-400 text-center">{error}</div>
            )}
          </div>
        </div>
      </div>
      {/* no guest loading overlay */}
    </div>
  );
}





