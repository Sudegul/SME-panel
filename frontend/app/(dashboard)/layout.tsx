'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useTheme } from '@/contexts/ThemeContext'
import axios from '@/lib/axios'
import {
  LogOut,
  Moon,
  Sun,
  LayoutDashboard,
  Building,
  FileText,
  Calendar,
  BarChart3,
  Users,
  ClipboardList
} from 'lucide-react'

interface MenuItem {
  label: string
  path: string
  icon: any
  roles?: string[]
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { theme, toggleTheme } = useTheme()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    const fetchUser = async () => {
      try {
        const res = await axios.get('/employees/me')
        setUser(res.data)
      } catch (error) {
        localStorage.removeItem('token')
        router.push('/login')
      }
    }

    fetchUser()
  }, [router])

  const menuItems: MenuItem[] = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Eczaneler', path: '/pharmacies', icon: Building },
    { label: 'Günlük Rapor', path: '/daily-report', icon: FileText },
    { label: 'Haftalık Program', path: '/weekly-program', icon: Calendar },
    { label: 'Raporlar', path: '/reports', icon: BarChart3, roles: ['MANAGER', 'ADMIN'] },
    { label: 'Durum Raporu', path: '/status-report', icon: ClipboardList, roles: ['MANAGER', 'ADMIN'] },
    { label: 'Kullanıcılar', path: '/users', icon: Users, roles: ['MANAGER', 'ADMIN'] },
  ]

  const handleLogout = () => {
    localStorage.removeItem('token')
    router.push('/login')
  }

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(path)
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600 dark:text-gray-300">Yükleniyor...</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-800 shadow-lg flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b dark:border-gray-700">
          <img src="/images/logo.png" alt="Logo" className="h-32 w-auto" />
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              if (item.roles && !item.roles.includes(user?.role)) {
                return null
              }

              const Icon = item.icon
              const active = isActive(item.path)

              return (
                <li key={item.path}>
                  <button
                    onClick={() => router.push(item.path)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      active
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t dark:border-gray-700 space-y-2">
          <div className="flex items-center justify-between px-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user?.full_name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {user?.role}
              </p>
            </div>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 ml-2"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-yellow-500" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Çıkış Yap
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900">
          {children}
        </main>
      </div>
    </div>
  )
}
