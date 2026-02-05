// ============================================
// COMPONENTE: SIDEBAR DE NAVEGAÇÃO
// ============================================

import React, { useState } from 'react';
import {
    LayoutDashboard, BarChart2, ShoppingCart, Users, Database,
    Package, Truck, Gift, History, User as UserIcon, Settings,
    ChevronLeft, ChevronRight, LogOut, Sun, Moon, Building2
} from 'lucide-react';

interface SidebarProps {
    currentView: string;
    onNavigate: (view: string) => void;
    visibleTabs: Array<{ id: string; label: string; icon: any }>;
    companyName: string;
    currentUser: { name: string; role: string } | null;
    theme: 'light' | 'dark';
    onToggleTheme: () => void;
    onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
    currentView,
    onNavigate,
    visibleTabs,
    companyName,
    currentUser,
    theme,
    onToggleTheme,
    onLogout
}) => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Group tabs
    const mainTabs = visibleTabs.filter(t =>
        ['dashboard', 'sales_stats', 'sales', 'customers', 'list'].includes(t.id)
    );
    const adminTabs = visibleTabs.filter(t =>
        ['purchases', 'suppliers', 'promotions', 'history', 'users', 'tenants', 'settings'].includes(t.id)
    );

    return (
        <aside
            className={`
        ${isCollapsed ? 'w-16' : 'w-64'} 
        bg-gray-900 dark:bg-gray-950 
        h-screen flex flex-col 
        transition-all duration-300 ease-in-out
        border-r border-gray-800
      `}
        >
            {/* Logo / Company Name */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-gray-800">
                {!isCollapsed && (
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <Package className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-white text-sm truncate">
                            {companyName}
                        </span>
                    </div>
                )}
                {isCollapsed && (
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mx-auto">
                        <Package className="w-5 h-5 text-white" />
                    </div>
                )}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="p-1.5 rounded-md hover:bg-gray-800 text-gray-400 hover:text-white transition-colors hidden lg:block"
                >
                    {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 overflow-y-auto">
                {/* Main Navigation */}
                <div className="px-3 mb-2">
                    {!isCollapsed && (
                        <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider px-3">
                            Principal
                        </span>
                    )}
                </div>
                <ul className="space-y-1 px-3">
                    {mainTabs.map((tab) => (
                        <li key={tab.id}>
                            <button
                                onClick={() => onNavigate(tab.id)}
                                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                  transition-all duration-200 group
                  ${currentView === tab.id
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                    }
                `}
                                title={isCollapsed ? tab.label : undefined}
                            >
                                <tab.icon className={`w-5 h-5 flex-shrink-0 ${currentView === tab.id ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
                                {!isCollapsed && (
                                    <span className="text-sm font-medium truncate">{tab.label}</span>
                                )}
                            </button>
                        </li>
                    ))}
                </ul>

                {/* Admin Navigation */}
                {adminTabs.length > 0 && (
                    <>
                        <div className="px-3 mt-6 mb-2">
                            {!isCollapsed && (
                                <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider px-3">
                                    Administração
                                </span>
                            )}
                            {isCollapsed && (
                                <div className="border-t border-gray-800 mx-3 my-2"></div>
                            )}
                        </div>
                        <ul className="space-y-1 px-3">
                            {adminTabs.map((tab) => (
                                <li key={tab.id}>
                                    <button
                                        onClick={() => onNavigate(tab.id)}
                                        className={`
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                      transition-all duration-200 group
                      ${currentView === tab.id
                                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                                                : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                            }
                    `}
                                        title={isCollapsed ? tab.label : undefined}
                                    >
                                        <tab.icon className={`w-5 h-5 flex-shrink-0 ${currentView === tab.id ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
                                        {!isCollapsed && (
                                            <span className="text-sm font-medium truncate">{tab.label}</span>
                                        )}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </>
                )}
            </nav>

            {/* Footer: User & Theme */}
            <div className="border-t border-gray-800 p-3 space-y-2">
                {/* Theme Toggle */}
                <button
                    onClick={onToggleTheme}
                    className={`
            w-full flex items-center gap-3 px-3 py-2 rounded-lg
            text-gray-400 hover:text-white hover:bg-gray-800
            transition-all duration-200
          `}
                    title={isCollapsed ? 'Alternar tema' : undefined}
                >
                    {theme === 'light' ? (
                        <Moon className="w-5 h-5 flex-shrink-0" />
                    ) : (
                        <Sun className="w-5 h-5 flex-shrink-0" />
                    )}
                    {!isCollapsed && (
                        <span className="text-sm font-medium">
                            {theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}
                        </span>
                    )}
                </button>

                {/* User Info */}
                {currentUser && (
                    <div className={`
            flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-800/50
            ${isCollapsed ? 'justify-center' : ''}
          `}>
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <UserIcon className="w-4 h-4 text-white" />
                        </div>
                        {!isCollapsed && (
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{currentUser.name}</p>
                                <p className="text-xs text-gray-500">{currentUser.role}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Logout */}
                <button
                    onClick={onLogout}
                    className={`
            w-full flex items-center gap-3 px-3 py-2 rounded-lg
            text-red-400 hover:text-red-300 hover:bg-red-900/20
            transition-all duration-200
          `}
                    title={isCollapsed ? 'Sair' : undefined}
                >
                    <LogOut className="w-5 h-5 flex-shrink-0" />
                    {!isCollapsed && (
                        <span className="text-sm font-medium">Sair</span>
                    )}
                </button>
            </div>
        </aside>
    );
};
