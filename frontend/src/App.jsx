import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './stores/authStore';
import { useEffect, Component } from 'react';
import Layout from './components/Layout';
import FieldWorkerLayout from './components/FieldWorkerLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Blocks from './pages/Blocks';
import BlockDetail from './pages/BlockDetail';
import BlockActivityHistory from './pages/BlockActivityHistory';
import Crops from './pages/Crops';
import CropActivityHistory from './pages/CropActivityHistory';
import Seasons from './pages/Seasons';
import Workers from './pages/WorkerList';
import WorkLogs from './pages/WorkLogs';
import WorkLogForm from './pages/WorkLogForm';
import Analytics from './pages/Analytics';
import WorkerHome from './pages/WorkerHome';
import MyLogs from './pages/MyLogs';
import Weather from './pages/Weather';
import Inventory from './pages/Inventory';
import CostSummary from './pages/CostSummary';
import Activity from './pages/Activity';
import Attendance from './pages/Attendance';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
            <p className="text-gray-600 mb-4">Please refresh the page or try again later.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function PrivateRoute({ children }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function AppRoutes() {
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.is_admin;

  useEffect(() => {
    checkAuth();
  }, []);

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/" />} />
      
      {isAdmin ? (
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="blocks" element={<Blocks />} />
          <Route path="blocks/:id" element={<BlockDetail />} />
          <Route path="blocks/:id/activity" element={<BlockActivityHistory />} />
          <Route path="crops" element={<Crops />} />
          <Route path="crops/:id/activity" element={<CropActivityHistory />} />
          <Route path="seasons" element={<Seasons />} />
          <Route path="workers" element={<Workers />} />
          <Route path="workers/attendance" element={<Attendance />} />
          <Route path="work-logs" element={<WorkLogs />} />
          <Route path="work-logs/new" element={<WorkLogForm />} />
          <Route path="work-logs/:id/edit" element={<WorkLogForm />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="weather" element={<Weather />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="activity" element={<Activity />} />
          <Route path="cost-summary" element={<CostSummary />} />
        </Route>
      ) : (
        <Route path="/" element={<FieldWorkerLayout />}>
          <Route index element={<WorkerHome />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="work-logs/new" element={<WorkLogForm />} />
          <Route path="work-logs/:id/edit" element={<WorkLogForm />} />
        </Route>
      )}
      
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Toaster position="top-right" />
        <AppRoutes />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;