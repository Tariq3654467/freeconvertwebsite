"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    X,
    Search,
    ChevronDown,
    Video,
    Image as ImageIcon,
    FileText,
    MoreHorizontal,
    ChevronRight,
    User,
    LogOut,
    Music,
    FileArchive
} from 'lucide-react';
import { TOOLS_DATA, ToolCategory, ToolItem } from '../constants/tools';
import { useAuth } from '../contexts/AuthContext';

interface SideDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectTool: (tool: ToolItem) => void;
  }

export default function SideDrawer({ isOpen, onClose, onSelectTool }: SideDrawerProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedSection, setExpandedSection] = useState<'Convert' | 'Compress' | null>('Convert');
    const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

    const { user, logout } = useAuth();
    const router = useRouter();

    const toggleCategory = (catName: string) => {
        setExpandedCategories(prev =>
            prev.includes(catName) ? prev.filter(c => c !== catName) : [...prev, catName]
        );
    };

    const getIcon = (iconName: string) => {
        switch (iconName) {
            case 'video': return <Video size={18} />;
            case 'image': return <ImageIcon size={18} />;
            case 'file-text': return <FileText size={18} />;
            case 'music': return <Music size={18} />;
            case 'archive': return <FileArchive size={18} />;
            default: return <MoreHorizontal size={18} />;
        }
    };

    if (!isOpen) return null;

    return (
        <div className="drawer-overlay" onClick={onClose}>
            <div className="drawer-content" onClick={e => e.stopPropagation()}>
                <div className="drawer-header">
                    <div className="search-bar-container">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Universal search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="search-input"
                        />
                    </div>
                    <button className="close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div className="drawer-body">
                    <div className="drawer-auth">
                        {user ? (
                            <div className="user-info">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: 'var(--text-main)' }}>
                                    <div style={{ padding: '0.5rem', background: 'var(--bg-secondary)', borderRadius: '50%', border: '1px solid var(--border-glass)' }}>
                                        <User size={20} />
                                    </div>
                                    <span style={{ fontWeight: 700 }}>{user.username}</span>
                                </div>
                                <button
                                    className="btn-outline w-full"
                                    style={{ border: '1px solid #f87171', color: '#f87171', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                    onClick={() => {
                                        logout();
                                        onClose();
                                    }}
                                >
                                    <LogOut size={16} />
                                    Log Out
                                </button>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <button
                                    className="btn-outline"
                                    onClick={() => {
                                        router.push('/login');
                                        onClose();
                                    }}
                                >
                                    Log In
                                </button>
                                <button
                                    className="form-btn w-full"
                                    onClick={() => {
                                        router.push('/signup');
                                        onClose();
                                    }}
                                >
                                    Get Started
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="drawer-sections">
                        <div className="section-tabs">
                            {Object.keys(TOOLS_DATA).map(section => (
                                <button
                                    key={section}
                                    className={`section-tab ${expandedSection === section ? 'active' : ''}`}
                                    onClick={() => setExpandedSection(section as any)}
                                >
                                    {section}
                                </button>
                            ))}
                        </div>

                        {expandedSection && (
                            <div className="category-list">
                                {TOOLS_DATA[expandedSection].map(category => (
                                    <div key={category.name} className="category-item">
                                        <button
                                            className="category-toggle"
                                            onClick={() => toggleCategory(`${expandedSection}-${category.name}`)}
                                        >
                                            <div className="category-icon-text">
                                                <div style={{ color: 'var(--primary-color)', display: 'flex' }}>{getIcon(category.icon)}</div>
                                                <span>{category.name}</span>
                                            </div>
                                            {expandedCategories.includes(`${expandedSection}-${category.name}`) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                        </button>

                                        {expandedCategories.includes(`${expandedSection}-${category.name}`) && (
                                            <div className="tool-list">
                                                {category.items.map(tool => (
                                                    <button
                                                        key={tool.id}
                                                        className="tool-link"
                                                        onClick={() => {
                                                            onSelectTool(tool);
                                                            onClose();
                                                        }}
                                                    >
                                                        {tool.name}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
