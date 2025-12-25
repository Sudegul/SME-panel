'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from '@/lib/axios';
import { Plus, Calendar, Clock, CheckCircle, XCircle, AlertCircle, Trash2, Edit, Check, X, Download } from 'lucide-react';
import { toast } from 'react-toastify';

interface LeaveBalance {
  id: number;
  leave_type_id: number;
  leave_type_name: string;
  year: number;
  total_days: number;
  used_days: number;
  remaining_days: number;
}

interface LeaveRequest {
  id: number;
  employee_id: number;
  employee_name: string;
  leave_type_id: number;
  leave_type_name: string;
  start_date: string;
  end_date: string;
  return_to_work_date: string;
  total_days: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  message?: string;
  rejection_reason?: string;
  approver_name?: string;
  approved_at?: string;
  created_at: string;
}

interface LeaveType {
  id: number;
  name: string;
  max_days: number;
  is_paid: boolean;
  is_active: boolean;
  gender_restriction: string;
  description?: string;
}

type TabType = 'requests' | 'leaves' | 'active';

export default function LeavesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [allRequests, setAllRequests] = useState<LeaveRequest[]>([]);
  const [activeLeaves, setActiveLeaves] = useState<LeaveRequest[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [currentTab, setCurrentTab] = useState<TabType>('requests');
  const [editingLeave, setEditingLeave] = useState<number | null>(null);
  const [editEndDate, setEditEndDate] = useState('');
  const [editReturnDate, setEditReturnDate] = useState('');

  // Approval modal state
  const [approvingRequest, setApprovingRequest] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Form state
  const [selectedLeaveType, setSelectedLeaveType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [totalDays, setTotalDays] = useState(0);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // İzin durumu
  const [isOnLeaveToday, setIsOnLeaveToday] = useState<any>(null);
  const [showPastDateWarning, setShowPastDateWarning] = useState(false);
  const [showCancelPastLeaveWarning, setShowCancelPastLeaveWarning] = useState(false);
  const [pendingCancelId, setPendingCancelId] = useState<number | null>(null);

  // Onaylanan izinler için filtreler
  const [periodFilter, setPeriodFilter] = useState<'all' | 'monthly' | 'yearly'>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [employees, setEmployees] = useState<any[]>([]);

  const isManager = user?.role === 'ADMIN' || user?.role === 'MANAGER';
  const canApproveLeaves = user?.role === 'MANAGER' || user?.permissions?.approve_leaves;

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
      const [userRes, balancesRes, requestsRes, activeRes, typesRes, leaveStatusRes] = await Promise.all([
        axios.get('/employees/me'),
        axios.get('/leave-requests/my-balances'),
        axios.get('/leave-requests/'),
        axios.get('/leave-requests/active'),
        axios.get('/leave-types/'),
        axios.get('/leave-requests/my-leave-status-today'),
      ]);

      setUser(userRes.data);
      setBalances(balancesRes.data);
      setAllRequests(requestsRes.data);
      setActiveLeaves(activeRes.data);
      setLeaveTypes(typesRes.data.filter((t: LeaveType) => t.is_active));
      setIsOnLeaveToday(leaveStatusRes.data);

      // Eğer manager veya admin ise, çalışanları da çek
      if (userRes.data.role === 'MANAGER' || userRes.data.role === 'ADMIN') {
        const employeesRes = await axios.get('/employees/');
        setEmployees(employeesRes.data.filter((emp: any) => emp.is_active));
      }
    } catch (error: any) {
      console.error('Veri yüklenirken hata:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  // Başlangıç ve bitiş tarihi değiştiğinde gün sayısını otomatik hesapla
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      // Tarihlerin geçerli olup olmadığını kontrol et
      if (start <= end) {
        // Gün farkını hesapla (dahil başlangıç ve bitiş)
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 çünkü her iki gün de dahil
        setTotalDays(diffDays);
      } else {
        setTotalDays(0);
      }
    } else {
      setTotalDays(0);
    }
  }, [startDate, endDate]);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedLeaveType || !startDate || !endDate || !returnDate || totalDays <= 0) {
      toast.error('Lütfen tüm alanları doldurun');
      return;
    }

    // Geçmiş tarih kontrolü - sadece çalışanlar için
    if (!isManager) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const requestStartDate = new Date(startDate);
      requestStartDate.setHours(0, 0, 0, 0);

      if (requestStartDate < today) {
        setShowPastDateWarning(true);
        return;
      }
    }

    await submitLeaveRequest();
  };

  const submitLeaveRequest = async () => {
    setSubmitting(true);
    try {
      await axios.post('/leave-requests/', {
        leave_type_id: parseInt(selectedLeaveType),
        start_date: startDate,
        end_date: endDate,
        return_to_work_date: returnDate,
        total_days: totalDays,
        message: message || null,
      });

      toast.success('İzin talebi başarıyla oluşturuldu');
      setShowRequestModal(false);
      setShowPastDateWarning(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error('İzin talebi oluşturulurken hata:', error);
      toast.error(error.response?.data?.detail || 'İzin talebi oluşturulamadı');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveRequest = async (requestId: number, approved: boolean) => {
    try {
      await axios.post(`/leave-requests/${requestId}/approve`, {
        approved,
        rejection_reason: approved ? null : rejectReason,
      });

      toast.success(approved ? 'İzin talebi onaylandı' : 'İzin talebi reddedildi');
      setApprovingRequest(null);
      setRejectReason('');
      fetchData();
    } catch (error: any) {
      console.error('İşlem sırasında hata:', error);
      toast.error(error.response?.data?.detail || 'İşlem başarısız');
    }
  };

  const handleCancelRequest = async (requestId: number) => {
    // Geçmiş tarih kontrolü - sadece manager için uyarı
    const leave = allRequests.find(r => r.id === requestId);
    if (leave && isManager && leave.status === 'APPROVED') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const leaveEndDate = new Date(leave.end_date);
      leaveEndDate.setHours(0, 0, 0, 0);

      if (leaveEndDate < today) {
        setPendingCancelId(requestId);
        setShowCancelPastLeaveWarning(true);
        return;
      }
    }

    await performCancelRequest(requestId);
  };

  const performCancelRequest = async (requestId: number) => {
    try {
      await axios.post(`/leave-requests/${requestId}/cancel`);
      toast.success('İzin talebi iptal edildi');
      setShowCancelPastLeaveWarning(false);
      setPendingCancelId(null);
      fetchData();
    } catch (error: any) {
      console.error('İzin talebi iptal edilirken hata:', error);
      toast.error(error.response?.data?.detail || 'İzin talebi iptal edilemedi');
    }
  };

  const handleExportToExcel = async () => {
    try {
      // Filtreleri parametreler olarak gönder
      const params: any = {};

      if (selectedEmployee !== 'all') {
        params.employee_name = selectedEmployee;
      }

      if (periodFilter === 'monthly') {
        const now = new Date();
        params.year = now.getFullYear();
        params.month = now.getMonth() + 1; // JavaScript months are 0-indexed
      } else if (periodFilter === 'yearly') {
        const now = new Date();
        params.year = now.getFullYear();
      }

      const response = await axios.get('/leave-requests/export', {
        params,
        responseType: 'blob'
      });

      const contentDisposition = response.headers['content-disposition'];
      let filename = 'onaylanmis_izinler.xlsx';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename=(.+)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Excel dosyası indirildi');
    } catch (error: any) {
      console.error('Excel export hatası:', error);
      toast.error('Excel dosyası indirilemedi');
    }
  };

  const handleEditLeaveDates = async (requestId: number) => {
    if (!editEndDate || !editReturnDate) {
      toast.error('Lütfen tüm tarihleri doldurun');
      return;
    }

    try {
      await axios.put(`/leave-requests/${requestId}/edit-dates?new_end_date=${editEndDate}&new_return_date=${editReturnDate}`);
      toast.success('İzin tarihleri güncellendi');
      setEditingLeave(null);
      setEditEndDate('');
      setEditReturnDate('');
      fetchData();
    } catch (error: any) {
      console.error('Tarih güncellenirken hata:', error);
      toast.error(error.response?.data?.detail || 'Tarih güncellenemedi');
    }
  };

  const resetForm = () => {
    setSelectedLeaveType('');
    setStartDate('');
    setEndDate('');
    setReturnDate('');
    setTotalDays(0);
    setMessage('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400';
      case 'REJECTED':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400';
      case 'CANCELLED':
        return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-400';
      default:
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="w-5 h-5" />;
      case 'REJECTED':
        return <XCircle className="w-5 h-5" />;
      case 'CANCELLED':
        return <Trash2 className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'Onaylandı';
      case 'REJECTED':
        return 'Reddedildi';
      case 'CANCELLED':
        return 'İptal Edildi';
      default:
        return 'Beklemede';
    }
  };

  // Yıllık izin hakkı görsel bileşeni
  const LeaveBalanceVisual = () => {
    const annualLeave = balances.find(b => b.leave_type_name === 'Yıllık İzin');
    if (!annualLeave) return null;

    const remaining = annualLeave.remaining_days;
    const isNegative = remaining < 0;
    const absValue = Math.abs(remaining);

    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Yıllık İzin Hakkınız</h3>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="relative h-8 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
              <div
                className={`absolute top-0 left-0 h-full ${isNegative ? 'bg-red-500' : 'bg-green-500'} transition-all duration-500`}
                style={{ width: `${Math.min((absValue / annualLeave.total_days) * 100, 100)}%` }}
              />
            </div>
          </div>
          <div className="text-right min-w-[100px]">
            <div className={`text-3xl font-bold ${isNegative ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
              {isNegative ? '-' : '+'}{absValue}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {annualLeave.total_days} günden
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-gray-600 dark:text-gray-400">Toplam Hak</div>
            <div className="font-semibold dark:text-white">{annualLeave.total_days} gün</div>
          </div>
          <div>
            <div className="text-gray-600 dark:text-gray-400">Kullanılan</div>
            <div className="font-semibold dark:text-white">{annualLeave.used_days} gün</div>
          </div>
          <div>
            <div className="text-gray-600 dark:text-gray-400">Kalan</div>
            <div className={`font-semibold ${isNegative ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
              {remaining} gün
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // İzin Talepleri tab için - TÜM talepler (pending, approved, rejected, cancelled)
  const requestsForTab = allRequests;
  // Pending taleplerin sayısı (badge için)
  const pendingCount = allRequests.filter(r => r.status === 'PENDING').length;

  // Onaylanmış izinler - filtrelenmiş
  const getFilteredApprovedLeaves = () => {
    let leaves = allRequests.filter(r => r.status === 'APPROVED');

    // Çalışan filtresi
    if (selectedEmployee !== 'all') {
      leaves = leaves.filter(l => l.employee_name === selectedEmployee);
    }

    // Periyot filtresi
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    if (periodFilter === 'monthly') {
      leaves = leaves.filter(l => {
        const leaveDate = new Date(l.start_date);
        return leaveDate.getFullYear() === currentYear && leaveDate.getMonth() === currentMonth;
      });
    } else if (periodFilter === 'yearly') {
      leaves = leaves.filter(l => {
        const leaveDate = new Date(l.start_date);
        return leaveDate.getFullYear() === currentYear;
      });
    }

    return leaves;
  };

  const approvedLeaves = getFilteredApprovedLeaves();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">İzin Yönetimi</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {isManager ? 'Çalışanların izinlerini yönetin ve kendi izinlerinizi talep edin' : 'İzin bakiyelerinizi görüntüleyin ve yeni izin talebi oluşturun'}
            </p>
          </div>
          <button
            onClick={() => setShowRequestModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-5 h-5" />
            Yeni İzin Talebi
          </button>
        </div>
      </div>

      {/* Bugün İzinli Banner */}
      {isOnLeaveToday?.is_on_leave && (
        <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-l-4 border-green-500 p-6 rounded-lg shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                Bugün İzinlisiniz
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                <strong>{isOnLeaveToday.leave_type}</strong> nedeniyle {' '}
                {new Date(isOnLeaveToday.start_date).toLocaleDateString('tr-TR')} - {' '}
                {new Date(isOnLeaveToday.end_date).toLocaleDateString('tr-TR')} tarihleri arasında izindesiniz.
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                İşe dönüş tarihiniz: <strong>{new Date(isOnLeaveToday.return_to_work_date).toLocaleDateString('tr-TR')}</strong>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Employee: Yıllık izin hakkı görseli */}
      {!isManager && <LeaveBalanceVisual />}

      {/* Employee: Bakiyeler */}
      {!isManager && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">İzin Bakiyelerim ({new Date().getFullYear()})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {balances.map((balance) => (
              <div key={balance.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">{balance.leave_type_name}</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Toplam Hak:</span>
                    <span className="font-medium dark:text-gray-200">{balance.total_days} gün</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Kullanılan:</span>
                    <span className="font-medium dark:text-gray-200">{balance.used_days} gün</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Kalan:</span>
                    <span className={`font-bold ${balance.remaining_days < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                      {balance.remaining_days} gün
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setCurrentTab('requests')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                currentTab === 'requests'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {isManager ? 'İzin Talepleri' : 'Taleplerim'}
              {pendingCount > 0 && (
                <span className="ml-2 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400 py-0.5 px-2 rounded-full text-xs">
                  {pendingCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setCurrentTab('leaves')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                currentTab === 'leaves'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {isManager ? 'İzinler' : 'İzinlerim'}
            </button>
            <button
              onClick={() => setCurrentTab('active')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                currentTab === 'active'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {isManager ? 'Aktif İzinler' : 'Aktif İzinlerim'}
              {activeLeaves.length > 0 && (
                <span className="ml-2 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 py-0.5 px-2 rounded-full text-xs">
                  {activeLeaves.length}
                </span>
              )}
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {/* İzin Talepleri Tab */}
        {currentTab === 'requests' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  {isManager && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Çalışan</th>}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">İzin Türü</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Başlangıç</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Bitiş</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Gün Sayısı</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Durum</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">İşlemler</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {requestsForTab.length === 0 ? (
                  <tr>
                    <td colSpan={isManager ? 7 : 6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      {isManager ? 'Hiç izin talebi bulunmuyor' : 'Henüz izin talebiniz bulunmamaktadır'}
                    </td>
                  </tr>
                ) : (
                  requestsForTab.map((request) => (
                    <tr key={request.id}>
                      {isManager && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {request.employee_name}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {request.leave_type_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(request.start_date).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(request.end_date).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {request.total_days} gün
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                          {getStatusIcon(request.status)}
                          {getStatusText(request.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        {request.status === 'PENDING' ? (
                          canApproveLeaves && request.employee_id !== user?.id ? (
                            <>
                              <button
                                onClick={() => handleApproveRequest(request.id, true)}
                                className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                              >
                                Onayla
                              </button>
                              <button
                                onClick={() => setApprovingRequest(request.id)}
                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                              >
                                Reddet
                              </button>
                            </>
                          ) : request.employee_id === user?.id ? (
                            <button
                              onClick={() => handleCancelRequest(request.id)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            >
                              İptal Et
                            </button>
                          ) : null
                        ) : request.status === 'APPROVED' ? (
                          <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-xs">
                              Onaylandı
                              {request.approver_name && ` - ${request.approver_name}`}
                            </span>
                          </div>
                        ) : request.status === 'REJECTED' ? (
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                              <XCircle className="w-4 h-4" />
                              <span className="text-xs">Reddedildi</span>
                            </div>
                            {request.rejection_reason && (
                              <span className="text-xs text-gray-500 dark:text-gray-400 italic">
                                "{request.rejection_reason}"
                              </span>
                            )}
                          </div>
                        ) : request.status === 'CANCELLED' ? (
                          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                            <XCircle className="w-4 h-4" />
                            <span className="text-xs">İptal Edildi</span>
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* İzinler Tab */}
        {currentTab === 'leaves' && (
          <>
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Onaylanmış İzinler
              </h2>
              <button
                onClick={handleExportToExcel}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                <Download className="w-5 h-5" />
                Excel'e Aktar
              </button>
            </div>

            {/* Filtreler */}
            {isManager && (
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <div className="flex flex-wrap gap-4">
                  {/* Periyot Filtresi */}
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Periyot:</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPeriodFilter('all')}
                        className={`px-4 py-2 text-sm rounded-lg transition ${
                          periodFilter === 'all'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                        }`}
                      >
                        Tümü
                      </button>
                      <button
                        onClick={() => setPeriodFilter('monthly')}
                        className={`px-4 py-2 text-sm rounded-lg transition ${
                          periodFilter === 'monthly'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                        }`}
                      >
                        Aylık
                      </button>
                      <button
                        onClick={() => setPeriodFilter('yearly')}
                        className={`px-4 py-2 text-sm rounded-lg transition ${
                          periodFilter === 'yearly'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                        }`}
                      >
                        Yıllık
                      </button>
                    </div>
                  </div>

                  {/* Çalışan Filtresi */}
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Çalışan:</label>
                    <select
                      value={selectedEmployee}
                      onChange={(e) => setSelectedEmployee(e.target.value)}
                      className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    >
                      <option value="all">Tüm Çalışanlar</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.full_name}>{emp.full_name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  {isManager && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Çalışan</th>}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">İzin Türü</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Başlangıç</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Bitiş</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Gün Sayısı</th>
                  {isManager && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Onaylayan</th>}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">İşlemler</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {approvedLeaves.length === 0 ? (
                  <tr>
                    <td colSpan={isManager ? 7 : 6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      Onaylanmış izin bulunmuyor
                    </td>
                  </tr>
                ) : (
                  approvedLeaves.map((request) => (
                    <tr key={request.id}>
                      {isManager && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {request.employee_name}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {request.leave_type_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(request.start_date).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(request.end_date).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {request.total_days} gün
                      </td>
                      {isManager && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {request.approver_name || '-'}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {canApproveLeaves && request.employee_id !== user?.id && (
                          <button
                            onClick={() => handleCancelRequest(request.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            İptal Et
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          </>
        )}

        {/* Aktif İzinler Tab */}
        {currentTab === 'active' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  {isManager && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Çalışan</th>}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">İzin Türü</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Başlangıç</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Bitiş</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Dönüş Tarihi</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Gün Sayısı</th>
                  {canApproveLeaves && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">İşlemler</th>}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {activeLeaves.length === 0 ? (
                  <tr>
                    <td colSpan={isManager ? 7 : 6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      Aktif izin bulunmuyor
                    </td>
                  </tr>
                ) : (
                  activeLeaves.map((request) => (
                    <tr key={request.id}>
                      {isManager && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {request.employee_name}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {request.leave_type_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(request.start_date).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {editingLeave === request.id ? (
                          <input
                            type="date"
                            value={editEndDate}
                            onChange={(e) => setEditEndDate(e.target.value)}
                            className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white text-sm"
                          />
                        ) : (
                          new Date(request.end_date).toLocaleDateString('tr-TR')
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {editingLeave === request.id ? (
                          <input
                            type="date"
                            value={editReturnDate}
                            onChange={(e) => setEditReturnDate(e.target.value)}
                            className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white text-sm"
                          />
                        ) : (
                          new Date(request.return_to_work_date).toLocaleDateString('tr-TR')
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {request.total_days} gün
                      </td>
                      {canApproveLeaves && request.employee_id !== user?.id && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                          {editingLeave === request.id ? (
                            <>
                              <button
                                onClick={() => handleEditLeaveDates(request.id)}
                                className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                              >
                                <Check className="w-4 h-4 inline" /> Kaydet
                              </button>
                              <button
                                onClick={() => {
                                  setEditingLeave(null);
                                  setEditEndDate('');
                                  setEditReturnDate('');
                                }}
                                className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                              >
                                <X className="w-4 h-4 inline" /> İptal
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingLeave(request.id);
                                setEditEndDate(request.end_date);
                                setEditReturnDate(request.return_to_work_date);
                              }}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              <Edit className="w-4 h-4 inline" /> Düzenle
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Yeni İzin Talebi Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Yeni İzin Talebi</h2>
            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  İzin Türü
                </label>
                <select
                  value={selectedLeaveType}
                  onChange={(e) => setSelectedLeaveType(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Seçiniz...</option>
                  {leaveTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name} ({type.max_days} gün)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Başlangıç Tarihi
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Bitiş Tarihi
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  İşe Dönüş Tarihi
                </label>
                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Toplam Gün Sayısı
                </label>
                <input
                  type="number"
                  value={totalDays}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Başlangıç ve bitiş tarihine göre otomatik hesaplanır
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Mesaj (Opsiyonel)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowRequestModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Gönderiliyor...' : 'Talep Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Geçmiş Tarih Uyarı Modal - İzin Talebi */}
      {showPastDateWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-8 h-8 text-yellow-600" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Geçmiş Tarih Uyarısı</h3>
            </div>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Geçmiş tarih için izin talebi oluşturuyorsunuz. Devam etmek istiyor musunuz?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPastDateWarning(false);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                İptal
              </button>
              <button
                onClick={() => submitLeaveRequest()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Devam Et
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Geçmiş Tarih Uyarı Modal - İzin İptali */}
      {showCancelPastLeaveWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Geçmiş Tarih İptal Uyarısı</h3>
            </div>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Geçmiş tarihte onaylanıp kullanılmış bir izni iptal ediyorsunuz. Bu işlem izin bakiyesini geri iade edecektir. Devam etmek istiyor musunuz?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCancelPastLeaveWarning(false);
                  setPendingCancelId(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                İptal
              </button>
              <button
                onClick={() => {
                  if (pendingCancelId) {
                    performCancelRequest(pendingCancelId);
                  }
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Devam Et ve İptal Et
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Red Nedeni Modal */}
      {approvingRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">İzin Talebini Reddet</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Red Nedeni
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={4}
                  required
                  placeholder="Lütfen red nedenini açıklayın..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setApprovingRequest(null);
                    setRejectReason('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  İptal
                </button>
                <button
                  onClick={() => handleApproveRequest(approvingRequest, false)}
                  disabled={!rejectReason.trim()}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Reddet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
