'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from '@/lib/axios';
import { LogOut, MessageSquare, Calendar, User, Moon, Sun, Filter } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface Feedback {
  id: number;
  manager_id: number;
  manager_name: string;
  employee_id: number;
  employee_name: string;
  visit_type: 'DOCTOR' | 'PHARMACY';
  target_id: number;
  target_name: string;
  feedback_text: string;
  is_read: boolean;
  created_at: string;
}

export default function FeedbacksPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'week' | 'month' | 'all'>('all');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (user) {
      fetchFeedbacks();
    }
  }, [filter, user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const userRes = await axios.get('/employees/me');
      setUser(userRes.data);

      // Manager ise bu sayfayı görmemeli
      if (userRes.data.role === 'MANAGER') {
        router.push('/');
        return;
      }
    } catch (error) {
      console.error('Error:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const fetchFeedbacks = async () => {
    try {
      const response = await axios.get(`/feedbacks/my-feedbacks?filter=${filter}`);
      setFeedbacks(response.data);
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
      // Mock data for demo
      const mockFeedbacks: Feedback[] = [
        {
          id: 1,
          manager_id: 1,
          manager_name: 'Sema Ekinci',
          employee_id: 2,
          employee_name: user?.full_name || '',
          visit_type: 'DOCTOR',
          target_id: 1,
          target_name: 'Dr. Mehmet Yılmaz',
          feedback_text: 'Harika bir ziyaret! Doktorla iyi ilişki kurdunuz. Sipariş alımı başarılı.',
          is_read: false,
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          manager_id: 1,
          manager_name: 'Sema Ekinci',
          employee_id: 2,
          employee_name: user?.full_name || '',
          visit_type: 'PHARMACY',
          target_id: 5,
          target_name: 'Hayat Eczanesi',
          feedback_text: 'Eczacı ile fiyat konusunda daha detaylı görüşme yapabilirdiniz. Bir sonraki ziyarette rekabet analizini paylaşın.',
          is_read: true,
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
      ];
      setFeedbacks(mockFeedbacks);
    }
  };

  const markAsRead = async (feedbackId: number) => {
    try {
      await axios.patch(`/feedbacks/${feedbackId}/mark-read`);
      setFeedbacks(feedbacks.map(f =>
        f.id === feedbackId ? { ...f, is_read: true } : f
      ));
    } catch (error) {
      console.error('Error marking feedback as read:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900">
        <div className="text-xl text-gray-600 dark:text-gray-300">Yükleniyor...</div>
      </div>
    );
  }

  const unreadCount = feedbacks.filter(f => !f.is_read).length;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <img src="/images/logo.png" alt="Logo" className="h-12 w-auto" />
            <div className="flex items-center gap-4">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                title={theme === 'dark' ? 'Açık moda geç' : 'Koyu moda geç'}
              >
                {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-gray-700 dark:text-gray-200" />}
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-300">{user?.full_name} ({user?.role})</span>
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
      <nav className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-6">
            <button onClick={() => router.push('/')} className="py-4 px-2 border-b-2 border-transparent text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Dashboard</button>
            <button onClick={() => router.push('/doctors')} className="py-4 px-2 border-b-2 border-transparent text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Doktorlar</button>
            <button onClick={() => router.push('/pharmacies')} className="py-4 px-2 border-b-2 border-transparent text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Eczaneler</button>
            <button onClick={() => router.push('/cases')} className="py-4 px-2 border-b-2 border-transparent text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Vakalar</button>
            <button className="py-4 px-2 border-b-2 border-blue-500 text-blue-600 dark:text-blue-400 font-medium relative">
              Geri Dönüşler
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with filters */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Geri Dönüşler</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Yöneticinizden gelen geri dönüşleri buradan görüntüleyebilirsiniz
            </p>
          </div>

          {/* Filter Buttons */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <button
              onClick={() => setFilter('week')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'week'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Son 1 Hafta
            </button>
            <button
              onClick={() => setFilter('month')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'month'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Son 1 Ay
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Tümü
            </button>
          </div>
        </div>

        {/* Feedbacks List */}
        {feedbacks.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Henüz geri dönüş bulunmuyor</p>
          </div>
        ) : (
          <div className="space-y-4">
            {feedbacks.map((feedback) => (
              <div
                key={feedback.id}
                className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-l-4 ${
                  feedback.is_read
                    ? 'border-gray-300 dark:border-gray-600'
                    : 'border-blue-500 dark:border-blue-400'
                } hover:shadow-md transition-shadow`}
                onClick={() => !feedback.is_read && markAsRead(feedback.id)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      feedback.visit_type === 'DOCTOR'
                        ? 'bg-blue-100 dark:bg-blue-900/30'
                        : 'bg-green-100 dark:bg-green-900/30'
                    }`}>
                      <MessageSquare className={`w-5 h-5 ${
                        feedback.visit_type === 'DOCTOR'
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-green-600 dark:text-green-400'
                      }`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {feedback.target_name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {feedback.visit_type === 'DOCTOR' ? 'Doktor Ziyareti' : 'Eczane Ziyareti'}
                      </p>
                    </div>
                  </div>
                  {!feedback.is_read && (
                    <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs px-2 py-1 rounded-full">
                      Yeni
                    </span>
                  )}
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                  <p className="text-gray-700 dark:text-gray-200">{feedback.feedback_text}</p>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>{feedback.manager_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{format(new Date(feedback.created_at), 'dd MMMM yyyy HH:mm', { locale: tr })}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
