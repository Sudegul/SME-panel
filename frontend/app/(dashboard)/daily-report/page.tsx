'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from '@/lib/axios';
import { Building, Stethoscope, Pill, Plus, X, Trash2, Edit } from 'lucide-react';

interface DoctorVisit {
  id?: number;
  doctor_name: string;
  hospital_name: string;
  specialty?: string;
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

export default function DailyReportPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [doctorVisits, setDoctorVisits] = useState<DoctorVisit[]>([]);
  const [pharmacyVisits, setPharmacyVisits] = useState<PharmacyVisit[]>([]);
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [showPharmacyModal, setShowPharmacyModal] = useState(false);
  const [doctorForm, setDoctorForm] = useState<DoctorVisit>({
    doctor_name: '',
    hospital_name: '',
    specialty: '',
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
    district: '',
    street: ''
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

      const doctorRes = await axios.get(`/daily-visits/doctors?visit_date=${today}`);
      setDoctorVisits(doctorRes.data);

      const pharmacyRes = await axios.get(`/daily-visits/pharmacies?visit_date=${today}`);
      setPharmacyVisits(pharmacyRes.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDoctorVisit = async () => {
    if (!doctorForm.doctor_name.trim() || !doctorForm.hospital_name.trim()) {
      alert('Lütfen doktor adı ve hastane adını doldurun!');
      return;
    }

    try {
      await axios.post('/daily-visits/doctors', {
        ...doctorForm,
        visit_date: today
      });

      setShowDoctorModal(false);
      setDoctorForm({ doctor_name: '', hospital_name: '', specialty: '', notes: '' });
      fetchData();
      alert('Hekim ziyareti başarıyla eklendi!');
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Hekim ziyareti eklenirken bir hata oluştu');
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
      alert('Lütfen eczane adını doldurun!');
      return;
    }

    // Adres standardizasyonu kontrolü
    const forbidden = ['mah.', 'sk.', 'cad.', 'bulv.', 'sokak', 'mahalle', 'cadde', 'bulvar'];
    const checkForbidden = (text: string) => {
      const lower = text.toLowerCase();
      return forbidden.some(word => lower.includes(word));
    };

    if (checkForbidden(newPharmacyData.city) || checkForbidden(newPharmacyData.district) || checkForbidden(newPharmacyData.street)) {
      alert('Lütfen "mah.", "sk." gibi kısaltmalar kullanmayın. Sadece semt ve sokak adını yazın.');
      return;
    }

    try {
      const res = await axios.post('/pharmacies/create', newPharmacyData);
      alert(res.data.message || 'Yeni eczane oluşturuldu!');
      setSelectedPharmacy({
        id: res.data.id,
        name: res.data.name,
        city: res.data.city,
        district: res.data.district,
        street: res.data.street,
        address_display: [res.data.district, res.data.street, res.data.city].filter(Boolean).join(' / '),
        is_approved: false
      });
      setShowNewPharmacyForm(false);
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Eczane oluşturulurken bir hata oluştu');
    }
  };

  const handleAddPharmacyVisit = async () => {
    if (!selectedPharmacy) {
      alert('Lütfen bir eczane seçin veya yeni eczane oluşturun!');
      return;
    }

    try {
      await axios.post('/daily-visits/pharmacies', {
        pharmacy_id: selectedPharmacy.id,
        pharmacy_name: selectedPharmacy.name,
        product_count: parseInt(visitDetails.product_count as string, 10) || 0,
        mf_count: parseInt(visitDetails.mf_count as string, 10) || 0,
        notes: visitDetails.notes,
        visit_date: today
      });

      setShowPharmacyModal(false);
      setPharmacyForm({ pharmacy_name: '', owner_name: '', phone: '', address: '', city: '', notes: '' });
      setSelectedPharmacy(null);
      setPharmacySearchResults([]);
      setShowNewPharmacyForm(false);
      setNewPharmacyData({ name: '', city: '', district: '', street: '' });
      setVisitDetails({ product_count: '', mf_count: '', notes: '' });
      fetchData();
      alert('Eczane ziyareti başarıyla eklendi!');
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Eczane ziyareti eklenirken bir hata oluştu');
    }
  };

  const handleDeleteDoctor = async (id: number) => {
    if (!confirm('Bu ziyareti silmek istediğinize emin misiniz?')) return;

    try {
      await axios.delete(`/daily-visits/doctors/${id}`);
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Ziyaret silinirken bir hata oluştu');
    }
  };

  const handleDeletePharmacy = async (id: number) => {
    if (!confirm('Bu ziyareti silmek istediğinize emin misiniz?')) return;

    try {
      await axios.delete(`/daily-visits/pharmacies/${id}`);
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Ziyaret silinirken bir hata oluştu');
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
        visit_date: today
      });
      setShowEditPharmacyVisitModal(false);
      setEditingPharmacyVisit(null);
      setEditPharmacyVisitForm({ product_count: '', mf_count: '', notes: '' });
      fetchData();
      alert('Ziyaret başarıyla güncellendi!');
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Güncelleme sırasında bir hata oluştu');
    }
  };

  const getColorCode = (count: number) => {
    if (count >= 20) return { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', border: 'border-green-300 dark:border-green-700' };
    if (count >= 15) return { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400', border: 'border-orange-300 dark:border-orange-700' };
    return { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', border: 'border-yellow-300 dark:border-yellow-700' };
  };

  const colorCode = getColorCode(doctorVisits.length);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600 dark:text-gray-300">Yükleniyor...</div>
      </div>
    );
  }

  return <>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className={`mb-6 p-6 rounded-lg border-2 ${colorCode.bg} ${colorCode.border}`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-2xl font-bold ${colorCode.text}`}>Bugünün Özeti</h2>
              <p className="text-gray-600 dark:text-gray-300 mt-1">{new Date(today).toLocaleDateString('tr-TR')}</p>
            </div>
            <div className="text-right">
              <div className={`text-4xl font-bold ${colorCode.text}`}>{doctorVisits.length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Hekim Ziyareti</div>
              <div className={`text-2xl font-bold ${colorCode.text} mt-2`}>{pharmacyVisits.length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Eczane Ziyareti</div>
            </div>
          </div>
        </div>

        <div className="mb-6 flex gap-4">
          <button
            onClick={() => setShowDoctorModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
          >
            <Stethoscope className="w-5 h-5" />
            Hekim Ziyareti Ekle
          </button>
          <button
            onClick={() => setShowPharmacyModal(true)}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {doctorVisits.map((visit) => (
              <div key={visit.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-gray-900 dark:text-white">{visit.doctor_name}</h4>
                  <button
                    onClick={() => visit.id && handleDeleteDoctor(visit.id)}
                    className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mb-1">
                  <Building className="w-4 h-4" />
                  {visit.hospital_name}
                </div>
                {visit.specialty && (
                  <div className="text-sm text-gray-500 dark:text-gray-400">Branş: {visit.specialty}</div>
                )}
                {visit.notes && (
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">{visit.notes}</div>
                )}
              </div>
            ))}
            {doctorVisits.length === 0 && (
              <div className="col-span-full text-center text-gray-500 dark:text-gray-400 py-8">
                Henüz hekim ziyareti eklenmemiş
              </div>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Pill className="w-6 h-6 text-green-600" />
            Eczane Ziyaretleri ({pharmacyVisits.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pharmacyVisits.map((visit) => (
              <div key={visit.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-semibold text-gray-900 dark:text-white">{visit.pharmacy_name}</h4>
                  <div className="flex gap-2">
                    {(user?.role === 'MANAGER' || user?.role === 'ADMIN') && (
                      <button
                        onClick={() => handleEditPharmacyVisit(visit)}
                        className="text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-1 rounded"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => visit.id && handleDeletePharmacy(visit.id)}
                      className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Satılan Ürün:</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">{visit.product_count}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Verilen MF:</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">{visit.mf_count}</span>
                  </div>
                  {visit.notes && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-2 pt-2 border-t dark:border-gray-600">
                      <span className="font-medium">Not:</span> {visit.notes}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {pharmacyVisits.length === 0 && (
              <div className="col-span-full text-center text-gray-500 dark:text-gray-400 py-8">
                Henüz eczane ziyareti eklenmemiş
              </div>
            )}
          </div>
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
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Ziyaret Detayları</h3>

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
                  <input
                    type="text"
                    placeholder="Sokak (örn: bahariye)"
                    value={newPharmacyData.street}
                    onChange={(e) => setNewPharmacyData({ ...newPharmacyData, street: e.target.value.toLowerCase() })}
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
    </div>
  </>;
}
