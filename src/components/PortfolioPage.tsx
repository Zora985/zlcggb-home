import React, { useState, useEffect } from 'react';
import { ExternalLink, Wrench, Code, Award, Microscope, Car } from 'lucide-react';

export default function PortfolioPage() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'mechanical' | 'software'>('all');
  const [selectedProject, setSelectedProject] = useState<any>(null);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const mechanicalProjects = [
    {
      title: "机创大赛 - 仿生机械蝎子",
      subtitle: "第十届全国大学生机械创新设计大赛",
      year: "2022.01 - 2022.08",
      tags: ["仿生设计", "误差分析", "整机制造", "发明专利"],
      description: "参与全国大学生机械创新设计大赛，设计并制造仿生机械蝎子。负责误差分析以及设计与控制，完成整机制造。项目获得全国二等奖，并获得发明专利证书。",
      highlights: [
        "全国二等奖",
        "发明专利证书",
        "负责误差分析与控制设计",
        "完成整机制造"
      ],
      image: "https://file.unilumin-gtm.com/719dd328-3fee-4364-80a7-fb7a2a4e2881/1765715886689-蝎子.png",
      type: "mechanical",
      icon: <Award className="text-amber-500" size={16} />
    },
    {
      title: "污水中新冠病毒高效检测技术开发及应用示范",
      subtitle: "深圳科技专项",
      year: "2022.10 - 2023.04",
      tags: ["医疗设备", "自动化检测", "液体采集", "PCR"],
      description: "参与深圳科技专项项目，设计采集提取检测一体化设备。系统包含微泵移液分装、液体采集、PCR检测、磁珠试剂盒、试剂存放、移液装置、磁珠提取仪等模块，实现污水中新冠病毒的高效自动化检测。",
      highlights: [
        "深圳科技专项项目",
        "采集提取检测一体化设计",
        "自动化检测流程",
        "多模块系统集成"
      ],
      image: "https://file.unilumin-gtm.com/719dd328-3fee-4364-80a7-fb7a2a4e2881/1765715886689-医疗.png",
      type: "mechanical",
      icon: <Microscope className="text-blue-500" size={16} />
    },
    {
      title: "无人车-无人机一体化系统",
      subtitle: "优秀毕业设计",
      year: "2024.04",
      tags: ["系统集成", "感知融合", "避障规划", "定位降落"],
      description: "毕业设计项目，设计车机一体化系统。创新点包括：感知融合（三维语义点云预测）、避障规划（应用网络与B样条规划）、定位降落（特征识别与磁力辅助）。实现无人车与无人机的协同作业。",
      highlights: [
        "优秀毕业设计",
        "三维语义点云预测",
        "B样条避障规划",
        "磁力辅助定位降落"
      ],
      image: "https://file.unilumin-gtm.com/719dd328-3fee-4364-80a7-fb7a2a4e2881/1765715886688-车.png",
      type: "mechanical",
      icon: <Car className="text-indigo-500" size={16} />
    }
  ];

  const softwareProjects = [
    {
      title: "Unilumin 官网会员中心",
      subtitle: "企业级会员服务平台",
      year: "2025.02",
      tags: ["React", "Supabase", "AI问答", "全球展厅"],
      description: "负责开发 Unilumin 官网会员中心，为用户提供产品选择、全球展厅预约、AI智能问答、课程教学等一站式服务平台。实现会员全生命周期管理与智能化服务体验。",
      highlights: [
        "产品智能选择",
        "全球展厅预约",
        "AI智能问答",
        "课程教学系统"
      ],
      tech: "React + Supabase",
      image: "https://file.unilumin-gtm.com/719dd328-3fee-4364-80a7-fb7a2a4e2881/1765716162171-vip.png",
      link: "https://vip.unilumin.com/",
      type: "software",
      icon: <Code className="text-blue-500" size={16} />
    },
    {
      title: "Unilumin Smart 智能工具平台",
      subtitle: "LED工程智能配置系统",
      year: "2025.06",
      tags: ["Python", "Flask", "FastAPI", "智能配置"],
      description: "上线智能工具平台，实现LED屏幕的智能配置、走线图自动生成、一键报价等功能。让客户可以快速配置具体屏幕参数，实现工程应用的高效落地。",
      highlights: [
        "LED智能配置",
        "走线图自动生成",
        "一键报价系统",
        "工程应用落地"
      ],
      tech: "Python + Flask + FastAPI",
      image: "https://file.unilumin-gtm.com/719dd328-3fee-4364-80a7-fb7a2a4e2881/1765716162170-smart.png",
      link: "https://unilumin-gtm.com/",
      type: "software",
      icon: <Code className="text-green-500" size={16} />
    }
  ];

  const allProjects = [...mechanicalProjects, ...softwareProjects];
  
  const filteredProjects = activeTab === 'all' 
    ? allProjects 
    : activeTab === 'mechanical' 
      ? mechanicalProjects 
      : softwareProjects;

  return (
    <div className="min-h-screen bg-apple-gray-100 py-24">
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Header */}
        <div className={`text-center mb-16 transition-all duration-1000 ease-apple ${
          isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'
        }`}>
          <p className="text-apple-gray-500 text-sm font-medium tracking-wide mb-4">
            作品集
          </p>
          <h1 className="text-5xl md:text-6xl font-semibold text-apple-gray-600 tracking-tight mb-4">
            工程思维的一致性
          </h1>
          <p className="text-xl text-apple-gray-500 max-w-2xl mx-auto">
            无论实体还是虚拟，核心都是解决问题的系统设计
          </p>
        </div>

        {/* Filter Tabs */}
        <div className={`flex justify-center mb-12 transition-all duration-1000 delay-100 ease-apple ${
          isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'
        }`}>
          <div className="inline-flex bg-apple-gray-200/60 rounded-full p-1">
            {[
              { id: 'all', label: '全部', count: allProjects.length },
              { id: 'mechanical', label: '机械设计', count: mechanicalProjects.length, icon: <Wrench size={14} /> },
              { id: 'software', label: '软件开发', count: softwareProjects.length, icon: <Code size={14} /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-white text-apple-gray-600 shadow-sm'
                    : 'text-apple-gray-500 hover:text-apple-gray-600'
                }`}
              >
                {tab.icon}
                {tab.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.id ? 'bg-apple-blue/10 text-apple-blue' : 'bg-apple-gray-300/50'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Projects Grid */}
        <div className={`grid md:grid-cols-2 lg:grid-cols-3 gap-8 transition-all duration-1000 delay-200 ease-apple ${
          isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'
        }`}>
          {filteredProjects.map((project, index) => (
            <div
              key={index}
              className="apple-card overflow-hidden group cursor-pointer"
              onClick={() => setSelectedProject(project)}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Image */}
              <div className="relative aspect-[16/10] overflow-hidden bg-apple-gray-200">
                <img
                  src={project.image}
                  alt={project.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-apple"
                />
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                
                {/* Type Badge */}
                <div className="absolute top-4 left-4">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium glass ${
                    project.type === 'mechanical' 
                      ? 'text-apple-gray-600' 
                      : 'text-apple-blue'
                  }`}>
                    {project.icon}
                    {project.type === 'mechanical' ? '机械' : '软件'}
                  </span>
                </div>

                {/* Year Badge */}
                <div className="absolute top-4 right-4">
                  <span className="px-3 py-1.5 rounded-full text-xs font-mono glass text-apple-gray-600">
                    {project.year.split(' ')[0]}
                  </span>
                </div>

                {/* Title on Image */}
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-white/80 text-xs mb-1">{project.subtitle}</p>
                  <h3 className="text-white text-lg font-semibold leading-tight">
                    {project.title}
                  </h3>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <p className="text-apple-gray-500 text-sm leading-relaxed mb-4 line-clamp-2">
                  {project.description}
                </p>
                
                {/* Highlights */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {project.highlights.slice(0, 2).map((highlight: string, hIndex: number) => (
                    <span
                      key={hIndex}
                      className="text-xs text-apple-blue bg-apple-blue/10 px-2.5 py-1 rounded-full"
                    >
                      {highlight}
                    </span>
                  ))}
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {project.tags.slice(0, 3).map((tag: string, tagIndex: number) => (
                    <span
                      key={tagIndex}
                      className="text-xs text-apple-gray-400 bg-apple-gray-100 px-2 py-0.5 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Project Detail Modal */}
        {selectedProject && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedProject(null)}
          >
            <div 
              className="bg-white rounded-apple-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-apple-xl animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Image */}
              <div className="relative aspect-video bg-apple-gray-200">
                <img
                  src={selectedProject.image}
                  alt={selectedProject.title}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => setSelectedProject(null)}
                  className="absolute top-4 right-4 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-8">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                    selectedProject.type === 'mechanical' 
                      ? 'bg-apple-gray-100 text-apple-gray-600' 
                      : 'bg-apple-blue/10 text-apple-blue'
                  }`}>
                    {selectedProject.icon}
                    {selectedProject.type === 'mechanical' ? '机械设计' : '软件开发'}
                  </span>
                  <span className="text-sm font-mono text-apple-gray-400">
                    {selectedProject.year}
                  </span>
                </div>

                <p className="text-apple-gray-500 text-sm mb-1">{selectedProject.subtitle}</p>
                <h2 className="text-2xl font-semibold text-apple-gray-600 mb-4">
                  {selectedProject.title}
                </h2>

                <p className="text-apple-gray-500 leading-relaxed mb-6">
                  {selectedProject.description}
                </p>

                {/* Highlights */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-apple-gray-600 mb-3">项目亮点</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedProject.highlights.map((highlight: string, index: number) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-apple-gray-500">
                        <div className="w-1.5 h-1.5 bg-apple-blue rounded-full" />
                        {highlight}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {selectedProject.tags.map((tag: string, index: number) => (
                    <span
                      key={index}
                      className="text-sm text-apple-gray-500 bg-apple-gray-100 px-3 py-1.5 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Link Button */}
                {selectedProject.link && (
                  <a
                    href={selectedProject.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 apple-button apple-button-primary"
                  >
                    <ExternalLink size={16} />
                    访问网站
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
