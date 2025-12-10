'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from '@/lib/axios';
import { Star, TrendingUp, Users, Package, Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DashboardStats {
  period: { start_date: string; end_date: string };
  visits: { total: number; doctor: number; pharmacy: number };
  sales: { total_count: number; total_revenue: number };
  cases: { open: number; in_progress: number; closed: number; total: number };
  goal: { target_visits: number; current_visits: number; visit_progress: number; target_sales: number; current_sales: number; sales_progress: number };
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [visitStats, setVisitStats] = useState<DashboardStats | null>(null);
  const [salesStats, setSalesStats] = useState<DashboardStats | null>(null);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [visitPeriod, setVisitPeriod] = useState<'today' | 'this-week' | 'last-week' | 'this-month' | 'this-year'>('this-week');
  const [salesPeriod, setSalesPeriod] = useState<'today' | 'this-week' | 'last-week' | 'this-month' | 'this-year'>('this-month');
  const [loading, setLoading] = useState(true);
  const [visitLoading, setVisitLoading] = useState(false);
  const [salesLoading, setSalesLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (user) fetchVisitStats();
  }, [visitPeriod]);

  useEffect(() => {
    if (user) fetchSalesStats();
  }, [salesPeriod]);

  useEffect(() => {
    if (user) fetchGraphStats();
  }, [period]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [userRes, statsRes, visitRes, salesRes] = await Promise.all([
        axios.get('/employees/me'),
        axios.get(`/dashboard/stats?period=${period}`),
        axios.get(`/dashboard/stats?period=week`),
        axios.get(`/dashboard/stats?period=month`),
      ]);

      setUser(userRes.data);
      setStats(statsRes.data);
      setVisitStats(visitRes.data);
      setSalesStats(salesRes.data);
    } catch (error: any) {
      console.error('Dashboard yüklenirken hata:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchVisitStats = async () => {
    try {
      setVisitLoading(true);
      let visitPeriodParam = 'week';
      if (visitPeriod === 'today') visitPeriodParam = 'day';
      else if (visitPeriod === 'this-week') visitPeriodParam = 'week';
      else if (visitPeriod === 'last-week') visitPeriodParam = 'last-week';
      else if (visitPeriod === 'this-month') visitPeriodParam = 'month';
      else if (visitPeriod === 'this-year') visitPeriodParam = 'year';

      const res = await axios.get(`/dashboard/stats?period=${visitPeriodParam}`);
      setVisitStats(res.data);
    } catch (error: any) {
      console.error('Ziyaret istatistikleri yüklenirken hata:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        router.push('/login');
      }
    } finally {
      setVisitLoading(false);
    }
  };

  const fetchSalesStats = async () => {
    try {
      setSalesLoading(true);
      let salesPeriodParam = 'month';
      if (salesPeriod === 'today') salesPeriodParam = 'day';
      else if (salesPeriod === 'this-week') salesPeriodParam = 'week';
      else if (salesPeriod === 'last-week') salesPeriodParam = 'last-week';
      else if (salesPeriod === 'this-month') salesPeriodParam = 'month';
      else if (salesPeriod === 'this-year') salesPeriodParam = 'year';

      const res = await axios.get(`/dashboard/stats?period=${salesPeriodParam}`);
      setSalesStats(res.data);
    } catch (error: any) {
      console.error('Satış istatistikleri yüklenirken hata:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        router.push('/login');
      }
    } finally {
      setSalesLoading(false);
    }
  };

  const fetchGraphStats = async () => {
    try {
      const res = await axios.get(`/dashboard/stats?period=${period}`);
      setStats(res.data);
    } catch (error: any) {
      console.error('Grafik istatistikleri yüklenirken hata:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        router.push('/login');
      }
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Haftanın Yıldızı */}
        <div className="mb-8 bg-gradient-to-r from-emerald-700/85 via-teal-700/83 via-emerald-600/81 to-teal-600/80 dark:from-emerald-700/42 dark:via-teal-700/39 dark:via-emerald-600/36 dark:to-teal-600/34 rounded-xl p-8 shadow-2xl backdrop-blur-md border border-white/20 dark:border-white/10">
          <div className="flex items-center gap-6">
            <div className="animate-spin-slow relative">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-300/30 to-amber-400/30 rounded-full blur-xl"></div>
              <Star className="w-14 h-14 text-orange-300/95 fill-orange-300/95 relative z-10 drop-shadow-lg" />
            </div>
            <div className="text-white drop-shadow-md">
              <h3 className="text-xl font-semibold mb-1">Haftanın Yıldızı</h3>
              <p className="text-3xl font-bold mb-1">Ahmet Kaya</p>
              <p className="text-sm opacity-95">245 kutu satış</p>
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
          {/* Toplam Ziyaretler */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Toplam Ziyaretler</h3>
              </div>
              <select
                value={visitPeriod}
                onChange={(e) => setVisitPeriod(e.target.value as any)}
                className="text-sm px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
              >
                <option value="today">Bugün</option>
                <option value="this-week">Bu Hafta</option>
                <option value="last-week">Geçen Hafta</option>
                <option value="this-month">Bu Ay</option>
                <option value="this-year">Bu Yıl</option>
              </select>
            </div>
            {visitStats && (
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Toplam Ziyaret</p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{visitStats.visits.total}</p>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Hekim:</span>
                  <span className="font-semibold dark:text-gray-200">{visitStats.visits.doctor}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Eczane:</span>
                  <span className="font-semibold dark:text-gray-200">{visitStats.visits.pharmacy}</span>
                </div>
              </div>
            )}
          </div>

          {/* Toplam Satışlar */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Package className="w-6 h-6 text-green-600 dark:text-green-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Toplam Satışlar</h3>
              </div>
              <select
                value={salesPeriod}
                onChange={(e) => setSalesPeriod(e.target.value as any)}
                className="text-sm px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                disabled={salesLoading}
              >
                <option value="today">Bugün</option>
                <option value="this-week">Bu Hafta</option>
                <option value="last-week">Geçen Hafta</option>
                <option value="this-month">Bu Ay</option>
                <option value="this-year">Bu Yıl</option>
              </select>
            </div>
            {salesStats && (
              <div className="space-y-3">
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Toplam Satış</p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {salesLoading ? '...' : `${salesStats.sales.total_count} adet`}
                  </p>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Toplam Gelir</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {salesLoading ? '...' : `₺${salesStats.sales.total_revenue.toLocaleString('tr-TR')}`}
                  </p>
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
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .animate-spin-slow {
            animation: spin-slow 3s linear infinite;
          }
        `
      }} />
    </div>
  );
}
