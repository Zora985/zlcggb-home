import { useState, useEffect } from 'react';
import { Menu, X, Github, Mail } from 'lucide-react';

// B站图标组件
const BilibiliIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.813 4.653h.854c1.51.054 2.769.578 3.773 1.574 1.004.995 1.524 2.249 1.56 3.76v7.36c-.036 1.51-.556 2.769-1.56 3.773s-2.262 1.524-3.773 1.56H5.333c-1.51-.036-2.769-.556-3.773-1.56S.036 18.858 0 17.347v-7.36c.036-1.511.556-2.765 1.56-3.76 1.004-.996 2.262-1.52 3.773-1.574h.774l-1.174-1.12a1.234 1.234 0 0 1-.373-.906c0-.356.124-.659.373-.907l.027-.027c.267-.249.573-.373.92-.373.347 0 .653.124.92.373L9.653 4.44c.071.071.134.142.187.213h4.267a.836.836 0 0 1 .16-.213l2.853-2.747c.267-.249.573-.373.92-.373.347 0 .662.151.929.4.267.249.391.551.391.907 0 .355-.124.657-.373.906L17.813 4.653zM5.333 7.24c-.746.018-1.373.276-1.88.773-.506.498-.769 1.13-.786 1.894v7.52c.017.764.28 1.395.786 1.893.507.498 1.134.756 1.88.773h13.334c.746-.017 1.373-.275 1.88-.773.506-.498.769-1.129.786-1.893v-7.52c-.017-.765-.28-1.396-.786-1.894-.507-.497-1.134-.755-1.88-.773H5.333zM8 11.107c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c0-.373.129-.689.386-.947.258-.257.574-.386.947-.386zm8 0c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c.017-.391.15-.711.4-.96.249-.249.56-.373.933-.373z"/>
  </svg>
);

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
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

export default function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  
  // 判断是否是圣诞树页面
  const isChristmasPage = currentPage === 'christmas';

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
            <div 
              className="cursor-pointer hover:opacity-80 transition-opacity duration-300"
              onClick={() => onNavigate('home')}
            >
              <FusionLogo isDark={isChristmasPage} />
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`text-xs font-medium transition-all duration-300 ${
                    isChristmasPage
                      ? currentPage === item.id
                        ? 'text-green-400'
                        : 'text-gray-400 hover:text-green-300'
                      : currentPage === item.id
                        ? 'text-apple-gray-600'
                        : 'text-apple-gray-500 hover:text-apple-gray-600'
                  }`}
                >
                  {item.label}
                </button>
              ))}
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
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavigate(item.id);
                      setIsMenuOpen(false);
                    }}
                    className={`block w-full text-left px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 ${
                      isChristmasPage
                        ? currentPage === item.id
                          ? 'text-green-400 bg-green-500/10'
                          : 'text-gray-300 hover:bg-white/5'
                        : currentPage === item.id
                          ? 'text-apple-blue bg-apple-blue/5'
                          : 'text-apple-gray-600 hover:bg-apple-gray-200/50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
                <div className="px-4 pt-2 flex items-center gap-4">
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
    </div>
  );
}
