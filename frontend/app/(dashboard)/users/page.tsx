'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from '@/lib/axios';
import { UserPlus, Users, UserCheck, UserX, Edit } from 'lucide-react';

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

export default function UsersPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [managerPassword, setManagerPassword] = useState('');
  const [pendingAction, setPendingAction] = useState<{type: 'deactivate' | 'changeRole', userId: number, newRole?: string} | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('active');

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
      const [userRes, usersRes] = await Promise.all([
        axios.get('/employees/me'),
        axios.get('/employees')
      ]);

      setCurrentUser(userRes.data);
      setUsers(usersRes.data);

      // Only MANAGER can access this page
      if (userRes.data.role !== 'MANAGER' && userRes.data.role !== 'ADMIN') {
        alert('Bu sayfaya erişim yetkiniz yok!');
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
      alert('Kullanıcı başarıyla eklendi!');
      setShowAddModal(false);
      setNewUser({ full_name: '', email: '', password: '', role: 'EMPLOYEE', phone: '' });
      fetchData();
    } catch (error: any) {
      console.error('Add user error:', error);
      alert(error.response?.data?.detail || 'Kullanıcı eklenirken hata oluştu.');
    }
  };

  const handleToggleActive = async (userId: number, currentStatus: boolean) => {
    if (currentStatus) {
      // Deactivate requires password
      setPendingAction({ type: 'deactivate', userId });
      setShowPasswordModal(true);
    } else {
      // Activate doesn't require password
      try {
        await axios.patch(`/employees/${userId}/activate`);
        alert('Kullanıcı aktif hale getirildi.');
        fetchData();
      } catch (error: any) {
        console.error('Activate error:', error);
        alert(error.response?.data?.detail || 'İşlem sırasında hata oluştu.');
      }
    }
  };

  const handleChangeRole = (userId: number, newRole: string) => {
    setPendingAction({ type: 'changeRole', userId, newRole });
    setShowPasswordModal(true);
  };

  const handlePasswordSubmit = async () => {
    if (!managerPassword.trim()) {
      alert('Lütfen şifrenizi girin!');
      return;
    }

    if (!pendingAction) return;

    try {
      if (pendingAction.type === 'deactivate') {
        await axios.patch(`/employees/${pendingAction.userId}/deactivate?manager_password=${encodeURIComponent(managerPassword)}`);
        alert('Kullanıcı pasif hale getirildi.');
      } else if (pendingAction.type === 'changeRole') {
        await axios.patch(`/employees/${pendingAction.userId}/change-role?new_role=${pendingAction.newRole}&manager_password=${encodeURIComponent(managerPassword)}`);
        alert('Kullanıcı rolü değiştirildi.');
      }

      setShowPasswordModal(false);
      setManagerPassword('');
      setPendingAction(null);
      fetchData();
    } catch (error: any) {
      console.error('Password verify error:', error);
      if (error.response?.status === 401) {
        alert('Hatalı şifre! Lütfen tekrar deneyin.');
      } else if (error.response?.status === 403) {
        alert('Bu işlem için yetkiniz yok. Sadece MANAGER kullanıcıları rol değiştirebilir.');
        setShowPasswordModal(false);
        setManagerPassword('');
        setPendingAction(null);
      } else {
        alert(error.response?.data?.detail || 'İşlem sırasında hata oluştu.');
      }
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

  return <>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      {/* Password Verification Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Manager Şifresi Gerekli</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              {pendingAction?.type === 'deactivate'
                ? 'Kullanıcıyı pasif yapmak için manager şifrenizi girin.'
                : 'Kullanıcı rolünü değiştirmek için manager şifrenizi girin.'}
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
                  placeholder="Manager şifrenizi girin"
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
                  <option value="MANAGER">Manager</option>
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
  </>;
}
