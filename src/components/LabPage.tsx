import React, { useState, useEffect } from 'react';
import { Monitor, Atom, Server, ChevronRight, Clock, BookOpen } from 'lucide-react';

export default function LabPage() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const articles = [
    {
      id: 1,
      title: "如何设计第一个网站",
      icon: <Monitor className="text-apple-blue" size={32} />,
      excerpt: "从零开始搭建个人网站的完整指南，包括域名注册、服务器配置、HTML/CSS 基础，以及部署上线的全流程。",
      readTime: "15 分钟",
      category: "入门教程",
      gradient: "from-blue-50 to-cyan-50"
    },
    {
      id: 2,
      title: "为什么选择 React",
      icon: <Atom className="text-cyan-500" size={32} />,
      excerpt: "组件化架构的优势、虚拟 DOM 的工作原理、以及 React 生态系统的强大之处。从机械工程师的视角理解前端框架。",
      readTime: "12 分钟",
      category: "技术选型",
      gradient: "from-cyan-50 to-teal-50"
    },
    {
      id: 3,
      title: "如何拥有自己的服务器和域名",
      icon: <Server className="text-purple-500" size={32} />,
      excerpt: "云服务器选购指南、域名注册与解析、SSL 证书配置、Nginx 部署实战，让你的网站正式上线。",
      readTime: "20 分钟",
      category: "运维部署",
      gradient: "from-purple-50 to-pink-50"
    }
  ];

  const upcomingTopics = [
    "TypeScript 入门：为什么类型很重要",
    "从机械图纸到代码架构：思维的迁移",
    "Tailwind CSS：快速构建现代 UI",
    "Git 版本控制：像管理工程图纸一样管理代码"
  ];

  return (
    <div className="min-h-screen bg-apple-gray-100 py-24">
      <div className="max-w-[980px] mx-auto px-6">
        {/* Header */}
        <div className={`text-center mb-16 transition-all duration-1000 ease-apple ${
          isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'
        }`}>
          <p className="text-apple-gray-500 text-sm font-medium tracking-wide mb-4">
            技术实验室
          </p>
          <h1 className="text-5xl md:text-6xl font-semibold text-apple-gray-600 tracking-tight mb-4">
            教程与文章
          </h1>
          <p className="text-xl text-apple-gray-500 max-w-2xl mx-auto">
            分享我的学习笔记和技术心得，帮助更多人入门全栈开发
          </p>
        </div>

        {/* Featured Articles */}
        <div className={`space-y-6 mb-16 transition-all duration-1000 delay-100 ease-apple ${
          isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'
        }`}>
          {articles.map((article, index) => (
            <article
              key={article.id}
              className="apple-card overflow-hidden group cursor-pointer"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex flex-col md:flex-row">
                <div className={`md:w-48 p-8 bg-gradient-to-br ${article.gradient} flex items-center justify-center`}>
                  <div className="w-20 h-20 bg-white/80 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-500 ease-apple">
                    {article.icon}
                  </div>
                </div>
                <div className="flex-1 p-6 md:p-8 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-4 mb-3">
                      <span className="text-xs font-medium text-apple-blue bg-apple-blue/10 px-3 py-1 rounded-full">
                        {article.category}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-apple-gray-400">
                        <Clock size={12} />
                        {article.readTime}
                      </span>
                    </div>
                    <h2 className="text-xl md:text-2xl font-semibold text-apple-gray-600 mb-3 group-hover:text-apple-blue transition-colors duration-300">
                      {article.title}
                    </h2>
                    <p className="text-apple-gray-500 leading-relaxed mb-4">
                      {article.excerpt}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center text-apple-blue text-sm font-medium group-hover:gap-2 transition-all duration-300">
                      阅读全文
                      <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform duration-300" />
                    </span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Upcoming Topics */}
        <div className={`transition-all duration-1000 delay-300 ease-apple ${
          isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'
        }`}>
          <div className="apple-card p-8 md:p-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-apple-gray-100 rounded-xl flex items-center justify-center">
                <BookOpen className="text-apple-gray-500" size={20} />
              </div>
              <h3 className="text-xl font-semibold text-apple-gray-600">即将发布</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {upcomingTopics.map((topic, index) => (
                <div key={index} className="flex items-center gap-3 p-4 bg-apple-gray-50 rounded-xl hover:bg-apple-gray-100 transition-colors duration-300">
                  <div className="w-2 h-2 bg-apple-blue rounded-full" />
                  <span className="text-apple-gray-600 text-sm">{topic}</span>
                </div>
              ))}
            </div>
            <p className="text-apple-gray-400 text-sm mt-6 text-center">更多文章正在撰写中，敬请期待...</p>
          </div>
        </div>

        {/* Newsletter CTA */}
        <div className={`mt-12 transition-all duration-1000 delay-400 ease-apple ${
          isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'
        }`}>
          <div className="apple-card p-8 md:p-12 text-center bg-gradient-to-br from-apple-blue/5 to-purple-500/5">
            <h3 className="text-2xl font-semibold text-apple-gray-600 mb-3">订阅更新</h3>
            <p className="text-apple-gray-500 mb-6 max-w-md mx-auto">第一时间获取新文章通知，不错过任何学习机会</p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 px-4 py-3 rounded-xl border border-apple-gray-200 bg-white text-apple-gray-600 placeholder-apple-gray-400 focus:outline-none focus:ring-2 focus:ring-apple-blue/20 focus:border-apple-blue transition-all duration-300"
              />
              <button className="apple-button apple-button-primary whitespace-nowrap">订阅</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
