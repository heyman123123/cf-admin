import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import LeadDetail from './pages/LeadDetail';
import Pipeline from './pages/Pipeline';
import Pages from './pages/Pages';
import BlockEditor from './pages/BlockEditor';
import Media from './pages/Media';
import Theme from './pages/Theme';
import Mail from './pages/Mail';
import Login from './pages/Login';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/leads" element={<Leads />} />
        <Route path="/leads/:id" element={<LeadDetail />} />
        <Route path="/pipeline" element={<Pipeline />} />
        <Route path="/pages" element={<Pages />} />
        <Route path="/media" element={<Media />} />
        <Route path="/theme" element={<Theme />} />
        <Route path="/mail" element={<Mail />} />
      </Route>
      {/* 编辑器独立二级全屏页（无主菜单） */}
      <Route path="/pages/:id/blocks" element={<BlockEditor />} />
    </Routes>
  );
}
