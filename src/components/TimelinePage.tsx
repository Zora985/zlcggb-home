import { useState, useEffect } from 'react';
import { Code, Rocket, Monitor, Award, Microscope, Car } from 'lucide-react';

export default function TimelinePage() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const timelineEvents = [
    {
      year: "2022.01 - 08",
      title: "机创大赛 - 仿生机械蝎子",
      icon: <Award className="text-white" size={20} />,
      description: "参加第十届全国大学生机械创新设计大赛，设计仿生机械蝎子。负责误差分析与控制设计，完成整机制造，获全国二等奖及发明专利。",
      color: "bg-amber-500",
      highlight: "全国二等奖"
    },
    {
      year: "2022.10 - 2023.04",
      title: "深圳科技专项 - 新冠检测设备",
      icon: <Microscope className="text-white" size={20} />,
      description: "参与深圳科技专项项目，设计污水中新冠病毒高效检测设备。实现采集、提取、检测一体化自动化流程。",
      color: "bg-blue-500",
      highlight: "科技专项"
    },
    {
      year: "2024.04",
      title: "优秀毕设 - 无人车机一体化系统",
      icon: <Car className="text-white" size={20} />,
      description: "毕业设计项目，设计车机一体化系统。创新点包括三维语义点云预测、B样条避障规划、磁力辅助定位降落。",
      color: "bg-indigo-500",
      highlight: "优秀毕设"
    },
    {
      year: "2024 下半年",
      title: "开始自学编程",
      icon: <Monitor className="text-white" size={20} />,
      description: "从机械专业转向自学编程，发现代码世界与机械设计的思维共通之处。系统学习 HTML/CSS/JavaScript/React。",
      color: "bg-gradient-to-r from-indigo-500 to-apple-blue",
      highlight: "转型起点"
    },
    {
      year: "2025.02",
      title: "Unilumin 官网会员中心上线",
      icon: <Code className="text-white" size={20} />,
      description: "负责开发企业级会员服务平台，实现产品选择、全球展厅预约、AI智能问答、课程教学等功能。",
      color: "bg-apple-blue",
      highlight: "首个商业项目"
    },
    {
      year: "2025.06",
      title: "Unilumin Smart 智能工具平台",
      icon: <Rocket className="text-white" size={20} />,
      description: "上线LED智能配置系统，实现走线图自动生成、一键报价等功能，让工程应用高效落地。",
      color: "bg-gradient-to-r from-apple-blue to-purple-500",
      highlight: "持续进化"
    }
  ];

  return (
    <div className="min-h-screen bg-apple-gray-100 py-24">
      <div className="max-w-[980px] mx-auto px-6">
        {/* Header */}
        <div className={`text-center mb-20 transition-all duration-1000 ease-apple ${
          isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'
        }`}>
          <p className="text-apple-gray-500 text-sm font-medium tracking-wide mb-4">
            进化之路
          </p>
          <h1 className="text-5xl md:text-6xl font-semibold text-apple-gray-600 tracking-tight mb-4">
            个人成长故事
          </h1>
          <p className="text-xl text-apple-gray-500 max-w-2xl mx-auto">
            从机械设计到自学编程，再到成为全栈工程师的路径
          </p>
        </div>

        {/* Desktop Timeline */}
        <div className={`hidden md:block relative transition-all duration-1000 delay-200 ease-apple ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}>
          {/* Center Line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-amber-400 via-apple-blue to-purple-500 transform -translate-x-1/2" />

          {/* Timeline Items */}
          <div className="space-y-20">
            {timelineEvents.map((event, index) => (
              <div
                key={index}
                className={`relative flex items-center ${
                  index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'
                }`}
                style={{ animationDelay: `${index * 150}ms` }}
              >
                {/* Content Card */}
                <div className={`w-5/12 ${index % 2 === 0 ? 'pr-16 text-right' : 'pl-16 text-left'}`}>
                  <div className="apple-card p-6 hover:shadow-apple-lg transition-all duration-500 group">
                    {/* Highlight Badge */}
                    <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full mb-3 ${
                      index < 3 
                        ? 'bg-amber-100 text-amber-700' 
                        : 'bg-apple-blue/10 text-apple-blue'
                    }`}>
                      {event.highlight}
                    </span>
                    
                    <span className="text-sm font-mono text-apple-gray-400 block mb-2">
                      {event.year}
                    </span>
                    <h3 className="text-xl font-semibold text-apple-gray-600 mb-3 group-hover:text-apple-blue transition-colors">
                      {event.title}
                    </h3>
                    <p className="text-apple-gray-500 leading-relaxed text-sm">
                      {event.description}
                    </p>
                  </div>
                </div>

                {/* Center Icon */}
                <div className="absolute left-1/2 transform -translate-x-1/2 z-10">
                  <div className={`w-14 h-14 ${event.color} rounded-full flex items-center justify-center shadow-lg ring-4 ring-apple-gray-100 hover:scale-110 transition-transform duration-300`}>
                    {event.icon}
                  </div>
                </div>

                {/* Empty Space */}
                <div className="w-5/12" />
              </div>
            ))}
          </div>

          {/* End Marker */}
          <div className="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-12">
            <div className="w-4 h-4 bg-purple-500 rounded-full ring-4 ring-apple-gray-100 animate-pulse" />
          </div>
        </div>

        {/* Mobile Timeline */}
        <div className="md:hidden">
          <div className="relative pl-8">
            {/* Left Line */}
            <div className="absolute left-3 top-0 bottom-0 w-px bg-gradient-to-b from-amber-400 via-apple-blue to-purple-500" />

            {/* Timeline Items */}
            <div className="space-y-8">
              {timelineEvents.map((event, index) => (
                <div
                  key={index}
                  className={`relative transition-all duration-500 ease-apple ${
                    isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'
                  }`}
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  {/* Icon */}
                  <div className="absolute -left-5 top-0">
                    <div className={`w-10 h-10 ${event.color} rounded-full flex items-center justify-center shadow-lg ring-4 ring-apple-gray-100`}>
                      {event.icon}
                    </div>
                  </div>

                  {/* Content Card */}
                  <div className="apple-card p-5 ml-4">
                    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mb-2 ${
                      index < 3 
                        ? 'bg-amber-100 text-amber-700' 
                        : 'bg-apple-blue/10 text-apple-blue'
                    }`}>
                      {event.highlight}
                    </span>
                    <span className="text-sm font-mono text-apple-gray-400 block mb-1">
                      {event.year}
                    </span>
                    <h3 className="text-lg font-semibold text-apple-gray-600 mb-2">
                      {event.title}
                    </h3>
                    <p className="text-apple-gray-500 text-sm leading-relaxed">
                      {event.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Summary Card */}
        <div className={`mt-24 transition-all duration-1000 delay-500 ease-apple ${
          isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'
        }`}>
          <div className="apple-card p-8 md:p-12 text-center bg-gradient-to-br from-white to-apple-gray-50">
            <h3 className="text-2xl md:text-3xl font-semibold text-apple-gray-600 mb-4">
              工程思维，永不改变
            </h3>
            <p className="text-apple-gray-500 max-w-2xl mx-auto leading-relaxed">
              从仿生机械蝎子到无人车机一体化系统，再到企业级 Web 应用——
              变的是工具和载体，不变的是解决复杂问题的系统思维。
              每一行代码，都像设计一个精密的齿轮，需要严谨、需要创新、需要对细节的极致追求。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
