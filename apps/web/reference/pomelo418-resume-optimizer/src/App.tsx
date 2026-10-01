import { GoogleOAuthProvider } from '@react-oauth/google';
import { ResumeProvider, useResume } from './context/ResumeContext';
import { Header }            from './components/Header/Header';
import { FileUpload }        from './components/FileUpload/FileUpload';
import { JobDescription }    from './components/JobDescription/JobDescription';
import { ComparisonView }    from './components/ComparisonView/ComparisonView';
import { ResumeEditor }      from './components/ResumeEditor/ResumeEditor';
import { ToastContainer }    from './components/Toast/Toast';
import { ProgressIndicator } from './components/ProgressIndicator/ProgressIndicator';
import { ErrorBoundary }     from './components/ErrorBoundary';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

// ─── Inner app (needs context) ────────────────────────────────────────────────

function AppContent() {
  const { activeView } = useResume();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeView === 'upload' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left column */}
            <div className="space-y-8">
              <FileUpload />
            </div>
            {/* Right column */}
            <div className="space-y-8">
              <JobDescription />
            </div>
          </div>
        )}

        {activeView === 'compare' && <ComparisonView />}
        {activeView === 'edit'    && <ResumeEditor />}
      </main>

      {/* Global overlays */}
      <ProgressIndicator />
      <ToastContainer />
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <ErrorBoundary>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID ?? 'no-client-id'}>
        <ResumeProvider>
          <AppContent />
        </ResumeProvider>
      </GoogleOAuthProvider>
    </ErrorBoundary>
  );
}
