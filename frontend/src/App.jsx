import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import Layout from "./components/Layout.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Onboarding from "./pages/Onboarding.jsx";
import Discover from "./pages/Discover.jsx";
import Music from "./pages/Music.jsx";
import NearMe from "./pages/NearMe.jsx";
import Jams from "./pages/Jams.jsx";
import Friends from "./pages/Friends.jsx";
import Market from "./pages/Market.jsx";
import Messages from "./pages/Messages.jsx";
import Me from "./pages/Me.jsx";
import Profile from "./pages/Profile.jsx";
import Discography from "./pages/Discography.jsx";
import Seller from "./pages/Seller.jsx";
import Listing from "./pages/Listing.jsx";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-10 text-center text-[var(--jm-text-dim)]">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.onboardingComplete) return <Navigate to="/onboarding" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/onboarding" element={<Onboarding />} />

      <Route element={<Layout />}>
        <Route
          path="/discover"
          element={
            <ProtectedRoute>
              <Discover />
            </ProtectedRoute>
          }
        />
        <Route
          path="/music"
          element={
            <ProtectedRoute>
              <Music />
            </ProtectedRoute>
          }
        />
        <Route
          path="/near-me"
          element={
            <ProtectedRoute>
              <NearMe />
            </ProtectedRoute>
          }
        />
        <Route
          path="/jams"
          element={
            <ProtectedRoute>
              <Jams />
            </ProtectedRoute>
          }
        />
        <Route
          path="/friends"
          element={
            <ProtectedRoute>
              <Friends />
            </ProtectedRoute>
          }
        />
        <Route
          path="/market"
          element={
            <ProtectedRoute>
              <Market />
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <Messages />
            </ProtectedRoute>
          }
        />
        <Route
          path="/me"
          element={
            <ProtectedRoute>
              <Me />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/:id"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/discography/:id"
          element={
            <ProtectedRoute>
              <Discography />
            </ProtectedRoute>
          }
        />
        <Route
          path="/seller/:id"
          element={
            <ProtectedRoute>
              <Seller />
            </ProtectedRoute>
          }
        />
        <Route
          path="/listing/:id"
          element={
            <ProtectedRoute>
              <Listing />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/discover" replace />} />
    </Routes>
  );
}
