import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './stores/authStore';
import { useEffect } from 'react';
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
    <BrowserRouter>
      <Toaster position="top-right" />
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;