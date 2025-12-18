'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from '@/lib/axios';
import { Calendar, Plus, X, Trash2, Edit, ChevronDown, ChevronRight as ChevronRightIcon } from 'lucide-react';
import CustomDateInput from '@/components/CustomDateInput';
import { toast } from 'react-toastify';

interface HospitalVisitPlan {
  hospital_name: string;
}

interface DayPlan {
  date: string;
  day_name: string;
  visits: HospitalVisitPlan[];
}

interface WeeklyProgram {
  id?: number;
  week_start: string;
  week_end: string;
  employee_name: string;
  days: DayPlan[];
  submitted: boolean;
}

type FilterMode = 'this-week' | 'date-range';

export default function WeeklyProgramPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [programs, setPrograms] = useState<WeeklyProgram[]>([]);
  const [filteredPrograms, setFilteredPrograms] = useState<WeeklyProgram[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProgram, setEditingProgram] = useState<WeeklyProgram | null>(null);
  const [currentWeek, setCurrentWeek] = useState<DayPlan[]>([]);

  // Filtering states
  const [filterMode, setFilterMode] = useState<FilterMode>('this-week');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [expandedPrograms, setExpandedPrograms] = useState<Set<number>>(new Set());

  const dayNames = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

  // Helper: Get Monday of a given date
  const getMondayOfWeek = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  };

  // Helper: Get week range (Monday to Sunday)
  const getWeekRange = (monday: Date): { start: string; end: string } => {
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return {
      start: monday.toISOString().split('T')[0],
      end: sunday.toISOString().split('T')[0]
    };
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [selectedEmployee, programs, filterMode, selectedDate, endDate]);

  const applyFilters = () => {
    let filtered = programs;

    // Çalışan filtresi
    if (selectedEmployee !== 'all') {
      filtered = filtered.filter(p => p.employee_name === selectedEmployee);
    }

    // Week filter based on mode
    if (filterMode === 'this-week') {
      const today = new Date();
      const monday = getMondayOfWeek(today);
      const weekRange = getWeekRange(monday);
      filtered = filtered.filter(p => p.week_start === weekRange.start);
    } else if (filterMode === 'date-range' && selectedDate) {
      if (endDate) {
        // Tarih aralığı: başlangıç haftasından bitiş haftasına kadar
        const startDate = new Date(selectedDate);
        const endDateObj = new Date(endDate);
        const startMonday = getMondayOfWeek(startDate);
        const endMonday = getMondayOfWeek(endDateObj);

        filtered = filtered.filter(p => {
          const programMonday = new Date(p.week_start);
          return programMonday >= startMonday && programMonday <= endMonday;
        });
      } else {
        // Sadece başlangıç tarihi: o günün haftası
        const date = new Date(selectedDate);
        const monday = getMondayOfWeek(date);
        const weekRange = getWeekRange(monday);
        filtered = filtered.filter(p => p.week_start === weekRange.start);
      }
    }

    setFilteredPrograms(filtered);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const userRes = await axios.get('/employees/me');
      setUser(userRes.data);

      const programsRes = await axios.get('/weekly-programs/');
      setPrograms(programsRes.data);
      setFilteredPrograms(programsRes.data);

      if (userRes.data.role === 'MANAGER' || userRes.data.role === 'ADMIN') {
        const employeesRes = await axios.get('/employees/');
        setEmployees(employeesRes.data.filter((emp: any) => emp.is_active));
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeWeek = () => {
    const today = new Date();
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + ((8 - today.getDay()) % 7));

    const weekDays: DayPlan[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(nextMonday);
      date.setDate(nextMonday.getDate() + i);
      weekDays.push({
        date: date.toISOString().split('T')[0],
        day_name: dayNames[i],
        visits: []
      });
    }
    setCurrentWeek(weekDays);
  };

  const canEditProgram = (program: WeeklyProgram): boolean => {
    // Kendi programı değilse düzenleyemez
    if (program.employee_name !== user?.full_name) return false;

    // Pazar günü 23:59'a kadar düzenlenebilir
    const sundayEnd = new Date(program.week_end);
    sundayEnd.setHours(23, 59, 59, 999);
    const now = new Date();

    return now <= sundayEnd;
  };

  const handleEditProgram = (program: WeeklyProgram) => {
    setEditingProgram(program);
    setCurrentWeek(program.days);
    setShowEditModal(true);
  };

  const handleSubmitProgram = async () => {
    let isValid = true;
    currentWeek.forEach(day => {
      day.visits.forEach(visit => {
        if (!visit.hospital_name.trim()) isValid = false;
      });
    });

    if (!isValid) {
      toast.warning('Lütfen tüm hastane isimlerini doldurun!');
      return;
    }

    try {
      await axios.post('/weekly-programs/', {
        week_start: currentWeek[0].date,
        week_end: currentWeek[6].date,
        days: currentWeek
      });

      setShowAddModal(false);
      initializeWeek();
      toast.success('Haftalık program başarıyla kaydedildi');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Haftalık program oluşturulurken bir hata oluştu');
    }
  };

  const handleUpdateProgram = async () => {
    if (!editingProgram) return;

    let isValid = true;
    currentWeek.forEach(day => {
      day.visits.forEach(visit => {
        if (!visit.hospital_name.trim()) isValid = false;
      });
    });

    if (!isValid) {
      toast.warning('Lütfen tüm hastane isimlerini doldurun!');
      return;
    }

    try {
      await axios.put(`/weekly-programs/${editingProgram.id}`, {
        week_start: currentWeek[0].date,
        week_end: currentWeek[6].date,
        days: currentWeek
      });

      setShowEditModal(false);
      setEditingProgram(null);
      initializeWeek();
      toast.success('Haftalık program başarıyla güncellendi');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Haftalık program güncellenirken bir hata oluştu');
    }
  };

  const addHospitalToDay = (dayIndex: number) => {
    const updatedWeek = [...currentWeek];
    updatedWeek[dayIndex].visits.push({ hospital_name: '' });
    setCurrentWeek(updatedWeek);
  };

  const removeHospitalFromDay = (dayIndex: number, hospitalIndex: number) => {
    const updatedWeek = [...currentWeek];
    updatedWeek[dayIndex].visits.splice(hospitalIndex, 1);
    setCurrentWeek(updatedWeek);
  };

  const updateHospitalName = (dayIndex: number, hospitalIndex: number, name: string) => {
    const updatedWeek = [...currentWeek];
    updatedWeek[dayIndex].visits[hospitalIndex].hospital_name = name;
    setCurrentWeek(updatedWeek);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600 dark:text-gray-300">Yükleniyor...</div>
      </div>
    );
  }

  return <>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Haftalık Program</h1>
          <button
            onClick={() => { setShowAddModal(true); initializeWeek(); }}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            Yeni Program Oluştur
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6 space-y-4">
          {/* Çalışan Filtresi (Yönetici/Admin only) */}
          {(user?.role === 'MANAGER' || user?.role === 'ADMIN') && (
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200 mr-4">Çalışan Filtrele:</label>
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              >
                <option value="all">Tüm Çalışanlar</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.full_name}>{emp.full_name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Week Filter Buttons */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Geçmiş Haftalar */}
            <button
              onClick={() => {
                const today = new Date();
                const targetDate = new Date(today);
                targetDate.setDate(today.getDate() - 21); // 3 hafta önce
                setSelectedDate(targetDate.toISOString().split('T')[0]);
                setEndDate('');
                setFilterMode('date-range');
              }}
              className="px-4 py-2 rounded-lg font-medium transition-colors bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              3 Hafta Önce
            </button>

            <button
              onClick={() => {
                const today = new Date();
                const targetDate = new Date(today);
                targetDate.setDate(today.getDate() - 14); // 2 hafta önce
                setSelectedDate(targetDate.toISOString().split('T')[0]);
                setEndDate('');
                setFilterMode('date-range');
              }}
              className="px-4 py-2 rounded-lg font-medium transition-colors bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              2 Hafta Önce
            </button>

            <button
              onClick={() => {
                const today = new Date();
                const targetDate = new Date(today);
                targetDate.setDate(today.getDate() - 7); // Geçen hafta
                setSelectedDate(targetDate.toISOString().split('T')[0]);
                setEndDate('');
                setFilterMode('date-range');
              }}
              className="px-4 py-2 rounded-lg font-medium transition-colors bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Geçen Hafta
            </button>

            {/* Bu Hafta */}
            <button
              onClick={() => {
                setFilterMode('this-week');
                setSelectedDate('');
                setEndDate('');
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterMode === 'this-week'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Bu Hafta
            </button>

            {/* Manuel Tarih Aralığı */}
            <div className="flex items-center gap-2 border-l dark:border-gray-600 pl-4">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Başlangıç:</label>
              <CustomDateInput
                value={selectedDate}
                onChange={(value) => {
                  setSelectedDate(value);
                  if (value) {
                    setFilterMode('date-range');
                  }
                }}
              />
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Bitiş:</label>
              <CustomDateInput
                value={endDate}
                onChange={(value) => {
                  setEndDate(value);
                  if (value && selectedDate) {
                    setFilterMode('date-range');
                  }
                }}
              />
              {(selectedDate || endDate) && (
                <button
                  onClick={() => {
                    setSelectedDate('');
                    setEndDate('');
                    setFilterMode('this-week');
                  }}
                  className="px-3 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50"
                >
                  Temizle
                </button>
              )}
            </div>
          </div>

          {/* Show selected week range */}
          {filterMode === 'date-range' && selectedDate && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
              <p className="text-sm text-blue-900 dark:text-blue-200">
                <strong>Seçili Hafta:</strong>{' '}
                {(() => {
                  if (endDate) {
                    // Tarih aralığı seçildiğinde tüm haftaları listele
                    const startDate = new Date(selectedDate);
                    const endDateObj = new Date(endDate);
                    const startMonday = getMondayOfWeek(startDate);
                    const endMonday = getMondayOfWeek(endDateObj);

                    const weeks: string[] = [];
                    const currentWeek = new Date(startMonday);

                    while (currentWeek <= endMonday) {
                      const weekRange = getWeekRange(currentWeek);
                      weeks.push(
                        `${new Date(weekRange.start).toLocaleDateString('tr-TR')} - ${new Date(weekRange.end).toLocaleDateString('tr-TR')}`
                      );
                      currentWeek.setDate(currentWeek.getDate() + 7);
                    }

                    return weeks.join(', ');
                  } else {
                    // Tek tarih seçildiğinde sadece o hafta
                    const monday = getMondayOfWeek(new Date(selectedDate));
                    const weekRange = getWeekRange(monday);
                    return `${new Date(weekRange.start).toLocaleDateString('tr-TR')} - ${new Date(weekRange.end).toLocaleDateString('tr-TR')}`;
                  }
                })()}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {filteredPrograms.map((program) => (
            <div key={program.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              <div
                className="p-6 border-b dark:border-gray-700 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-gray-700 dark:to-gray-800 cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => {
                  if (program.id) {
                    const newExpanded = new Set(expandedPrograms);
                    if (newExpanded.has(program.id)) {
                      newExpanded.delete(program.id);
                    } else {
                      newExpanded.add(program.id);
                    }
                    setExpandedPrograms(newExpanded);
                  }
                }}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    {program.id && expandedPrograms.has(program.id) ? (
                      <ChevronDown className="w-6 h-6 text-gray-700 dark:text-gray-300 mt-1" />
                    ) : (
                      <ChevronRightIcon className="w-6 h-6 text-gray-700 dark:text-gray-300 mt-1" />
                    )}
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {program.employee_name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {new Date(program.week_start).toLocaleDateString('tr-TR')} - {new Date(program.week_end).toLocaleDateString('tr-TR')}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm">
                          Gönderildi
                        </span>
                        {canEditProgram(program) && (
                          <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full text-sm">
                            Pazar 23:59'a kadar düzenlenebilir
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {canEditProgram(program) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditProgram(program);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Edit className="w-4 h-4" />
                      Düzenle
                    </button>
                  )}
                </div>
              </div>

              {program.id && expandedPrograms.has(program.id) && (
                <div className="p-6">
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse">
                      <thead>
                        <tr className="bg-blue-100 dark:bg-blue-900/40">
                          {program.days.map((day, dayIdx) => (
                            <th key={dayIdx} className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b-2 border-r border-blue-300 dark:border-blue-700">
                              <div className="font-bold">{day.day_name}</div>
                              <div className="text-xs font-normal text-gray-600 dark:text-gray-400">
                                {new Date(day.date).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })}
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-blue-100 dark:border-blue-900/30">
                          {program.days.map((day, dayIdx) => (
                            <td key={dayIdx} className="px-4 py-3 align-top border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                              {day.visits.length > 0 ? (
                                <div className="space-y-2">
                                  {day.visits.map((visit, visitIdx) => (
                                    <div key={visitIdx} className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 border border-blue-200 dark:border-blue-700">
                                      <div className="text-sm font-medium text-gray-900 dark:text-white">{visit.hospital_name}</div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center text-gray-400 dark:text-gray-500 text-sm py-2">-</div>
                              )}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))}

          {filteredPrograms.length === 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-lg">Henüz haftalık program oluşturulmamış</p>
            </div>
          )}
        </div>

      {/* Add Program Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-7xl w-full my-8 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 z-10">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Haftalık Program Oluştur</h2>
              <button onClick={() => setShowAddModal(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-900 dark:text-blue-200">
                  <strong>Hafta:</strong> {currentWeek[0] && new Date(currentWeek[0].date).toLocaleDateString('tr-TR')} - {currentWeek[6] && new Date(currentWeek[6].date).toLocaleDateString('tr-TR')}
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="bg-blue-100 dark:bg-blue-900/40">
                      {currentWeek.map((day, dayIndex) => (
                        <th key={dayIndex} className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b-2 border-r border-blue-300 dark:border-blue-700">
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <div className="font-bold">{day.day_name}</div>
                              <div className="text-xs font-normal text-gray-600 dark:text-gray-400">
                                {new Date(day.date).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })}
                              </div>
                            </div>
                            <button
                              onClick={() => addHospitalToDay(dayIndex)}
                              className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                              title="Hastane Ekle"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {currentWeek.map((day, dayIndex) => (
                        <td key={dayIndex} className="px-3 py-3 align-top border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                          {day.visits.length > 0 ? (
                            <div className="space-y-2">
                              {day.visits.map((visit, hospitalIndex) => (
                                <div key={hospitalIndex} className="flex gap-2">
                                  <input
                                    type="text"
                                    value={visit.hospital_name}
                                    onChange={(e) => updateHospitalName(dayIndex, hospitalIndex, e.target.value)}
                                    placeholder="Hastane adı"
                                    className="flex-1 px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                  />
                                  <button
                                    onClick={() => removeHospitalFromDay(dayIndex, hospitalIndex)}
                                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                    title="Sil"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center text-gray-400 dark:text-gray-500 text-sm py-8">
                              Ziyaret yok
                            </div>
                          )}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-6 border-t dark:border-gray-700 flex gap-3 justify-end sticky bottom-0 bg-white dark:bg-gray-800">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200"
              >
                İptal
              </button>
              <button
                onClick={handleSubmitProgram}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Programı Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Program Modal */}
      {showEditModal && editingProgram && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-7xl w-full my-8 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 z-10">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Haftalık Program Düzenle</h2>
                <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
                  Pazar 23:59'a kadar düzenleyebilirsiniz
                </p>
              </div>
              <button onClick={() => { setShowEditModal(false); setEditingProgram(null); }}>
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-900 dark:text-blue-200">
                  <strong>Hafta:</strong> {currentWeek[0] && new Date(currentWeek[0].date).toLocaleDateString('tr-TR')} - {currentWeek[6] && new Date(currentWeek[6].date).toLocaleDateString('tr-TR')}
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="bg-blue-100 dark:bg-blue-900/40">
                      {currentWeek.map((day, dayIndex) => (
                        <th key={dayIndex} className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b-2 border-r border-blue-300 dark:border-blue-700">
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <div className="font-bold">{day.day_name}</div>
                              <div className="text-xs font-normal text-gray-600 dark:text-gray-400">
                                {new Date(day.date).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })}
                              </div>
                            </div>
                            <button
                              onClick={() => addHospitalToDay(dayIndex)}
                              className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                              title="Hastane Ekle"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {currentWeek.map((day, dayIndex) => (
                        <td key={dayIndex} className="px-3 py-3 align-top border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                          {day.visits.length > 0 ? (
                            <div className="space-y-2">
                              {day.visits.map((visit, hospitalIndex) => (
                                <div key={hospitalIndex} className="flex gap-2">
                                  <input
                                    type="text"
                                    value={visit.hospital_name}
                                    onChange={(e) => updateHospitalName(dayIndex, hospitalIndex, e.target.value)}
                                    placeholder="Hastane adı"
                                    className="flex-1 px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                  />
                                  <button
                                    onClick={() => removeHospitalFromDay(dayIndex, hospitalIndex)}
                                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                    title="Sil"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center text-gray-400 dark:text-gray-500 text-sm py-8">
                              Ziyaret yok
                            </div>
                          )}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-6 border-t dark:border-gray-700 flex gap-3 justify-end sticky bottom-0 bg-white dark:bg-gray-800">
              <button
                onClick={() => { setShowEditModal(false); setEditingProgram(null); }}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200"
              >
                İptal
              </button>
              <button
                onClick={handleUpdateProgram}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Değişiklikleri Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  </>;
}
