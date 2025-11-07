import { useEffect, useRef, useState } from "react";
import { authLoginLocal, authRegisterLocal, authLoginGoogle } from "../lib/api";
import { getDeviceId, saveTokens } from "../lib/auth";
import { useNavigate, useLocation } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-[#040B17] text-white p-4 overflow-x-hidden">
      <div className="w-full max-w-xl bg-[#010710] border border-white/10 rounded-[32px] p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-white">Iniciar Sesión</h1>
          <p className="text-gray-400">Accede a tu cuenta</p>
        </div>

        <div className="flex flex-col gap-3">
          <label className="text-sm font-semibold text-gray-200">Correo electrónico</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="px-4 py-3 rounded-2xl bg-[#000A14] border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:border-[#33AACD]"
            type="email"
            placeholder="Ingresa tu email"
          />
          <label className="text-sm font-semibold text-gray-200">Contraseña</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="px-4 py-3 rounded-2xl bg-[#000A14] border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:border-[#33AACD]"
            type="password"
            placeholder="Ingresa tu contraseña"
          />

          <label className="inline-flex items-center gap-2 text-gray-300 select-none">
            <input type="checkbox" className="w-5 h-5 rounded-md bg-[#000A14] border border-white/10 accent-[#33AACD]" />
            <span>Mantener sesión abierta</span>
          </label>

          <button onClick={doLogin} disabled={loading} className="mt-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white px-4 py-3 rounded-2xl font-medium">
            Acceder
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-gray-800" />
          <span className="text-sm text-gray-500">o</span>
          <div className="h-px flex-1 bg-gray-800" />
        </div>

        <div className="space-y-3">
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
            className="w-full flex items-center justify-center gap-3 border border-gray-700 rounded-2xl px-5 py-3 hover:bg-gray-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
              <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.731 31.91 29.273 35 24 35c-7.18 0-13-5.82-13-13s5.82-13 13-13c3.1 0 5.941 1.102 8.146 2.919l5.657-5.657C34.676 3.042 29.614 1 24 1 11.85 1 2 10.85 2 23s9.85 22 22 22 22-9.85 22-22c0-1.467-.153-2.897-.389-4.317z"/>
              <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.4 16.108 18.86 13 24 13c3.1 0 5.941 1.102 8.146 2.919l5.657-5.657C34.676 3.042 29.614 1 24 1 15.316 1 7.985 5.769 4.25 12.742l2.056 1.949z"/>
              <path fill="#4CAF50" d="M24 45c5.192 0 9.86-1.98 13.409-5.219l-6.191-5.238C29.106 36.483 26.707 37 24 37c-5.239 0-9.681-3.363-11.292-8.02l-6.522 5.025C9.845 41.599 16.394 45 24 45z"/>
              <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-1.024 3.017-3.231 5.495-6.084 6.958l.001-.001 6.191 5.238C35.246 41.246 40 37 40 31c0-1.467-.153-2.897-.389-4.317z"/>
            </svg>
            <span className="font-medium text-white">Iniciar sesión con Google</span>
          </button>

          {/* Botón oficial oculto (fallback) */}
          <div ref={googleBtnRef} className="hidden" />
          <div ref={hiddenGoogleBtnRef} className="hidden" />
        </div>

        <div className="text-center">
          <button onClick={() => navigate('/')} className="text-[#6ACCFF] hover:text-white/90 underline underline-offset-4">Continuar como invitado</button>
        </div>

        <div className="text-center text-sm">
          <button onClick={doRegister} disabled={loading} className="text-blue-400 hover:text-blue-300">¿No tienes cuenta? Regístrate</button>
        </div>

        {error && (
          <div className="text-sm text-red-400 text-center">{error}</div>
        )}
      </div>
    </div>
  );
}

