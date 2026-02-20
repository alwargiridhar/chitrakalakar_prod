import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';

// Components
import NavBar from './components/NavBar';
import Layout from './components/Layout';
import Chatbot from './components/Chatbot';
import NotificationPopup from './components/NotificationPopup';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import AdminDashboard from './pages/AdminDashboard';
import ArtistDashboard from './pages/ArtistDashboard';
import UserDashboard from './pages/UserDashboard';
import AboutPage from './pages/AboutPage';
import ArtistsPage from './pages/ArtistsPage';
import ArtistDetailPage from './pages/ArtistDetailPage';
import PaintingsPage from './pages/PaintingsPage';
import PaintingDetailPage from './pages/PaintingDetailPage';
import ExhibitionsPage from './pages/ExhibitionsPage';
import ArchivedExhibitionsPage from './pages/ArchivedExhibitionsPage';
import ArtClassesPage from './pages/ArtClassesPage';
import ContactPage from './pages/ContactPage';
import FAQPage from './pages/FAQPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import NotFoundPage from './pages/NotFoundPage';
import LeadChitrakarDashboard from './pages/LeadChitrakarDashboard';
import KalakarDashboard from './pages/KalakarDashboard';
import ProfilePage from './pages/ProfilePage';
import AccountPage from './pages/AccountPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import SubscriptionPage from './pages/SubscriptionPage';
import CommunitiesPage from './pages/CommunitiesPage';
import CommunityDetailPage from './pages/CommunityDetailPage';
import InstallAppPage from './pages/InstallAppPage';
import DownloadAppPage from './pages/DownloadAppPage';
import PWAInstallPrompt from './components/PWAInstallPrompt';

import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <PWAInstallPrompt />
        <Routes>
          <Route path="/" element={<Layout><HomePage /></Layout>} />
          <Route path="/login" element={<Layout><LoginPage /></Layout>} />
          <Route path="/signup" element={<Layout><SignupPage /></Layout>} />
          <Route path="/forgot-password" element={<Layout><ForgotPasswordPage /></Layout>} />
          <Route path="/about" element={<Layout><AboutPage /></Layout>} />
          <Route path="/artists" element={<Layout><ArtistsPage /></Layout>} />
          <Route path="/artist/:id" element={<Layout><ArtistDetailPage /></Layout>} />
          <Route path="/paintings" element={<Layout><PaintingsPage /></Layout>} />
          <Route path="/painting/:id" element={<Layout><PaintingDetailPage /></Layout>} />
          <Route path="/exhibitions" element={<Layout><ExhibitionsPage /></Layout>} />
          <Route path="/exhibitions/archived" element={<Layout><ArchivedExhibitionsPage /></Layout>} />
          <Route path="/art-classes" element={<Layout><ArtClassesPage /></Layout>} />
          <Route path="/contact" element={<Layout><ContactPage /></Layout>} />
          <Route path="/faq" element={<Layout><FAQPage /></Layout>} />
          <Route path="/privacy" element={<Layout><PrivacyPage /></Layout>} />
          <Route path="/terms" element={<Layout><TermsPage /></Layout>} />
          <Route path="/admin" element={<><NavBar /><AdminDashboard /></>} />
          <Route path="/dashboard" element={<><NavBar /><ArtistDashboard /></>} />
          <Route path="/user-dashboard" element={<><NavBar /><UserDashboard /></>} />
          <Route path="/lead-chitrakar" element={<><NavBar /><LeadChitrakarDashboard /></>} />
          <Route path="/kalakar" element={<><NavBar /><KalakarDashboard /></>} />
          <Route path="/profile" element={<><NavBar /><ProfilePage /></>} />
          <Route path="/account" element={<><NavBar /><AccountPage /></>} />
          <Route path="/change-password" element={<><NavBar /><ChangePasswordPage /></>} />
          <Route path="/subscription" element={<><NavBar /><SubscriptionPage /></>} />
          <Route path="/communities" element={<Layout><CommunitiesPage /></Layout>} />
          <Route path="/community/:id" element={<Layout><CommunityDetailPage /></Layout>} />
          <Route path="/install" element={<Layout><InstallAppPage /></Layout>} />
          <Route path="*" element={<Layout><NotFoundPage /></Layout>} />
        </Routes>
        <Chatbot />
        <NotificationPopup />
      </BrowserRouter>
    </AuthProvider>
  );
}

// Export for backwards compatibility
export { LoginPage, SignupPage, AdminDashboard };
export default App;
