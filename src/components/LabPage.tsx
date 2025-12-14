import { useState, useEffect } from 'react';
import { FileText, ExternalLink, BookOpen, Sparkles, ChevronRight } from 'lucide-react';

export default function LabPage() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const docLink = "https://doyd60gw42.feishu.cn/wiki/M3UxwbJy7in1z2kv0TNcxECynoc";

  const topics = [
    "网络代理",
    "网站开发（0～1）",
    "网站编辑（1～100）",
    "语法与框架",
    "React成长之路",
    "部署自己的域名"
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

        {/* Main CTA - 飞书文档入口 */}
        <div className={`mb-12 transition-all duration-1000 delay-100 ease-apple ${
          isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'
        }`}>
          <a 
            href={docLink}
            target="_blank"
            rel="noopener noreferrer"
            className="block group"
          >
            <div className="apple-card p-8 md:p-12 bg-gradient-to-br from-apple-blue/5 via-purple-500/5 to-pink-500/5 border border-apple-blue/10 hover:border-apple-blue/30 transition-all duration-500">
              <div className="flex flex-col md:flex-row items-center gap-8">
                {/* 图标区域 */}
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-br from-apple-blue to-purple-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500">
                    <FileText className="text-white" size={40} />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                    <Sparkles className="text-white" size={16} />
                  </div>
                </div>

                {/* 内容区域 */}
                <div className="flex-1 text-center md:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-apple-blue/10 rounded-full text-apple-blue text-sm font-medium mb-4">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    持续更新中
                  </div>
                  <h2 className="text-2xl md:text-3xl font-semibold text-apple-gray-600 mb-3 group-hover:text-apple-blue transition-colors duration-300">
                    📚 查看完整技术文档
                  </h2>
                  <p className="text-apple-gray-500 leading-relaxed mb-4">
                    所有教程和文章都整理在飞书文档中，包含从零开始的全栈开发指南、
                    转行经验分享、工具使用技巧等内容。点击访问获取最新内容！
                  </p>
                  <div className="inline-flex items-center gap-2 text-apple-blue font-medium group-hover:gap-3 transition-all duration-300">
                    立即访问飞书文档
                    <ExternalLink size={18} className="group-hover:translate-x-1 transition-transform duration-300" />
                  </div>
                </div>
              </div>
            </div>
          </a>
        </div>

        {/* 文档内容预览 */}
        <div className={`mb-12 transition-all duration-1000 delay-200 ease-apple ${
          isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'
        }`}>
          <div className="apple-card p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-apple-blue/10 rounded-xl flex items-center justify-center">
                <BookOpen className="text-apple-blue" size={20} />
              </div>
              <h3 className="text-xl font-semibold text-apple-gray-600">文档内容预览</h3>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              {topics.map((topic, index) => (
                <a
                  key={index}
                  href={docLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 bg-apple-gray-50 rounded-xl hover:bg-apple-blue/5 hover:border-apple-blue/20 border border-transparent transition-all duration-300 group"
                >
                  <div className="w-8 h-8 bg-apple-blue/10 rounded-lg flex items-center justify-center text-apple-blue font-mono text-sm group-hover:bg-apple-blue group-hover:text-white transition-colors duration-300">
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  <span className="text-apple-gray-600 text-sm flex-1 group-hover:text-apple-blue transition-colors duration-300">{topic}</span>
                  <ChevronRight size={14} className="text-apple-gray-300 group-hover:text-apple-blue group-hover:translate-x-1 transition-all duration-300" />
                </a>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-apple-gray-100 text-center">
              <a
                href={docLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-apple-blue font-medium hover:gap-3 transition-all duration-300"
              >
                查看全部内容
                <ExternalLink size={16} />
              </a>
            </div>
          </div>
        </div>

        {/* 特色说明 */}
        <div className={`grid md:grid-cols-3 gap-6 mb-12 transition-all duration-1000 delay-300 ease-apple ${
          isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'
        }`}>
          {[
            {
              emoji: "🎯",
              title: "实战导向",
              desc: "每篇教程都来自真实项目经验，不是纸上谈兵"
            },
            {
              emoji: "🔄",
              title: "持续更新",
              desc: "定期更新新内容，记录最新的学习心得"
            },
            {
              emoji: "💬",
              title: "互动交流",
              desc: "欢迎在文档中留言讨论，一起进步"
            }
          ].map((item, index) => (
            <div key={index} className="apple-card p-6 text-center">
              <div className="text-4xl mb-4">{item.emoji}</div>
              <h4 className="font-semibold text-apple-gray-600 mb-2">{item.title}</h4>
              <p className="text-sm text-apple-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* 底部 CTA */}
        <div className={`transition-all duration-1000 delay-400 ease-apple ${
          isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'
        }`}>
          <div className="apple-card p-8 md:p-10 text-center bg-apple-gray-600">
            <h3 className="text-2xl font-semibold text-white mb-3">
              开始你的全栈之旅
            </h3>
            <p className="text-apple-gray-300 mb-6 max-w-md mx-auto">
              从机械到代码，我走过的路，希望能帮你少走弯路
            </p>
            <a
              href={docLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3 bg-white text-apple-gray-600 font-semibold rounded-full hover:bg-apple-gray-100 transition-colors duration-300"
            >
              <FileText size={18} />
              访问技术文档
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
