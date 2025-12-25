'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from '@/lib/axios';
import { Star, TrendingUp, Users, Package } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface DashboardStats {
  period: { start_date: string; end_date: string };
  visits: { total: number; doctor: number; pharmacy: number };
  sales: { total_count: number; total_revenue: number };
  cases: { open: number; in_progress: number; closed: number; total: number };
  goal: { target_visits: number; current_visits: number; visit_progress: number; target_sales: number; current_sales: number; sales_progress: number };
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [visitStats, setVisitStats] = useState<DashboardStats | null>(null);
  const [salesStats, setSalesStats] = useState<DashboardStats | null>(null);
  const [weekStar, setWeekStar] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [doctorPieData, setDoctorPieData] = useState<any[]>([]);
  const [pharmacyPieData, setPharmacyPieData] = useState<any[]>([]);
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
      const [userRes, statsRes, visitRes, salesRes, weekStarRes, chartRes, doctorPieRes, pharmacyPieRes] = await Promise.all([
        axios.get('/employees/me'),
        axios.get(`/dashboard/stats?period=${period}`),
        axios.get(`/dashboard/stats?period=week`),
        axios.get(`/dashboard/stats?period=month`),
        axios.get('/dashboard/week-star'),
        axios.get(`/dashboard/chart-data?period=${period}`),
        axios.get('/dashboard/doctor-visits-pie'),
        axios.get('/dashboard/pharmacy-visits-pie'),
      ]);

      setUser(userRes.data);
      setStats(statsRes.data);
      setVisitStats(visitRes.data);
      setSalesStats(salesRes.data);
      setWeekStar(weekStarRes.data);
      setChartData(chartRes.data);
      setDoctorPieData(doctorPieRes.data);
      setPharmacyPieData(pharmacyPieRes.data);
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
      const [statsRes, chartRes] = await Promise.all([
        axios.get(`/dashboard/stats?period=${period}`),
        axios.get(`/dashboard/chart-data?period=${period}`),
      ]);
      setStats(statsRes.data);
      setChartData(chartRes.data);
    } catch (error: any) {
      console.error('Grafik istatistikleri yüklenirken hata:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        router.push('/login');
      }
    }
  };

  // Loading state - Skeleton göster
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Haftanın Yıldızı Skeleton */}
        <div className="mb-8 bg-gradient-to-r from-emerald-700/85 to-teal-600/80 dark:from-emerald-700/42 dark:to-teal-600/34 rounded-xl p-8 shadow-2xl">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-white/20 rounded-full animate-pulse" />
            <div className="space-y-2">
              <div className="h-6 w-32 bg-white/20 rounded animate-pulse" />
              <div className="h-8 w-48 bg-white/20 rounded animate-pulse" />
              <div className="h-4 w-24 bg-white/20 rounded animate-pulse" />
            </div>
          </div>
        </div>

        {/* Grafik Skeleton */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-6 animate-pulse" />
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>

        {/* 3 Kart Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-4 animate-pulse" />
              <div className="h-10 w-20 bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse" />
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Haftanın Yıldızı */}
        {weekStar ? (
          <div className="mb-8 bg-gradient-to-r from-emerald-700/85 via-teal-700/83 via-emerald-600/81 to-teal-600/80 dark:from-emerald-700/42 dark:via-teal-700/39 dark:via-emerald-600/36 dark:to-teal-600/34 rounded-xl p-8 shadow-2xl backdrop-blur-md border border-white/20 dark:border-white/10">
            <div className="flex items-center gap-6">
              <div className="animate-spin-slow relative">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-300/30 to-amber-400/30 rounded-full blur-xl"></div>
                <Star className="w-14 h-14 text-orange-300/95 fill-orange-300/95 relative z-10 drop-shadow-lg" />
              </div>
              <div className="text-white drop-shadow-md">
                <h3 className="text-xl font-semibold mb-1">Haftanın Yıldızı</h3>
                <p className="text-3xl font-bold mb-1">{weekStar.employee_name}</p>
                <p className="text-sm opacity-95">{weekStar.sales_count} kutu satış</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-8 bg-gray-100 dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700">
            <p className="text-center text-gray-500 dark:text-gray-400">Haftanın yıldızı verisi yükleniyor...</p>
          </div>
        )}

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
          {chartData && chartData.length > 0 ? (
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
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
              Grafik verisi yükleniyor...
            </div>
          )}
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
            {visitStats ? (
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
            ) : (
              <div className="flex items-center justify-center h-32 text-gray-400 dark:text-gray-500">
                Yükleniyor...
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
            {salesStats ? (
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
            ) : (
              <div className="flex items-center justify-center h-32 text-gray-400 dark:text-gray-500">
                Yükleniyor...
              </div>
            )}
          </div>

          {/* Hedef Durumu */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-6">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Hedef Durumu</h3>
            </div>
            {stats?.goal ? (
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
            ) : (
              <div className="flex items-center justify-center h-32 text-gray-400 dark:text-gray-500">
                Yükleniyor...
              </div>
            )}
          </div>
        </div>

        {/* Pie Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Doctor Visits Pie Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Hekim Ziyaretleri (Çalışan Bazlı)</h3>
            {doctorPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={doctorPieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {doctorPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-400 dark:text-gray-500">
                Veri yok
              </div>
            )}
          </div>

          {/* Pharmacy Visits Pie Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Eczane Ziyaretleri (Çalışan Bazlı)</h3>
            {pharmacyPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pharmacyPieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pharmacyPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-400 dark:text-gray-500">
                Veri yok
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
