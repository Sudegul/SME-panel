'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from '@/lib/axios';
import { Download, Calendar, Filter, FileSpreadsheet, TrendingUp, Users } from 'lucide-react';
import { toast } from 'react-toastify';

type ReportCategory = 'weekly-plans' | 'daily-reports' | 'growth-tracking';
type VisitType = 'all' | 'doctor' | 'pharmacy';

export default function ReportsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activeCategory, setActiveCategory] = useState<ReportCategory>('daily-reports');

  // Daily Reports States
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [visitType, setVisitType] = useState<VisitType>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');

  // Growth Tracking States
  const [growthEmployee, setGrowthEmployee] = useState<string>('all');

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

      if (userRes.data.role !== 'MANAGER' && userRes.data.role !== 'ADMIN') {
        toast.error('Bu sayfaya erişim yetkiniz yok!');
        router.push('/');
        return;
      }

      // Fetch employees
      const employeesRes = await axios.get('/employees/');
      setEmployees(employeesRes.data.filter((emp: any) => emp.is_active));
    } catch (error) {
      console.error('Error:', error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const handleExportWeeklyPlans = async () => {
    try {
      const response = await axios.get('/reports/export/weekly-plans', {
        responseType: 'blob'
      });

      // Bugünün tarihini al
      const today = new Date();
      const dateStr = `${today.getDate().toString().padStart(2, '0')}_${(today.getMonth() + 1).toString().padStart(2, '0')}_${today.getFullYear()}`;

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `haftalik_planlar_tum_calisanlar_${dateStr}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Rapor indirilirken hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  const handleExportDailyReports = async () => {
    try {
      const employeeParam = selectedEmployee === 'all' ? 'all' : selectedEmployee;

      // Dosya ismi için formatla
      const periodNames: Record<string, string> = {
        'day': 'gunluk',
        'week': 'haftalik',
        'month': 'aylik',
        'year': 'yillik'
      };
      const periodName = periodNames[period] || period;

      // Çalışan ismini formatla (boşlukları alt tire yap, türkçe karakterleri düzelt)
      const formatEmployeeName = (name: string) => {
        if (name === 'all') return 'tum_calisanlar';
        return name
          .toLowerCase()
          .replace(/ğ/g, 'g')
          .replace(/ü/g, 'u')
          .replace(/ş/g, 's')
          .replace(/ı/g, 'i')
          .replace(/ö/g, 'o')
          .replace(/ç/g, 'c')
          .replace(/\s+/g, '_');
      };
      const employeeName = formatEmployeeName(selectedEmployee);

      // Eğer "Tümü" seçiliyse, 2 ayrı dosya indir
      if (visitType === 'all') {
        // 1. Hekim Ziyaretleri
        const doctorResponse = await axios.get(`/reports/export/daily-reports?period=${period}&employee=${employeeParam}&visit_type=doctor`, {
          responseType: 'blob'
        });

        const doctorUrl = window.URL.createObjectURL(new Blob([doctorResponse.data]));
        const doctorLink = document.createElement('a');
        doctorLink.href = doctorUrl;
        doctorLink.setAttribute('download', `${periodName}_hekim_ziyareti_${employeeName}.xlsx`);
        document.body.appendChild(doctorLink);
        doctorLink.click();
        doctorLink.remove();
        window.URL.revokeObjectURL(doctorUrl);

        // Kısa bir gecikme (tarayıcı iki indirmeyi ayırt etsin)
        await new Promise(resolve => setTimeout(resolve, 500));

        // 2. Eczane Ziyaretleri
        const pharmacyResponse = await axios.get(`/reports/export/daily-reports?period=${period}&employee=${employeeParam}&visit_type=pharmacy`, {
          responseType: 'blob'
        });

        const pharmacyUrl = window.URL.createObjectURL(new Blob([pharmacyResponse.data]));
        const pharmacyLink = document.createElement('a');
        pharmacyLink.href = pharmacyUrl;
        pharmacyLink.setAttribute('download', `${periodName}_eczane_ziyareti_${employeeName}.xlsx`);
        document.body.appendChild(pharmacyLink);
        pharmacyLink.click();
        pharmacyLink.remove();
        window.URL.revokeObjectURL(pharmacyUrl);

        toast.success('2 dosya indirildi: Hekim Ziyaretleri ve Eczane Ziyaretleri');
      } else {
        // Tek dosya indir (sadece doctor veya sadece pharmacy)
        const response = await axios.get(`/reports/export/daily-reports?period=${period}&employee=${employeeParam}&visit_type=${visitType}`, {
          responseType: 'blob'
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        const visitTypeName = visitType === 'doctor' ? 'hekim_ziyareti' : 'eczane_ziyareti';
        const filename = `${periodName}_${visitTypeName}_${employeeName}.xlsx`;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Rapor indirilirken hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  const handleExportGrowthTracking = async () => {
    try {
      const employeeParam = growthEmployee === 'all' ? 'all' : growthEmployee;

      // Çalışan ismini formatla
      const formatEmployeeName = (name: string) => {
        if (name === 'all') return 'tum_calisanlar';
        return name
          .toLowerCase()
          .replace(/ğ/g, 'g')
          .replace(/ü/g, 'u')
          .replace(/ş/g, 's')
          .replace(/ı/g, 'i')
          .replace(/ö/g, 'o')
          .replace(/ç/g, 'c')
          .replace(/\s+/g, '_');
      };
      const employeeName = formatEmployeeName(growthEmployee);

      const response = await axios.get(`/reports/export/growth-tracking?employee=${employeeParam}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `buyume_takibi_${employeeName}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Rapor indirilirken hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600 dark:text-gray-300">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-6">
          <FileSpreadsheet className="w-8 h-8 text-green-600" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Rapor Oluştur ve İndir</h1>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-3 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveCategory('weekly-plans')}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              activeCategory === 'weekly-plans'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Haftalık Planlar
            </div>
          </button>
          <button
            onClick={() => setActiveCategory('daily-reports')}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              activeCategory === 'daily-reports'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              Günlük Raporlar
            </div>
          </button>
          <button
            onClick={() => setActiveCategory('growth-tracking')}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              activeCategory === 'growth-tracking'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Büyüme Takibi
            </div>
          </button>
        </div>
      </div>

      {/* Weekly Plans Section */}
      {activeCategory === 'weekly-plans' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Haftalık Planlar</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Bu haftanın tüm çalışan planlarını Excel formatında indirin. Raporda her çalışanın haftalık ziyaret programı yer alacak.
          </p>

          <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-6 mb-8 rounded-lg">
            <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Rapor İçeriği</h3>
            <ul className="text-blue-700 dark:text-blue-400 space-y-1 text-sm">
              <li>• Çalışan adı ve hafta tarihleri</li>
              <li>• Günlük bazda hastane ve doktor ziyaret planları</li>
              <li>• Ziyaret hedefleri ve notlar</li>
            </ul>
          </div>

          <button
            onClick={handleExportWeeklyPlans}
            className="w-full py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-3 text-lg font-semibold"
          >
            <Download className="w-6 h-6" />
            Bu Haftanın Planlarını İndir
          </button>
        </div>
      )}

      {/* Daily Reports Section */}
      {activeCategory === 'daily-reports' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Günlük Raporlar</h2>

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
                      ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'border-gray-200 hover:border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-lg font-semibold">Günlük</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Bugünün verileri</div>
                  </div>
                </button>
                <button
                  onClick={() => setPeriod('week')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    period === 'week'
                      ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'border-gray-200 hover:border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-lg font-semibold">Haftalık</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Son 7 gün</div>
                  </div>
                </button>
                <button
                  onClick={() => setPeriod('month')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    period === 'month'
                      ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'border-gray-200 hover:border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-lg font-semibold">Aylık</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Son 30 gün</div>
                  </div>
                </button>
                <button
                  onClick={() => setPeriod('year')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    period === 'year'
                      ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'border-gray-200 hover:border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-lg font-semibold">Yıllık</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Son 365 gün</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Visit Type Selection */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
                <Filter className="w-5 h-5" />
                Ziyaret Tipi
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setVisitType('all')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    visitType === 'all'
                      ? 'border-green-600 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'border-gray-200 hover:border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <div className="text-center font-semibold">Tümü</div>
                </button>
                <button
                  onClick={() => setVisitType('doctor')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    visitType === 'doctor'
                      ? 'border-green-600 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'border-gray-200 hover:border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <div className="text-center font-semibold">Sadece Hekim Ziyaretleri</div>
                </button>
                <button
                  onClick={() => setVisitType('pharmacy')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    visitType === 'pharmacy'
                      ? 'border-green-600 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'border-gray-200 hover:border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <div className="text-center font-semibold">Sadece Eczane Ziyaretleri</div>
                </button>
              </div>
            </div>

            {/* Çalışan Seçimi */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
                <Users className="w-5 h-5" />
                Çalışan Filtresi
              </label>
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg dark:bg-gray-700 dark:text-white"
              >
                <option value="all">Tüm Çalışanlar</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.full_name}>{emp.full_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-6 mb-8 rounded-lg">
            <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Rapor Özeti</h3>
            <div className="text-blue-700 dark:text-blue-400 space-y-1">
              <p><span className="font-medium">Dönem:</span> {
                period === 'day' ? 'Günlük' :
                period === 'week' ? 'Haftalık' :
                period === 'month' ? 'Aylık' : 'Yıllık'
              }</p>
              <p><span className="font-medium">Ziyaret Tipi:</span> {
                visitType === 'all' ? 'Tümü' :
                visitType === 'doctor' ? 'Sadece Hekim Ziyaretleri' : 'Sadece Eczane Ziyaretleri'
              }</p>
              <p><span className="font-medium">Çalışan:</span> {selectedEmployee === 'all' ? 'Tüm Çalışanlar' : selectedEmployee}</p>
            </div>
          </div>

          <button
            onClick={handleExportDailyReports}
            className="w-full py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-3 text-lg font-semibold"
          >
            <Download className="w-6 h-6" />
            Günlük Raporları İndir
          </button>
        </div>
      )}

      {/* Growth Tracking Section */}
      {activeCategory === 'growth-tracking' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Büyüme Takibi Raporu</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Aylık bazda satış ve ziyaret performansını takip edin. Önceki aya ve 3 aylık ortalamaya göre büyüme oranlarını görün.
          </p>

          <div className="space-y-6 mb-8">
            {/* Çalışan Seçimi */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
                <Users className="w-5 h-5" />
                Çalışan Filtresi
              </label>
              <select
                value={growthEmployee}
                onChange={(e) => setGrowthEmployee(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg dark:bg-gray-700 dark:text-white"
              >
                <option value="all">Tüm Çalışanlar</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.full_name}>{emp.full_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-500 p-6 mb-8 rounded-lg">
            <h3 className="font-semibold text-purple-900 dark:text-purple-300 mb-2">Rapor İçeriği</h3>
            <ul className="text-purple-700 dark:text-purple-400 space-y-1 text-sm">
              <li>• Aylık bazda satılan ürün sayısı</li>
              <li>• Aylık bazda verilen MF sayısı</li>
              <li>• Aylık bazda toplam hekim ziyareti</li>
              <li>• Önceki aya göre % büyüme/küçülme oranı</li>
              <li>• Önceki 3 aya göre ortalama % büyüme/küçülme oranı</li>
              <li>• Çalışan bazlı veya tüm takım performansı</li>
            </ul>
          </div>

          <button
            onClick={handleExportGrowthTracking}
            className="w-full py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-3 text-lg font-semibold"
          >
            <Download className="w-6 h-6" />
            Büyüme Takibi Raporunu İndir
          </button>
        </div>
      )}
    </div>
  );
}
