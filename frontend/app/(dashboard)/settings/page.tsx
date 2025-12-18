'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from '@/lib/axios';
import { UserPlus, Users, UserCheck, UserX, Edit, Palette, Key } from 'lucide-react';
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
}

interface ColorScale {
  id: number;
  color: string;
  min_visits: number;
  max_visits: number | null;
}

export default function SettingsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'colors'>('users');

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
      const [userRes, usersRes, colorScalesRes] = await Promise.all([
        axios.get('/employees/me'),
        axios.get('/employees'),
        axios.get('/settings/visit-color-scales')
      ]);

      setCurrentUser(userRes.data);
      setUsers(usersRes.data);
      setColorScales(colorScalesRes.data);
      setEditingScales(JSON.parse(JSON.stringify(colorScalesRes.data))); // Deep copy

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Ayarlar</h1>
        <p className="text-gray-600 dark:text-gray-300">Sistem ayarlarını yönetin</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('users')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'users'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Kullanıcı Yönetimi
            </div>
          </button>
          <button
            onClick={() => setActiveTab('colors')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'colors'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Durum Raporu Renk Skalası
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
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Kullanıcı Yönetimi</h2>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <UserPlus className="w-5 h-5" />
              Yeni Kullanıcı Ekle
            </button>
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded-lg ${filter === 'active' ? 'bg-green-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
            >
              Aktif Kullanıcılar ({users.filter(u => u.is_active).length})
            </button>
            <button
              onClick={() => setFilter('inactive')}
              className={`px-4 py-2 rounded-lg ${filter === 'inactive' ? 'bg-red-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
            >
              Pasif Kullanıcılar ({users.filter(u => !u.is_active).length})
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
            >
              Tümü ({users.length})
            </button>
          </div>

          {/* Users Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Durum</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ad Soyad</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Rol</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Telefon</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">İşlemler</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className={!user.is_active ? 'opacity-60' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.is_active ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <UserCheck className="w-4 h-4 mr-1" />
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <UserX className="w-4 h-4 mr-1" />
                          Pasif
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{user.full_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{user.phone || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <button
                        onClick={() => handleToggleActive(user.id, user.is_active)}
                        disabled={user.id === currentUser?.id}
                        className={`px-3 py-1 rounded-lg text-white ${
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
                        className="px-3 py-1 rounded-lg bg-orange-600 hover:bg-orange-700 text-white inline-flex items-center gap-1"
                      >
                        <Key className="w-4 h-4" />
                        Şifre Sıfırla
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Color Scale Tab */}
      {activeTab === 'colors' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Durum Raporu Renk Skalası</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Hekim ziyaretlerine göre renk skalası ayarlarını belirleyin</p>
            </div>
            {!isEditingScales ? (
              <button
                onClick={() => setIsEditingScales(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Edit className="w-5 h-5 inline mr-2" />
                Düzenle
              </button>
            ) : (
              <div className="space-x-2">
                <button
                  onClick={() => {
                    setEditingScales(JSON.parse(JSON.stringify(colorScales)));
                    setIsEditingScales(false);
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  İptal
                </button>
                <button
                  onClick={handleSaveColorScales}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
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
    </div>
  );
}
