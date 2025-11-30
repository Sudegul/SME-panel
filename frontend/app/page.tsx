'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from '@/lib/axios';
import { Star, TrendingUp, Users, Package, Calendar, LogOut, Moon, Sun } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTheme } from '@/contexts/ThemeContext';

interface DashboardStats {
  period: { start_date: string; end_date: string };
  visits: { total: number; doctor: number; pharmacy: number };
  sales: { total_count: number; total_revenue: number };
  cases: { open: number; in_progress: number; closed: number; total: number };
  goal: { target_visits: number; current_visits: number; visit_progress: number; target_sales: number; current_sales: number; sales_progress: number };
}

export default function Dashboard() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [weekStats, setWeekStats] = useState<DashboardStats | null>(null);
  const [monthStats, setMonthStats] = useState<DashboardStats | null>(null);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchData();
  }, [period]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [userRes, statsRes, weekRes, monthRes] = await Promise.all([
        axios.get('/employees/me'),
        axios.get(`/dashboard/stats?period=${period}`),
        axios.get('/dashboard/stats?period=week'),
        axios.get('/dashboard/stats?period=month'),
      ]);

      setUser(userRes.data);
      setStats(statsRes.data);
      setWeekStats(weekRes.data);
      setMonthStats(monthRes.data);
    } catch (error) {
      console.error('Dashboard yüklenirken hata:', error);
      localStorage.removeItem('token');
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900">
        <div className="text-xl text-gray-600 dark:text-gray-300">Yükleniyor...</div>
      </div>
    );
  }

  const chartData = period === 'week'
    ? [
        { name: 'Pzt', ziyaret: 12, satis: 8 },
        { name: 'Sal', ziyaret: 15, satis: 10 },
        { name: 'Çar', ziyaret: 10, satis: 7 },
        { name: 'Per', ziyaret: 18, satis: 12 },
        { name: 'Cum', ziyaret: 14, satis: 9 },
      ]
    : period === 'month'
    ? [
        { name: 'Hafta 1', ziyaret: 45, satis: 30 },
        { name: 'Hafta 2', ziyaret: 52, satis: 35 },
        { name: 'Hafta 3', ziyaret: 48, satis: 32 },
        { name: 'Hafta 4', ziyaret: 55, satis: 40 },
      ]
    : [
        { name: 'Oca', ziyaret: 180, satis: 120 }, { name: 'Şub', ziyaret: 200, satis: 135 },
        { name: 'Mar', ziyaret: 190, satis: 128 }, { name: 'Nis', ziyaret: 210, satis: 145 },
        { name: 'May', ziyaret: 195, satis: 132 }, { name: 'Haz', ziyaret: 220, satis: 150 },
        { name: 'Tem', ziyaret: 205, satis: 140 }, { name: 'Ağu', ziyaret: 215, satis: 148 },
        { name: 'Eyl', ziyaret: 225, satis: 155 }, { name: 'Eki', ziyaret: 210, satis: 143 },
        { name: 'Kas', ziyaret: 230, satis: 160 },
      ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <img src="/images/logo.png" alt="Logo" className="h-12 w-auto" />
            <div className="flex items-center gap-4">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                title={theme === 'dark' ? 'Açık moda geç' : 'Koyu moda geç'}
              >
                {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-gray-700" />}
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-300">{user?.full_name} ({user?.role})</span>
              <button
                onClick={() => { localStorage.removeItem('token'); router.push('/login'); }}
                className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                <LogOut className="w-4 h-4" />
                Çıkış
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-6">
            <button className="py-4 px-2 border-b-2 border-blue-500 text-blue-600 dark:text-blue-400 font-medium">Dashboard</button>
            <button onClick={() => router.push('/doctors')} className="py-4 px-2 border-b-2 border-transparent text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Doktorlar</button>
            <button onClick={() => router.push('/pharmacies')} className="py-4 px-2 border-b-2 border-transparent text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Eczaneler</button>
            <button onClick={() => router.push('/cases')} className="py-4 px-2 border-b-2 border-transparent text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Vakalar</button>
            {user?.role === 'MANAGER' && (
              <button onClick={() => router.push('/reports')} className="py-4 px-2 border-b-2 border-transparent text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Raporlar</button>
            )}
            {(user?.role === 'MANAGER' || user?.role === 'ADMIN') && (
              <button onClick={() => router.push('/users')} className="py-4 px-2 border-b-2 border-transparent text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Kullanıcılar</button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Haftanın Yıldızı */}
        <div className="mb-8 bg-gradient-to-r from-yellow-400 to-orange-500 dark:from-yellow-500 dark:to-orange-600 rounded-lg p-6 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="animate-spin-slow">
              <Star className="w-12 h-12 text-white fill-white" />
            </div>
            <div className="text-white">
              <h3 className="text-lg font-semibold">Haftanın Yıldızı</h3>
              <p className="text-2xl font-bold">Ahmet Kaya</p>
              <p className="text-sm opacity-90">245 kutu satış</p>
            </div>
          </div>
        </div>

        {/* Grafik */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">İstatistikler</h2>
            <div className="flex gap-2">
              <button onClick={() => setPeriod('week')} className={`px-4 py-2 rounded-lg ${period === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>1 Hafta</button>
              <button onClick={() => setPeriod('month')} className={`px-4 py-2 rounded-lg ${period === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>1 Ay</button>
              <button onClick={() => setPeriod('year')} className={`px-4 py-2 rounded-lg ${period === 'year' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>1 Yıl</button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="ziyaret" stroke="#3B82F6" strokeWidth={2} name="Ziyaret" />
              <Line type="monotone" dataKey="satis" stroke="#10B981" strokeWidth={2} name="Satış" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 3 Bölüm */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Son 1 Hafta Ziyaretleri */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Son 1 Hafta Ziyaretleri</h3>
            </div>
            {weekStats && (
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Toplam Ziyaret</p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{weekStats.visits.total}</p>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Doktor:</span>
                  <span className="font-semibold dark:text-gray-200">{weekStats.visits.doctor}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Eczane:</span>
                  <span className="font-semibold dark:text-gray-200">{weekStats.visits.pharmacy}</span>
                </div>
              </div>
            )}
          </div>

          {/* Son 1 Ay Satışları */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Package className="w-6 h-6 text-green-600 dark:text-green-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Son 1 Ay Satışları</h3>
            </div>
            {monthStats && (
              <div className="space-y-3">
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Toplam Satış</p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">{monthStats.sales.total_count} adet</p>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Toplam Gelir</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">₺{monthStats.sales.total_revenue.toLocaleString('tr-TR')}</p>
                </div>
              </div>
            )}
          </div>

          {/* Hedef Durumu */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-6">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Hedef Durumu</h3>
            </div>
            {stats?.goal && (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-400">Ziyaret</span>
                    <span className="font-semibold dark:text-gray-200">{stats.goal.visit_progress.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-purple-600 dark:bg-purple-500 h-2 rounded-full" style={{ width: `${Math.min(stats.goal.visit_progress, 100)}%` }} />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stats.goal.current_visits} / {stats.goal.target_visits}</p>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-400">Satış</span>
                    <span className="font-semibold dark:text-gray-200">{stats.goal.sales_progress.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-green-600 dark:bg-green-500 h-2 rounded-full" style={{ width: `${Math.min(stats.goal.sales_progress, 100)}%` }} />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">₺{stats.goal.current_sales.toLocaleString()} / ₺{stats.goal.target_sales.toLocaleString()}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <style jsx global>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
    </div>
  );
}
