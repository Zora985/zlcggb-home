import { Routes, Route, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './components/HomePage';
import PortfolioPage from './components/PortfolioPage';
import TimelinePage from './components/TimelinePage';
import LabPage from './components/LabPage';
import ChristmasPage from './components/ChristmasPage';

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
        <Route path="/christmas" element={<ChristmasPage />} />
        {/* 404 重定向到首页 */}
        <Route path="*" element={<HomePage />} />
      </Routes>
    </Layout>
  );
}

export default App;