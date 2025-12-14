import React, { useState, useEffect } from 'react';
import { ChevronRight, Wrench, Code, Share2 } from 'lucide-react';

interface HomePageProps {
  onNavigate: (page: string) => void;
}

export default function HomePage({ onNavigate }: HomePageProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="relative overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center">
        {/* Background Pattern */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-white to-gray-50"></div>
          <div className="absolute left-0 top-0 w-1/2 h-full opacity-10">
            <svg className="w-full h-full" viewBox="0 0 400 400" fill="none">
              <defs>
                <pattern id="blueprint" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e40af" strokeWidth="0.5"/>
                  <circle cx="20" cy="20" r="1" fill="#1e40af"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#blueprint)"/>
            </svg>
          </div>
          <div className="absolute right-0 top-0 w-1/2 h-full opacity-10">
            <div className="w-full h-full bg-gray-900 font-mono text-xs text-green-400 p-4 overflow-hidden">
              <div className="animate-pulse">
                <div className="mb-2">const engineer = &#123;</div>
                <div className="ml-4 mb-2">background: 'mechanical',</div>
                <div className="ml-4 mb-2">passion: 'problem-solving',</div>
                <div className="ml-4 mb-2">evolution: 'continuous'</div>
                <div>&#125;;</div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative max-w-7xl mx-auto px-6 z-10">
          <div className="text-center">
            <h1 className={`text-4xl md:text-6xl font-bold text-gray-900 mb-6 transition-all duration-1000 ${
              isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'
            }`}>
              从实体构建到
              <span className="text-blue-600 font-mono">数字创造</span>
            </h1>
            
            <h2 className={`text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto transition-all duration-1000 delay-300 ${
              isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'
            }`}>
              我是 <span className="font-mono text-blue-600 font-semibold">zlcggb</span>，一个用代码延续工程思维的全栈开发者
            </h2>

            <div className={`flex flex-col sm:flex-row gap-4 justify-center transition-all duration-1000 delay-600 ${
              isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'
            }`}>
              <button
                onClick={() => onNavigate('portfolio')}
                className="inline-flex items-center px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
              >
                查看我的工程作品
                <ChevronRight className="ml-2" size={20} />
              </button>
              <button
                onClick={() => onNavigate('timeline')}
                className="inline-flex items-center px-8 py-3 border-2 border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors"
              >
                阅读转行故事
                <ChevronRight className="ml-2" size={20} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Value Props Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Wrench className="text-blue-600" size={40} />,
                title: "工程根基",
                description: "3年机械设计经验，从零件到系统，习惯了严谨的物理约束。"
              },
              {
                icon: <Code className="text-teal-600" size={40} />,
                title: "全栈思维",
                description: "1年高强度开发，将模块化设计理念带入 React 组件系统。"
              },
              {
                icon: <Share2 className="text-orange-600" size={40} />,
                title: "开源分享",
                description: "致力于降低技术门槛，分享从 0 到 1 的建站与部署经验。"
              }
            ].map((prop, index) => (
              <div
                key={index}
                className="text-center p-8 rounded-xl bg-gray-50 hover:bg-white hover:shadow-lg transition-all duration-300 group"
              >
                <div className="flex justify-center mb-4 group-hover:scale-110 transition-transform">
                  {prop.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 font-mono">
                  {prop.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {prop.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}