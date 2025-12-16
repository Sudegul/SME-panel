'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from '@/lib/axios';
import { Calendar, Building, UserRound, Package, Gift } from 'lucide-react';
import DateSelector from '@/components/DateSelector';

interface EmployeeVisitStats {
  employee_id: number;
  employee_name: string;
  doctor_visits: number;
  pharmacy_visits: number;
  product_count: number;
  mf_count: number;
}

interface ColorScale {
  id: number;
  color: string;
  min_visits: number;
  max_visits: number | null;
}

export default function StatusReportPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<EmployeeVisitStats[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [colorScales, setColorScales] = useState<ColorScale[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [userRes, colorScalesRes] = await Promise.all([
        axios.get('/employees/me'),
        axios.get('/settings/visit-color-scales')
      ]);
      setUser(userRes.data);
      setColorScales(colorScalesRes.data);

      // Check if user is manager/admin
      if (userRes.data.role !== 'MANAGER' && userRes.data.role !== 'ADMIN') {
        router.push('/');
        return;
      }

      // Fetch all employees
      const employeesRes = await axios.get('/employees/');
      const activeEmployees = employeesRes.data.filter((emp: any) => emp.is_active);

      // Sort employees: EMPLOYEE first, then MANAGER and ADMIN at the end
      activeEmployees.sort((a: any, b: any) => {
        const aIsManagerOrAdmin = a.role === 'MANAGER' || a.role === 'ADMIN';
        const bIsManagerOrAdmin = b.role === 'MANAGER' || b.role === 'ADMIN';

        if (aIsManagerOrAdmin && !bIsManagerOrAdmin) return 1;
        if (!aIsManagerOrAdmin && bIsManagerOrAdmin) return -1;
        return 0;
      });

      // Fetch visits for selected date and calculate stats per employee
      const [doctorVisitsRes, pharmacyVisitsRes] = await Promise.all([
        axios.get('/daily-visits/doctors', { params: { visit_date: selectedDate, limit: 1000 } }),
        axios.get('/daily-visits/pharmacies', { params: { visit_date: selectedDate, limit: 1000 } })
      ]);

      // Group visits by employee
      const employeeStats: { [key: number]: EmployeeVisitStats } = {};

      activeEmployees.forEach((emp: any) => {
        employeeStats[emp.id] = {
          employee_id: emp.id,
          employee_name: emp.full_name,
          doctor_visits: 0,
          pharmacy_visits: 0,
          product_count: 0,
          mf_count: 0
        };
      });

      // Count doctor visits
      doctorVisitsRes.data.forEach((visit: any) => {
        if (employeeStats[visit.employee_id]) {
          employeeStats[visit.employee_id].doctor_visits++;
        }
      });

      // Count pharmacy visits and sum product/mf counts
      pharmacyVisitsRes.data.forEach((visit: any) => {
        if (employeeStats[visit.employee_id]) {
          employeeStats[visit.employee_id].pharmacy_visits++;
          employeeStats[visit.employee_id].product_count += visit.product_count || 0;
          employeeStats[visit.employee_id].mf_count += visit.mf_count || 0;
        }
      });

      // Convert to array and maintain the sort order (EMPLOYEE first, MANAGER/ADMIN last)
      const sortedStats = activeEmployees.map((emp: any) => employeeStats[emp.id]);
      setStats(sortedStats);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get color based on doctor visit count (dynamic from backend)
  const getColorClass = (doctorVisits: number) => {
    // Find the matching color scale
    const sortedScales = [...colorScales].sort((a, b) => a.min_visits - b.min_visits);

    for (const scale of sortedScales) {
      if (scale.max_visits === null) {
        // Last scale (unlimited)
        if (doctorVisits >= scale.min_visits) {
          return getColorClassForColor(scale.color);
        }
      } else {
        // Range scale
        if (doctorVisits >= scale.min_visits && doctorVisits <= scale.max_visits) {
          return getColorClassForColor(scale.color);
        }
      }
    }

    // Fallback (should not happen)
    return 'bg-gray-100 dark:bg-gray-900/30 border-gray-500 text-gray-900 dark:text-gray-200';
  };

  const getColorClassForColor = (color: string) => {
    switch (color) {
      case 'yellow':
        return 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-500 text-yellow-900 dark:text-yellow-200';
      case 'orange':
        return 'bg-orange-200 dark:bg-orange-700/60 border-orange-600 text-orange-900 dark:text-orange-100';
      case 'green':
        return 'bg-green-100 dark:bg-green-900/30 border-green-500 text-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 dark:bg-gray-900/30 border-gray-500 text-gray-900 dark:text-gray-200';
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Durum Raporu</h1>
        <p className="text-gray-600 dark:text-gray-300">Çalışanların günlük ziyaret durumu</p>
      </div>

      {/* Date Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <DateSelector
          value={selectedDate}
          onChange={setSelectedDate}
        />
      </div>

      {/* Color Scale Legend - Dynamic */}
      {colorScales.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 mb-6 rounded-lg">
          <div className="text-xs font-semibold text-blue-900 dark:text-blue-200 mb-2">Renk Kodları (Hekim Ziyaretleri)</div>
          <div className="flex flex-wrap gap-3">
            {colorScales
              .sort((a, b) => a.min_visits - b.min_visits)
              .map((scale) => (
                <div key={scale.id} className="flex items-center gap-1.5">
                  <div className={`w-5 h-5 rounded ${getColorClass(scale.min_visits)} border`}></div>
                  <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                    {scale.max_visits !== null
                      ? `${scale.min_visits}-${scale.max_visits}`
                      : `${scale.min_visits}+`
                    }
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Employee Stats Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.employee_id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border-2"
          >
            {/* Employee Name - Colored based on doctor visits */}
            <div className={`p-4 border-b-2 ${getColorClass(stat.doctor_visits)}`}>
              <div className="flex items-center gap-2">
                <UserRound className="w-5 h-5" />
                <h3 className="font-bold text-lg">{stat.employee_name}</h3>
              </div>
            </div>

            {/* Visit Stats */}
            <div className="p-4 space-y-3">
              <div className="flex items-start gap-3">
                <UserRound className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Hekim Ziyaretleri</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.doctor_visits}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Building className="w-5 h-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Eczane Ziyaretleri</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.pharmacy_visits}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Package className="w-5 h-5 text-purple-600 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Satılan Ürün</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.product_count}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Gift className="w-5 h-5 text-orange-600 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm text-gray-600 dark:text-gray-400">MF Sayısı</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.mf_count}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {stats.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-lg">Seçili tarih için veri bulunmuyor</p>
        </div>
      )}
    </div>
  );
}
