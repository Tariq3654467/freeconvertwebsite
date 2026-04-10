"use client";

import { Video, Image as ImageIcon, FileText, ChevronRight } from 'lucide-react';
import { TOOLS_DATA, ToolCategory } from '../constants/tools';

interface ToolsGridProps {}

export default function ToolsGrid({}: ToolsGridProps) {
  const getCategoryIcon = (icon: string) => {
    switch (icon) {
      case 'video': return <Video size={32} />;
      case 'image': return <ImageIcon size={32} />;
      case 'file-text': return <FileText size={32} />;
      default: return <FileText size={32} />;
    }
  };

  const handleToolClick = (tool: any) => {
    if (tool.to) {
      const event = new CustomEvent('selectTool', { detail: tool });
      window.dispatchEvent(event);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="tools-grid-section">
      <h2 className="section-title">Supported Conversions</h2>
      {Object.entries(TOOLS_DATA).map(([section, categories]) => (
        <section key={section} className="grid-section">
          <h3 className="section-subtitle">{section}</h3>
          <div className="tools-grid">
            {categories.map((category: ToolCategory) => (
              <div key={category.name} className="category-column">
                <div className="category-header">
                  <div className="category-icon">{getCategoryIcon(category.icon)}</div>
                  <h4 className="category-title">{category.name}</h4>
                </div>
                <div className="tool-cards">
                  {category.items.slice(0, 8).map(tool => (
                    <button
                      key={tool.id}
                      className="tool-card"
                      onClick={() => handleToolClick(tool)}
                    >
                      <span className="tool-name">{tool.name}</span>
                      <ChevronRight size={20} className="tool-arrow" />
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
