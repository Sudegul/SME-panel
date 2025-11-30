'use client';

import { useEffect, useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'next/navigation';
import axios from '@/lib/axios';
import { LogOut, CheckCircle, XCircle, Package, Gift, User, Filter, Building, Plus, X, Moon, Sun, MessageSquare } from 'lucide-react';

interface PharmacyVisit {
  id: number;
  pharmacy_name: string;
  employee_name: string;
  visit_date: string;
  start_time: string;
  end_time: string;
  agreement_status: 'success' | 'failed';
  boxes_sold: number;
  boxes_gifted: number;
  notes: string;
}

export default function PharmaciesPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [visits, setVisits] = useState<PharmacyVisit[]>([]);
  const [filteredVisits, setFilteredVisits] = useState<PharmacyVisit[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<PharmacyVisit | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [newVisit, setNewVisit] = useState({
    pharmacy_name: '',
    visit_date: new Date().toISOString().split('T')[0],
    start_time: '',
    end_time: '',
    agreement_status: 'success' as 'success' | 'failed',
    boxes_sold: 0,
    boxes_gifted: 0,
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
    if (selectedEmployee === 'all') {
      setFilteredVisits(visits);
    } else {
      setFilteredVisits(visits.filter(v => v.employee_name === selectedEmployee));
    }
  }, [selectedEmployee, visits]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const userRes = await axios.get('/employees/me');
      setUser(userRes.data);

      // Mock data
      const mockVisits: PharmacyVisit[] = [
        {
          id: 1,
          pharmacy_name: 'Sağlık Eczanesi',
          employee_name: 'Ahmet Kaya',
          visit_date: '2025-11-24',
          start_time: '09:00',
          end_time: '09:45',
          agreement_status: 'success',
          boxes_sold: 50,
          boxes_gifted: 5,
          notes: 'Eczane ile anlaşma sağlandı, 50 kutu satış yapıldı, 5 kutu hediye verildi'
        },
        {
          id: 2,
          pharmacy_name: 'Hayat Eczanesi',
          employee_name: 'Ayşe Demir',
          visit_date: '2025-11-24',
          start_time: '11:00',
          end_time: '11:30',
          agreement_status: 'failed',
          boxes_sold: 0,
          boxes_gifted: 0,
          notes: 'Eczacı başka tedarikçi ile çalışmak istiyor, anlaşma sağlanamadı'
        },
        {
          id: 3,
          pharmacy_name: 'Şifa Eczanesi',
          employee_name: 'Mehmet Öz',
          visit_date: '2025-11-23',
          start_time: '14:00',
          end_time: '14:45',
          agreement_status: 'success',
          boxes_sold: 30,
          boxes_gifted: 3,
          notes: 'İlk sipariş verildi, takip edilecek'
        },
        {
          id: 4,
          pharmacy_name: 'Merkez Eczanesi',
          employee_name: 'Ahmet Kaya',
          visit_date: '2025-11-23',
          start_time: '10:30',
          end_time: '11:00',
          agreement_status: 'failed',
          boxes_sold: 0,
          boxes_gifted: 0,
          notes: 'Fiyat konusunda anlaşma sağlanamadı'
        },
      ];

      // Employee ise sadece kendi ziyaretlerini göster
      const filteredData = userRes.data.role === 'MANAGER'
        ? mockVisits
        : mockVisits.filter(v => v.employee_name === userRes.data.full_name);

      setVisits(filteredData);
      setFilteredVisits(filteredData);

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
    if (!newVisit.pharmacy_name || !newVisit.start_time || !newVisit.end_time || !newVisit.notes) {
      alert('Lütfen tüm zorunlu alanları doldurun!');
      return;
    }

    const visit: PharmacyVisit = {
      id: visits.length + 1,
      pharmacy_name: newVisit.pharmacy_name,
      employee_name: user?.full_name,
      visit_date: newVisit.visit_date,
      start_time: newVisit.start_time,
      end_time: newVisit.end_time,
      agreement_status: newVisit.agreement_status,
      boxes_sold: newVisit.boxes_sold,
      boxes_gifted: newVisit.boxes_gifted,
      notes: newVisit.notes
    };

    setVisits([visit, ...visits]);
    setFilteredVisits([visit, ...filteredVisits]);
    setShowAddModal(false);
    setNewVisit({
      pharmacy_name: '',
      visit_date: new Date().toISOString().split('T')[0],
      start_time: '',
      end_time: '',
      agreement_status: 'success',
      boxes_sold: 0,
      boxes_gifted: 0,
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
      const employee = employees.find(e => e.full_name === selectedVisit.employee_name);

      await axios.post('/feedbacks/', {
        employee_id: employee?.id || 2,
        visit_type: 'PHARMACY',
        target_id: selectedVisit.id,
        target_name: selectedVisit.pharmacy_name,
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

  const openFeedbackModal = (visit: PharmacyVisit) => {
    setSelectedVisit(visit);
    setShowFeedbackModal(true);
  };

  const successfulVisits = filteredVisits.filter(v => v.agreement_status === 'success');
  const failedVisits = filteredVisits.filter(v => v.agreement_status === 'failed');
  const totalBoxesSold = successfulVisits.reduce((sum, v) => sum + v.boxes_sold, 0);
  const totalBoxesGifted = successfulVisits.reduce((sum, v) => sum + v.boxes_gifted, 0);

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
            <button className="py-4 px-2 border-b-2 border-blue-500 text-blue-600 dark:text-blue-400 font-medium">Eczaneler</button>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300 dark:text-gray-300">Toplam Ziyaret</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white dark:text-white">{filteredVisits.length}</p>
              </div>
              <Building className="w-12 h-12 text-blue-500" />
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
                <p className="text-sm text-gray-600 dark:text-gray-300 dark:text-gray-300">Toplam Satış</p>
                <p className="text-3xl font-bold text-purple-600">{totalBoxesSold} kutu</p>
              </div>
              <Package className="w-12 h-12 text-purple-500" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300 dark:text-gray-300">Toplam Hediye</p>
                <p className="text-3xl font-bold text-orange-600">{totalBoxesGifted} kutu</p>
              </div>
              <Gift className="w-12 h-12 text-orange-500" />
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
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-white">{visit.pharmacy_name}</h3>
                        <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-medium">
                          Başarılı
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm mb-3">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 dark:text-gray-300">
                          <User className="w-4 h-4" />
                          <span>{visit.employee_name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 dark:text-gray-300">
                          <span>{new Date(visit.visit_date).toLocaleDateString('tr-TR')} | {visit.start_time} - {visit.end_time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-purple-600" />
                          <span className="font-semibold text-purple-600">{visit.boxes_sold} kutu satış</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Gift className="w-4 h-4 text-orange-600" />
                          <span className="font-semibold text-orange-600">{visit.boxes_gifted} kutu hediye</span>
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
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-white">{visit.pharmacy_name}</h3>
                        <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-sm font-medium">
                          Başarısız
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-300 mb-3">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>{visit.employee_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
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
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white dark:text-white">Yeni Eczane Ziyareti Ekle</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-200 dark:text-gray-200">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Eczane Adı *</label>
                <input
                  type="text"
                  value={newVisit.pharmacy_name}
                  onChange={(e) => setNewVisit({...newVisit, pharmacy_name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Sağlık Eczanesi"
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Satılan Kutu Sayısı</label>
                  <input
                    type="number"
                    min="0"
                    value={newVisit.boxes_sold}
                    onChange={(e) => setNewVisit({...newVisit, boxes_sold: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Hediye Kutu Sayısı</label>
                  <input
                    type="number"
                    min="0"
                    value={newVisit.boxes_gifted}
                    onChange={(e) => setNewVisit({...newVisit, boxes_gifted: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
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
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Geri Dönüş Yap</h2>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  {selectedVisit.pharmacy_name} - {selectedVisit.employee_name}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowFeedbackModal(false);
                  setFeedbackText('');
                  setSelectedVisit(null);
                }}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Tarih:</span>
                      <span className="ml-2 text-gray-900 dark:text-white font-medium">
                        {new Date(selectedVisit.visit_date).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Saat:</span>
                      <span className="ml-2 text-gray-900 dark:text-white font-medium">
                        {selectedVisit.start_time} - {selectedVisit.end_time}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Durum:</span>
                      <span className={`ml-2 font-medium ${
                        selectedVisit.agreement_status === 'success'
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {selectedVisit.agreement_status === 'success' ? 'Başarılı' : 'Başarısız'}
                      </span>
                    </div>
                    {selectedVisit.agreement_status === 'success' && (
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Satış:</span>
                        <span className="ml-2 text-gray-900 dark:text-white font-medium">
                          {selectedVisit.boxes_sold} kutu / {selectedVisit.boxes_gifted} hediye
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 pt-3 border-t dark:border-gray-600">
                    <p className="text-sm text-gray-700 dark:text-gray-200">{selectedVisit.notes}</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Geri Dönüş Mesajı
                </label>
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Çalışana geri dönüş mesajınızı yazın..."
                />
              </div>
            </div>

            <div className="p-6 border-t dark:border-gray-700 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowFeedbackModal(false);
                  setFeedbackText('');
                  setSelectedVisit(null);
                }}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleSendFeedback}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                Gönder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
