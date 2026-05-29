import { lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './components/HomePage';
import PortfolioPage from './components/PortfolioPage';
import TimelinePage from './components/TimelinePage';
import LabPage from './components/LabPage';
import ChristmasPage from './components/ChristmasPage';
import PetPage from './components/PetPage';
import TutorialDetail from './components/lab/TutorialDetail';

// 编辑器按需加载（Tiptap 体积较大）
const TutorialEditor = lazy(() => import('./components/lab/TutorialEditor'));

const EditorFallback = () => (
  <div className="min-h-screen bg-apple-gray-100 flex items-center justify-center">
    <div className="w-6 h-6 border-2 border-apple-gray-300 border-t-apple-blue rounded-full animate-spin" />
  </div>
);

function App() {
  const location = useLocation();
  
  // 从路径中提取当前页面标识（用于 Layout 组件）
  const currentPage = location.pathname === '/' ? 'home' : location.pathname.slice(1);

  return (
    <Layout currentPage={currentPage}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/portfolio" element={<PortfolioPage />} />
        <Route path="/timeline" element={<TimelinePage />} />
        <Route path="/lab" element={<LabPage />} />
        {/* editor 路由必须在 :slug 前面，防止 "editor" 被当作 slug */}
        <Route path="/lab/editor" element={<Suspense fallback={<EditorFallback />}><TutorialEditor /></Suspense>} />
        <Route path="/lab/editor/:id" element={<Suspense fallback={<EditorFallback />}><TutorialEditor /></Suspense>} />
        <Route path="/lab/:slug" element={<TutorialDetail />} />
        <Route path="/christmas" element={<ChristmasPage />} />
        <Route path="/pet" element={<PetPage />} />
        {/* 404 重定向到首页 */}
        <Route path="*" element={<HomePage />} />
      </Routes>
    </Layout>
  );
}

export default App;