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
    LogOut
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
            default: return <MoreHorizontal size={18} />;
        }
    };

    if (!isOpen) return null;

    return (
        <div className="drawer-overlay" onClick={onClose}>
            <div className="drawer-content" onClick={e => e.stopPropagation()}>
                <div className="drawer-header">
                    <div className="search-bar-container">
                        <Search size={18} color="#a0aec0" />
                        <input
                            type="text"
                            placeholder="Search"
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
                                <div className="flex items-center gap-2 mb-2">
                                    <User size={18} />
                                    <span className="text-sm font-medium">{user.username}</span>
                                </div>
                                <button
                                    className="btn-outline w-full"
                                    onClick={() => {
                                        logout();
                                        onClose();
                                    }}
                                >
                                    <LogOut size={16} className="mr-2" />
                                    Log Out
                                </button>
                            </div>
                        ) : (
                            <>
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
                                    className="btn-primary w-full"
                                    onClick={() => {
                                        router.push('/signup');
                                        onClose();
                                    }}
                                >
                                    Sign Up
                                </button>
                            </>
                        )}
                    </div>

                    <div className="drawer-sections">
                        {Object.keys(TOOLS_DATA).map(section => (
                            <div key={section} className="drawer-section">
                                <button
                                    className={`section-header ${expandedSection === section ? 'active' : ''}`}
                                    onClick={() => setExpandedSection(section as any)}
                                >
                                    {section}
                                </button>

                                {expandedSection === section && (
                                    <div className="category-list">
                                        {TOOLS_DATA[section].map(category => (
                                            <div key={category.name} className="category-item">
                                                <button
                                                    className="category-toggle"
                                                    onClick={() => toggleCategory(`${section}-${category.name}`)}
                                                >
                                                    <div className="category-icon-text">
                                                        {getIcon(category.icon)}
                                                        <span>{category.name}</span>
                                                    </div>
                                                    {expandedCategories.includes(`${section}-${category.name}`) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                                </button>

                                                {expandedCategories.includes(`${section}-${category.name}`) && (
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
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
