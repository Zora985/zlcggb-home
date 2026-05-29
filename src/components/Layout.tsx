import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Github, Mail, LogOut, Plus, ChevronDown } from 'lucide-react';
import { useAuth } from '../lib/useAuth';
import LoginModal from './lab/LoginModal';

// B站图标组件
const BilibiliIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.813 4.653h.854c1.51.054 2.769.578 3.773 1.574 1.004.995 1.524 2.249 1.56 3.76v7.36c-.036 1.51-.556 2.769-1.56 3.773s-2.262 1.524-3.773 1.56H5.333c-1.51-.036-2.769-.556-3.773-1.56S.036 18.858 0 17.347v-7.36c.036-1.511.556-2.765 1.56-3.76 1.004-.996 2.262-1.52 3.773-1.574h.774l-1.174-1.12a1.234 1.234 0 0 1-.373-.906c0-.356.124-.659.373-.907l.027-.027c.267-.249.573-.373.92-.373.347 0 .653.124.92.373L9.653 4.44c.071.071.134.142.187.213h4.267a.836.836 0 0 1 .16-.213l2.853-2.747c.267-.249.573-.373.92-.373.347 0 .662.151.929.4.267.249.391.551.391.907 0 .355-.124.657-.373.906L17.813 4.653zM5.333 7.24c-.746.018-1.373.276-1.88.773-.506.498-.769 1.13-.786 1.894v7.52c.017.764.28 1.395.786 1.893.507.498 1.134.756 1.88.773h13.334c.746-.017 1.373-.275 1.88-.773.506-.498.769-1.129.786-1.893v-7.52c-.017-.765-.28-1.396-.786-1.894-.507-.497-1.134-.755-1.88-.773H5.333zM8 11.107c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c0-.373.129-.689.386-.947.258-.257.574-.386.947-.386zm8 0c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c.017-.391.15-.711.4-.96.249-.249.56-.373.933-.373z"/>
  </svg>
);

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
}

// 融合型 Logo - 齿轮 + 代码标签
const FusionLogo = ({ className = "", isDark = false }: { className?: string; isDark?: boolean }) => (
  <svg width="160" height="44" viewBox="0 0 200 60" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style={{ stopColor: isDark ? '#a1a1aa' : '#6e6e73', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: isDark ? '#22c55e' : '#0071e3', stopOpacity: 1 }} />
      </linearGradient>
      <linearGradient id="logoGradDark" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style={{ stopColor: '#a1a1aa', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#22c55e', stopOpacity: 1 }} />
      </linearGradient>
    </defs>
    <g transform="translate(10, 10)">
      <path 
        d="M20 0 C 8.95 0 0 8.95 0 20 C 0 31.05 8.95 40 20 40" 
        fill="none" 
        stroke={isDark ? "url(#logoGradDark)" : "url(#logoGrad)"}
        strokeWidth="3.5" 
        strokeLinecap="round"
      />
      <path 
        d="M5 8 L 8 5 M 0 20 L 4 20 M 5 32 L 8 35" 
        stroke={isDark ? "url(#logoGradDark)" : "url(#logoGrad)"}
        strokeWidth="3.5" 
        strokeLinecap="round" 
      />
      <path 
        d="M25 10 L 35 20 L 25 30" 
        fill="none" 
        stroke={isDark ? "#22c55e" : "#0071e3"}
        strokeWidth="3.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M32 8 L 22 32" 
        stroke={isDark ? "#22c55e" : "#0071e3"}
        strokeWidth="2.5" 
        strokeLinecap="round"
      />
    </g>
    <text x="58" y="36" fontFamily="'Inter', sans-serif" fontSize="22" fontWeight="600" fill={isDark ? "#ffffff" : "#1d1d1f"} letterSpacing="-0.5">
      zlc<tspan fill={isDark ? "#22c55e" : "#0071e3"}>ggb</tspan>
    </text>
  </svg>
);

export default function Layout({ children, currentPage }: LayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, isAdmin, signOut } = useAuth();
  const userMenuRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭用户菜单
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    }
    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showUserMenu]);

  async function handleSignOut() {
    await signOut();
    setShowUserMenu(false);
  }
  
  // 判断是否是深色主题页面（圣诞树 / 电子宠物）
  const isChristmasPage = currentPage === 'christmas' || currentPage === 'pet';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { id: 'home', label: '首页' },
    { id: 'portfolio', label: '作品集' },
    { id: 'timeline', label: '进化之路' },
    { id: 'lab', label: '技术实验室' },
    { id: 'pet', label: '🐾 电子宠物' },
    { id: 'christmas', label: '🎄 圣诞树' }
  ];

  return (
    <div className={`min-h-screen ${isChristmasPage ? 'bg-black' : 'bg-apple-gray-100'}`}>
      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-apple ${
        isChristmasPage
          ? 'bg-black/80 backdrop-blur-md border-b border-white/10'
          : isScrolled 
            ? 'glass border-b border-apple-gray-200/50' 
            : 'bg-transparent'
      }`}>
        <div className="max-w-[980px] mx-auto px-6">
          <div className="flex items-center justify-between h-12">
            {/* Logo */}
            <Link 
              to="/"
              className="cursor-pointer hover:opacity-80 transition-opacity duration-300"
            >
              <FusionLogo isDark={isChristmasPage} />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navItems.map((item) => {
                const path = item.id === 'home' ? '/' : `/${item.id}`;
                const isActive = location.pathname === path;
                return (
                  <Link
                    key={item.id}
                    to={path}
                    className={`text-xs font-medium transition-all duration-300 ${
                      isChristmasPage
                        ? isActive
                          ? 'text-green-400'
                          : 'text-gray-400 hover:text-green-300'
                        : isActive
                          ? 'text-apple-gray-600'
                          : 'text-apple-gray-500 hover:text-apple-gray-600'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <a
                href="https://github.com/zlcggb/zlcggb-home"
                target="_blank"
                rel="noopener noreferrer"
                className={`transition-colors duration-300 ${
                  isChristmasPage 
                    ? 'text-gray-400 hover:text-green-400' 
                    : 'text-apple-gray-500 hover:text-apple-gray-600'
                }`}
              >
                <Github size={16} />
              </a>

              {/* 用户入口 */}
              {user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-full transition-all duration-300 ${
                      isChristmasPage
                        ? 'text-gray-300 hover:bg-white/10'
                        : 'text-apple-gray-500 hover:bg-apple-gray-200/50'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                      isAdmin
                        ? 'bg-apple-blue text-white'
                        : isChristmasPage ? 'bg-green-600 text-white' : 'bg-apple-gray-300 text-white'
                    }`}>
                      {profile?.username?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <ChevronDown size={12} className={`transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-apple-xl border border-apple-gray-200/50 py-2 animate-fade-in-up z-50">
                      <div className="px-3 py-2 border-b border-apple-gray-100">
                        <p className="text-sm font-medium text-apple-gray-600 truncate">{profile?.username || '用户'}</p>
                        <p className="text-xs text-apple-gray-400 truncate">{user.email}</p>
                        {isAdmin && <span className="inline-block mt-1 px-1.5 py-0.5 bg-apple-blue/10 text-apple-blue text-[10px] font-medium rounded">管理员</span>}
                      </div>
                      {isAdmin && (
                        <button
                          onClick={() => { navigate('/lab/editor'); setShowUserMenu(false); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-apple-gray-600 hover:bg-apple-gray-100 transition-colors"
                        >
                          <Plus size={14} /> 发布教程
                        </button>
                      )}
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <LogOut size={14} /> 退出登录
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setShowLogin(true)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-full transition-all duration-300 ${
                    isChristmasPage
                      ? 'text-green-400 border border-green-500/30 hover:bg-green-500/10'
                      : 'text-apple-blue border border-apple-blue/30 hover:bg-apple-blue/5'
                  }`}
                >
                  登录
                </button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className={`md:hidden transition-colors duration-300 ${
                isChristmasPage 
                  ? 'text-white hover:text-green-400' 
                  : 'text-apple-gray-600 hover:text-apple-blue'
              }`}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className={`md:hidden animate-fade-in-up ${
              isChristmasPage 
                ? 'bg-black/90 border-t border-white/10' 
                : 'glass border-t border-apple-gray-200/50'
            }`}>
              <div className="py-4 space-y-1">
                {navItems.map((item) => {
                  const path = item.id === 'home' ? '/' : `/${item.id}`;
                  const isActive = location.pathname === path;
                  return (
                    <Link
                      key={item.id}
                      to={path}
                      onClick={() => setIsMenuOpen(false)}
                      className={`block w-full text-left px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 ${
                        isChristmasPage
                          ? isActive
                            ? 'text-green-400 bg-green-500/10'
                            : 'text-gray-300 hover:bg-white/5'
                          : isActive
                            ? 'text-apple-blue bg-apple-blue/5'
                            : 'text-apple-gray-600 hover:bg-apple-gray-200/50'
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
                <div className="px-4 pt-2 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <a
                      href="https://github.com/zlcggb/zlcggb-home"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center transition-colors duration-300 ${
                        isChristmasPage ? 'text-gray-400 hover:text-green-400' : 'text-apple-gray-500 hover:text-apple-gray-600'
                      }`}
                    >
                      <Github size={16} className="mr-1" />
                      <span className="text-sm">GitHub</span>
                    </a>
                    <a
                      href="https://b23.tv/xJIdoxY"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center transition-colors duration-300 ${
                        isChristmasPage ? 'text-gray-400 hover:text-pink-400' : 'text-apple-gray-500 hover:text-pink-500'
                      }`}
                    >
                      <BilibiliIcon size={16} />
                      <span className="text-sm ml-1">B站</span>
                    </a>
                  </div>
                  {/* 移动端用户入口 */}
                  {user ? (
                    <div className="flex items-center gap-3">
                      <span className={`text-sm ${
                        isChristmasPage ? 'text-gray-300' : 'text-apple-gray-500'
                      }`}>{profile?.username}</span>
                      <button
                        onClick={() => { handleSignOut(); setIsMenuOpen(false); }}
                        className="text-sm text-red-500 hover:text-red-600 transition-colors"
                      >
                        退出
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setShowLogin(true); setIsMenuOpen(false); }}
                      className={`text-sm font-medium ${
                        isChristmasPage ? 'text-green-400' : 'text-apple-blue'
                      }`}
                    >
                      登录 / 注册
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-12">
        {children}
      </main>

      {/* Footer - 圣诞树页面不显示 */}
      {!isChristmasPage && (
        <footer className="bg-apple-gray-100 border-t border-apple-gray-200/80 py-8">
          <div className="max-w-[980px] mx-auto px-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                <FusionLogo className="opacity-60 hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-xs text-apple-gray-400">
                © 2025 zlcggb. 用工程思维构建数字世界
              </p>
              <div className="flex items-center space-x-5">
                <a
                  href="mailto:u0015098@unilumin.com"
                  className="text-apple-gray-400 hover:text-apple-blue transition-colors duration-300"
                  title="邮箱"
                >
                  <Mail size={18} />
                </a>
                <a
                  href="https://b23.tv/xJIdoxY"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-apple-gray-400 hover:text-pink-500 transition-colors duration-300"
                  title="B站"
                >
                  <BilibiliIcon size={18} />
                </a>
                <a
                  href="https://github.com/zlcggb/zlcggb-home"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-apple-gray-400 hover:text-apple-gray-600 transition-colors duration-300"
                  title="GitHub"
                >
                  <Github size={18} />
                </a>
              </div>
            </div>
          </div>
        </footer>
      )}

      {/* 登录弹窗 */}
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
    </div>
  );
}
