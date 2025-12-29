'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from '@/lib/axios';
import { Building, Stethoscope, Pill, Plus, X, Trash2, Edit, ChevronDown, ChevronRight } from 'lucide-react';
import DateSelector from '@/components/DateSelector';
import { toast } from 'react-toastify';

interface DoctorVisit {
  id?: number;
  doctor_name: string;
  hospital_name: string;
  specialty?: string;
  supported_product?: string;
  notes?: string;
}

interface PharmacyVisit {
  id?: number;
  pharmacy_id: number;
  pharmacy_name: string;
  product_count: number;
  mf_count: number;
  notes?: string;
}

interface PharmacySearchResult {
  id: number;
  name: string;
  city?: string;
  district?: string;
  street?: string;
  address_display: string;
  employee_name?: string;
  is_approved: boolean;
}

interface EmployeeDailyReport {
  employee_id: number;
  employee_name: string;
  doctor_visits: DoctorVisit[];
  pharmacy_visits: PharmacyVisit[];
  is_on_leave?: boolean;
  leave_type?: string;
}

interface ColorScale {
  id: number;
  color: string;
  min_visits: number;
  max_visits: number | null;
}

type ColorFilter = 'all' | 'yellow' | 'orange' | 'green';

export default function DailyReportPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [doctorVisits, setDoctorVisits] = useState<DoctorVisit[]>([]);
  const [pharmacyVisits, setPharmacyVisits] = useState<PharmacyVisit[]>([]);
  const [colorScales, setColorScales] = useState<ColorScale[]>([]);
  const [isOnLeaveToday, setIsOnLeaveToday] = useState<any>(null);
  const [showLeaveWarning, setShowLeaveWarning] = useState(false);
  const [pendingAction, setPendingAction] = useState<'doctor' | 'pharmacy' | null>(null);

  // Yönetici view states
  const [employeeReports, setEmployeeReports] = useState<EmployeeDailyReport[]>([]);
  const [colorFilter, setColorFilter] = useState<ColorFilter>('all');
  const [expandedEmployees, setExpandedEmployees] = useState<Set<number>>(new Set());
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [showPharmacyModal, setShowPharmacyModal] = useState(false);
  const [doctorForm, setDoctorForm] = useState<DoctorVisit>({
    doctor_name: '',
    hospital_name: '',
    specialty: '',
    supported_product: '',
    notes: ''
  });
  const [pharmacyForm, setPharmacyForm] = useState({
    pharmacy_name: '',
    owner_name: '',
    phone: '',
    address: '',
    city: '',
    notes: ''
  });
  const [pharmacySearchResults, setPharmacySearchResults] = useState<PharmacySearchResult[]>([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState<PharmacySearchResult | null>(null);
  const [showNewPharmacyForm, setShowNewPharmacyForm] = useState(false);
  const [newPharmacyData, setNewPharmacyData] = useState({
    name: '',
    city: '',
    district: ''
  });
  const [visitDetails, setVisitDetails] = useState({
    product_count: '',
    mf_count: '',
    notes: ''
  });
  const [showEditPharmacyVisitModal, setShowEditPharmacyVisitModal] = useState(false);
  const [editingPharmacyVisit, setEditingPharmacyVisit] = useState<PharmacyVisit | null>(null);
  const [editPharmacyVisitForm, setEditPharmacyVisitForm] = useState({
    product_count: '',
    mf_count: '',
    notes: ''
  });

  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(today);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchData();
  }, [selectedDate]); // selectedDate değiştiğinde yeniden fetch et

  const fetchData = async () => {
    try {
      setLoading(true);
      const [userRes, colorScalesRes] = await Promise.all([
        axios.get('/employees/me'),
        axios.get('/settings/visit-color-scales')
      ]);
      setUser(userRes.data);
      setColorScales(colorScalesRes.data);

      if (userRes.data.role === 'MANAGER' || userRes.data.role === 'ADMIN') {
        // Yönetici: Fetch all employees' visits
        const employeesRes = await axios.get('/employees/');
        const activeEmployees = employeesRes.data.filter((emp: any) => emp.is_active);

        // Sort employees: Çalışan first, then Yönetici and Admin at the end
        activeEmployees.sort((a: any, b: any) => {
          const aIsManagerOrAdmin = a.role === 'MANAGER' || a.role === 'ADMIN';
          const bIsManagerOrAdmin = b.role === 'MANAGER' || b.role === 'ADMIN';

          if (aIsManagerOrAdmin && !bIsManagerOrAdmin) return 1;
          if (!aIsManagerOrAdmin && bIsManagerOrAdmin) return -1;
          return 0;
        });

        const [doctorVisitsRes, pharmacyVisitsRes, leavesRes] = await Promise.all([
          axios.get('/daily-visits/doctors', { params: { visit_date: selectedDate, limit: 1000 } }),
          axios.get('/daily-visits/pharmacies', { params: { visit_date: selectedDate, limit: 1000 } }),
          axios.get('/leave-requests/employees-on-leave', { params: { check_date: selectedDate } })
        ]);

        // Group by employee
        const employeeReportsMap: { [key: number]: EmployeeDailyReport } = {};
        const leavesData = leavesRes.data;

        activeEmployees.forEach((emp: any) => {
          const leaveInfo = leavesData[emp.id];
          employeeReportsMap[emp.id] = {
            employee_id: emp.id,
            employee_name: emp.full_name,
            doctor_visits: [],
            pharmacy_visits: [],
            is_on_leave: leaveInfo?.is_on_leave || false,
            leave_type: leaveInfo?.leave_type
          };
        });

        // Add doctor visits
        doctorVisitsRes.data.forEach((visit: any) => {
          if (employeeReportsMap[visit.employee_id]) {
            employeeReportsMap[visit.employee_id].doctor_visits.push(visit);
          }
        });

        // Add pharmacy visits
        pharmacyVisitsRes.data.forEach((visit: any) => {
          if (employeeReportsMap[visit.employee_id]) {
            employeeReportsMap[visit.employee_id].pharmacy_visits.push(visit);
          }
        });

        // Convert to array and maintain the sort order (EMPLOYEE first, MANAGER/ADMIN last)
        const sortedReports = activeEmployees.map((emp: any) => employeeReportsMap[emp.id]);
        setEmployeeReports(sortedReports);
      } else {
        // Regular employee: Fetch own visits
        const [doctorRes, pharmacyRes, leaveStatusRes] = await Promise.all([
          axios.get('/daily-visits/doctors', { params: { visit_date: selectedDate } }),
          axios.get('/daily-visits/pharmacies', { params: { visit_date: selectedDate } }),
          axios.get('/leave-requests/my-leave-status', { params: { check_date: selectedDate } })
        ]);

        setDoctorVisits(doctorRes.data);
        setPharmacyVisits(pharmacyRes.data);
        setIsOnLeaveToday(leaveStatusRes.data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDoctorModal = () => {
    if (isOnLeaveToday?.is_on_leave) {
      setPendingAction('doctor');
      setShowLeaveWarning(true);
    } else {
      setShowDoctorModal(true);
    }
  };

  const handleOpenPharmacyModal = () => {
    if (isOnLeaveToday?.is_on_leave) {
      setPendingAction('pharmacy');
      setShowLeaveWarning(true);
    } else {
      setShowPharmacyModal(true);
    }
  };

  const handleProceedWithLeaveWarning = () => {
    setShowLeaveWarning(false);
    if (pendingAction === 'doctor') {
      setShowDoctorModal(true);
    } else if (pendingAction === 'pharmacy') {
      setShowPharmacyModal(true);
    }
    setPendingAction(null);
  };

  const handleAddDoctorVisit = async () => {
    if (!doctorForm.doctor_name.trim() || !doctorForm.hospital_name.trim()) {
      toast.warning('Lütfen doktor adı ve hastane adını doldurun!');
      return;
    }

    try {
      await axios.post('/daily-visits/doctors', {
        ...doctorForm,
        visit_date: selectedDate
      });

      setShowDoctorModal(false);
      setDoctorForm({ doctor_name: '', hospital_name: '', specialty: '', supported_product: '', notes: '' });
      fetchData();
      toast.success('Hekim ziyareti başarıyla eklendi');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Hekim ziyareti eklenirken bir hata oluştu');
    }
  };

  const handlePharmacyNameSearch = async (name: string) => {
    if (!name || name.length < 2) {
      setPharmacySearchResults([]);
      return;
    }

    try {
      const res = await axios.get(`/pharmacies/search?name=${encodeURIComponent(name)}`);
      setPharmacySearchResults(res.data);
    } catch (error) {
      console.error('Error searching pharmacies:', error);
      setPharmacySearchResults([]);
    }
  };

  const handleSelectPharmacy = (pharmacy: PharmacySearchResult) => {
    setSelectedPharmacy(pharmacy);
    setPharmacySearchResults([]);
    setShowNewPharmacyForm(false);
  };

  const handleCreateNewPharmacy = async () => {
    if (!newPharmacyData.name.trim()) {
      toast.warning('Lütfen eczane adını doldurun!');
      return;
    }

    // Adres standardizasyonu kontrolü
    const forbidden = ['mah.', 'sk.', 'cad.', 'bulv.', 'sokak', 'mahalle', 'cadde', 'bulvar'];
    const checkForbidden = (text: string) => {
      const lower = text.toLowerCase();
      return forbidden.some(word => lower.includes(word));
    };

    if (checkForbidden(newPharmacyData.city) || checkForbidden(newPharmacyData.district)) {
      toast.warning('Lütfen "mah.", "sk." gibi kısaltmalar kullanmayın. Sadece şehir ve semt adını yazın.');
      return;
    }

    try {
      const res = await axios.post('/pharmacies/create', newPharmacyData);
      toast.success('Eczane oluşturuldu! Şimdi ziyaret detaylarını doldurun.');
      setSelectedPharmacy({
        id: res.data.id,
        name: res.data.name,
        city: res.data.city,
        district: res.data.district,
        address_display: [res.data.district, res.data.city].filter(Boolean).join(' / '),
        is_approved: false
      });
      setShowNewPharmacyForm(false);
      // Ziyaret detayları formuna odaklan
      setPharmacySearchResults([]);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Eczane oluşturulurken bir hata oluştu');
    }
  };

  const handleAddPharmacyVisit = async () => {
    if (!selectedPharmacy) {
      toast.warning('Lütfen bir eczane seçin veya yeni eczane oluşturun!');
      return;
    }

    try {
      await axios.post('/daily-visits/pharmacies', {
        pharmacy_id: selectedPharmacy.id,
        pharmacy_name: selectedPharmacy.name,
        product_count: parseInt(visitDetails.product_count as string, 10) || 0,
        mf_count: parseInt(visitDetails.mf_count as string, 10) || 0,
        notes: visitDetails.notes,
        visit_date: selectedDate
      });

      setShowPharmacyModal(false);
      setPharmacyForm({ pharmacy_name: '', owner_name: '', phone: '', address: '', city: '', notes: '' });
      setSelectedPharmacy(null);
      setPharmacySearchResults([]);
      setShowNewPharmacyForm(false);
      setNewPharmacyData({ name: '', city: '', district: '' });
      setVisitDetails({ product_count: '', mf_count: '', notes: '' });
      fetchData();
      toast.success('Eczane ziyareti başarıyla eklendi');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Eczane ziyareti eklenirken bir hata oluştu');
    }
  };

  const handleDeleteDoctor = async (id: number) => {
    if (!confirm('Bu ziyareti silmek istediğinize emin misiniz?')) return;

    try {
      await axios.delete(`/daily-visits/doctors/${id}`);
      fetchData();
      toast.success('Ziyaret silindi');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ziyaret silinirken bir hata oluştu');
    }
  };

  const handleDeletePharmacy = async (id: number) => {
    if (!confirm('Bu ziyareti silmek istediğinize emin misiniz?')) return;

    try {
      await axios.delete(`/daily-visits/pharmacies/${id}`);
      fetchData();
      toast.success('Ziyaret silindi');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ziyaret silinirken bir hata oluştu');
    }
  };

  const handleEditPharmacyVisit = (visit: PharmacyVisit) => {
    setEditingPharmacyVisit(visit);
    setEditPharmacyVisitForm({
      product_count: visit.product_count.toString(),
      mf_count: visit.mf_count.toString(),
      notes: visit.notes || ''
    });
    setShowEditPharmacyVisitModal(true);
  };

  const handleSavePharmacyVisit = async () => {
    if (!editingPharmacyVisit || !editingPharmacyVisit.id) return;

    try {
      await axios.put(`/daily-visits/pharmacies/${editingPharmacyVisit.id}`, {
        pharmacy_id: editingPharmacyVisit.pharmacy_id,
        pharmacy_name: editingPharmacyVisit.pharmacy_name,
        product_count: parseInt(editPharmacyVisitForm.product_count as string, 10) || 0,
        mf_count: parseInt(editPharmacyVisitForm.mf_count as string, 10) || 0,
        notes: editPharmacyVisitForm.notes,
        visit_date: selectedDate
      });
      setShowEditPharmacyVisitModal(false);
      setEditingPharmacyVisit(null);
      setEditPharmacyVisitForm({ product_count: '', mf_count: '', notes: '' });
      fetchData();
      toast.success('Ziyaret başarıyla güncellendi');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Güncelleme sırasında bir hata oluştu');
    }
  };

  // Helper functions for color coding (dynamic based on colorScales from API)
  const getColorClass = (doctorVisits: number) => {
    const sortedScales = [...colorScales].sort((a, b) => a.min_visits - b.min_visits);

    for (const scale of sortedScales) {
      if (scale.max_visits === null) {
        if (doctorVisits >= scale.min_visits) {
          return getColorClassForColor(scale.color);
        }
      } else {
        if (doctorVisits >= scale.min_visits && doctorVisits <= scale.max_visits) {
          return getColorClassForColor(scale.color);
        }
      }
    }

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

  const getColorCategory = (doctorVisits: number): ColorFilter => {
    const sortedScales = [...colorScales].sort((a, b) => a.min_visits - b.min_visits);

    for (const scale of sortedScales) {
      if (scale.max_visits === null) {
        if (doctorVisits >= scale.min_visits) {
          return scale.color as ColorFilter;
        }
      } else {
        if (doctorVisits >= scale.min_visits && doctorVisits <= scale.max_visits) {
          return scale.color as ColorFilter;
        }
      }
    }

    return 'yellow';
  };

  const getUserColorInfo = (doctorVisits: number) => {
    const sortedScales = [...colorScales].sort((a, b) => a.min_visits - b.min_visits);

    for (const scale of sortedScales) {
      if (scale.max_visits === null) {
        if (doctorVisits >= scale.min_visits) {
          return { color: scale.color, label: getColorLabel(scale.color) };
        }
      } else {
        if (doctorVisits >= scale.min_visits && doctorVisits <= scale.max_visits) {
          return { color: scale.color, label: getColorLabel(scale.color) };
        }
      }
    }

    return { color: 'gray', label: 'Gri' };
  };

  const getColorLabel = (color: string) => {
    switch (color) {
      case 'yellow': return 'Sarı';
      case 'orange': return 'Turuncu';
      case 'green': return 'Yeşil';
      default: return color;
    }
  };

  const getColorTextClass = (color: string) => {
    switch (color) {
      case 'yellow': return 'text-yellow-600 dark:text-yellow-400 font-bold';
      case 'orange': return 'text-orange-600 dark:text-orange-400 font-bold';
      case 'green': return 'text-green-600 dark:text-green-400 font-bold';
      default: return 'text-gray-600 dark:text-gray-400 font-bold';
    }
  };

  const filteredEmployeeReports = employeeReports.filter(report => {
    if (colorFilter === 'all') return true;
    return getColorCategory(report.doctor_visits.length) === colorFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600 dark:text-gray-300">Yükleniyor...</div>
      </div>
    );
  }

  // Yönetici View
  if (user?.role === 'MANAGER' || user?.role === 'ADMIN') {
    return (
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">Günlük Rapor</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">Çalışanların günlük ziyaret detayları</p>
        </div>

        {/* Tarih Seçici ve Filtre */}
        <div className="mb-4 sm:mb-6 bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 space-y-4">
          <DateSelector
            value={selectedDate}
            onChange={setSelectedDate}
            max={today}
          />
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-4 border-t dark:border-gray-700">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Renk Filtrele:</label>
            <select
              value={colorFilter}
              onChange={(e) => setColorFilter(e.target.value as ColorFilter)}
              className="w-full sm:w-auto px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm sm:text-base"
            >
              <option value="all">Tümü</option>
              <option value="yellow">Sarı (0-14)</option>
              <option value="orange">Turuncu (15-19)</option>
              <option value="green">Yeşil (20+)</option>
            </select>
          </div>
        </div>

        {/* Çalışan Raporları */}
        <div className="space-y-6">
          {filteredEmployeeReports.map((report) => (
            <div key={report.employee_id} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              {/* Çalışan İsmi Header - Colored + Clickable */}
              <div
                className={`p-4 ${getColorClass(report.doctor_visits.length)} cursor-pointer hover:opacity-90 transition-opacity`}
                onClick={() => {
                  const newExpanded = new Set(expandedEmployees);
                  if (newExpanded.has(report.employee_id)) {
                    newExpanded.delete(report.employee_id);
                  } else {
                    newExpanded.add(report.employee_id);
                  }
                  setExpandedEmployees(newExpanded);
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {expandedEmployees.has(report.employee_id) ? (
                      <ChevronDown className="w-5 h-5" />
                    ) : (
                      <ChevronRight className="w-5 h-5" />
                    )}
                    <h3 className="text-xl font-bold">{report.employee_name}</h3>
                  </div>
                  <div className="text-sm font-semibold">
                    {report.is_on_leave ? (
                      <span className="text-green-600 dark:text-green-400 font-bold">İzinli ({report.leave_type})</span>
                    ) : (
                      <>{report.doctor_visits.length} Hekim | {report.pharmacy_visits.length} Eczane</>
                    )}
                  </div>
                </div>
              </div>

              {/* Visit Details - Collapsible */}
              {expandedEmployees.has(report.employee_id) && (
                <div className="p-6 space-y-6">
                {report.is_on_leave ? (
                  <div className="flex items-center justify-center p-8 bg-green-50 dark:bg-green-900/20 rounded-lg border-2 border-green-300 dark:border-green-700">
                    <p className="text-lg font-bold text-green-700 dark:text-green-400">
                      İzinli ({report.leave_type})
                    </p>
                  </div>
                ) : (
                  <>
                {/* Hekim Ziyaretleri */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Stethoscope className="w-5 h-5 text-blue-600" />
                    Hekim Ziyaretleri
                  </h4>
                  {report.doctor_visits.length > 0 ? (
                    <div className="overflow-x-auto -mx-4 sm:mx-0">
                      <div className="inline-block min-w-full align-middle">
                        <table className="min-w-full border-collapse">
                          <thead>
                            <tr className="bg-blue-100 dark:bg-blue-900/40">
                              <th className="w-32 sm:w-40 px-2 sm:px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 border-b-2 border-blue-300 dark:border-blue-700">Hastane</th>
                              <th className="w-24 sm:w-32 px-2 sm:px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 border-b-2 border-blue-300 dark:border-blue-700">Bölüm</th>
                              <th className="w-28 sm:w-36 px-2 sm:px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 border-b-2 border-blue-300 dark:border-blue-700">Hekim</th>
                              <th className="w-28 sm:w-36 px-2 sm:px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 border-b-2 border-blue-300 dark:border-blue-700">Desteklenen Ürün</th>
                              <th className="w-32 sm:w-48 px-2 sm:px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 border-b-2 border-blue-300 dark:border-blue-700">Notlar</th>
                            </tr>
                          </thead>
                          <tbody>
                            {report.doctor_visits.map((visit, idx) => (
                              <tr key={idx} className="border-b border-blue-100 dark:border-blue-900/30 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                                <td className="w-32 sm:w-40 px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-900 dark:text-white break-words">{visit.hospital_name}</td>
                                <td className="w-24 sm:w-32 px-2 sm:px-4 py-3 text-xs sm:text-sm text-blue-600 dark:text-blue-400 break-words">{visit.specialty || '-'}</td>
                                <td className="w-28 sm:w-36 px-2 sm:px-4 py-3 text-xs sm:text-sm font-medium text-gray-900 dark:text-white break-words">{visit.doctor_name}</td>
                                <td className="w-28 sm:w-36 px-2 sm:px-4 py-3 text-xs sm:text-sm text-green-600 dark:text-green-400 font-medium break-words">{visit.supported_product || '-'}</td>
                                <td className="w-32 sm:w-48 px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-600 dark:text-gray-400 break-words">{visit.notes || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">Hekim ziyareti yok</p>
                  )}
                </div>

                {/* Eczane Ziyaretleri */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Building className="w-5 h-5 text-green-600" />
                    Eczane Ziyaretleri
                  </h4>
                  {report.pharmacy_visits.length > 0 ? (
                    <div className="overflow-x-auto -mx-4 sm:mx-0">
                      <div className="inline-block min-w-full align-middle">
                        <table className="min-w-full border-collapse">
                          <thead>
                            <tr className="bg-green-100 dark:bg-green-900/40">
                              <th className="w-32 sm:w-48 px-2 sm:px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 border-b-2 border-green-300 dark:border-green-700">Eczane Adı</th>
                              <th className="w-24 sm:w-32 px-2 sm:px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 border-b-2 border-green-300 dark:border-green-700">Satılan Ürün</th>
                              <th className="w-20 sm:w-24 px-2 sm:px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 border-b-2 border-green-300 dark:border-green-700">MF Sayısı</th>
                              <th className="w-32 sm:w-48 px-2 sm:px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 border-b-2 border-green-300 dark:border-green-700">Notlar</th>
                            </tr>
                          </thead>
                          <tbody>
                            {report.pharmacy_visits.map((visit, idx) => (
                              <tr key={idx} className="border-b border-green-100 dark:border-green-900/30 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors">
                                <td className="w-32 sm:w-48 px-2 sm:px-4 py-3 text-xs sm:text-sm font-medium text-gray-900 dark:text-white break-words">{visit.pharmacy_name || 'Eczane'}</td>
                                <td className="w-24 sm:w-32 px-2 sm:px-4 py-3 text-xs sm:text-sm text-purple-600 dark:text-purple-400 font-medium text-center">{visit.product_count}</td>
                                <td className="w-20 sm:w-24 px-2 sm:px-4 py-3 text-xs sm:text-sm text-orange-600 dark:text-orange-400 font-medium text-center">{visit.mf_count}</td>
                                <td className="w-32 sm:w-48 px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-600 dark:text-gray-400 break-words">{visit.notes || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">Eczane ziyareti yok</p>
                  )}
                </div>
                  </>
                )}
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredEmployeeReports.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <Stethoscope className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              {colorFilter === 'all' ? 'Seçili tarih için veri bulunmuyor' : 'Seçili filtre için veri bulunmuyor'}
            </p>
          </div>
        )}
      </div>
    );
  }

  // Çalışan View

  return <>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tarih Seçici */}
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <DateSelector
            value={selectedDate}
            onChange={setSelectedDate}
            max={today}
          />
        </div>

        <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border-2 border-blue-300 dark:border-blue-700">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/40 dark:to-blue-800/40 px-6 py-4 border-b-2 border-blue-300 dark:border-blue-700">
            <h2 className="text-2xl font-bold text-blue-700 dark:text-blue-400">Seçilen Günün Özeti</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{new Date(selectedDate).toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>

          {/* Stats Grid */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Hekim Ziyaretleri */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border-2 border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Hekim Ziyareti</div>
                    <div className="text-4xl font-bold text-blue-700 dark:text-blue-400 mt-1">{doctorVisits.length}</div>
                  </div>
                  <Stethoscope className="w-12 h-12 text-blue-400 dark:text-blue-600" />
                </div>
              </div>

              {/* Eczane Ziyaretleri */}
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border-2 border-green-200 dark:border-green-800">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Eczane Ziyareti</div>
                    <div className="text-4xl font-bold text-green-700 dark:text-green-400 mt-1">{pharmacyVisits.length}</div>
                  </div>
                  <Pill className="w-12 h-12 text-green-400 dark:text-green-600" />
                </div>
              </div>

              {/* Renk Kodu */}
              <div className={`${getColorClass(doctorVisits.length)} rounded-lg p-4 border-2`}>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Renk Kodunuz</div>
                <div className="text-3xl font-bold">
                  <span className={getUserColorInfo(doctorVisits.length).color === 'yellow' ? 'text-yellow-600 dark:text-yellow-400' :
                                  getUserColorInfo(doctorVisits.length).color === 'orange' ? 'text-orange-600 dark:text-orange-400' :
                                  getUserColorInfo(doctorVisits.length).color === 'green' ? 'text-green-600 dark:text-green-400' :
                                  'text-gray-600 dark:text-gray-400'}>
                    {getUserColorInfo(doctorVisits.length).label}
                  </span>
                </div>
              </div>
            </div>

            {/* Renk Kodları Açıklaması (Dinamik) */}
            {colorScales.length > 0 && (
              <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Renk Kodları</div>
                <div className="flex flex-wrap gap-3">
                  {colorScales
                    .sort((a, b) => a.min_visits - b.min_visits)
                    .map((scale) => (
                      <div key={scale.id} className="flex items-center gap-1.5">
                        <div className={`w-5 h-5 rounded ${getColorClassForColor(scale.color)} border`}></div>
                        <span className="text-xs text-gray-700 dark:text-gray-300">
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
          </div>
        </div>

        <div className="mb-6 flex gap-4">
          <button
            onClick={handleOpenDoctorModal}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
          >
            <Stethoscope className="w-5 h-5" />
            Hekim Ziyareti Ekle
          </button>
          <button
            onClick={handleOpenPharmacyModal}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-lg"
          >
            <Pill className="w-5 h-5" />
            Eczane Ziyareti Ekle
          </button>
        </div>

        <div className="mb-8">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-blue-600" />
            Hekim Ziyaretleri ({doctorVisits.length})
          </h3>
          {doctorVisits.length > 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="bg-blue-100 dark:bg-blue-900/40">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 border-b-2 border-blue-300 dark:border-blue-700">Hastane</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 border-b-2 border-blue-300 dark:border-blue-700">Bölüm</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 border-b-2 border-blue-300 dark:border-blue-700">Hekim</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 border-b-2 border-blue-300 dark:border-blue-700">Desteklenen Ürün</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 border-b-2 border-blue-300 dark:border-blue-700">Notlar</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-200 border-b-2 border-blue-300 dark:border-blue-700">İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doctorVisits.map((visit) => (
                      <tr key={visit.id} className="border-b border-blue-100 dark:border-blue-900/30 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{visit.hospital_name}</td>
                        <td className="px-4 py-3 text-sm text-blue-600 dark:text-blue-400">{visit.specialty || '-'}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{visit.doctor_name}</td>
                        <td className="px-4 py-3 text-sm text-green-600 dark:text-green-400 font-medium">{visit.supported_product || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate" title={visit.notes}>{visit.notes || '-'}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => visit.id && handleDeleteDoctor(visit.id)}
                            className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded inline-flex items-center justify-center"
                            title="Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
              {isOnLeaveToday?.is_on_leave ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="text-5xl">🏖️</div>
                  <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                    Bugün İzinlisiniz
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {isOnLeaveToday.leave_type}
                  </p>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">Henüz hekim ziyareti eklenmemiş</p>
              )}
            </div>
          )}
        </div>

        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Pill className="w-6 h-6 text-green-600" />
            Eczane Ziyaretleri ({pharmacyVisits.length})
          </h3>
          {pharmacyVisits.length > 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="bg-green-100 dark:bg-green-900/40">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 border-b-2 border-green-300 dark:border-green-700">Eczane Adı</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 border-b-2 border-green-300 dark:border-green-700">Satılan Ürün Sayısı</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 border-b-2 border-green-300 dark:border-green-700">MF Sayısı</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 border-b-2 border-green-300 dark:border-green-700">Notlar</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-200 border-b-2 border-green-300 dark:border-green-700">İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pharmacyVisits.map((visit) => (
                      <tr key={visit.id} className="border-b border-green-100 dark:border-green-900/30 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{visit.pharmacy_name}</td>
                        <td className="px-4 py-3 text-sm text-purple-600 dark:text-purple-400 font-medium">{visit.product_count}</td>
                        <td className="px-4 py-3 text-sm text-orange-600 dark:text-orange-400 font-medium">{visit.mf_count}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate" title={visit.notes}>{visit.notes || '-'}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex gap-2 justify-center">
                            {(user?.role === 'MANAGER' || user?.role === 'ADMIN') && (
                              <button
                                onClick={() => handleEditPharmacyVisit(visit)}
                                className="text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-2 rounded inline-flex items-center justify-center"
                                title="Düzenle"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => visit.id && handleDeletePharmacy(visit.id)}
                              className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded inline-flex items-center justify-center"
                              title="Sil"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
              {isOnLeaveToday?.is_on_leave ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="text-5xl">🏖️</div>
                  <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                    Bugün İzinlisiniz
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {isOnLeaveToday.leave_type}
                  </p>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">Henüz eczane ziyareti eklenmemiş</p>
              )}
            </div>
          )}
        </div>

      {/* Doctor Modal */}
      {showDoctorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Hekim Ziyareti Ekle</h2>
              <button onClick={() => setShowDoctorModal(false)} className="text-gray-500">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Doktor Adı *"
                value={doctorForm.doctor_name}
                onChange={(e) => setDoctorForm({ ...doctorForm, doctor_name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
              />
              <input
                type="text"
                placeholder="Hastane Adı *"
                value={doctorForm.hospital_name}
                onChange={(e) => setDoctorForm({ ...doctorForm, hospital_name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
              />
              <input
                type="text"
                placeholder="Branş"
                value={doctorForm.specialty}
                onChange={(e) => setDoctorForm({ ...doctorForm, specialty: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
              />
              <input
                type="text"
                placeholder="Desteklenen Ürün"
                value={doctorForm.supported_product}
                onChange={(e) => setDoctorForm({ ...doctorForm, supported_product: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
              />
              <textarea
                placeholder="Notlar"
                value={doctorForm.notes}
                onChange={(e) => setDoctorForm({ ...doctorForm, notes: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
                rows={3}
              />
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowDoctorModal(false)}
                  className="px-4 py-2 border rounded-lg"
                >
                  İptal
                </button>
                <button
                  onClick={handleAddDoctorVisit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                >
                  Ekle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pharmacy Modal */}
      {showPharmacyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Eczane Ziyareti Ekle</h2>
              <button onClick={() => {
                setShowPharmacyModal(false);
                setSelectedPharmacy(null);
                setPharmacySearchResults([]);
                setShowNewPharmacyForm(false);
              }} className="text-gray-500">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Eczane Arama */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Eczane Adı *
                </label>
                <input
                  type="text"
                  placeholder="Eczane adını yazın..."
                  value={pharmacyForm.pharmacy_name}
                  onChange={(e) => {
                    setPharmacyForm({ ...pharmacyForm, pharmacy_name: e.target.value });
                    handlePharmacyNameSearch(e.target.value);
                  }}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
                />
              </div>

              {/* Arama Sonuçları */}
              {pharmacySearchResults.length > 0 && !selectedPharmacy && (
                <div className="border rounded-lg p-4 dark:border-gray-600">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Bu eczanelerden biri mi?
                  </h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {pharmacySearchResults.map((pharmacy) => (
                      <button
                        key={pharmacy.id}
                        onClick={() => handleSelectPharmacy(pharmacy)}
                        className="w-full text-left p-3 border rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 dark:border-gray-600 transition-colors"
                      >
                        <div className="font-medium text-gray-900 dark:text-white">{pharmacy.name}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{pharmacy.address_display}</div>
                        {pharmacy.employee_name && (
                          <div className="text-xs text-gray-500 dark:text-gray-500">Ekleyen: {pharmacy.employee_name}</div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Seçilen Eczane */}
              {selectedPharmacy && (
                <>
                  <div className="border-2 border-green-500 rounded-lg p-4 bg-green-50 dark:bg-green-900/20">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">✓ Seçilen Eczane</div>
                        <div className="text-lg font-bold text-green-700 dark:text-green-400">{selectedPharmacy.name}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{selectedPharmacy.address_display}</div>
                      </div>
                      <button
                        onClick={() => setSelectedPharmacy(null)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Ziyaret Detayları Formu */}
                  <div className="border-2 border-blue-500 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20 space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">📝 Ziyaret Detaylarını Doldurun</h3>
                    </div>
                    <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                      Eczane seçildi! Şimdi bu eczaneye yaptığınız ziyaretin detaylarını girin.
                    </p>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Satılan Ürün Sayısı *
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={visitDetails.product_count}
                        onChange={(e) => {
                          // Sadece rakam kabul et
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          setVisitDetails({ ...visitDetails, product_count: val });
                        }}
                        onFocus={(e) => {
                          // Tıklandığında leading zero'ları temizle
                          if (e.target.value && e.target.value !== '0') {
                            const val = parseInt(e.target.value, 10).toString();
                            setVisitDetails({ ...visitDetails, product_count: val });
                          }
                        }}
                        className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Verilen MF Sayısı *
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={visitDetails.mf_count}
                        onChange={(e) => {
                          // Sadece rakam kabul et
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          setVisitDetails({ ...visitDetails, mf_count: val });
                        }}
                        onFocus={(e) => {
                          // Tıklandığında leading zero'ları temizle
                          if (e.target.value && e.target.value !== '0') {
                            const val = parseInt(e.target.value, 10).toString();
                            setVisitDetails({ ...visitDetails, mf_count: val });
                          }
                        }}
                        className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Notlar (Opsiyonel)
                      </label>
                      <textarea
                        value={visitDetails.notes}
                        onChange={(e) => setVisitDetails({ ...visitDetails, notes: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
                        rows={3}
                        placeholder="Ziyaretle ilgili notlar..."
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Yeni Eczane Ekle Butonu */}
              {pharmacyForm.pharmacy_name && !selectedPharmacy && (
                <button
                  onClick={() => {
                    setShowNewPharmacyForm(!showNewPharmacyForm);
                    setNewPharmacyData({ ...newPharmacyData, name: pharmacyForm.pharmacy_name });
                  }}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Yeni Eczane Ekle
                </button>
              )}

              {/* Yeni Eczane Formu */}
              {showNewPharmacyForm && (
                <div className="border-2 border-blue-500 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20 space-y-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Yeni Eczane Bilgileri</h3>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                    * Tüm bilgiler küçük harfle girilmeli. "mah.", "sk." gibi kısaltmalar kullanmayın.
                  </div>
                  <input
                    type="text"
                    placeholder="Eczane Adı *"
                    value={newPharmacyData.name}
                    onChange={(e) => setNewPharmacyData({ ...newPharmacyData, name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  />
                  <input
                    type="text"
                    placeholder="Şehir (örn: istanbul)"
                    value={newPharmacyData.city}
                    onChange={(e) => setNewPharmacyData({ ...newPharmacyData, city: e.target.value.toLowerCase() })}
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  />
                  <input
                    type="text"
                    placeholder="Semt/İlçe (örn: kadıköy)"
                    value={newPharmacyData.district}
                    onChange={(e) => setNewPharmacyData({ ...newPharmacyData, district: e.target.value.toLowerCase() })}
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  />
                  <button
                    onClick={handleCreateNewPharmacy}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Eczaneyi Oluştur
                  </button>
                </div>
              )}

              {/* Alt Butonlar */}
              <div className="flex gap-3 justify-end pt-4 border-t dark:border-gray-600">
                <button
                  onClick={() => {
                    setShowPharmacyModal(false);
                    setSelectedPharmacy(null);
                    setPharmacySearchResults([]);
                    setShowNewPharmacyForm(false);
                  }}
                  className="px-4 py-2 border rounded-lg dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  İptal
                </button>
                <button
                  onClick={handleAddPharmacyVisit}
                  disabled={!selectedPharmacy}
                  className={`px-4 py-2 rounded-lg ${
                    selectedPharmacy
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Ziyaret Ekle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Eczane Ziyareti Düzenleme Modalı */}
      {showEditPharmacyVisitModal && editingPharmacyVisit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Eczane Ziyaretini Düzenle</h2>
              <button
                onClick={() => {
                  setShowEditPharmacyVisitModal(false);
                  setEditingPharmacyVisit(null);
                }}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mb-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>{editingPharmacyVisit.pharmacy_name}</strong>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Satılan Ürün Sayısı *
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={editPharmacyVisitForm.product_count}
                  onChange={(e) => {
                    // Sadece rakam kabul et
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setEditPharmacyVisitForm({ ...editPharmacyVisitForm, product_count: val });
                  }}
                  onFocus={(e) => {
                    // Tıklandığında leading zero'ları temizle
                    if (e.target.value && e.target.value !== '0') {
                      const val = parseInt(e.target.value, 10).toString();
                      setEditPharmacyVisitForm({ ...editPharmacyVisitForm, product_count: val });
                    }
                  }}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Verilen MF Sayısı *
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={editPharmacyVisitForm.mf_count}
                  onChange={(e) => {
                    // Sadece rakam kabul et
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setEditPharmacyVisitForm({ ...editPharmacyVisitForm, mf_count: val });
                  }}
                  onFocus={(e) => {
                    // Tıklandığında leading zero'ları temizle
                    if (e.target.value && e.target.value !== '0') {
                      const val = parseInt(e.target.value, 10).toString();
                      setEditPharmacyVisitForm({ ...editPharmacyVisitForm, mf_count: val });
                    }
                  }}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notlar (Opsiyonel)
                </label>
                <textarea
                  value={editPharmacyVisitForm.notes}
                  onChange={(e) => setEditPharmacyVisitForm({ ...editPharmacyVisitForm, notes: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  rows={3}
                  placeholder="Ziyaretle ilgili notlar..."
                />
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  ⚠️ Sadece MANAGER ve ADMIN yetkisine sahip kullanıcılar ürün ve MF sayılarını düzenleyebilir.
                </p>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  onClick={() => {
                    setShowEditPharmacyVisitModal(false);
                    setEditingPharmacyVisit(null);
                  }}
                  className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={handleSavePharmacyVisit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Kaydet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* İzin Uyarı Modalı */}
      {showLeaveWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-5xl">🏖️</div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Bugün İzinlisiniz</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">{isOnLeaveToday?.leave_type}</p>
              </div>
            </div>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Bugün izinlisiniz. Veri girmek istediğinize emin misiniz?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowLeaveWarning(false);
                  setPendingAction(null);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                İptal
              </button>
              <button
                onClick={handleProceedWithLeaveWarning}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Devam Et
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  </>;
}
