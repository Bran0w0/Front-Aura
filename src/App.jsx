import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import GuestHome from "./pages/GuestHome";
import Timetable from "./pages/Timetable";
import Map from "./pages/Map";
import { getAccessToken } from "./lib/auth";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";

function RequireAuth({ children }) {
  const token = getAccessToken();
  const location = useLocation();
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

function RedirectIfAuthed({ children }) {
  const token = getAccessToken();
  if (token) return <Navigate to="/home" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<RedirectIfAuthed><Login /></RedirectIfAuthed>} />
        <Route path="/register" element={<RedirectIfAuthed><Register /></RedirectIfAuthed>} />
        <Route
          path="/home"
          element={
            <RequireAuth>
              <Home />
            </RequireAuth>
          }
        />
        <Route
          path="/timetable"
          element={
            <RequireAuth>
              <Timetable />
            </RequireAuth>
          }
        />
        <Route
          path="/map"
          element={
            <RequireAuth>
              <Map />
            </RequireAuth>
          }
        />
        <Route path="/" element={<GuestHome />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
