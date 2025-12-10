'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from '@/lib/axios';
import { Calendar, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface DoctorComparisonItem {
  hospital_name: string;
  doctor_name: string;
  planned: boolean;
  visited: boolean;
  status: string;
}

interface DayStatusReport {
  date: string;
  day_name: string;
  doctors: DoctorComparisonItem[];
}

interface WeeklyStatusReport {
  employee_id: number;
  employee_name: string;
  week_start: string;
  week_end: string;
  total_planned: number;
  total_visited: number;
  total_missed: number;
  completion_rate: number;
  days: DayStatusReport[];
}

export default function StatusReportPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<WeeklyStatusReport[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');

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

      // Check if user is manager/admin
      if (userRes.data.role !== 'MANAGER' && userRes.data.role !== 'ADMIN') {
        router.push('/');
        return;
      }

      // Fetch status reports
      const reportsRes = await axios.get('/status-reports/weekly');
      setReports(reportsRes.data);

      // Fetch employees
      const employeesRes = await axios.get('/employees/');
      setEmployees(employeesRes.data.filter((emp: any) => emp.is_active));
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = selectedEmployee === 'all'
    ? reports
    : reports.filter(r => r.employee_id === parseInt(selectedEmployee));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600 dark:text-gray-300">Yükleniyor...</div>
      </div>
    );
  }

  return <>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Haftalık Durum Raporu</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">Planlanan hekim ziyaretleri ile gerçekleşen ziyaretlerin karşılaştırması</p>

        {/* Filter */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200 mr-4">Çalışan Filtrele:</label>
          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
          >
            <option value="all">Tüm Çalışanlar</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>{emp.full_name}</option>
            ))}
          </select>
        </div>

        {/* Reports */}
        <div className="space-y-6">
          {filteredReports.map((report) => (
            <div key={report.employee_id} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              {/* Header */}
              <div className="p-6 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-gray-700 dark:to-gray-800 border-b dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{report.employee_name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {new Date(report.week_start).toLocaleDateString('tr-TR')} - {new Date(report.week_end).toLocaleDateString('tr-TR')}
                </p>
                <div className="mt-4 flex gap-6">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{report.total_planned}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Planlanan</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{report.total_visited}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Gerçekleşen</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">{report.total_missed}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Kaçırılan</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">{report.completion_rate}%</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Tamamlanma</div>
                  </div>
                </div>
              </div>

              {/* Days */}
              <div className="p-6">
                <div className="space-y-4">
                  {report.days.map((day, idx) => (
                    <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {day.day_name} - {new Date(day.date).toLocaleDateString('tr-TR')}
                        </h4>
                      </div>

                      <div className="space-y-2">
                        {day.doctors.map((doctor, docIdx) => (
                          <div
                            key={docIdx}
                            className={`flex items-start gap-3 p-3 rounded-lg ${
                              doctor.status === 'completed'
                                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                                : doctor.status === 'missed'
                                ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                                : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                            }`}
                          >
                            {doctor.status === 'completed' && <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />}
                            {doctor.status === 'missed' && <XCircle className="w-5 h-5 text-red-600 mt-0.5" />}
                            {doctor.status === 'extra' && <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />}

                            <div className="flex-1">
                              <div className="font-medium text-gray-900 dark:text-white">{doctor.doctor_name}</div>
                              <div className="text-sm text-gray-600 dark:text-gray-300">{doctor.hospital_name}</div>
                              {doctor.status === 'completed' && (
                                <div className="text-xs text-green-600 dark:text-green-400 mt-1">✓ Ziyaret gerçekleşti</div>
                              )}
                              {doctor.status === 'missed' && (
                                <div className="text-xs text-red-600 dark:text-red-400 mt-1">✗ Ziyaret gerçekleşmedi</div>
                              )}
                              {doctor.status === 'extra' && (
                                <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">+ Planlanmamış ziyaret</div>
                              )}
                            </div>
                          </div>
                        ))}

                        {day.doctors.length === 0 && (
                          <p className="text-center text-gray-500 dark:text-gray-400 text-sm py-2">Bu gün için ziyaret planlanmamış</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {filteredReports.length === 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-lg">Henüz durum raporu bulunmuyor</p>
            </div>
          )}
        </div>
    </div>
  </>;
}
