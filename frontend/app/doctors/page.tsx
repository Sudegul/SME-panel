'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from '@/lib/axios';
import { LogOut, CheckCircle, XCircle, Clock, User, Filter, Plus, X, Moon, Sun, MessageSquare, Search, Calendar } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

interface Visit {
  id: number;
  doctor_name: string;
  employee_name: string;
  visit_date: string;
  start_time: string;
  end_time: string;
  agreement_status: 'success' | 'failed';
  notes: string;
}

export default function DoctorsPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [filteredVisits, setFilteredVisits] = useState<Visit[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [datePeriod, setDatePeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [searchName, setSearchName] = useState('');
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [newVisit, setNewVisit] = useState({
    doctor_name: '',
    visit_date: new Date().toISOString().split('T')[0],
    start_time: '',
    end_time: '',
    agreement_status: 'success' as 'success' | 'failed',
    notes: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = visits;

    // Employee filter
    if (selectedEmployee !== 'all') {
      filtered = filtered.filter(v => v.employee_name === selectedEmployee);
    }

    // Date period filter
    const today = new Date();
    const filterDate = new Date();

    if (datePeriod === 'day') {
      filterDate.setDate(today.getDate());
    } else if (datePeriod === 'week') {
      filterDate.setDate(today.getDate() - 7);
    } else if (datePeriod === 'month') {
      filterDate.setMonth(today.getMonth() - 1);
    } else if (datePeriod === 'year') {
      filterDate.setFullYear(today.getFullYear() - 1);
    }

    filtered = filtered.filter(v => new Date(v.visit_date) >= filterDate);

    // Name search filter
    if (searchName.trim()) {
      filtered = filtered.filter(v =>
        v.doctor_name.toLowerCase().includes(searchName.toLowerCase())
      );
    }

    setFilteredVisits(filtered);
  }, [selectedEmployee, datePeriod, searchName, visits]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const userRes = await axios.get('/employees/me');
      setUser(userRes.data);

      // Mock data - backend'de gerçek endpoint'leri oluşturacağız
      const mockVisits: Visit[] = [
        {
          id: 1,
          doctor_name: 'Dr. Mehmet Yılmaz',
          employee_name: 'Ahmet Kaya',
          visit_date: '2025-11-24',
          start_time: '10:00',
          end_time: '10:45',
          agreement_status: 'success',
          notes: 'Ürün tanıtımı yapıldı, 50 kutu sipariş alındı'
        },
        {
          id: 2,
          doctor_name: 'Dr. Ayşe Demir',
          employee_name: 'Ayşe Demir',
          visit_date: '2025-11-24',
          start_time: '14:00',
          end_time: '14:30',
          agreement_status: 'failed',
          notes: 'Doktor meşgul, randevu alınamadı. Tekrar ziyaret gerekli.'
        },
        {
          id: 3,
          doctor_name: 'Dr. Can Öztürk',
          employee_name: 'Ahmet Kaya',
          visit_date: '2025-11-23',
          start_time: '11:30',
          end_time: '12:15',
          agreement_status: 'success',
          notes: 'Ürün hakkında bilgi verildi, numune bırakıldı'
        },
        {
          id: 4,
          doctor_name: 'Dr. Zeynep Kılıç',
          employee_name: 'Mehmet Öz',
          visit_date: '2025-11-23',
          start_time: '09:00',
          end_time: '09:40',
          agreement_status: 'failed',
          notes: 'Doktor başka ürün kullanmayı tercih ediyor'
        },
      ];

      // Employee ise sadece kendi ziyaretlerini göster
      const filteredData = userRes.data.role === 'MANAGER'
        ? mockVisits
        : mockVisits.filter(v => v.employee_name === userRes.data.full_name);

      setVisits(filteredData);
      setFilteredVisits(filteredData);

      // Mock employees
      if (userRes.data.role === 'MANAGER') {
        setEmployees([
          { id: 1, full_name: 'Ahmet Kaya' },
          { id: 2, full_name: 'Ayşe Demir' },
          { id: 3, full_name: 'Mehmet Öz' },
        ]);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600 dark:text-gray-300 dark:text-gray-300">Yükleniyor...</div>
      </div>
    );
  }

  const handleAddVisit = () => {
    if (!newVisit.doctor_name || !newVisit.start_time || !newVisit.end_time || !newVisit.notes) {
      alert('Lütfen tüm alanları doldurun!');
      return;
    }

    const visit: Visit = {
      id: visits.length + 1,
      doctor_name: newVisit.doctor_name,
      employee_name: user?.full_name,
      visit_date: newVisit.visit_date,
      start_time: newVisit.start_time,
      end_time: newVisit.end_time,
      agreement_status: newVisit.agreement_status,
      notes: newVisit.notes
    };

    setVisits([visit, ...visits]);
    setFilteredVisits([visit, ...filteredVisits]);
    setShowAddModal(false);
    setNewVisit({
      doctor_name: '',
      visit_date: new Date().toISOString().split('T')[0],
      start_time: '',
      end_time: '',
      agreement_status: 'success',
      notes: ''
    });
    alert('Ziyaret başarıyla eklendi!');
  };

  const handleSendFeedback = async () => {
    if (!feedbackText.trim()) {
      alert('Lütfen geri dönüş mesajı girin!');
      return;
    }

    if (!selectedVisit) return;

    try {
      // Find employee by name (in real app, we'd have employee_id)
      const employee = employees.find(e => e.full_name === selectedVisit.employee_name);

      await axios.post('/feedbacks/', {
        employee_id: employee?.id || 2,
        visit_type: 'DOCTOR',
        target_id: selectedVisit.id,
        target_name: selectedVisit.doctor_name,
        feedback_text: feedbackText,
        visit_id: selectedVisit.id
      });

      alert('Geri dönüş başarıyla gönderildi!');
      setShowFeedbackModal(false);
      setFeedbackText('');
      setSelectedVisit(null);
    } catch (error) {
      console.error('Error sending feedback:', error);
      alert('Geri dönüş gönderilemedi. Lütfen tekrar deneyin.');
    }
  };

  const openFeedbackModal = (visit: Visit) => {
    setSelectedVisit(visit);
    setShowFeedbackModal(true);
  };

  const successfulVisits = filteredVisits.filter(v => v.agreement_status === 'success');
  const failedVisits = filteredVisits.filter(v => v.agreement_status === 'failed');

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
            <button className="py-4 px-2 border-b-2 border-blue-500 text-blue-600 dark:text-blue-400 font-medium">Doktorlar</button>
            <button onClick={() => router.push('/pharmacies')} className="py-4 px-2 border-b-2 border-transparent text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Eczaneler</button>
            <button onClick={() => router.push('/cases')} className="py-4 px-2 border-b-2 border-transparent text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Vakalar</button>
            {user?.role === 'EMPLOYEE' && (
              <button onClick={() => router.push('/feedbacks')} className="py-4 px-2 border-b-2 border-transparent text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Geri Dönüşler</button>
            )}
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
        {/* Filters */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Date Period Filter */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-5 h-5 text-blue-600" />
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Tarih Filtresi:</label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setDatePeriod('day')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  datePeriod === 'day'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Bugün
              </button>
              <button
                onClick={() => setDatePeriod('week')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  datePeriod === 'week'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                1 Hafta
              </button>
              <button
                onClick={() => setDatePeriod('month')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  datePeriod === 'month'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                1 Ay
              </button>
              <button
                onClick={() => setDatePeriod('year')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  datePeriod === 'year'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                1 Yıl
              </button>
            </div>
          </div>

          {/* Name Search */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center gap-2 mb-3">
              <Search className="w-5 h-5 text-blue-600" />
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Doktor Ara:</label>
            </div>
            <input
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="Doktor adı girin..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        {/* Add Visit Button */}
        <div className="mb-6 flex justify-between items-center">
          {user?.role === 'MANAGER' ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center gap-4 flex-1 mr-4">
              <Filter className="w-5 h-5 text-gray-600 dark:text-gray-300 dark:text-gray-300" />
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200 dark:text-gray-200">Çalışan Filtrele:</label>
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Tüm Çalışanlar</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.full_name}>{emp.full_name}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex-1"></div>
          )}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Yeni Ziyaret Ekle
          </button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300 dark:text-gray-300">Toplam Ziyaret</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white dark:text-white">{filteredVisits.length}</p>
              </div>
              <User className="w-12 h-12 text-blue-500" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300 dark:text-gray-300">Anlaşma Sağlandı</p>
                <p className="text-3xl font-bold text-green-600">{successfulVisits.length}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300 dark:text-gray-300">Anlaşma Sağlanamadı</p>
                <p className="text-3xl font-bold text-red-600">{failedVisits.length}</p>
              </div>
              <XCircle className="w-12 h-12 text-red-500" />
            </div>
          </div>
        </div>

        {/* Visits List */}
        <div className="space-y-6">
          {/* Successful Agreements */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-6 border-b dark:border-gray-700 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white dark:text-white">Anlaşma Sağlananlar</h2>
                <span className="ml-auto bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1 rounded-full text-sm font-medium">
                  {successfulVisits.length}
                </span>
              </div>
            </div>
            <div className="divide-y">
              {successfulVisits.map((visit) => (
                <div key={visit.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-white">{visit.doctor_name}</h3>
                        <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-medium">
                          Başarılı
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-300 mb-3">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>{visit.employee_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{new Date(visit.visit_date).toLocaleDateString('tr-TR')} | {visit.start_time} - {visit.end_time}</span>
                        </div>
                      </div>
                      <p className="text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg mb-3">{visit.notes}</p>
                      {user?.role === 'MANAGER' && (
                        <button
                          onClick={() => openFeedbackModal(visit)}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          <MessageSquare className="w-4 h-4" />
                          Geri Dönüş Yap
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {successfulVisits.length === 0 && (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400 dark:text-gray-400">Henüz başarılı ziyaret yok</div>
              )}
            </div>
          </div>

          {/* Failed Agreements */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-6 border-b dark:border-gray-700 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <XCircle className="w-6 h-6 text-red-600" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white dark:text-white">Anlaşma Sağlanamayanlar</h2>
                <span className="ml-auto bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-3 py-1 rounded-full text-sm font-medium">
                  {failedVisits.length}
                </span>
              </div>
            </div>
            <div className="divide-y">
              {failedVisits.map((visit) => (
                <div key={visit.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-white">{visit.doctor_name}</h3>
                        <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-sm font-medium">
                          Başarısız
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-300 mb-3">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>{visit.employee_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{new Date(visit.visit_date).toLocaleDateString('tr-TR')} | {visit.start_time} - {visit.end_time}</span>
                        </div>
                      </div>
                      <p className="text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg mb-3">{visit.notes}</p>
                      {user?.role === 'MANAGER' && (
                        <button
                          onClick={() => openFeedbackModal(visit)}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          <MessageSquare className="w-4 h-4" />
                          Geri Dönüş Yap
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {failedVisits.length === 0 && (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400 dark:text-gray-400">Henüz başarısız ziyaret yok</div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Add Visit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white dark:text-white">Yeni Doktor Ziyareti Ekle</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-200 dark:text-gray-200">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Doktor Adı *</label>
                <input
                  type="text"
                  value={newVisit.doctor_name}
                  onChange={(e) => setNewVisit({...newVisit, doctor_name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Dr. Ahmet Yılmaz"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Ziyaret Tarihi *</label>
                <input
                  type="date"
                  value={newVisit.visit_date}
                  onChange={(e) => setNewVisit({...newVisit, visit_date: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Başlangıç Saati *</label>
                  <input
                    type="time"
                    value={newVisit.start_time}
                    onChange={(e) => setNewVisit({...newVisit, start_time: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Bitiş Saati *</label>
                  <input
                    type="time"
                    value={newVisit.end_time}
                    onChange={(e) => setNewVisit({...newVisit, end_time: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Anlaşma Durumu *</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="agreement"
                      checked={newVisit.agreement_status === 'success'}
                      onChange={() => setNewVisit({...newVisit, agreement_status: 'success'})}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm font-medium text-green-700">Anlaşma Sağlandı</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="agreement"
                      checked={newVisit.agreement_status === 'failed'}
                      onChange={() => setNewVisit({...newVisit, agreement_status: 'failed'})}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm font-medium text-red-700">Anlaşma Sağlanamadı</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Notlar *</label>
                <textarea
                  value={newVisit.notes}
                  onChange={(e) => setNewVisit({...newVisit, notes: e.target.value})}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ziyaret hakkında detaylı bilgi girin..."
                />
              </div>
            </div>

            <div className="p-6 border-t flex gap-3 justify-end">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleAddVisit}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && selectedVisit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full">
            <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Geri Dönüş Yap</h2>
              <button onClick={() => { setShowFeedbackModal(false); setFeedbackText(''); }} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{selectedVisit.doctor_name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Çalışan: {selectedVisit.employee_name}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Tarih: {new Date(selectedVisit.visit_date).toLocaleDateString('tr-TR')}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Geri Dönüş Mesajı *
                </label>
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Çalışana geri dönüş mesajı yazın..."
                />
              </div>
            </div>

            <div className="p-6 border-t dark:border-gray-700 flex gap-3 justify-end">
              <button
                onClick={() => { setShowFeedbackModal(false); setFeedbackText(''); }}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleSendFeedback}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Gönder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
