'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from '@/lib/axios';
import { UserPlus, Users, UserCheck, UserX, Edit, Palette, Key, Palmtree, Calendar } from 'lucide-react';
import { toast } from 'react-toastify';

interface User {
  id: number;
  full_name: string;
  email: string;
  role: string;
  phone?: string;
  is_active: boolean;
  hire_date?: string;
  created_at: string;
  permissions?: {
    view_all_leaves: boolean;
    view_all_daily_reports: boolean;
    view_all_weekly_plans: boolean;
    approve_leaves: boolean;
    manage_leave_types: boolean;
    manage_roles: boolean;
    manage_performance_scale: boolean;
    dashboard_full_access: boolean;
  };
}

interface ColorScale {
  id: number;
  color: string;
  min_visits: number;
  max_visits: number | null;
}

interface LeaveType {
  id: number;
  name: string;
  max_days: number;
  is_paid: boolean;
  is_active: boolean;
  gender_restriction: 'NONE' | 'MALE_ONLY' | 'FEMALE_ONLY';
  description?: string;
}

interface AnnualLeaveRule {
  id: number;
  year_of_service: number;
  days_entitled: number;
}

export default function SettingsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'colors' | 'leave-types' | 'annual-leave-rules'>('users');

  // User management states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [managerPassword, setManagerPassword] = useState('');
  const [pendingAction, setPendingAction] = useState<{type: 'deactivate' | 'changeRole', userId: number, newRole?: string} | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('active');

  // Color scale states
  const [colorScales, setColorScales] = useState<ColorScale[]>([]);
  const [editingScales, setEditingScales] = useState<ColorScale[]>([]);
  const [isEditingScales, setIsEditingScales] = useState(false);

  // Leave types states
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [showLeaveTypeModal, setShowLeaveTypeModal] = useState(false);
  const [editingLeaveType, setEditingLeaveType] = useState<LeaveType | null>(null);
  const [leaveTypeForm, setLeaveTypeForm] = useState({
    name: '',
    max_days: 0,
    is_paid: true,
    gender_restriction: 'NONE' as 'NONE' | 'MALE_ONLY' | 'FEMALE_ONLY',
    description: ''
  });

  // Permissions management states
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [editingUserPermissions, setEditingUserPermissions] = useState<User | null>(null);
  const [permissionsForm, setPermissionsForm] = useState({
    view_all_leaves: false,
    view_all_daily_reports: false,
    view_all_weekly_plans: false,
    approve_leaves: false,
    manage_leave_types: false,
    manage_roles: false,
    manage_performance_scale: false,
    dashboard_full_access: false
  });

  // Annual leave rules states
  const [annualLeaveRules, setAnnualLeaveRules] = useState<AnnualLeaveRule[]>([]);
  const [editingRules, setEditingRules] = useState<AnnualLeaveRule[]>([]);
  const [isEditingRules, setIsEditingRules] = useState(false);

  // New user form
  const [newUser, setNewUser] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'EMPLOYEE',
    phone: ''
  });

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
      const [userRes, usersRes, colorScalesRes, leaveTypesRes, annualLeaveRulesRes] = await Promise.all([
        axios.get('/employees/me'),
        axios.get('/employees'),
        axios.get('/settings/visit-color-scales'),
        axios.get('/leave-types?include_inactive=true'),
        axios.get('/annual-leave-rules')
      ]);

      setCurrentUser(userRes.data);
      setUsers(usersRes.data);
      setColorScales(colorScalesRes.data);
      setEditingScales(JSON.parse(JSON.stringify(colorScalesRes.data))); // Deep copy
      setLeaveTypes(leaveTypesRes.data);
      setAnnualLeaveRules(annualLeaveRulesRes.data);
      setEditingRules(JSON.parse(JSON.stringify(annualLeaveRulesRes.data))); // Deep copy

      // Only MANAGER/ADMIN can access this page
      if (userRes.data.role !== 'MANAGER' && userRes.data.role !== 'ADMIN') {
        toast.error('Bu sayfaya erişim yetkiniz yok!');
        router.push('/');
        return;
      }
    } catch (error) {
      console.error('Error:', error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/employees', newUser);
      toast.success('Kullanıcı başarıyla eklendi!');
      setShowAddModal(false);
      setNewUser({ full_name: '', email: '', password: '', role: 'EMPLOYEE', phone: '' });
      fetchData();
    } catch (error: any) {
      console.error('Add user error:', error);
      toast.error(error.response?.data?.detail || 'Kullanıcı eklenirken hata oluştu.');
    }
  };

  const handleToggleActive = async (userId: number, currentStatus: boolean) => {
    if (currentStatus) {
      setPendingAction({ type: 'deactivate', userId });
      setShowPasswordModal(true);
    } else {
      try {
        await axios.patch(`/employees/${userId}/activate`);
        toast.success('Kullanıcı aktif hale getirildi.');
        fetchData();
      } catch (error: any) {
        console.error('Activate error:', error);
        toast.error(error.response?.data?.detail || 'İşlem sırasında hata oluştu.');
      }
    }
  };

  const handleChangeRole = (userId: number, newRole: string) => {
    setPendingAction({ type: 'changeRole', userId, newRole });
    setShowPasswordModal(true);
  };

  const handlePasswordSubmit = async () => {
    if (!managerPassword.trim()) {
      toast.error('Lütfen şifrenizi girin!');
      return;
    }

    if (!pendingAction) return;

    try {
      if (pendingAction.type === 'deactivate') {
        await axios.patch(`/employees/${pendingAction.userId}/deactivate?manager_password=${encodeURIComponent(managerPassword)}`);
        toast.success('Kullanıcı pasif hale getirildi.');
      } else if (pendingAction.type === 'changeRole') {
        await axios.patch(`/employees/${pendingAction.userId}/change-role?new_role=${pendingAction.newRole}&manager_password=${encodeURIComponent(managerPassword)}`);
        toast.success('Kullanıcı rolü değiştirildi.');
      }

      setShowPasswordModal(false);
      setManagerPassword('');
      setPendingAction(null);
      fetchData();
    } catch (error: any) {
      console.error('Password verify error:', error);
      if (error.response?.status === 401) {
        toast.error('Hatalı şifre! Lütfen tekrar deneyin.');
      } else if (error.response?.status === 403) {
        toast.error('Bu işlem için yetkiniz yok.');
        setShowPasswordModal(false);
        setManagerPassword('');
        setPendingAction(null);
      } else {
        toast.error(error.response?.data?.detail || 'İşlem sırasında hata oluştu.');
      }
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword.trim()) {
      toast.error('Lütfen yeni şifre girin!');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Şifre en az 6 karakter olmalıdır!');
      return;
    }

    try {
      await axios.post(`/settings/reset-password/${selectedUserId}?new_password=${encodeURIComponent(newPassword)}`);
      toast.success('Şifre başarıyla sıfırlandı!');
      setShowResetPasswordModal(false);
      setNewPassword('');
      setSelectedUserId(null);
    } catch (error: any) {
      console.error('Reset password error:', error);
      toast.error(error.response?.data?.detail || 'Şifre sıfırlama başarısız oldu.');
    }
  };

  const handleSaveColorScales = async () => {
    // Validate scales
    const sortedScales = [...editingScales].sort((a, b) => a.min_visits - b.min_visits);

    // Check if first starts at 0
    if (sortedScales[0].min_visits !== 0) {
      toast.error('İlk renk skalası 0\'dan başlamalıdır!');
      return;
    }

    // Check for overlaps/gaps
    for (let i = 1; i < sortedScales.length; i++) {
      const prev = sortedScales[i - 1];
      const curr = sortedScales[i];

      if (prev.max_visits === null) {
        toast.error('Sadece son renk skalası sınırsız olabilir!');
        return;
      }

      if (curr.min_visits !== prev.max_visits + 1) {
        toast.error(`Renk skalaları arasında boşluk veya çakışma var!\n${prev.color}: ${prev.min_visits}-${prev.max_visits}\n${curr.color}: ${curr.min_visits} ile başlıyor`);
        return;
      }
    }

    // Last should have no max
    if (sortedScales[sortedScales.length - 1].max_visits !== null) {
      toast.error('Son renk skalası sınırsız olmalıdır!');
      return;
    }

    try {
      const response = await axios.put('/settings/visit-color-scales', editingScales);
      setColorScales(response.data);
      setEditingScales(JSON.parse(JSON.stringify(response.data)));
      setIsEditingScales(false);
      toast.success('Renk skalası ayarları başarıyla güncellendi!');
    } catch (error: any) {
      console.error('Save color scales error:', error);
      toast.error(error.response?.data?.detail || 'Renk skalası güncellenemedi.');
    }
  };

  const getColorInfo = (color: string) => {
    switch (color) {
      case 'yellow':
        return { label: 'Sarı', bgClass: 'bg-yellow-100 dark:bg-yellow-900/30', textClass: 'text-yellow-900 dark:text-yellow-200' };
      case 'orange':
        return { label: 'Turuncu', bgClass: 'bg-orange-200 dark:bg-orange-700/60', textClass: 'text-orange-900 dark:text-orange-100' };
      case 'green':
        return { label: 'Yeşil', bgClass: 'bg-green-100 dark:bg-green-900/30', textClass: 'text-green-900 dark:text-green-200' };
      default:
        return { label: color, bgClass: 'bg-gray-100', textClass: 'text-gray-900' };
    }
  };

  const handleSaveAnnualLeaveRules = async () => {
    // Validate rules
    if (editingRules.length === 0) {
      toast.error('En az bir yıllık izin kuralı eklemelisiniz!');
      return;
    }

    // Check all have valid values
    for (const rule of editingRules) {
      if (rule.days_entitled < 0) {
        toast.error('Gün sayısı negatif olamaz!');
        return;
      }
    }

    try {
      const response = await axios.put('/annual-leave-rules', {
        rules: editingRules
      });
      setAnnualLeaveRules(response.data);
      setEditingRules(JSON.parse(JSON.stringify(response.data)));
      setIsEditingRules(false);
      toast.success('Yıllık izin kuralları başarıyla güncellendi!');
    } catch (error: any) {
      console.error('Save annual leave rules error:', error);
      toast.error(error.response?.data?.detail || 'Yıllık izin kuralları güncellenemedi.');
    }
  };

  const handleAddOrUpdateLeaveType = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingLeaveType) {
        await axios.put(`/leave-types/${editingLeaveType.id}`, leaveTypeForm);
        toast.success('İzin türü başarıyla güncellendi!');
      } else {
        await axios.post('/leave-types', leaveTypeForm);
        toast.success('İzin türü başarıyla eklendi!');
      }
      setShowLeaveTypeModal(false);
      setEditingLeaveType(null);
      setLeaveTypeForm({ name: '', max_days: 0, is_paid: true, gender_restriction: 'NONE', description: '' });
      fetchData();
    } catch (error: any) {
      console.error('Leave type error:', error);
      toast.error(error.response?.data?.detail || 'İşlem başarısız oldu.');
    }
  };

  const handleToggleLeaveTypeActive = async (id: number) => {
    try {
      await axios.patch(`/leave-types/${id}/toggle-active`);
      toast.success('İzin türü durumu değiştirildi!');
      fetchData();
    } catch (error: any) {
      console.error('Toggle leave type error:', error);
      toast.error(error.response?.data?.detail || 'İşlem başarısız oldu.');
    }
  };

  const handleDeleteLeaveType = async (id: number) => {
    if (!confirm('Bu izin türünü silmek istediğinizden emin misiniz?')) {
      return;
    }
    try {
      await axios.delete(`/leave-types/${id}`);
      toast.success('İzin türü başarıyla silindi!');
      fetchData();
    } catch (error: any) {
      console.error('Delete leave type error:', error);
      toast.error(error.response?.data?.detail || 'İzin türü silinemedi. Kullanımda olan izin türleri silinemez.');
    }
  };

  const getGenderRestrictionLabel = (restriction: string) => {
    switch (restriction) {
      case 'NONE': return 'Yok';
      case 'MALE_ONLY': return 'Sadece Erkek';
      case 'FEMALE_ONLY': return 'Sadece Kadın';
      default: return restriction;
    }
  };

  const handleEditPermissions = (user: User) => {
    setEditingUserPermissions(user);
    setPermissionsForm(user.permissions || {
      view_all_leaves: false,
      view_all_daily_reports: false,
      view_all_weekly_plans: false,
      approve_leaves: false,
      manage_leave_types: false,
      manage_roles: false,
      manage_performance_scale: false,
      dashboard_full_access: false
    });
    setShowPermissionsModal(true);
  };

  const handleSavePermissions = async () => {
    if (!editingUserPermissions) return;

    try {
      await axios.patch(`/employees/${editingUserPermissions.id}/permissions`, permissionsForm);
      toast.success('Yetkiler başarıyla güncellendi!');
      setShowPermissionsModal(false);
      setEditingUserPermissions(null);
      fetchData();
    } catch (error: any) {
      console.error('Permissions update error:', error);
      toast.error(error.response?.data?.detail || 'Yetkiler güncellenirken hata oluştu.');
    }
  };

  const filteredUsers = users.filter(user => {
    if (filter === 'active') return user.is_active;
    if (filter === 'inactive') return !user.is_active;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900">
        <div className="text-xl text-gray-600 dark:text-gray-300">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">Ayarlar</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">Sistem ayarlarını yönetin</p>
      </div>

      {/* Tabs */}
      <div className="mb-4 sm:mb-6 border-b border-gray-200 dark:border-gray-700 overflow-x-auto -mx-2 sm:mx-0">
        <nav className="-mb-px flex space-x-4 sm:space-x-8 px-2 sm:px-0">
          <button
            onClick={() => setActiveTab('users')}
            className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
              activeTab === 'users'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400'
            }`}
          >
            <div className="flex items-center gap-1 sm:gap-2">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Kullanıcı Yönetimi</span>
              <span className="sm:hidden">Kullanıcı</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('colors')}
            className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
              activeTab === 'colors'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400'
            }`}
          >
            <div className="flex items-center gap-1 sm:gap-2">
              <Palette className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Durum Raporu Renk Skalası</span>
              <span className="sm:hidden">Renkler</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('leave-types')}
            className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
              activeTab === 'leave-types'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400'
            }`}
          >
            <div className="flex items-center gap-1 sm:gap-2">
              <Palmtree className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">İzin Türleri</span>
              <span className="sm:hidden">İzinler</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('annual-leave-rules')}
            className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
              activeTab === 'annual-leave-rules'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400'
            }`}
          >
            <div className="flex items-center gap-1 sm:gap-2">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Yıllık İzin Hakları</span>
              <span className="sm:hidden">Yıllık İzin</span>
            </div>
          </button>
        </nav>
      </div>

      {/* User Management Tab */}
      {activeTab === 'users' && (
        <>
          {/* ADMIN Info Banner */}
          {currentUser?.role === 'ADMIN' && (
            <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 rounded-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    <span className="font-medium">ADMIN yetkisi:</span> Tüm kullanıcıları görüntüleyebilir ve pasif/aktif yapabilirsiniz.
                    Ancak kullanıcı rollerini değiştirmek için <span className="font-semibold">MANAGER</span> yetkisi gereklidir.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Header with Add Button */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <Users className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Kullanıcı Yönetimi</h2>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm sm:text-base whitespace-nowrap"
            >
              <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Yeni Kullanıcı Ekle</span>
              <span className="sm:hidden">Kullanıcı Ekle</span>
            </button>
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2 sm:gap-4 mb-4 sm:mb-6">
            <button
              onClick={() => setFilter('active')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm ${filter === 'active' ? 'bg-green-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
            >
              Aktif ({users.filter(u => u.is_active).length})
            </button>
            <button
              onClick={() => setFilter('inactive')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm ${filter === 'inactive' ? 'bg-red-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
            >
              Pasif ({users.filter(u => !u.is_active).length})
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
            >
              Tümü ({users.length})
            </button>
          </div>

          {/* Users Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto -mx-2 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Durum</th>
                    <th className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ad Soyad</th>
                    <th className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                    <th className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Rol</th>
                    <th className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Telefon</th>
                    <th className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className={!user.is_active ? 'opacity-60' : ''}>
                      <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap">
                        {user.is_active ? (
                          <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <UserCheck className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                            <span className="hidden sm:inline">Aktif</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <UserX className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                            <span className="hidden sm:inline">Pasif</span>
                          </span>
                        )}
                      </td>
                      <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-900 dark:text-white break-words max-w-[120px] sm:max-w-none">{user.full_name}</td>
                      <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-500 dark:text-gray-300 break-words max-w-[150px] sm:max-w-none">{user.email}</td>
                      <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap">
                        {user.id === currentUser?.id || currentUser?.role === 'ADMIN' ? (
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.role === 'MANAGER' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300' :
                            user.role === 'ADMIN' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' :
                            'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                          }`}>
                            {user.role}
                          </span>
                        ) : (
                          <select
                            value={user.role}
                            onChange={(e) => handleChangeRole(user.id, e.target.value)}
                            className={`px-2 py-1 text-xs font-semibold rounded-full border-2 cursor-pointer ${
                              user.role === 'MANAGER' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-700' :
                              user.role === 'ADMIN' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700' :
                              'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700'
                            }`}
                          >
                            <option value="EMPLOYEE">EMPLOYEE</option>
                            <option value="MANAGER">MANAGER</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                        )}
                      </td>
                      <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-500 dark:text-gray-300 break-words max-w-[100px] sm:max-w-none">{user.phone || '-'}</td>
                      <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm">
                        <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                          <button
                            onClick={() => handleToggleActive(user.id, user.is_active)}
                            disabled={user.id === currentUser?.id}
                            className={`px-2 sm:px-3 py-1 rounded-lg text-white whitespace-nowrap text-xs ${
                              user.id === currentUser?.id
                                ? 'bg-gray-400 cursor-not-allowed'
                                : user.is_active
                                ? 'bg-red-600 hover:bg-red-700'
                                : 'bg-green-600 hover:bg-green-700'
                            }`}
                          >
                            {user.is_active ? 'Pasif Yap' : 'Aktif Yap'}
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUserId(user.id);
                              setShowResetPasswordModal(true);
                            }}
                            className="px-2 sm:px-3 py-1 rounded-lg bg-orange-600 hover:bg-orange-700 text-white inline-flex items-center justify-center gap-1 whitespace-nowrap text-xs"
                          >
                            <Key className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="hidden lg:inline">Şifre Sıfırla</span>
                            <span className="lg:hidden">Şifre</span>
                          </button>
                          {currentUser?.role === 'MANAGER' && user.role !== 'MANAGER' && (
                            <button
                              onClick={() => handleEditPermissions(user)}
                              className="px-2 sm:px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white inline-flex items-center justify-center gap-1 whitespace-nowrap text-xs"
                            >
                              <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span className="hidden lg:inline">Yetki Düzenle</span>
                              <span className="lg:hidden">Yetki</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Color Scale Tab */}
      {activeTab === 'colors' && (
        <div>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4 sm:mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">Durum Raporu Renk Skalası</h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Hekim ziyaretlerine göre renk skalası ayarlarını belirleyin</p>
            </div>
            {!isEditingScales ? (
              <button
                onClick={() => setIsEditingScales(true)}
                className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 whitespace-nowrap text-sm sm:text-base"
              >
                <Edit className="w-4 h-4 sm:w-5 sm:h-5" />
                Düzenle
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingScales(JSON.parse(JSON.stringify(colorScales)));
                    setIsEditingScales(false);
                  }}
                  className="px-3 sm:px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm sm:text-base"
                >
                  İptal
                </button>
                <button
                  onClick={handleSaveColorScales}
                  className="px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm sm:text-base"
                >
                  Kaydet
                </button>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6">
            {(isEditingScales ? editingScales : colorScales)
              .sort((a, b) => a.min_visits - b.min_visits)
              .map((scale) => {
                const colorInfo = getColorInfo(scale.color);
                return (
                  <div key={scale.id} className={`p-6 rounded-lg ${colorInfo.bgClass} border-2 border-${scale.color}-500`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-16 h-16 rounded-lg ${colorInfo.bgClass} border-4 border-${scale.color}-500`}></div>
                        <div>
                          <h3 className={`text-xl font-bold ${colorInfo.textClass}`}>{colorInfo.label}</h3>
                          <p className={`text-sm ${colorInfo.textClass}`}>
                            {isEditingScales ? 'Ziyaret aralığını düzenleyin' : `${scale.min_visits}${scale.max_visits !== null ? ` - ${scale.max_visits}` : '+'} hekim ziyareti`}
                          </p>
                        </div>
                      </div>

                      {isEditingScales && (
                        <div className="flex items-center gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">Minimum</label>
                            <input
                              type="number"
                              min="0"
                              value={scale.min_visits}
                              onChange={(e) => {
                                const updated = [...editingScales];
                                const idx = updated.findIndex(s => s.id === scale.id);
                                updated[idx].min_visits = parseInt(e.target.value) || 0;
                                setEditingScales(updated);
                              }}
                              className="w-24 px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Maximum</label>
                            <input
                              type="number"
                              min="0"
                              value={scale.max_visits ?? ''}
                              placeholder="Sınırsız"
                              onChange={(e) => {
                                const updated = [...editingScales];
                                const idx = updated.findIndex(s => s.id === scale.id);
                                updated[idx].max_visits = e.target.value === '' ? null : parseInt(e.target.value);
                                setEditingScales(updated);
                              }}
                              className="w-24 px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>

          <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 p-4 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Not:</strong> Renk skalaları arasında boşluk veya çakışma olmamalıdır. İlk skala 0'dan başlamalı, son skala sınırsız olmalıdır.
            </p>
          </div>
        </div>
      )}

      {/* Leave Types Tab */}
      {activeTab === 'leave-types' && (
        <div>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4 sm:mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">İzin Türleri Yönetimi</h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Şirketteki tüm izin türlerini yönetin</p>
            </div>
            <button
              onClick={() => {
                setEditingLeaveType(null);
                setLeaveTypeForm({ name: '', max_days: 0, is_paid: true, gender_restriction: 'NONE', description: '' });
                setShowLeaveTypeModal(true);
              }}
              className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 text-sm sm:text-base whitespace-nowrap"
            >
              <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Yeni İzin Türü Ekle</span>
              <span className="sm:hidden">İzin Türü Ekle</span>
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto -mx-2 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Durum</th>
                  <th className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">İzin Adı</th>
                  <th className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Max Gün</th>
                  <th className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ücretli</th>
                  <th className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Cinsiyet Kısıtı</th>
                  <th className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Açıklama</th>
                  <th className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">İşlemler</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {leaveTypes.map((leaveType) => (
                  <tr key={leaveType.id} className={!leaveType.is_active ? 'opacity-60' : ''}>
                    <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap">
                      {leaveType.is_active ? (
                        <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Pasif
                        </span>
                      )}
                    </td>
                    <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-900 dark:text-white break-words max-w-[120px] sm:max-w-none">{leaveType.name}</td>
                    <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 dark:text-gray-300">{leaveType.max_days} gün</td>
                    <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap">
                      {leaveType.is_paid ? (
                        <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Ücretli
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Ücretsiz
                        </span>
                      )}
                    </td>
                    <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-500 dark:text-gray-300 break-words max-w-[100px] sm:max-w-none">
                      {getGenderRestrictionLabel(leaveType.gender_restriction)}
                    </td>
                    <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-500 dark:text-gray-300 max-w-[150px] sm:max-w-xs break-words">
                      {leaveType.description || '-'}
                    </td>
                    <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 text-xs sm:text-sm">
                      <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                        <button
                          onClick={() => {
                            setEditingLeaveType(leaveType);
                            setLeaveTypeForm({
                              name: leaveType.name,
                              max_days: leaveType.max_days,
                              is_paid: leaveType.is_paid,
                              gender_restriction: leaveType.gender_restriction,
                              description: leaveType.description || ''
                            });
                            setShowLeaveTypeModal(true);
                          }}
                          className="px-2 sm:px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs whitespace-nowrap"
                        >
                          <Edit className="w-3 h-3 sm:w-4 sm:h-4 inline" />
                        </button>
                        {leaveType.name === 'Yıllık İzin' ? (
                          <button
                            disabled
                            className="px-2 sm:px-3 py-1 rounded-lg text-white bg-gray-400 cursor-not-allowed text-xs whitespace-nowrap"
                            title="Yıllık İzin türü pasif yapılamaz"
                          >
                            {leaveType.is_active ? 'Pasif' : 'Aktif'}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleLeaveTypeActive(leaveType.id)}
                            className={`px-2 sm:px-3 py-1 rounded-lg text-white text-xs whitespace-nowrap ${
                              leaveType.is_active
                                ? 'bg-orange-600 hover:bg-orange-700'
                                : 'bg-green-600 hover:bg-green-700'
                            }`}
                          >
                            {leaveType.is_active ? 'Pasif' : 'Aktif'}
                          </button>
                        )}
                        {leaveType.name === 'Yıllık İzin' ? (
                          <button
                            disabled
                            className="px-2 sm:px-3 py-1 rounded-lg text-white bg-gray-400 cursor-not-allowed text-xs whitespace-nowrap"
                            title="Yıllık İzin türü silinemez"
                          >
                            Sil
                          </button>
                        ) : (
                          <button
                            onClick={() => handleDeleteLeaveType(leaveType.id)}
                            className="px-2 sm:px-3 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs whitespace-nowrap"
                          >
                            Sil
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 p-4 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Yıllık İzin Türü Hakkında:</strong> &quot;Yıllık İzin&quot; türü sistem tarafından özel olarak kullanılmaktadır.
              Bu tür <strong>Yıllık İzin Hakları</strong> sekmesinde belirlediğiniz kurallar ile bağlantılıdır ve çalışanların
              işe giriş tarihine göre otomatik hesaplanır. Bu nedenle pasif yapılamaz ve silinemez.
            </p>
          </div>

          <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 rounded-lg">
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              <strong>Not:</strong> Kullanımda olan izin türleri silinemez. Eğer bir izin türünü kullanmak istemiyorsanız,
              &quot;Pasif Yap&quot; butonunu kullanarak pasif hale getirebilirsiniz.
            </p>
          </div>
        </div>
      )}

      {/* Annual Leave Rules Tab */}
      {activeTab === 'annual-leave-rules' && (
        <div>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4 sm:mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">Yıllık İzin Hakkı Kuralları</h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Çalışma yılına göre yıllık izin hakkı günlerini belirleyin
              </p>
            </div>
            {!isEditingRules ? (
              <button
                onClick={() => setIsEditingRules(true)}
                className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 whitespace-nowrap text-sm sm:text-base"
                disabled={currentUser?.role !== 'MANAGER'}
              >
                <Edit className="w-4 h-4 sm:w-5 sm:h-5" />
                Düzenle
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingRules(JSON.parse(JSON.stringify(annualLeaveRules)));
                    setIsEditingRules(false);
                  }}
                  className="px-3 sm:px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm sm:text-base"
                >
                  İptal
                </button>
                <button
                  onClick={handleSaveAnnualLeaveRules}
                  className="px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm sm:text-base"
                >
                  Kaydet
                </button>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto -mx-2 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Çalışma Yılı
                    </th>
                    <th className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Hak Edilen Gün Sayısı
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {(isEditingRules ? editingRules : annualLeaveRules)
                    .sort((a, b) => a.year_of_service - b.year_of_service)
                    .map((rule, index) => (
                      <tr key={rule.id}>
                        <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                            {rule.year_of_service}. Yıl
                          </span>
                        </td>
                        <td className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4 whitespace-nowrap">
                          {isEditingRules ? (
                            <input
                              type="number"
                              min="0"
                              value={rule.days_entitled}
                              onChange={(e) => {
                                const updated = [...editingRules];
                                updated[index].days_entitled = parseInt(e.target.value) || 0;
                                setEditingRules(updated);
                              }}
                              className="w-20 sm:w-24 px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-xs sm:text-sm"
                            />
                          ) : (
                            <span className="text-xs sm:text-sm text-gray-900 dark:text-white">
                              {rule.days_entitled} gün
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 p-4 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Not:</strong> Çalışanların yıllık izin bakiyeleri, işe giriş tarihlerine göre bu kurallar kullanılarak otomatik olarak hesaplanır.
              <br />
              Örneğin: 2. yılını dolduran bir çalışan için 2. yıldaki gün sayısı uygulanır.
            </p>
          </div>

          <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 rounded-lg">
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              <strong>Türk İş Kanunu Varsayılan Kuralları:</strong>
              <br />
              • 1-4 yıl arası: 14 gün yıllık izin
              <br />
              • 5-14 yıl arası: 20 gün yıllık izin
              <br />
              • 15 yıl ve üzeri: 26 gün yıllık izin
            </p>
          </div>
        </div>
      )}

      {/* Leave Type Modal */}
      {showLeaveTypeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              {editingLeaveType ? 'İzin Türünü Düzenle' : 'Yeni İzin Türü Ekle'}
            </h3>
            <form onSubmit={handleAddOrUpdateLeaveType} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">İzin Adı</label>
                <input
                  type="text"
                  required
                  value={leaveTypeForm.name}
                  onChange={(e) => setLeaveTypeForm({...leaveTypeForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Örn: Yıllık İzin"
                />
              </div>

              {editingLeaveType?.name === 'Yıllık İzin' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Maksimum Gün Sayısı</label>
                  <p className="mt-2 text-sm text-blue-600 dark:text-blue-400">
                    💡 Yıllık İzin günleri <strong>Yıllık İzin Hakları</strong> sekmesinden düzenleyebilirsiniz.
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Maksimum Gün Sayısı</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={leaveTypeForm.max_days}
                    onChange={(e) => setLeaveTypeForm({...leaveTypeForm, max_days: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ücretli mi?</label>
                <select
                  value={leaveTypeForm.is_paid ? 'true' : 'false'}
                  onChange={(e) => setLeaveTypeForm({...leaveTypeForm, is_paid: e.target.value === 'true'})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="true">Ücretli</option>
                  <option value="false">Ücretsiz</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cinsiyet Kısıtı</label>
                <select
                  value={leaveTypeForm.gender_restriction}
                  onChange={(e) => setLeaveTypeForm({...leaveTypeForm, gender_restriction: e.target.value as 'NONE' | 'MALE_ONLY' | 'FEMALE_ONLY'})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="NONE">Yok</option>
                  <option value="MALE_ONLY">Sadece Erkek</option>
                  <option value="FEMALE_ONLY">Sadece Kadın</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Açıklama (Opsiyonel)</label>
                <textarea
                  value={leaveTypeForm.description}
                  onChange={(e) => setLeaveTypeForm({...leaveTypeForm, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="İzin türü hakkında açıklama..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowLeaveTypeModal(false);
                    setEditingLeaveType(null);
                    setLeaveTypeForm({ name: '', max_days: 0, is_paid: true, gender_restriction: 'NONE', description: '' });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingLeaveType ? 'Güncelle' : 'Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Verification Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Yönetici Şifresi Gerekli</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              {pendingAction?.type === 'deactivate'
                ? 'Kullanıcıyı pasif yapmak için yönetici şifrenizi girin.'
                : 'Kullanıcı rolünü değiştirmek için yönetici şifrenizi girin.'}
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Şifre</label>
                <input
                  type="password"
                  autoFocus
                  value={managerPassword}
                  onChange={(e) => setManagerPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handlePasswordSubmit();
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Yönetici şifrenizi girin"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setManagerPassword('');
                    setPendingAction(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500"
                >
                  İptal
                </button>
                <button
                  type="button"
                  onClick={handlePasswordSubmit}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Onayla
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Şifre Sıfırla</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              Kullanıcı için yeni bir şifre belirleyin. Kullanıcı bu şifre ile giriş yapabilecektir.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Yeni Şifre</label>
                <input
                  type="password"
                  autoFocus
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleResetPassword();
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="En az 6 karakter"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowResetPasswordModal(false);
                    setNewPassword('');
                    setSelectedUserId(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500"
                >
                  İptal
                </button>
                <button
                  type="button"
                  onClick={handleResetPassword}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  Şifreyi Sıfırla
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Yeni Kullanıcı Ekle</h3>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ad Soyad</label>
                <input
                  type="text"
                  required
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({...newUser, full_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Şifre</label>
                <input
                  type="password"
                  required
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rol</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="EMPLOYEE">Çalışan</option>
                  <option value="MANAGER">Yönetici</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Telefon (Opsiyonel)</label>
                <input
                  type="tel"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setNewUser({ full_name: '', email: '', password: '', role: 'EMPLOYEE', phone: '' });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Ekle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Permissions Modal */}
      {showPermissionsModal && editingUserPermissions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Yetki Düzenle</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {editingUserPermissions.full_name} ({editingUserPermissions.email})
              </p>
            </div>

            <div className="space-y-4">
              {/* Dashboard Full Access */}
              <div className="p-4 border-2 border-blue-200 dark:border-blue-700 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 dark:text-white">Dashboard Tam Erişim</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Tüm verileri dashboard'da görebilir (aktif değilse sadece kendi verilerini görür)
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPermissionsForm({...permissionsForm, dashboard_full_access: !permissionsForm.dashboard_full_access})}
                    className={`relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      permissionsForm.dashboard_full_access ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        permissionsForm.dashboard_full_access ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </label>
              </div>

              {/* View All Leaves */}
              <div className="p-4 border-2 border-purple-200 dark:border-purple-700 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 dark:text-white">Tüm İzinleri Görüntüleme</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Tüm çalışanların izinlerini görüntüleyebilir
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPermissionsForm({...permissionsForm, view_all_leaves: !permissionsForm.view_all_leaves})}
                    className={`relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                      permissionsForm.view_all_leaves ? 'bg-purple-600' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        permissionsForm.view_all_leaves ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </label>
              </div>

              {/* Approve Leaves */}
              <div className="p-4 border-2 border-pink-200 dark:border-pink-700 rounded-lg bg-pink-50 dark:bg-pink-900/20">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 dark:text-white">İzin Onaylayabilme</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Çalışanların izin taleplerini onaylayabilir veya reddedebilir. Bu yetki açıldığında "Tüm İzinleri Görüntüleme" yetkisi de otomatik olarak açılır.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newValue = !permissionsForm.approve_leaves;
                      // Eğer approve_leaves açılıyorsa view_all_leaves'i de aç
                      if (newValue) {
                        setPermissionsForm({...permissionsForm, approve_leaves: true, view_all_leaves: true});
                      } else {
                        setPermissionsForm({...permissionsForm, approve_leaves: false});
                      }
                    }}
                    className={`relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 ${
                      permissionsForm.approve_leaves ? 'bg-pink-600' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        permissionsForm.approve_leaves ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </label>
              </div>

              {/* View All Daily Reports */}
              <div className="p-4 border-2 border-green-200 dark:border-green-700 rounded-lg bg-green-50 dark:bg-green-900/20">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 dark:text-white">Tüm Günlük Raporları Görüntüleme</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Tüm çalışanların günlük raporlarını görüntüleyebilir
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPermissionsForm({...permissionsForm, view_all_daily_reports: !permissionsForm.view_all_daily_reports})}
                    className={`relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                      permissionsForm.view_all_daily_reports ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        permissionsForm.view_all_daily_reports ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </label>
              </div>

              {/* View All Weekly Plans */}
              <div className="p-4 border-2 border-yellow-200 dark:border-yellow-700 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 dark:text-white">Tüm Haftalık Planları Görüntüleme</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Tüm çalışanların haftalık programlarını görüntüleyebilir
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPermissionsForm({...permissionsForm, view_all_weekly_plans: !permissionsForm.view_all_weekly_plans})}
                    className={`relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 ${
                      permissionsForm.view_all_weekly_plans ? 'bg-yellow-600' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        permissionsForm.view_all_weekly_plans ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </label>
              </div>

              {/* Manage Leave Types */}
              <div className="p-4 border-2 border-red-200 dark:border-red-700 rounded-lg bg-red-50 dark:bg-red-900/20">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 dark:text-white">İzin Türleri Değişim Yetkisi</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      İzin türlerini ekleyebilir, düzenleyebilir ve silebilir
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPermissionsForm({...permissionsForm, manage_leave_types: !permissionsForm.manage_leave_types})}
                    className={`relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${
                      permissionsForm.manage_leave_types ? 'bg-red-600' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        permissionsForm.manage_leave_types ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </label>
              </div>

              {/* Manage Roles */}
              <div className="p-4 border-2 border-indigo-200 dark:border-indigo-700 rounded-lg bg-indigo-50 dark:bg-indigo-900/20">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 dark:text-white">Rol Değişim Yetkisi</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Kullanıcı rollerini değiştirebilir
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPermissionsForm({...permissionsForm, manage_roles: !permissionsForm.manage_roles})}
                    className={`relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                      permissionsForm.manage_roles ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        permissionsForm.manage_roles ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </label>
              </div>

              {/* Manage Performance Scale */}
              <div className="p-4 border-2 border-orange-200 dark:border-orange-700 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 dark:text-white">Renk Skalası Değişim Yetkisi</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Performans renk skalasını (sarı, turuncu, yeşil) düzenleyebilir
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPermissionsForm({...permissionsForm, manage_performance_scale: !permissionsForm.manage_performance_scale})}
                    className={`relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                      permissionsForm.manage_performance_scale ? 'bg-orange-600' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        permissionsForm.manage_performance_scale ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => {
                  setShowPermissionsModal(false);
                  setEditingUserPermissions(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleSavePermissions}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Yetkileri Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
