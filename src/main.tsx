import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import { Home } from "~/routes/home.tsx";
import { Login } from "~/routes/login.tsx";
import { Dashboard } from "~/routes/dashboard.tsx";
import { Settings } from "~/routes/settings.tsx";
import { Speaker } from "~/routes/speaker.tsx";
import { Session } from "~/routes/session.tsx";
import { AuthGuard } from "~/components/AuthGuard.tsx";
import { ThemeProvider } from "~/contexts/ThemeContext.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/session/:sessionId" element={<Session />} />

        {/* Protected */}
        <Route
          path="/dashboard"
          element={
            <AuthGuard>
              <Dashboard />
            </AuthGuard>
          }
        />
        <Route
          path="/dashboard/settings"
          element={
            <AuthGuard>
              <Settings />
            </AuthGuard>
          }
        />
        <Route
          path="/speaker/:sessionId"
          element={
            <AuthGuard>
              <Speaker />
            </AuthGuard>
          }
        />
      </Routes>
    </BrowserRouter>
    </ThemeProvider>
  </StrictMode>
);
