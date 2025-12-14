import React, { useState, useEffect } from 'react';
import { Settings, Heart, Plane, Code, Rocket } from 'lucide-react';

export default function TimelinePage() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const timelineEvents = [
    {
      year: "2022",
      title: "机械启蒙",
      icon: <Settings className="text-blue-600" size={24} />,
      description: "参加机械设计比赛。学会了如何将脑中的想法落实到图纸上，理解了"公差"与"标准"的重要性。",
      color: "blue"
    },
    {
      year: "2023",
      title: "责任与设计",
      icon: <Heart className="text-red-500" size={24} />,
      description: "新冠医疗设备设计。意识到工程设计必须服务于人的真实痛点（User-Centered Design 的萌芽）。",
      color: "red"
    },
    {
      year: "2024",
      title: "复杂度的挑战",
      icon: <Plane className="text-purple-600" size={24} />,
      description: "无人驾驶-无人机平台设计。在处理复杂的机电配合时，开始接触控制逻辑，意识到软件迭代的高效性。",
      color: "purple"
    },
    {
      year: "2025.02",
      title: "Hello World (转折点)",
      icon: <Code className="text-green-600" size={24} />,
      description: "开发自己的第一个网站。发现代码构建世界的速度远超机械加工，决定投身软件开发。自学 HTML/CSS/JS。",
      color: "green"
    },
    {
      year: "2025.09",
      title: "职业开发者",
      icon: <Rocket className="text-orange-500" size={24} />,
      description: "成功转行公司系统开发。正式入职，将机械设计的"模块化思维"无缝迁移至 React 组件开发中。",
      color: "orange"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-20">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className={`text-center mb-16 transition-all duration-1000 ${
          isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'
        }`}>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            破茧成蝶
          </h1>
          <p className="text-2xl font-mono text-blue-600 mb-8">
            "系统是不变的，改变的只是工具。"
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Center Line */}
          <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-blue-300 to-orange-300 rounded-full"></div>

          {timelineEvents.map((event, index) => (
            <div
              key={index}
              className={`relative flex items-center mb-16 transition-all duration-1000 delay-${index * 200} ${
                isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'
              } ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}
            >
              {/* Content Card */}
              <div className={`w-5/12 ${index % 2 === 0 ? 'pr-8' : 'pl-8'}`}>
                <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                  <div className="flex items-center mb-4">
                    <div className={`p-2 rounded-full bg-${event.color}-100 mr-3`}>
                      {event.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{event.title}</h3>
                      <span className="text-sm font-mono text-gray-500">{event.year}</span>
                    </div>
                  </div>
                  <p className="text-gray-600 leading-relaxed">{event.description}</p>
                </div>
              </div>

              {/* Center Circle */}
              <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white border-4 border-blue-600 rounded-full shadow-lg z-10"></div>

              {/* Empty space for opposite side */}
              <div className="w-5/12"></div>
            </div>
          ))}

          {/* Mobile Timeline */}
          <div className="md:hidden">
            {timelineEvents.map((event, index) => (
              <div
                key={`mobile-${index}`}
                className={`relative flex items-start mb-8 pl-16 transition-all duration-1000 delay-${index * 200} ${
                  isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'
                }`}
              >
                {/* Mobile Timeline Line */}
                <div className="absolute left-6 w-1 h-full bg-gradient-to-b from-blue-300 to-orange-300 rounded-full"></div>
                
                {/* Mobile Circle */}
                <div className="absolute left-4 w-4 h-4 bg-white border-4 border-blue-600 rounded-full shadow-lg"></div>

                {/* Mobile Content */}
                <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow w-full">
                  <div className="flex items-center mb-4">
                    <div className={`p-2 rounded-full bg-${event.color}-100 mr-3`}>
                      {event.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{event.title}</h3>
                      <span className="text-sm font-mono text-gray-500">{event.year}</span>
                    </div>
                  </div>
                  <p className="text-gray-600 leading-relaxed">{event.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}