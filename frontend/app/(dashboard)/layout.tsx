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
  Settings,
  ClipboardList,
  Lock,
  Palmtree,
  Menu,
  X
} from 'lucide-react'
import { toast } from 'react-toastify'

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
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

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
    { label: 'Durum Raporu', path: '/status-report', icon: ClipboardList, roles: ['MANAGER', 'ADMIN'] },
    { label: 'Haftalık Program', path: '/weekly-program', icon: Calendar },
    { label: 'İzinler', path: '/leaves', icon: Palmtree },
    { label: 'Raporlar', path: '/reports', icon: BarChart3, roles: ['MANAGER', 'ADMIN'] },
    { label: 'Ayarlar', path: '/settings', icon: Settings, roles: ['MANAGER', 'ADMIN'] },
  ]

  const handleLogout = () => {
    localStorage.removeItem('token')
    router.push('/login')
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      toast.error('Yeni şifreler eşleşmiyor!')
      return
    }

    if (newPassword.length < 6) {
      toast.error('Yeni şifre en az 6 karakter olmalıdır!')
      return
    }

    setPasswordLoading(true)
    try {
      await axios.post('/employees/change-password', {
        current_password: oldPassword,
        new_password: newPassword
      })
      toast.success('Şifre başarıyla değiştirildi!')
      setShowPasswordModal(false)
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Şifre değiştirme başarısız oldu'
      toast.error(errorMessage)
    } finally {
      setPasswordLoading(false)
    }
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
      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50
        w-64 bg-white dark:bg-gray-800 shadow-lg flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Close Button */}
        <div className="absolute top-4 right-4">
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

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
              {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.role}
                </p>
              )}
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

          {/* Password Change Button - Only for EMPLOYEE and ADMIN */}
          {(user?.role === 'EMPLOYEE' || user?.role === 'ADMIN') && (
            <button
              onClick={() => setShowPasswordModal(true)}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            >
              <Lock className="w-4 h-4" />
              Şifre Değiş
            </button>
          )}

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
        {/* Header with Menu Button */}
        <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 p-4 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Menüyü Aç"
          >
            <Menu className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          </button>
          <img src="/images/logo.png" alt="Logo" className="h-12 w-auto" />
          <div className="w-10" /> {/* Spacer for centering logo */}
        </div>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900">
          {children}
        </main>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Şifre Değiştir
              </h2>
              <button
                onClick={() => {
                  setShowPasswordModal(false)
                  setOldPassword('')
                  setNewPassword('')
                  setConfirmPassword('')
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Eski Şifre
                </label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Mevcut şifrenizi girin"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Yeni Şifre
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Yeni şifrenizi girin"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Yeni Şifre (Tekrar)
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Yeni şifrenizi tekrar girin"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false)
                    setOldPassword('')
                    setNewPassword('')
                    setConfirmPassword('')
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {passwordLoading ? 'Değiştiriliyor...' : 'Değiştir'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
