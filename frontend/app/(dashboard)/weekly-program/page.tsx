'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from '@/lib/axios';
import { Calendar, Plus, X, Trash2, Edit } from 'lucide-react';

interface DoctorVisitPlan {
  hospital_name: string;
  doctors: string[];
}

interface DayPlan {
  date: string;
  day_name: string;
  visits: DoctorVisitPlan[];
}

interface WeeklyProgram {
  id?: number;
  week_start: string;
  week_end: string;
  employee_name: string;
  days: DayPlan[];
  submitted: boolean;
}

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

  const dayNames = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedEmployee === 'all') {
      setFilteredPrograms(programs);
    } else {
      setFilteredPrograms(programs.filter(p => p.employee_name === selectedEmployee));
    }
  }, [selectedEmployee, programs]);

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
        visit.doctors.forEach(doctor => {
          if (!doctor.trim()) isValid = false;
        });
      });
    });

    if (!isValid) {
      alert('Lütfen tüm hastane ve doktor isimlerini doldurun!');
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
      alert('Haftalık program başarıyla kaydedildi!');
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Haftalık program oluşturulurken bir hata oluştu');
    }
  };

  const handleUpdateProgram = async () => {
    if (!editingProgram) return;

    let isValid = true;
    currentWeek.forEach(day => {
      day.visits.forEach(visit => {
        if (!visit.hospital_name.trim()) isValid = false;
        visit.doctors.forEach(doctor => {
          if (!doctor.trim()) isValid = false;
        });
      });
    });

    if (!isValid) {
      alert('Lütfen tüm hastane ve doktor isimlerini doldurun!');
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
      alert('Haftalık program başarıyla güncellendi!');
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Haftalık program güncellenirken bir hata oluştu');
    }
  };

  const addHospitalToDay = (dayIndex: number) => {
    const updatedWeek = [...currentWeek];
    updatedWeek[dayIndex].visits.push({ hospital_name: '', doctors: [''] });
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

  const addDoctorToHospital = (dayIndex: number, hospitalIndex: number) => {
    const updatedWeek = [...currentWeek];
    updatedWeek[dayIndex].visits[hospitalIndex].doctors.push('');
    setCurrentWeek(updatedWeek);
  };

  const removeDoctorFromHospital = (dayIndex: number, hospitalIndex: number, doctorIndex: number) => {
    const updatedWeek = [...currentWeek];
    updatedWeek[dayIndex].visits[hospitalIndex].doctors.splice(doctorIndex, 1);
    setCurrentWeek(updatedWeek);
  };

  const updateDoctorName = (dayIndex: number, hospitalIndex: number, doctorIndex: number, name: string) => {
    const updatedWeek = [...currentWeek];
    updatedWeek[dayIndex].visits[hospitalIndex].doctors[doctorIndex] = name;
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

        {(user?.role === 'MANAGER' || user?.role === 'ADMIN') && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
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

        <div className="space-y-6">
          {filteredPrograms.map((program) => (
            <div key={program.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              <div className="p-6 border-b dark:border-gray-700 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-gray-700 dark:to-gray-800">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {new Date(program.week_start).toLocaleDateString('tr-TR')} - {new Date(program.week_end).toLocaleDateString('tr-TR')}
                    </h3>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-sm text-gray-600 dark:text-gray-300">{program.employee_name}</span>
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
                  {canEditProgram(program) && (
                    <button
                      onClick={() => handleEditProgram(program)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Edit className="w-4 h-4" />
                      Düzenle
                    </button>
                  )}
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {program.days.filter(day => day.visits.length > 0).map((day, dayIdx) => (
                    <div key={dayIdx} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                        {day.day_name} - {new Date(day.date).toLocaleDateString('tr-TR')}
                      </h4>
                      <div className="space-y-3">
                        {day.visits.map((visit, visitIdx) => (
                          <div key={visitIdx} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                            <div className="font-medium text-gray-900 dark:text-white mb-2">{visit.hospital_name}</div>
                            <div className="ml-4 space-y-1">
                              {visit.doctors.map((doctor, docIdx) => (
                                <div key={docIdx} className="text-sm text-gray-600 dark:text-gray-300">• {doctor}</div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full my-8 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Haftalık Program Oluştur</h2>
              <button onClick={() => setShowAddModal(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                <p className="text-sm text-blue-900 dark:text-blue-200">
                  <strong>Hafta:</strong> {currentWeek[0] && new Date(currentWeek[0].date).toLocaleDateString('tr-TR')} - {currentWeek[6] && new Date(currentWeek[6].date).toLocaleDateString('tr-TR')}
                </p>
              </div>

              {currentWeek.map((day, dayIndex) => (
                <div key={dayIndex} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{day.day_name} - {new Date(day.date).toLocaleDateString('tr-TR')}</h3>
                    <button
                      onClick={() => addHospitalToDay(dayIndex)}
                      className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-lg text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Hastane Ekle
                    </button>
                  </div>

                  <div className="space-y-3">
                    {day.visits.map((visit, hospitalIndex) => (
                      <div key={hospitalIndex} className="bg-white dark:bg-gray-800 rounded-lg p-4">
                        <div className="flex gap-3">
                          <div className="flex-1 space-y-3">
                            <input
                              type="text"
                              value={visit.hospital_name}
                              onChange={(e) => updateHospitalName(dayIndex, hospitalIndex, e.target.value)}
                              placeholder="Hastane adı"
                              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
                            />

                            <div className="ml-4 space-y-2">
                              <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Doktorlar:</label>
                                <button
                                  onClick={() => addDoctorToHospital(dayIndex, hospitalIndex)}
                                  className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1"
                                >
                                  <Plus className="w-3 h-3" />
                                  Doktor Ekle
                                </button>
                              </div>

                              {visit.doctors.map((doctor, doctorIndex) => (
                                <div key={doctorIndex} className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={doctor}
                                    onChange={(e) => updateDoctorName(dayIndex, hospitalIndex, doctorIndex, e.target.value)}
                                    placeholder="Doktor adı"
                                    className="flex-1 px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600 text-sm"
                                  />
                                  {visit.doctors.length > 1 && (
                                    <button
                                      onClick={() => removeDoctorFromHospital(dayIndex, hospitalIndex, doctorIndex)}
                                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                          <button
                            onClick={() => removeHospitalFromDay(dayIndex, hospitalIndex)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {day.visits.length === 0 && (
                      <p className="text-center text-gray-500 dark:text-gray-400 text-sm py-4">
                        Bu gün için henüz ziyaret eklenmedi
                      </p>
                    )}
                  </div>
                </div>
              ))}
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
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full my-8 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800">
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

            <div className="p-6 space-y-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                <p className="text-sm text-blue-900 dark:text-blue-200">
                  <strong>Hafta:</strong> {currentWeek[0] && new Date(currentWeek[0].date).toLocaleDateString('tr-TR')} - {currentWeek[6] && new Date(currentWeek[6].date).toLocaleDateString('tr-TR')}
                </p>
              </div>

              {currentWeek.map((day, dayIndex) => (
                <div key={dayIndex} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{day.day_name} - {new Date(day.date).toLocaleDateString('tr-TR')}</h3>
                    <button
                      onClick={() => addHospitalToDay(dayIndex)}
                      className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-lg text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Hastane Ekle
                    </button>
                  </div>

                  <div className="space-y-3">
                    {day.visits.map((visit, hospitalIndex) => (
                      <div key={hospitalIndex} className="bg-white dark:bg-gray-800 rounded-lg p-4">
                        <div className="flex gap-3">
                          <div className="flex-1 space-y-3">
                            <input
                              type="text"
                              value={visit.hospital_name}
                              onChange={(e) => updateHospitalName(dayIndex, hospitalIndex, e.target.value)}
                              placeholder="Hastane adı"
                              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
                            />

                            <div className="ml-4 space-y-2">
                              <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Doktorlar:</label>
                                <button
                                  onClick={() => addDoctorToHospital(dayIndex, hospitalIndex)}
                                  className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1"
                                >
                                  <Plus className="w-3 h-3" />
                                  Doktor Ekle
                                </button>
                              </div>

                              {visit.doctors.map((doctor, doctorIndex) => (
                                <div key={doctorIndex} className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={doctor}
                                    onChange={(e) => updateDoctorName(dayIndex, hospitalIndex, doctorIndex, e.target.value)}
                                    placeholder="Doktor adı"
                                    className="flex-1 px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600 text-sm"
                                  />
                                  {visit.doctors.length > 1 && (
                                    <button
                                      onClick={() => removeDoctorFromHospital(dayIndex, hospitalIndex, doctorIndex)}
                                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                          <button
                            onClick={() => removeHospitalFromDay(dayIndex, hospitalIndex)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {day.visits.length === 0 && (
                      <p className="text-center text-gray-500 dark:text-gray-400 text-sm py-4">
                        Bu gün için henüz ziyaret eklenmedi
                      </p>
                    )}
                  </div>
                </div>
              ))}
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
