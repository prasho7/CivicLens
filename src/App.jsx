import { useRouter, matchRoute } from './router/routerUtils';
import { AppProvider } from './context/AppContext';
import Sidebar from './components/Sidebar';
import DashboardPage from './pages/DashboardPage';
import ReportPage from './pages/ReportPage';
import TrackPage from './pages/TrackPage';
import NotFoundPage from './pages/NotFoundPage';
import './App.css';

function AppShell() {
  const path = useRouter();
  const { route, params } = matchRoute(path);

  const renderPage = () => {
    switch (route) {
      case 'dashboard':
        return <DashboardPage />;
      case 'report':
        return <ReportPage />;
      case 'track':
        return <TrackPage reportId={params.reportId} />;
      default:
        return <NotFoundPage path={path} />;
    }
  };

  return (
    <div className="cl-app-layout">
      <Sidebar currentPath={path} />
      {renderPage()}
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}

export default App;
