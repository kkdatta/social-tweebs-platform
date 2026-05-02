import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';

// Layout
import DashboardLayout from './components/layout/DashboardLayout';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

// Dashboard Pages
import DiscoveryPage from './pages/discovery/DiscoveryPage';
import InsightsListPage from './pages/insights/InsightsListPage';
import InsightsPage from './pages/insights/InsightsPage';
import { CampaignsListPage, CampaignDetailPage, CampaignFormPage } from './pages/campaigns';
import { FaqPage, PrivacyPolicyPage, TermsConditionsPage } from './pages/content';
import {
  AudienceOverlapListPage,
  AudienceOverlapDetailPage,
  AudienceOverlapCreatePage,
  AudienceOverlapSharedPage,
} from './pages/audience-overlap';
import { CustomErListPage, CustomErDetailPage, CustomErCreatePage, CustomErSharedPage } from './pages/custom-er';
import {
  SentimentsListPage,
  SentimentsCreatePage,
  SentimentsDetailPage,
  SentimentsSharedPage,
} from './pages/sentiments';
import { CollabCheckListPage, CollabCheckCreatePage, CollabCheckDetailPage, CollabCheckSharedPage } from './pages/collab-check';
import { PaidCollaborationListPage, PaidCollaborationCreatePage, PaidCollaborationDetailPage, PaidCollaborationSharedPage } from './pages/paid-collaboration';
import { GeneratedReportsListPage } from './pages/generated-reports';
import { TieBreakerListPage, TieBreakerCreatePage, TieBreakerDetailPage } from './pages/tie-breaker';
import { InfluencerGroupsListPage, InfluencerGroupCreatePage, InfluencerGroupDetailPage } from './pages/influencer-groups';
import { MentionTrackingListPage, MentionTrackingCreatePage, MentionTrackingDetailPage, MentionTrackingSharedPage } from './pages/mention-tracking';
import { CompetitionAnalysisListPage, CompetitionAnalysisCreatePage, CompetitionAnalysisDetailPage, CompetitionAnalysisSharedPage } from './pages/competition-analysis';
import { CreditsPage } from './pages/credits';
import { ProfilePage } from './pages/profile';
import { AnalyticsPage, AnalyticsDetailPage } from './pages/analytics';
import {
  TeamMemberListPage,
  TeamMemberFormPage,
  TeamMemberServicesPage,
  TeamMemberCreditsPage,
  TeamCreditLogsPage,
  TeamCreditDetailPage,
} from './pages/team';
import SignupApprovalsPage from './pages/team/SignupApprovalsPage';

const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="card p-12 text-center">
    <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
    <p className="text-gray-500">This page is coming soon.</p>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/collab-check/shared/:token" element={<CollabCheckSharedPage />} />
            <Route path="/mention-tracking/shared/:token" element={<MentionTrackingSharedPage />} />
            <Route path="/competition-analysis/shared/:token" element={<CompetitionAnalysisSharedPage />} />
            <Route path="/audience-overlap/shared/:token" element={<AudienceOverlapSharedPage />} />
            <Route path="/custom-er/shared/:token" element={<CustomErSharedPage />} />
            <Route path="/sentiments/shared/:token" element={<SentimentsSharedPage />} />
            <Route path="/paid-collaboration/shared/:token" element={<PaidCollaborationSharedPage />} />

            {/* Protected Dashboard Routes */}
            <Route element={<DashboardLayout />}>
              <Route path="/" element={<Navigate to="/discovery" replace />} />
              <Route path="/discovery" element={<DiscoveryPage />} />
              <Route path="/insights" element={<InsightsListPage />} />
              <Route path="/insights/:id" element={<InsightsPage />} />
              <Route path="/campaigns" element={<CampaignsListPage />} />
              <Route path="/campaigns/new" element={<CampaignFormPage />} />
              <Route path="/campaigns/:id" element={<CampaignDetailPage />} />
              <Route path="/campaigns/:id/edit" element={<CampaignFormPage />} />
              <Route path="/audience-overlap" element={<AudienceOverlapListPage />} />
              <Route path="/audience-overlap/new" element={<AudienceOverlapCreatePage />} />
              <Route path="/audience-overlap/:id" element={<AudienceOverlapDetailPage />} />
              <Route path="/custom-er" element={<CustomErListPage />} />
              <Route path="/custom-er/new" element={<CustomErCreatePage />} />
              <Route path="/custom-er/:id" element={<CustomErDetailPage />} />
              <Route path="/sentiments" element={<SentimentsListPage />} />
              <Route path="/sentiments/new" element={<SentimentsCreatePage />} />
              <Route path="/sentiments/:id" element={<SentimentsDetailPage />} />
              <Route path="/collab-check" element={<CollabCheckListPage />} />
              <Route path="/collab-check/new" element={<CollabCheckCreatePage />} />
              <Route path="/collab-check/:id" element={<CollabCheckDetailPage />} />
              <Route path="/paid-collaboration" element={<PaidCollaborationListPage />} />
              <Route path="/paid-collaboration/new" element={<PaidCollaborationCreatePage />} />
              <Route path="/paid-collaboration/:id" element={<PaidCollaborationDetailPage />} />
              <Route path="/tie-breaker" element={<TieBreakerListPage />} />
              <Route path="/tie-breaker/new" element={<TieBreakerCreatePage />} />
              <Route path="/tie-breaker/:id" element={<TieBreakerDetailPage />} />
              <Route path="/generated-reports" element={<GeneratedReportsListPage />} />
              <Route path="/influencer-groups" element={<InfluencerGroupsListPage />} />
              <Route path="/influencer-groups/create" element={<InfluencerGroupCreatePage />} />
              <Route path="/influencer-groups/:id" element={<InfluencerGroupDetailPage />} />
              <Route path="/mention-tracking" element={<MentionTrackingListPage />} />
              <Route path="/mention-tracking/new" element={<MentionTrackingCreatePage />} />
              <Route path="/mention-tracking/:id" element={<MentionTrackingDetailPage />} />
              <Route path="/competition-analysis" element={<CompetitionAnalysisListPage />} />
              <Route path="/competition-analysis/create" element={<CompetitionAnalysisCreatePage />} />
              <Route path="/competition-analysis/:id" element={<CompetitionAnalysisDetailPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/analytics/:userId" element={<AnalyticsDetailPage />} />
              <Route path="/signup-approvals" element={<SignupApprovalsPage />} />
              <Route path="/team" element={<TeamMemberListPage />} />
              <Route path="/team/new" element={<TeamMemberFormPage />} />
              <Route path="/team/:id/edit" element={<TeamMemberFormPage />} />
              <Route path="/team/:id/services" element={<TeamMemberServicesPage />} />
              <Route path="/team/:id/credits" element={<TeamMemberCreditsPage />} />
              <Route path="/team/credit-logs" element={<TeamCreditLogsPage />} />
              <Route path="/team/credit-logs/:userId" element={<TeamCreditDetailPage />} />
              <Route path="/credits" element={<CreditsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/settings" element={<PlaceholderPage title="Account Settings" />} />
              <Route path="/faq" element={<FaqPage />} />
              <Route path="/privacy" element={<PrivacyPolicyPage />} />
              <Route path="/terms" element={<TermsConditionsPage />} />
            </Route>

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/discovery" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
