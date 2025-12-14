import React, { useState, useEffect } from 'react';
import { BookOpen, Clock, Tag, ChevronRight } from 'lucide-react';

export default function LabPage() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const articles = [
    {
      id: 1,
      title: "为什么机械工程师选择 React？",
      excerpt: "你以为我在写代码，其实我在拼乐高。深度解析 SolidWorks 的\"零件装配"思想与 React "组件复用\"思想的惊人相似性。",
      tags: ["React", "工程思维", "心得"],
      readTime: "8 分钟",
      date: "2025-01-15",
      featured: true,
      image: "https://images.pexels.com/photos/574069/pexels-photo-574069.jpeg"
    },
    {
      id: 2,
      title: "如何设计你的第一个网站（给非科班同学的指南）",
      excerpt: "复盘我在 2025 年 2 月的踩坑经历。不谈复杂的算法，只谈如何把一个想法变成可以点击的页面。",
      tags: ["WebDesign", "入门"],
      readTime: "12 分钟",
      date: "2025-01-10",
      featured: false,
      image: "https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg"
    },
    {
      id: 3,
      title: "全栈第一步：如何拥有自己的服务器和域名",
      excerpt: "从阿里云/腾讯云购买，到 Nginx 配置，再到 DNS 解析。手把手教你点亮互联网上的那一盏灯。",
      tags: ["DevOps", "Server", "部署"],
      readTime: "15 分钟",
      date: "2025-01-05",
      featured: false,
      image: "https://images.pexels.com/photos/1181298/pexels-photo-1181298.jpeg"
    },
    {
      id: 4,
      title: "从CAD建模到React组件：设计模式的迁移",
      excerpt: "探索机械设计中的参数化建模思维如何帮助我更好地理解React的props和state管理。",
      tags: ["React", "设计模式", "CAD"],
      readTime: "10 分钟",
      date: "2024-12-28",
      featured: false,
      image: "https://images.pexels.com/photos/159275/macro-cogwheel-gear-mechanism-159275.jpeg"
    }
  ];

  const ArticleCard = ({ article, featured = false }: { article: any; featured?: boolean }) => (
    <article className={`bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer ${
      featured ? 'md:col-span-2' : ''
    }`}>
      <div className="relative overflow-hidden">
        <img
          src={article.image}
          alt={article.title}
          className={`w-full object-cover group-hover:scale-105 transition-transform duration-300 ${
            featured ? 'h-64' : 'h-48'
          }`}
        />
        <div className="absolute top-4 left-4">
          <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
            {featured ? '精选' : '教程'}
          </span>
        </div>
      </div>
      <div className="p-6">
        <div className="flex items-center text-sm text-gray-500 mb-3">
          <Clock size={16} className="mr-2" />
          <span>{article.readTime}</span>
          <span className="mx-2">•</span>
          <span>{article.date}</span>
        </div>
        <h2 className={`font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors ${
          featured ? 'text-2xl' : 'text-xl'
        }`}>
          {article.title}
        </h2>
        <p className="text-gray-600 mb-4 leading-relaxed">
          {article.excerpt}
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          {article.tags.map((tag: string, index: number) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full"
            >
              <Tag size={12} className="mr-1" />
              {tag}
            </span>
          ))}
        </div>
        <div className="flex items-center text-blue-600 font-semibold group-hover:text-blue-700">
          阅读全文
          <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </article>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-20">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className={`text-center mb-12 transition-all duration-1000 ${
          isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'
        }`}>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            技术实验室
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-2">
            费曼学习法：Share to Learn
          </p>
          <p className="text-gray-500">
            展示技术深度和沟通能力
          </p>
        </div>

        {/* Featured Article */}
        <div className={`mb-12 transition-all duration-1000 delay-300 ${
          isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'
        }`}>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <BookOpen className="mr-3 text-blue-600" />
            精选文章
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <ArticleCard article={articles[0]} featured={true} />
          </div>
        </div>

        {/* Articles Grid */}
        <div className={`mb-12 transition-all duration-1000 delay-500 ${
          isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'
        }`}>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <BookOpen className="mr-3 text-teal-600" />
            技术教程
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.slice(1).map((article, index) => (
              <div
                key={article.id}
                className={`transition-all duration-500 delay-${(index + 1) * 100}`}
              >
                <ArticleCard article={article} />
              </div>
            ))}
          </div>
        </div>

        {/* Interactive Playground Section */}
        <div className={`bg-white rounded-xl shadow-lg p-8 transition-all duration-1000 delay-700 ${
          isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'
        }`}>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            互动演示：代码可视化
          </h2>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">CSS 3D 立方体</h3>
              <div className="bg-gray-900 p-4 rounded-lg font-mono text-sm text-green-400 overflow-hidden">
                <div className="animate-pulse">
                  <div>.cube &#123;</div>
                  <div className="ml-4">transform-style: preserve-3d;</div>
                  <div className="ml-4">animation: rotate 4s infinite;</div>
                  <div>&#125;</div>
                  <br />
                  <div>@keyframes rotate &#123;</div>
                  <div className="ml-4">from &#123; transform: rotateY(0); &#125;</div>
                  <div className="ml-4">to &#123; transform: rotateY(360deg); &#125;</div>
                  <div>&#125;</div>
                </div>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="perspective-1000">
                <div className="w-32 h-32 relative transform-gpu animate-spin" style={{ animationDuration: '4s' }}>
                  <div className="absolute inset-0 bg-blue-500 opacity-80 border border-blue-600"></div>
                  <div className="absolute inset-0 bg-blue-600 opacity-80 border border-blue-700 transform rotateY-90 origin-right"></div>
                  <div className="absolute inset-0 bg-blue-700 opacity-80 border border-blue-800 transform rotateX-90 origin-bottom"></div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-blue-800">
              <span className="font-semibold">设计理念：</span>
              "所见即所得" - 将抽象的代码逻辑通过视觉效果直观展示，正如机械设计中的三维建模。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}