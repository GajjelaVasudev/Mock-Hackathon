import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import { PWAProvider } from './context/PWAContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { FloatingAIButton } from './components/FloatingAIButton';
import { ProtectedRoute } from './components/ProtectedRoute';
import { OfflineBanner } from './components/OfflineBanner';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';

import { HomePage } from './pages/HomePage';
import { ActivitiesPage } from './pages/ActivitiesPage';
import { ActivityDetailPage } from './pages/ActivityDetailPage';
import { RecommendationsPage } from './pages/RecommendationsPage';
import { AssistantPage } from './pages/AssistantPage';
import { ProfilePage } from './pages/ProfilePage';
import { DashboardPage } from './pages/DashboardPage';
import { MyActivitiesPage } from './pages/MyActivitiesPage';
import { VolunteerPage } from './pages/VolunteerPage';
import { CommunityPage } from './pages/CommunityPage';
import { ActivityGroupChatPage } from './pages/ActivityGroupChatPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';

export const App: React.FC = () => {
  return (
    <PWAProvider>
      <UserProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <OfflineBanner />
            <Navbar />
            <main style={{ flex: 1 }}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />

              {/* Protected Authenticated User Routes */}
              <Route
                path="/activities"
                element={
                  <ProtectedRoute>
                    <ActivitiesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/activities/:id"
                element={
                  <ProtectedRoute>
                    <ActivityDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/recommendations"
                element={
                  <ProtectedRoute>
                    <RecommendationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/assistant"
                element={
                  <ProtectedRoute>
                    <AssistantPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-activities"
                element={
                  <ProtectedRoute>
                    <MyActivitiesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/volunteer"
                element={
                  <ProtectedRoute>
                    <VolunteerPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/community"
                element={
                  <ProtectedRoute>
                    <CommunityPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/community/activity/:activityId"
                element={
                  <ProtectedRoute>
                    <ActivityGroupChatPage />
                  </ProtectedRoute>
                }
              />

              {/* Unified Dashboard (handles both user & staff/admin based on role) */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />

              {/* Legacy /admin redirect to /dashboard */}
              <Route
                path="/admin"
                element={<Navigate to="/dashboard" replace />}
              />
            </Routes>
          </main>
          <PWAInstallPrompt />
          <FloatingAIButton />
          <Footer />
        </div>
      </BrowserRouter>
    </UserProvider>
  </PWAProvider>
);
};

export default App;
