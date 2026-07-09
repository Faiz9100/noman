import { lazy, ReactNode, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { MainLayout } from "../layouts/MainLayout";
import { AuthLayout } from "../layouts/AuthLayout";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { PageLoader } from "../components/common/Loader";

import { Home } from "../pages/Home";
import { AdminLogin } from "../pages/AdminLogin";
import { NotFound } from "../pages/NotFound";
import { ROUTES } from "../utils/constants";

// Everything behind a login (or the heavy full-screen projector) is
// code-split so the public landing/login bundle stays small — these only
// download once a user actually navigates to them.
const Dashboard = lazy(() => import("../pages/Dashboard").then((m) => ({ default: m.Dashboard })));
const Teams = lazy(() => import("../pages/Teams").then((m) => ({ default: m.Teams })));
const TeamDetail = lazy(() => import("../pages/TeamDetail").then((m) => ({ default: m.TeamDetail })));
const Players = lazy(() => import("../pages/Players").then((m) => ({ default: m.Players })));
const LiveAuction = lazy(() => import("../pages/LiveAuction").then((m) => ({ default: m.LiveAuction })));
const AuctionHistory = lazy(() => import("../pages/AuctionHistory").then((m) => ({ default: m.AuctionHistory })));
const Settings = lazy(() => import("../pages/Settings").then((m) => ({ default: m.Settings })));
const ProjectorScreen = lazy(() => import("../pages/ProjectorScreen").then((m) => ({ default: m.ProjectorScreen })));

function Lazy({ children }: { children: ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

export function AppRoutes() {
  return (
    <Routes>
      {/* Public site */}
      <Route element={<MainLayout />}>
        <Route path={ROUTES.HOME} element={<Home />} />
      </Route>

      {/* Admin auth */}
      <Route element={<AuthLayout />}>
        <Route path={ROUTES.ADMIN_LOGIN} element={<AdminLogin />} />
      </Route>

      {/* Full-bleed projector display — no dashboard chrome */}
      <Route
        path={ROUTES.PROJECTOR}
        element={
          <Lazy>
            <ProjectorScreen />
          </Lazy>
        }
      />

      {/* Authenticated control room */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route
            path={ROUTES.DASHBOARD}
            element={
              <Lazy>
                <Dashboard />
              </Lazy>
            }
          />
          <Route
            path={ROUTES.TEAMS}
            element={
              <Lazy>
                <Teams />
              </Lazy>
            }
          />
          <Route
            path={ROUTES.TEAM_DETAIL}
            element={
              <Lazy>
                <TeamDetail />
              </Lazy>
            }
          />
          <Route
            path={ROUTES.PLAYERS}
            element={
              <Lazy>
                <Players />
              </Lazy>
            }
          />
          <Route
            path={ROUTES.LIVE_AUCTION}
            element={
              <Lazy>
                <LiveAuction />
              </Lazy>
            }
          />
          <Route
            path={ROUTES.AUCTION_HISTORY}
            element={
              <Lazy>
                <AuctionHistory />
              </Lazy>
            }
          />
          <Route
            path={ROUTES.SETTINGS}
            element={
              <Lazy>
                <Settings />
              </Lazy>
            }
          />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
