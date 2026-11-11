import { Routes, Route } from 'react-router-dom';
import HomePage from '../pages/HomePage.jsx';
import StudentResultPage from '../pages/StudentResultPage.jsx';
import ToppersPage from '../pages/ToppersPage.jsx';
import AnalyticsPage from '../pages/AnalyticsPage.jsx';
import UploadPage from '../pages/UploadPage.jsx';
import AdminPage from '../pages/AdminPage.jsx';
import NotFoundPage from '../pages/NotFoundPage.jsx';

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/result/:rollNo?" element={<StudentResultPage />} />
      <Route path="/toppers" element={<ToppersPage />} />
      <Route path="/analytics" element={<AnalyticsPage />} />
      <Route path="/upload" element={<UploadPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
