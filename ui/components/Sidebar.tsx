// components/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Upload, 
  FileText, 
  Database, 
  Settings,
  BookOpen,
  FolderOpen,
  CheckCircle,
  Cog
} from 'lucide-react';
import clsx from 'clsx';

const menuItems = [
  { 
    name: 'Dashboard', 
    href: '/', 
    icon: LayoutDashboard 
  },
  { 
    name: 'Dokumen', 
    href: '/documents', 
    icon: FolderOpen 
  },
  { 
    name: 'Chunks', 
    href: '/chunks', 
    icon: FileText 
  },
  // { 
  //   name: 'Staging / Review', 
  //   href: '/staging', 
  //   icon: FileText 
  // },
  { 
    name: 'Knowledge Base', 
    href: '/vectorstore', 
    icon: Database 
  },
  // { 
  //   name: 'Processing', 
  //   href: '/processing', 
  //   icon: Cog 
  // },
];

export default function Sidebar() {
  const pathname = usePathname();
  
  return (
    <aside className="w-64 bg-green-800 text-white min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-green-700">
        <div className="flex items-center space-x-3">
          <BookOpen className="h-8 w-8 text-yellow-400" />
          <div>
            <h1 className="font-bold text-lg">Knowledge Base</h1>
            <p className="text-xs text-green-300">YPI Al-Azhar</p>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={clsx(
                    'flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors',
                    isActive
                      ? 'bg-green-700 text-white'
                      : 'text-green-200 hover:bg-green-700/50 hover:text-white'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      {/* Footer */}
      <div className="p-4 border-t border-green-700">
        <div className="text-xs text-green-400 text-center">
          v1.0.0 • RAG Chatbot System
        </div>
      </div>
    </aside>
  );
}
