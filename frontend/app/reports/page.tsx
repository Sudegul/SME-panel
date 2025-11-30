'use client';

import { useEffect, useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'next/navigation';
import axios from '@/lib/axios';
import { LogOut, Download, Calendar, Filter, FileSpreadsheet, Moon, Sun } from 'lucide-react';

export default function ReportsPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const userRes = await axios.get('/employees/me');
      setUser(userRes.data);

      if (userRes.data.role !== 'MANAGER') {
        alert('Bu sayfaya erişim yetkiniz yok!');
        router.push('/');
        return;
      }

      // Mock employees
      setEmployees([
        { id: 1, full_name: 'Ahmet Kaya' },
        { id: 2, full_name: 'Ayşe Demir' },
        { id: 3, full_name: 'Mehmet Öz' },
      ]);
    } catch (error) {
      console.error('Error:', error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const employeeParam = selectedEmployee === 'all' ? 'all' : selectedEmployee;
      const response = await axios.get(`/reports/export?period=${period}&employee=${employeeParam}`, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `rapor_${period}_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      // Clean up
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert('Rapor indirilirken hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600 dark:text-gray-300 dark:text-gray-300">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <img src="/images/logo.png" alt="Logo" className="h-12 w-auto" />
            <div className="flex items-center gap-4">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                title={theme === 'dark' ? 'Açık moda geç' : 'Koyu moda geç'}
              >
                {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-gray-700 dark:text-gray-200 dark:text-gray-200" />}
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-300 dark:text-gray-300">{user?.full_name} ({user?.role})</span>
              <button
                onClick={() => { localStorage.removeItem('token'); router.push('/login'); }}
                className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 hover:text-red-700"
              >
                <LogOut className="w-4 h-4" />
                Çıkış
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-6">
            <button onClick={() => router.push('/')} className="py-4 px-2 border-b-2 border-transparent text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Dashboard</button>
            <button onClick={() => router.push('/doctors')} className="py-4 px-2 border-b-2 border-transparent text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Doktorlar</button>
            <button onClick={() => router.push('/pharmacies')} className="py-4 px-2 border-b-2 border-transparent text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Eczaneler</button>
            <button onClick={() => router.push('/cases')} className="py-4 px-2 border-b-2 border-transparent text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Vakalar</button>
            <button className="py-4 px-2 border-b-2 border-blue-500 text-blue-600 dark:text-blue-400 font-medium">Raporlar</button>
            {(user?.role === 'MANAGER' || user?.role === 'ADMIN') && (
              <button onClick={() => router.push('/users')} className="py-4 px-2 border-b-2 border-transparent text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Kullanıcılar</button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="flex items-center gap-3 mb-8">
            <FileSpreadsheet className="w-8 h-8 text-green-600" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white dark:text-white">Rapor Oluştur ve İndir</h2>
          </div>

          {/* Filters */}
          <div className="space-y-6 mb-8">
            {/* Period Selection */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
                <Calendar className="w-5 h-5" />
                Rapor Dönemi
              </label>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <button
                  onClick={() => setPeriod('day')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    period === 'day'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-lg font-semibold">Günlük</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300 dark:text-gray-300">Bugünün verileri</div>
                  </div>
                </button>
                <button
                  onClick={() => setPeriod('week')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    period === 'week'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-lg font-semibold">Haftalık</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300 dark:text-gray-300">Son 7 gün</div>
                  </div>
                </button>
                <button
                  onClick={() => setPeriod('month')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    period === 'month'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-lg font-semibold">Aylık</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300 dark:text-gray-300">Son 30 gün</div>
                  </div>
                </button>
                <button
                  onClick={() => setPeriod('year')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    period === 'year'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-lg font-semibold">Yıllık</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300 dark:text-gray-300">Son 365 gün</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Employee Selection */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
                <Filter className="w-5 h-5" />
                Çalışan Filtresi
              </label>
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
              >
                <option value="all">Tüm Çalışanlar</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.full_name}>{emp.full_name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-6 mb-8 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Rapor Özeti</h3>
            <div className="text-blue-700 dark:text-blue-400 space-y-1">
              <p><span className="font-medium">Dönem:</span> {
                period === 'day' ? 'Günlük' :
                period === 'week' ? 'Haftalık' :
                period === 'month' ? 'Aylık' : 'Yıllık'
              }</p>
              <p><span className="font-medium">Çalışan:</span> {selectedEmployee === 'all' ? 'Tüm Çalışanlar' : selectedEmployee}</p>
              <p className="text-sm mt-3 text-blue-600">
                Raporda şunlar yer alacak: Ziyaret sayıları, satış rakamları, anlaşma durumları, hediye kutu sayıları, vaka detayları
              </p>
            </div>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExport}
            className="w-full py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-3 text-lg font-semibold"
          >
            <Download className="w-6 h-6" />
            Excel Olarak İndir
          </button>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Rapor İçeriği</h3>
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
              <li>• Ziyaret detayları (doktor/eczane)</li>
              <li>• Satış ve hediye kutular</li>
              <li>• Anlaşma durumları</li>
              <li>• Vaka listesi ve durumları</li>
              <li>• Hedef karşılaştırmaları</li>
            </ul>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Format Detayları</h3>
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
              <li>• Excel (.xlsx) formatında</li>
              <li>• Çoklu sayfa (sheet) desteği</li>
              <li>• Otomatik tablo formatlama</li>
              <li>• Grafik ve özet tablolar</li>
              <li>• Tarih ve saat damgası</li>
            </ul>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Kullanım Alanları</h3>
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
              <li>• Performans değerlendirmesi</li>
              <li>• Üst yönetime sunum</li>
              <li>• Trend analizi</li>
              <li>• Bütçe planlaması</li>
              <li>• Stratejik karar destek</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
