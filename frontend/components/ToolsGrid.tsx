"use client";

import { Video, Image as ImageIcon, FileText, ChevronRight, Music, FileArchive } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { TOOLS_DATA, ToolCategory } from '../constants/tools';

interface ToolsGridProps {}

export default function ToolsGrid({}: ToolsGridProps) {
  const router = useRouter();

  const getCategoryIcon = (icon: string) => {
    switch (icon) {
      case 'video': return <Video size={28} />;
      case 'image': return <ImageIcon size={28} />;
      case 'file-text': return <FileText size={28} />;
      case 'music': return <Music size={28} />;
      case 'archive': return <FileArchive size={28} />;
      default: return <FileText size={28} />;
    }
  };

  const handleToolClick = (tool: any) => {
    router.push(`/convert/${tool.id}`);
  };

  return (
    <div className="tools-grid-section animate-fadeInUp">
      <h2 className="section-title animate-fadeInUp stagger-1">Explore Our Prism Engine</h2>

      {Object.entries(TOOLS_DATA).map(([section, categories]) => (
        <section key={section} className="grid-section animate-fadeInUp stagger-2">
          <h3 className="section-subtitle">{section} Tools</h3>
          <div className="tools-grid">
            {categories.map((category: ToolCategory, catIdx: number) => (
              <div key={category.name} className="category-column card-lift ripple-container" style={{ animationDelay: `${catIdx * 0.1}s` }}>
                <div className="category-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginBottom: '2rem' }}>
                  <div className="category-icon">{getCategoryIcon(category.icon)}</div>
                  <h4 className="category-title" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.5rem' }}>{category.name}</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>High-performance processing</p>
                </div>
                <div className="tool-cards">
                  {category.items.slice(0, 8).map((tool, toolIdx) => (
                    <button
                      key={tool.id}
                      className="tool-card btn-magnetic"
                      onClick={() => handleToolClick(tool)}
                      style={{ animationDelay: `${(catIdx * 0.1) + (toolIdx * 0.05)}s` }}
                    >
                      <span className="tool-name">{tool.name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary-color)', background: 'rgba(99,102,241,0.1)', padding: '0.125rem 0.375rem', borderRadius: '4px' }}>4K</span>
                        <ChevronRight size={18} className="tool-arrow" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
