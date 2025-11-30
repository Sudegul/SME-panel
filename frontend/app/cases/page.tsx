'use client';

import { useEffect, useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'next/navigation';
import axios from '@/lib/axios';
import { LogOut, XCircle, AlertCircle, CheckCircle2, User, Moon, Sun } from 'lucide-react';

interface Case {
  id: number;
  title: string;
  description: string;
  employee_name: string;
  created_at: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  case_type: string;
}

export default function CasesPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [cases, setCases] = useState<Case[]>([]);
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

      // Mock data
      const mockCases: Case[] = [
        {
          id: 1,
          title: 'Dr. Mehmet Yılmaz - Anlaşma Sağlanamadı',
          description: 'Doktor başka ürün kullanmayı tercih ediyor. Fiyat konusunda anlaşma sağlanamadı. Rakip firma ile çalışıyor.',
          employee_name: 'Ahmet Kaya',
          created_at: '2025-11-24T10:30:00',
          status: 'OPEN',
          priority: 'HIGH',
          case_type: 'VISIT_PROBLEM'
        },
        {
          id: 2,
          title: 'Hayat Eczanesi - Fiyat Uyuşmazlığı',
          description: 'Eczacı fiyatların yüksek olduğunu düşünüyor. Rakip ürünlere göre fiyat avantajı sağlanması gerekiyor.',
          employee_name: 'Ayşe Demir',
          created_at: '2025-11-24T14:15:00',
          status: 'OPEN',
          priority: 'MEDIUM',
          case_type: 'CUSTOMER_COMPLAINT'
        },
        {
          id: 3,
          title: 'Dr. Zeynep Kılıç - Ürün Şikayeti',
          description: 'Doktor ürün ambalajından memnun değil. Tasarım değişikliği talep ediyor.',
          employee_name: 'Mehmet Öz',
          created_at: '2025-11-23T11:00:00',
          status: 'IN_PROGRESS',
          priority: 'LOW',
          case_type: 'PRODUCT_ISSUE'
        },
        {
          id: 4,
          title: 'Merkez Eczanesi - Teslimat Gecikm',
          description: 'Sipariş verilen ürünlerde teslimat gecikmesi yaşandı. Müşteri memnuniyetsiz.',
          employee_name: 'Ahmet Kaya',
          created_at: '2025-11-22T09:00:00',
          status: 'CLOSED',
          priority: 'URGENT',
          case_type: 'OTHER'
        },
      ];

      // Employee ise sadece kendi vakalarını göster
      const filteredData = userRes.data.role === 'MANAGER'
        ? mockCases
        : mockCases.filter(c => c.employee_name === userRes.data.full_name);

      setCases(filteredData);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseCase = async (caseId: number) => {
    if (user?.role !== 'MANAGER') {
      alert('Sadece yöneticiler vaka kapatabilir!');
      return;
    }

    if (confirm('Bu vakayı kapatmak istediğinizden emin misiniz?')) {
      // Backend'e istek atılacak
      setCases(cases.map(c => c.id === caseId ? { ...c, status: 'CLOSED' } : c));
      alert('Vaka kapatıldı!');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600 dark:text-gray-300 dark:text-gray-300">Yükleniyor...</div>
      </div>
    );
  }

  const openCases = cases.filter(c => c.status === 'OPEN');
  const inProgressCases = cases.filter(c => c.status === 'IN_PROGRESS');
  const closedCases = cases.filter(c => c.status === 'CLOSED');

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200';
      case 'MEDIUM': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
      case 'HIGH': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300';
      case 'URGENT': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'Düşük';
      case 'MEDIUM': return 'Orta';
      case 'HIGH': return 'Yüksek';
      case 'URGENT': return 'Acil';
      default: return priority;
    }
  };

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
            <button className="py-4 px-2 border-b-2 border-blue-500 text-blue-600 dark:text-blue-400 font-medium">Vakalar</button>
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
        {user?.role !== 'MANAGER' && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 p-4 mb-6">
            <div className="flex">
              <AlertCircle className="w-5 h-5 text-blue-400" />
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  Sadece yöneticiler vaka kapatabilir. Diğer çalışanlar sadece kendi vakalarını görüntüleyebilir.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300 dark:text-gray-300">Açık Vakalar</p>
                <p className="text-3xl font-bold text-red-600">{openCases.length}</p>
              </div>
              <XCircle className="w-12 h-12 text-red-500" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300 dark:text-gray-300">Devam Eden</p>
                <p className="text-3xl font-bold text-orange-600">{inProgressCases.length}</p>
              </div>
              <AlertCircle className="w-12 h-12 text-orange-500" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300 dark:text-gray-300">Kapatılan</p>
                <p className="text-3xl font-bold text-green-600">{closedCases.length}</p>
              </div>
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            </div>
          </div>
        </div>

        {/* Cases List */}
        <div className="space-y-6">
          {/* Open Cases */}
          {openCases.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6 border-b dark:border-gray-700 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <XCircle className="w-6 h-6 text-red-600" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white dark:text-white">Açık Vakalar</h2>
                  <span className="ml-auto bg-red-100 text-red-700 dark:text-red-400 px-3 py-1 rounded-full text-sm font-medium">
                    {openCases.length}
                  </span>
                </div>
              </div>
              <div className="divide-y">
                {openCases.map((caseItem) => (
                  <div key={caseItem.id} className="p-6 hover:bg-red-50 transition-colors border-l-4 border-red dark:border-red-500">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-white mb-2">{caseItem.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300 mb-3">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span>{caseItem.employee_name}</span>
                          </div>
                          <span>{new Date(caseItem.created_at).toLocaleDateString('tr-TR')}</span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg mb-3">{caseItem.description}</p>
                        {user?.role === 'MANAGER' && (
                          <button
                            onClick={() => handleCloseCase(caseItem.id)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          >
                            Vakayı Kapat
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* In Progress Cases */}
          {inProgressCases.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6 border-b dark:border-gray-700 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-6 h-6 text-orange-600" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white dark:text-white">Devam Eden Vakalar</h2>
                  <span className="ml-auto bg-orange-100 text-orange-700 dark:text-orange-400 px-3 py-1 rounded-full text-sm font-medium">
                    {inProgressCases.length}
                  </span>
                </div>
              </div>
              <div className="divide-y">
                {inProgressCases.map((caseItem) => (
                  <div key={caseItem.id} className="p-6 hover:bg-orange-50 transition-colors border-l-4 border-orange dark:border-orange-500">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-white mb-2">{caseItem.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300 mb-3">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span>{caseItem.employee_name}</span>
                          </div>
                          <span>{new Date(caseItem.created_at).toLocaleDateString('tr-TR')}</span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg mb-3">{caseItem.description}</p>
                        {user?.role === 'MANAGER' && (
                          <button
                            onClick={() => handleCloseCase(caseItem.id)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          >
                            Vakayı Kapat
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Closed Cases */}
          {closedCases.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6 border-b dark:border-gray-700 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white dark:text-white">Kapatılan Vakalar</h2>
                  <span className="ml-auto bg-green-100 text-green-700 dark:text-green-400 px-3 py-1 rounded-full text-sm font-medium">
                    {closedCases.length}
                  </span>
                </div>
              </div>
              <div className="divide-y">
                {closedCases.map((caseItem) => (
                  <div key={caseItem.id} className="p-6 hover:bg-green-50 transition-colors border-l-4 border-green dark:border-green-500">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-white mb-2">{caseItem.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300 mb-3">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span>{caseItem.employee_name}</span>
                          </div>
                          <span>{new Date(caseItem.created_at).toLocaleDateString('tr-TR')}</span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">{caseItem.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
