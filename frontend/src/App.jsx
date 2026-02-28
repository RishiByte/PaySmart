import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Groups from './pages/Groups';
import Expenses from './pages/Expenses';
import Balances from './pages/Balances';
import Toast from './components/Toast';
import { ToastProvider } from './components/ToastContext';
import './index.css';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <div className="app-layout">
          <Sidebar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/users" element={<Users />} />
              <Route path="/groups" element={<Groups />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/balances" element={<Balances />} />
            </Routes>
          </main>
          <Toast />
        </div>
      </ToastProvider>
    </BrowserRouter>
  );
}
