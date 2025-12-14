import { useState, useEffect } from 'react';
import { ChevronRight, Wrench, Code, Share2, Heart, Target, Lightbulb, PenTool, FlaskConical, ArrowRight } from 'lucide-react';

interface HomePageProps {
  onNavigate: (page: string) => void;
}

// 动态齿轮 SVG 组件
const GearIcon = ({ size = 80, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
    <defs>
      <linearGradient id="gearGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#d2d2d7', stopOpacity: 0.6 }} />
        <stop offset="100%" style={{ stopColor: '#86868b', stopOpacity: 0.4 }} />
      </linearGradient>
    </defs>
    <path
      d="M50 20 L53 20 L55 10 L60 10 L62 20 L65 22 L73 15 L78 20 L71 28 L73 32 L83 30 L85 35 L75 40 L75 45 L85 47 L85 53 L75 55 L75 60 L85 65 L83 70 L73 68 L71 72 L78 80 L73 85 L65 78 L62 80 L60 90 L55 90 L53 80 L50 80 L47 80 L45 90 L40 90 L38 80 L35 78 L27 85 L22 80 L29 72 L27 68 L17 70 L15 65 L25 60 L25 55 L15 53 L15 47 L25 45 L25 40 L15 35 L17 30 L27 32 L29 28 L22 20 L27 15 L35 22 L38 20 L40 10 L45 10 L47 20 Z"
      fill="url(#gearGrad)"
      stroke="none"
    />
    <circle cx="50" cy="50" r="15" fill="#f5f5f7" stroke="url(#gearGrad)" strokeWidth="3" />
  </svg>
);

export default function HomePage({ onNavigate }: HomePageProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // 设计思维五步法
  const designThinking = [
    { icon: <Heart size={20} />, title: "同理心", desc: "用户是谁？痛点在哪？", color: "from-pink-500 to-rose-500" },
    { icon: <Target size={20} />, title: "定义", desc: "我们要解决什么核心问题？", color: "from-cyan-500 to-blue-500" },
    { icon: <Lightbulb size={20} />, title: "构思", desc: "头脑风暴，天马行空", color: "from-purple-500 to-violet-500" },
    { icon: <PenTool size={20} />, title: "原型", desc: "画草图，做个假的先试试", color: "from-amber-500 to-orange-500" },
    { icon: <FlaskConical size={20} />, title: "测试", desc: "用户觉得好用吗？不好用重来", color: "from-green-500 to-emerald-500" }
  ];

  // 开发工具链
  const devToolchain = [
    { name: "构建思路", tool: "Gemini", color: "bg-blue-100 text-blue-700 hover:bg-blue-200", link: "https://gemini.google.com/" },
    { name: "网站设计", tool: "Bolt", color: "bg-gray-800 text-white hover:bg-gray-700", link: "https://bolt.new/?rid=1xfzsr" },
    { name: "代码编辑", tool: "Cursor", color: "bg-purple-100 text-purple-700 hover:bg-purple-200", link: "https://www.cursor.com/" },
    { name: "代码编辑", tool: "Kiro", color: "bg-indigo-100 text-indigo-700 hover:bg-indigo-200", link: "https://kiro.dev/" },
    { name: "数据库", tool: "Supabase", color: "bg-green-100 text-green-700 hover:bg-green-200", link: "https://supabase.com/" },
    { name: "存储库", tool: "Cloudflare", color: "bg-orange-100 text-orange-700 hover:bg-orange-200", link: "https://cloudflare.com/" },
    { name: "代码存储", tool: "GitHub", color: "bg-gray-100 text-gray-700 hover:bg-gray-200", link: "https://github.com/" },
    { name: "网站部署", tool: "Netlify", color: "bg-teal-100 text-teal-700 hover:bg-teal-200", link: "https://app.netlify.com/" },
    { name: "服务器", tool: "阿里云", color: "bg-red-100 text-red-700 hover:bg-red-200", link: "https://www.aliyun.com/" }
  ];

  return (
    <div className="relative overflow-hidden bg-apple-gray-100">
      {/* Hero Section - Apple Style */}
      <section className="relative min-h-screen flex items-center justify-center">
        {/* 背景装饰 */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-gradient-radial from-blue-100/40 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-gradient-radial from-purple-100/30 to-transparent rounded-full blur-3xl" />
          
          <div className="absolute top-20 left-[10%] animate-spin opacity-20" style={{ animationDuration: '30s' }}>
            <GearIcon size={120} />
          </div>
          <div className="absolute top-40 right-[15%] animate-spin opacity-15" style={{ animationDuration: '25s', animationDirection: 'reverse' }}>
            <GearIcon size={80} />
          </div>
          <div className="absolute bottom-32 left-[20%] animate-spin opacity-10" style={{ animationDuration: '35s' }}>
            <GearIcon size={100} />
          </div>
        </div>

        {/* 主内容 */}
        <div className="relative z-10 max-w-[980px] mx-auto px-6 text-center">
          <div className={`transition-all duration-1000 ease-apple ${
            isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'
          }`}>
            <p className="text-apple-gray-500 text-sm font-medium tracking-wide mb-4">
              从机械设计到全栈开发
            </p>
          </div>

          <h1 className={`text-5xl md:text-7xl lg:text-8xl font-semibold text-apple-gray-600 tracking-tight leading-[1.05] mb-6 transition-all duration-1000 delay-100 ease-apple ${
            isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'
          }`}>
            连接实体与代码
            <br />
            <span className="gradient-text-blue">的桥梁</span>
          </h1>

          <p className={`text-xl md:text-2xl text-apple-gray-500 font-normal max-w-2xl mx-auto mb-8 leading-relaxed transition-all duration-1000 delay-200 ease-apple ${
            isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'
          }`}>
            我是 <span className="font-mono text-apple-blue font-medium">zlcggb</span>，
            一个用代码延续工程思维的全栈开发者
          </p>

          <div className={`flex flex-col sm:flex-row gap-4 justify-center transition-all duration-1000 delay-300 ease-apple ${
            isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'
          }`}>
            <button
              onClick={() => onNavigate('portfolio')}
              className="apple-button apple-button-primary group"
            >
              查看工程作品
              <ChevronRight className="ml-1 group-hover:translate-x-1 transition-transform" size={18} />
            </button>
            <button
              onClick={() => onNavigate('timeline')}
              className="apple-button apple-button-secondary group"
            >
              阅读转行故事
              <ChevronRight className="ml-1 group-hover:translate-x-1 transition-transform" size={18} />
            </button>
          </div>
        </div>

        <div className={`absolute bottom-8 left-1/2 transform -translate-x-1/2 transition-all duration-1000 delay-500 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}>
          <div className="w-6 h-10 border-2 border-apple-gray-300 rounded-full flex justify-center">
            <div className="w-1 h-2 bg-apple-gray-400 rounded-full mt-2 animate-bounce" />
          </div>
        </div>
      </section>

      {/* 分割视觉区 - 机械 vs 代码 */}
      <section className="relative py-24 bg-white">
        <div className="max-w-[980px] mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-0 rounded-apple-xl overflow-hidden shadow-apple-lg">
            <div className="relative bg-gradient-to-br from-apple-gray-100 to-apple-gray-200 p-12 min-h-[400px] flex flex-col justify-center">
              <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 400 400">
                <defs>
                  <pattern id="blueprint" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1d1d1f" strokeWidth="0.5"/>
                    <circle cx="20" cy="20" r="1" fill="#1d1d1f"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#blueprint)"/>
              </svg>
              
              <div className="relative z-10">
                <div className="w-16 h-16 bg-apple-gray-600/10 rounded-2xl flex items-center justify-center mb-6">
                  <Wrench className="text-apple-gray-600" size={32} />
                </div>
                <h3 className="text-3xl font-semibold text-apple-gray-600 mb-3">机械设计</h3>
                <p className="text-apple-gray-500 text-lg leading-relaxed">
                  精密结构、传动系统、工程制图
                  <br />
                  <span className="font-mono text-sm text-apple-gray-400">Mechanical Design</span>
                </p>
              </div>
            </div>

            <div className="relative bg-apple-gray-600 p-12 min-h-[400px] flex flex-col justify-center overflow-hidden">
              <div className="absolute inset-0 p-6 font-mono text-xs opacity-20 text-apple-gray-300 overflow-hidden">
                <div className="space-y-1">
                  <div><span className="text-purple-400">const</span> stack = {'{'}</div>
                  <div className="ml-4">frontend: <span className="text-green-400">"React + Supabase"</span>,</div>
                  <div className="ml-4">backend: <span className="text-green-400">"Python + Flask"</span>,</div>
                  <div className="ml-4">api: <span className="text-green-400">"FastAPI"</span>,</div>
                  <div className="ml-4">passion: <span className="text-orange-400">∞</span>,</div>
                  <div>{'}'};</div>
                </div>
              </div>
              
              <div className="relative z-10">
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                  <Code className="text-white" size={32} />
                </div>
                <h3 className="text-3xl font-semibold text-white mb-3">全栈开发</h3>
                <p className="text-apple-gray-300 text-lg leading-relaxed">
                  React + Supabase、Python + FastAPI
                  <br />
                  <span className="font-mono text-sm text-apple-gray-400">Full-Stack Development</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 设计思维 Section */}
      <section className="py-24 bg-apple-gray-100">
        <div className="max-w-[980px] mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-apple-blue text-sm font-medium tracking-wide mb-2">构建思路</p>
            <h2 className="text-3xl md:text-4xl font-semibold text-apple-gray-600 tracking-tight mb-4">
              设计思维：在写代码之前
            </h2>
            <p className="text-lg text-apple-gray-500">
              先解决"做什么"和"为谁做"的问题
            </p>
          </div>

          {/* 五步法 */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 md:gap-8 mb-8">
            {designThinking.map((step, index) => (
              <div key={index} className="relative group">
                <div className="apple-card p-5 text-center h-full">
                  <div className={`w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    {step.icon}
                  </div>
                  <h4 className="font-semibold text-apple-gray-600 mb-1">{index + 1}. {step.title}</h4>
                  <p className="text-xs text-apple-gray-500 leading-relaxed">{step.desc}</p>
                </div>
                {index < 4 && (
                  <div className="hidden md:block absolute top-1/2 right-[-18px] transform -translate-y-1/2 z-10">
                    <ArrowRight size={16} className="text-apple-gray-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 开发工具链 Section */}
      <section className="py-24 bg-white">
        <div className="max-w-[980px] mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-apple-blue text-sm font-medium tracking-wide mb-2">网站开发流程</p>
            <h2 className="text-3xl md:text-4xl font-semibold text-apple-gray-600 tracking-tight mb-4">
              我的开发工具链
            </h2>
            <p className="text-lg text-apple-gray-500">
              从想法到上线的完整工作流
            </p>
          </div>

          {/* 工具链展示 */}
          <div className="apple-card p-8">
            <div className="flex flex-wrap justify-center items-start gap-3">
              {devToolchain.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <a 
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-center group"
                  >
                    <div className={`px-4 py-2 rounded-xl ${item.color} font-medium text-sm mb-1 transition-all duration-300 cursor-pointer`}>
                      {item.tool}
                    </div>
                    <p className="text-xs text-apple-gray-400 group-hover:text-apple-blue transition-colors">{item.name}</p>
                  </a>
                  {index < devToolchain.length - 1 && (
                    <ArrowRight size={14} className="text-apple-gray-300 mx-1 mt-[-16px]" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 工程思维一致性 Section */}
      <section className="py-24 bg-apple-gray-100">
        <div className="max-w-[980px] mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-semibold text-apple-gray-600 tracking-tight mb-4">
              工程思维的一致性
            </h2>
            <p className="text-xl text-apple-gray-500 max-w-2xl mx-auto">
              无论实体还是虚拟，核心都是解决问题的系统设计
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <Wrench className="text-apple-blue" size={32} />,
                title: "工程一致性",
                description: "机械设计讲究公差配合、受力分析；软件开发追求模块解耦、性能优化。本质都是在约束条件下寻找最优解。"
              },
              {
                icon: <Code className="text-apple-blue" size={32} />,
                title: "个人成长故事",
                description: "从仿生机械蝎子到 LED 智能配置系统，从 SolidWorks 到 React + Python，工具在变，解决问题的思维方式不变。"
              },
              {
                icon: <Share2 className="text-apple-blue" size={32} />,
                title: "技术教程分享",
                description: "将转型过程中踩过的坑、学到的经验整理成教程，帮助更多想要跨界的朋友少走弯路。"
              }
            ].map((prop, index) => (
              <div
                key={index}
                className="apple-card p-8 text-center group"
              >
                <div className="w-16 h-16 bg-apple-blue/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-apple-blue/15 transition-colors duration-300">
                  {prop.icon}
                </div>
                <h3 className="text-xl font-semibold text-apple-gray-600 mb-3">
                  {prop.title}
                </h3>
                <p className="text-apple-gray-500 leading-relaxed">
                  {prop.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-white">
        <div className="max-w-[980px] mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-semibold text-apple-gray-600 tracking-tight mb-4">
            准备好探索了吗？
          </h2>
          <p className="text-xl text-apple-gray-500 mb-8">
            查看我的作品集，了解更多关于我的故事
          </p>
          <button
            onClick={() => onNavigate('portfolio')}
            className="apple-button apple-button-primary group"
          >
            开始探索
            <ChevronRight className="ml-1 group-hover:translate-x-1 transition-transform" size={18} />
          </button>
        </div>
      </section>
    </div>
  );
}
