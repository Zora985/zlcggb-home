import React, { useState, useEffect } from 'react';
import { ExternalLink, Calendar, Tag, Wrench, Laptop } from 'lucide-react';

export default function PortfolioPage() {
  const [activeTab, setActiveTab] = useState('mechanical');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const mechanicalProjects = [
    {
      title: "无人驾驶车-无人机一体化平台",
      year: "2024",
      tags: ["系统集成", "结构设计", "复杂逻辑"],
      description: "设计一套空地协同的机械结构，解决无人机在移动平台的起降与固定问题。",
      highlight: "爆炸视图（Exploded View）展示图，强调各部件的配合。",
      image: "https://images.pexels.com/photos/442150/pexels-photo-442150.jpeg"
    },
    {
      title: "新冠医疗设备设计",
      year: "2023",
      tags: ["产品设计", "医疗急需", "社会价值"],
      description: "针对特定医疗场景设计的辅助设备，注重人机工程学与实用性。",
      highlight: "解决疫情期间医疗设备短缺的实际问题",
      image: "https://images.pexels.com/photos/3825584/pexels-photo-3825584.jpeg"
    },
    {
      title: "机械设计比赛项目",
      year: "2022",
      tags: ["团队协作", "创新竞赛", "抗压能力"],
      description: "大二期间参与的省级/国家级比赛作品，奠定了工程制图与设计基础。",
      highlight: "获得省级奖项，团队协作经验",
      image: "https://images.pexels.com/photos/159275/macro-cogwheel-gear-mechanism-159275.jpeg"
    }
  ];

  const softwareProjects = [
    {
      title: "公司级系统开发",
      year: "2025.09 - 至今",
      tags: ["React", "企业级应用", "业务逻辑"],
      description: "转行后的首个大型项目。负责公司内部系统的核心模块开发，将复杂的业务流程转化为高效的前端交互。",
      tech: "React, TypeScript, Ant Design",
      highlight: "成功转行，承担核心开发责任",
      image: "https://images.pexels.com/photos/574073/pexels-photo-574073.jpeg"
    },
    {
      title: "我的第一个个人网站",
      year: "2025.02",
      tags: ["启蒙", "全栈入门", "从零开始"],
      description: "标志着从机械转行的起点。独立完成设计、前端开发及服务器部署。",
      tech: "HTML/CSS, Vanilla JS, Nginx",
      highlight: "转行的起点，独立完成全流程",
      image: "https://images.pexels.com/photos/1181298/pexels-photo-1181298.jpeg"
    }
  ];

  const ProjectCard = ({ project, type }: { project: any; type: string }) => (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 group">
      <div className="relative overflow-hidden">
        <img
          src={project.image}
          alt={project.title}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-4 left-4 flex items-center space-x-2">
          {type === 'mechanical' ? (
            <div className="bg-blue-600 text-white p-1 rounded">
              <Wrench size={16} />
            </div>
          ) : (
            <div className="bg-teal-600 text-white p-1 rounded">
              <Laptop size={16} />
            </div>
          )}
          <span className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-mono">
            {project.year}
          </span>
        </div>
      </div>
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
          {project.title}
        </h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {project.tags.map((tag: string, index: number) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full"
            >
              <Tag size={12} className="mr-1" />
              {tag}
            </span>
          ))}
        </div>
        <p className="text-gray-600 mb-4 leading-relaxed">
          {project.description}
        </p>
        {project.tech && (
          <div className="mb-4">
            <span className="text-sm font-semibold text-gray-700">技术栈：</span>
            <span className="text-sm font-mono text-blue-600">{project.tech}</span>
          </div>
        )}
        <div className="border-t pt-4">
          <p className="text-sm text-blue-600 font-medium">
            {project.highlight}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-20">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className={`text-center mb-12 transition-all duration-1000 ${
          isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'
        }`}>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            工程思维的一致性
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            不把机械和代码分开，而是强调它们都是"解决问题的方案"
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-12">
          <div className="bg-white rounded-lg p-2 shadow-lg">
            <button
              onClick={() => setActiveTab('mechanical')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === 'mechanical'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              原子世界的系统设计 (2022-2024)
            </button>
            <button
              onClick={() => setActiveTab('software')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === 'software'
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-teal-600'
              }`}
            >
              比特世界的逻辑构建 (2025)
            </button>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {(activeTab === 'mechanical' ? mechanicalProjects : softwareProjects).map((project, index) => (
            <div
              key={index}
              className={`transition-all duration-500 delay-${index * 100} ${
                isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'
              }`}
            >
              <ProjectCard project={project} type={activeTab} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}