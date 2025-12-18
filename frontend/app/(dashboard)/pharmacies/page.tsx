'use client';

import { useEffect, useState, memo, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import axios from '@/lib/axios';
import useSWR, { mutate } from 'swr';
import { Search, Filter, Edit, Check, X, Clock } from 'lucide-react';
import CustomDateInput from '@/components/CustomDateInput';
import { toast } from 'react-toastify';

interface PharmacyVisit {
  id: number;
  pharmacy_id: number;
  pharmacy_name: string;
  pharmacy_address?: string;
  employee_name: string;
  visit_date: string;
  product_count: number;
  mf_count: number;
  is_approved: boolean;
  start_time?: string;
  end_time?: string;
  notes?: string;
}

// React.memo ile optimize edilmiş istatistik kartı
// Mantık: Stats değişmediği sürece kart yeniden render olmaz
// Props aynı kaldığında gereksiz re-render önlenir
const StatCard = memo(({ label, value, color }: { label: string; value: number; color: string }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <p className="text-sm text-gray-600 dark:text-gray-300">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </div>
  );
});
StatCard.displayName = 'StatCard';

// React.memo ile optimize edilmiş tablo satırı
// Mantık: Visit objesi ve user role değişmediği sürece satır yeniden render olmaz
// Örnek: 100 eczane varsa ve filtreleme yapılırsa, değişmeyen 99 satır tekrar render olmaz!
const PharmacyVisitRow = memo(({
  visit,
  userRole,
  onApprove,
  onEdit
}: {
  visit: PharmacyVisit;
  userRole: string | undefined;
  onApprove: (id: number) => void;
  onEdit: (visit: PharmacyVisit) => void;
}) => {
  const isManager = userRole === 'MANAGER' || userRole === 'ADMIN';

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
        {visit.employee_name}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
        {visit.pharmacy_name}
      </td>
      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
        {visit.pharmacy_address}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">
        {visit.product_count}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-purple-600">
        {visit.mf_count}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
        {new Date(visit.visit_date).toLocaleDateString('tr-TR')}
      </td>
      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
        {visit.notes || '-'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {isManager ? (
          <button
            onClick={() => onApprove(visit.id)}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium transition-all hover:opacity-80 cursor-pointer"
            style={{
              backgroundColor: visit.is_approved ? 'rgb(220 252 231)' : 'rgb(252 231 243)',
              color: visit.is_approved ? 'rgb(22 101 52)' : 'rgb(157 23 77)',
            }}
          >
            {visit.is_approved ? (
              <>
                <Check className="w-4 h-4" />
                Onaylandı
              </>
            ) : (
              <>
                <Clock className="w-4 h-4" />
                Onaylanmayı Bekliyor!
              </>
            )}
          </button>
        ) : (
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
            visit.is_approved
              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
              : 'bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-400'
          }`}>
            {visit.is_approved ? (
              <>
                <Check className="w-4 h-4" />
                Onaylandı
              </>
            ) : (
              <>
                <Clock className="w-4 h-4" />
                Onaylanmayı Bekliyor!
              </>
            )}
          </span>
        )}
      </td>
      {isManager && (
        <td className="px-6 py-4 whitespace-nowrap text-sm">
          <button
            onClick={() => onEdit(visit)}
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
            title="Düzenle"
          >
            <Edit className="w-5 h-5" />
          </button>
        </td>
      )}
    </tr>
  );
});
PharmacyVisitRow.displayName = 'PharmacyVisitRow';

// SWR fetcher fonksiyonu - API çağrılarını yapar
// Mantık: useSWR hook'una verilen URL'i bu fonksiyona gönderir, fonksiyon veriyi çeker
// SWR otomatik olarak cache yapar, error handle eder, loading state yönetir
const fetcher = (url: string) => axios.get(url).then(res => res.data);

export default function PharmaciesPage() {
  const router = useRouter();

  // Filters
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month' | 'year'>('day');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [searchPharmacy, setSearchPharmacy] = useState('');
  const [approvalFilter, setApprovalFilter] = useState<'all' | 'approved' | 'pending'>('all');

  // SWR hooks - Otomatik caching, revalidation, error handling
  // Mantık: useSWR(cache_key, fetcher_function) şeklinde kullanılır
  // Cache key değişince otomatik olarak yeniden fetch eder
  // Aynı cache key varsa cache'ten döner (network isteği yapmaz!)

  // User verisi - Tüm sayfalarda aynı, cache'lenir
  const { data: user } = useSWR('/employees/me', fetcher, {
    onError: (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        router.push('/login');
      }
    },
  });

  // Employees listesi - Nadiren değişir, cache'lenir
  const { data: employees = [] } = useSWR('/employees/', fetcher, {
    // Employees listesi nadiren değişir, 5 dakika cache'le
    dedupingInterval: 5 * 60 * 1000,
  });

  // Visits API URL - Filtreler değişince otomatik yeniden fetch edilir
  const visitsUrl = `/daily-visits/pharmacies?period=${selectedPeriod}&start_date=${startDate}&end_date=${endDate}${
    selectedEmployee !== 'all' ? `&employee_id=${selectedEmployee}` : ''
  }`;

  // Visits verisi - Filtrelere göre dinamik olarak güncellenir
  const { data: visits = [], isLoading: visitsLoading } = useSWR(visitsUrl, fetcher, {
    // Her 30 saniyede bir arka planda refresh (yeni ziyaretleri görmek için)
    refreshInterval: 30000,
    // Focus'ta revalidate - Başka sekmeye geçip geri gelince fresh data
    revalidateOnFocus: true,
  });

  // Stats API URL - Filtreler değişince otomatik yeniden fetch edilir
  const statsUrl = `/daily-visits/pharmacies/stats?period=${selectedPeriod}&start_date=${startDate}&end_date=${endDate}${
    selectedEmployee !== 'all' ? `&employee_id=${selectedEmployee}` : ''
  }`;

  // Stats verisi - Visits ile aynı filtrelere sahip
  const { data: stats = { total_visits: 0, total_mf: 0, total_products: 0, approved_count: 0, pending_count: 0 } } = useSWR(
    statsUrl,
    fetcher,
    {
      // Stats da aynı şekilde 30 saniyede bir refresh
      refreshInterval: 30000,
      revalidateOnFocus: true,
    }
  );

  // Edit Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingVisit, setEditingVisit] = useState<PharmacyVisit | null>(null);
  const [editForm, setEditForm] = useState({
    pharmacy_address: '',
    product_count: '',
    mf_count: '',
    notes: ''
  });

  // Period değiştiğinde start ve end date'i güncelle
  useEffect(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (selectedPeriod === 'day') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (selectedPeriod === 'week') {
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 7);
      setStartDate(weekAgo.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (selectedPeriod === 'month') {
      const monthAgo = new Date(today);
      monthAgo.setDate(today.getDate() - 30);
      setStartDate(monthAgo.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (selectedPeriod === 'year') {
      const yearAgo = new Date(today);
      yearAgo.setFullYear(today.getFullYear() - 1);
      setStartDate(yearAgo.toISOString().split('T')[0]);
      setEndDate(todayStr);
    }
  }, [selectedPeriod]);

  // SWR ile visits ve stats otomatik olarak fetch ediliyor
  // Token kontrolü - SWR error handling ile yapılıyor (onError callback)
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  // useMemo ile filtrelenmiş veriyi hesapla - infinite loop önlenir!
  // Mantık: visits, searchPharmacy, approvalFilter değişmedikçe yeniden hesaplamaz
  const filteredVisits = useMemo(() => {
    if (!visits || visits.length === 0) {
      return [];
    }

    // Visits API'den gelen veriyi map'le (normalize et)
    const normalizedVisits = visits.map((visit: any) => ({
      id: visit.id,
      pharmacy_id: visit.pharmacy_id,
      pharmacy_name: visit.pharmacy_name,
      pharmacy_address: visit.pharmacy_address || '',
      employee_name: visit.employee_name,
      visit_date: visit.visit_date,
      product_count: visit.product_count || 0,
      mf_count: visit.mf_count || 0,
      is_approved: visit.is_approved || false,
      start_time: visit.start_time,
      end_time: visit.end_time,
      notes: visit.notes || ''
    }));

    let filtered = [...normalizedVisits];

    // Pharmacy search
    if (searchPharmacy.trim()) {
      filtered = filtered.filter(v =>
        v.pharmacy_name.toLowerCase().includes(searchPharmacy.toLowerCase())
      );
    }

    // Approval filter
    if (approvalFilter === 'approved') {
      filtered = filtered.filter(v => v.is_approved);
    } else if (approvalFilter === 'pending') {
      filtered = filtered.filter(v => !v.is_approved);
    }

    return filtered;
  }, [visits, searchPharmacy, approvalFilter]);

  // Optimistic UI ile onaylama - SWR mutate kullanarak
  // Mantık: Önce UI'ı güncelle (kullanıcı anında görür), sonra API'yi çağır
  // API başarısız olursa SWR otomatik olarak eski veriyi geri yükler (revalidate)
  const handleApprove = async (visitId: number) => {
    const visit = visits.find((v: any) => v.id === visitId);
    if (!visit) return;

    // Confirm dialog
    const message = visit.is_approved
      ? 'Onayı geri almak istiyor musunuz?'
      : 'Onaylıyor musunuz?';

    if (!window.confirm(message)) {
      return;
    }

    try {
      // Optimistic update - UI'ı hemen güncelle
      mutate(
        visitsUrl,
        visits.map((v: any) =>
          v.id === visitId ? { ...v, is_approved: !v.is_approved } : v
        ),
        false // Revalidate'i kapat, kendimiz yapacağız
      );

      // Backend API çağrısı - toggle approval status
      const response = await axios.post(`/daily-visits/pharmacies/${visitId}/toggle-approval`);

      // Backend'den gelen güncel veriyle SWR cache'ini güncelle
      mutate(visitsUrl);
      mutate(statsUrl); // Stats da güncellensin (onay sayısı değişti)

      toast.success(visit.is_approved ? 'Onay geri alındı' : 'Ziyaret onaylandı');
    } catch (error) {
      console.error('Approval error:', error);
      toast.error('Onay durumu güncellenirken hata oluştu');
      // Hata olursa SWR otomatik olarak cache'i revalidate eder
      mutate(visitsUrl);
    }
  };

  const handleEdit = (visit: PharmacyVisit) => {
    setEditingVisit(visit);
    setEditForm({
      pharmacy_address: visit.pharmacy_address || '',
      product_count: visit.product_count.toString(),
      mf_count: visit.mf_count.toString(),
      notes: visit.notes || ''
    });
    setShowEditModal(true);
  };

  // Optimistic UI ile düzenleme - SWR mutate kullanarak
  const handleSaveEdit = async () => {
    if (!editingVisit) return;

    try {
      // Backend API çağrısı - ziyareti güncelle
      const updateData = {
        pharmacy_id: editingVisit.pharmacy_id,
        pharmacy_name: editingVisit.pharmacy_name,
        pharmacy_address: editForm.pharmacy_address,
        product_count: parseInt(editForm.product_count, 10) || 0,
        mf_count: parseInt(editForm.mf_count, 10) || 0,
        notes: editForm.notes,
        visit_date: editingVisit.visit_date
      };

      // Optimistic update
      const updatedVisit = {
        ...editingVisit,
        pharmacy_address: editForm.pharmacy_address,
        product_count: parseInt(editForm.product_count, 10) || 0,
        mf_count: parseInt(editForm.mf_count, 10) || 0,
        notes: editForm.notes
      };

      mutate(
        visitsUrl,
        visits.map((v: any) => (v.id === updatedVisit.id ? updatedVisit : v)),
        false
      );

      await axios.put(`/daily-visits/pharmacies/${editingVisit.id}`, updateData);

      // Backend'den gelen güncel veriyle cache'i güncelle
      mutate(visitsUrl);
      mutate(statsUrl); // Product count değişmiş olabilir

      setShowEditModal(false);
      setEditingVisit(null);
      toast.success('Ziyaret başarıyla güncellendi');
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Ziyaret güncellenirken hata oluştu');
      mutate(visitsUrl); // Hata durumunda revalidate
    }
  };

  // Loading state - İlk yüklenme için
  if (!user || !employees) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600 dark:text-gray-300">Yükleniyor...</div>
      </div>
    );
  }

  return <>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Eczane Ziyaretleri</h1>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6 space-y-4">
        {/* Period Buttons */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Dönem Seçimi
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedPeriod('day')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedPeriod === 'day'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Günlük
            </button>
            <button
              onClick={() => setSelectedPeriod('week')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedPeriod === 'week'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Haftalık
            </button>
            <button
              onClick={() => setSelectedPeriod('month')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedPeriod === 'month'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Aylık
            </button>
            <button
              onClick={() => setSelectedPeriod('year')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedPeriod === 'year'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Yıllık
            </button>
          </div>
        </div>

        {/* Date Picker and Other Filters */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Başlangıç Tarihi
            </label>
            <CustomDateInput
              value={startDate}
              onChange={(value) => setStartDate(value)}
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Bitiş Tarihi
            </label>
            <CustomDateInput
              value={endDate}
              onChange={(value) => setEndDate(value)}
            />
          </div>

          {/* Çalışan Filtresi */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Çalışan
            </label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            >
              <option value="all">Tüm Çalışanlar</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.full_name}</option>
              ))}
            </select>
          </div>

          {/* Pharmacy Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Eczane Ara
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchPharmacy}
                onChange={(e) => setSearchPharmacy(e.target.value)}
                placeholder="Eczane adı..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Approval Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Onay Durumu
            </label>
            <select
              value={approvalFilter}
              onChange={(e) => setApprovalFilter(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            >
              <option value="all">Tümü</option>
              <option value="approved">Onaylananlar</option>
              <option value="pending">Onay Bekleyenler</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards - React.memo ile optimize edilmiş */}
      {/* Her kart sadece kendi değeri değiştiğinde render olur */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
        <StatCard label="Toplam Ziyaret" value={stats.total_visits} color="text-blue-600" />
        <StatCard label="Toplam Satılan Ürün" value={stats.total_products} color="text-indigo-600" />
        <StatCard label="Toplam MF" value={stats.total_mf} color="text-purple-600" />
        <StatCard label="Onaylanan" value={stats.approved_count} color="text-green-600" />
        <StatCard label="Onay Bekleyen" value={stats.pending_count} color="text-orange-600" />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Satıcı
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Eczane
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Adres
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Satılan Ürün Sayısı
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  MF
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Tarih
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Notlar
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => {
                      if (approvalFilter === 'all') setApprovalFilter('approved');
                      else if (approvalFilter === 'approved') setApprovalFilter('pending');
                      else setApprovalFilter('all');
                    }}>
                  <div className="flex items-center gap-2">
                    Onay
                    <Filter className="w-4 h-4" />
                  </div>
                </th>
                {(user?.role === 'MANAGER' || user?.role === 'ADMIN') && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    İşlem
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {/* React.memo ile optimize edilmiş satırlar - Her satır sadece kendi verisi değiştiğinde render olur */}
              {filteredVisits.map((visit) => (
                <PharmacyVisitRow
                  key={visit.id}
                  visit={visit}
                  userRole={user?.role}
                  onApprove={handleApprove}
                  onEdit={handleEdit}
                />
              ))}
            </tbody>
          </table>

          {filteredVisits.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              Kayıt bulunamadı
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && editingVisit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Ziyaret Düzenle</h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Eczane Adı
                </label>
                <input
                  type="text"
                  value={editingVisit.pharmacy_name}
                  onChange={(e) => setEditingVisit({ ...editingVisit, pharmacy_name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Adres
                </label>
                <input
                  type="text"
                  value={editForm.pharmacy_address}
                  onChange={(e) => setEditForm({ ...editForm, pharmacy_address: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Satılan Ürün Sayısı
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={editForm.product_count}
                  onChange={(e) => {
                    // Sadece rakam kabul et
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setEditForm({ ...editForm, product_count: val });
                  }}
                  onFocus={(e) => {
                    // Tıklandığında leading zero'ları temizle
                    if (e.target.value && e.target.value !== '0') {
                      const val = parseInt(e.target.value, 10).toString();
                      setEditForm({ ...editForm, product_count: val });
                    }
                  }}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  MF Sayısı
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={editForm.mf_count}
                  onChange={(e) => {
                    // Sadece rakam kabul et
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setEditForm({ ...editForm, mf_count: val });
                  }}
                  onFocus={(e) => {
                    // Tıklandığında leading zero'ları temizle
                    if (e.target.value && e.target.value !== '0') {
                      const val = parseInt(e.target.value, 10).toString();
                      setEditForm({ ...editForm, mf_count: val });
                    }
                  }}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tarih
                </label>
                <input
                  type="date"
                  value={editingVisit.visit_date}
                  onChange={(e) => setEditingVisit({ ...editingVisit, visit_date: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notlar
                </label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
                  rows={3}
                />
              </div>
            </div>

            <div className="p-6 border-t dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                İptal
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  </>;
}
