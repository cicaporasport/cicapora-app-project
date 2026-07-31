'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type Coach = {
  id: number;
  Nama: string;
  Foto: string;
  Certificate: string;
  spesialis: string;
  username: string;
  password: string;
};

type TrainingSession = {
  id: number;
  NamaAtlet: string;
  Tanggal: string;
  JenisSesi: string;
  Lokasi: string;
  Durasi: string;
  Grade: string;
  AttemptsSends: string;
  FokusTeknik: string;
  StrengthTraining: string;
  EnergyLevel: string;
  Fatigue: string;
  Catatan: string;
  Kekuatan: string;
  DayaTahan: string;
  DayaLedak: string;
  Kecepatan: string;
  Kelentukan: string;
  Keseimbangan: string;
  Koordinasi: string;
  Ketepatan: string;
  Prestasi: string;
};

type PrestasiAtlet = {
  id: number;
  NamaAtlet: string;
  JenisKejuaraan: string;
  katagori: string;
  Tanggal: string;
  Lokasi: string;
  Medali: string;
};

type AthleteCertificate = {
  id: number;
  athleteName: string;
  certificateName: string;
  file: string;
  uploadedAt: string;
};

type ClimbingTrainingWeek = {
  minggu: number;
  grade: string;
  gradeNumeric: number;
  sesiTotal: number;
  sesiClimbing: number;
  sesiStrength: number;
  sesiEnduranceMobility: number;
  volumeClimbing: number;
  sends: number;
  fingerHang20mm: number;
  weightedPullupKg: number;
  corePlankSec: number;
  enduranceArcMin: number;
};

export default function CoachPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [atletList, setAtletList] = useState<string[]>([]);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [prestasiList, setPrestasiList] = useState<PrestasiAtlet[]>([]);
  const [certificates, setCertificates] = useState<AthleteCertificate[]>([]);

  const [selectedAtlet, setSelectedAtlet] = useState('');

  const [formSession, setFormSession] = useState({
    Tanggal: '', JenisSesi: '', Lokasi: '', Durasi: '', Grade: '', AttemptsSends: '',
    FokusTeknik: '', StrengthTraining: '', EnergyLevel: '', Fatigue: '', Catatan: '',
    Kekuatan: '', DayaTahan: '', DayaLedak: '', Kecepatan: '', Kelentukan: '',
    Keseimbangan: '', Koordinasi: '', Ketepatan: '', Prestasi: ''
  });

  const [formPrestasi, setFormPrestasi] = useState({
    NamaAtlet: '', JenisKejuaraan: '', katagori: '', Tanggal: '', Lokasi: '', Medali: ''
  });

  const [selectedAthleteForCert, setSelectedAthleteForCert] = useState('');
  const [certificateName, setCertificateName] = useState('');
  const [certificateFile, setCertificateFile] = useState<File | null>(null);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Climbing
  const [climbingForm, setClimbingForm] = useState<Partial<ClimbingTrainingWeek>>({
    minggu: 1, grade: "6b", gradeNumeric: 6.5, sesiTotal: 0, sesiClimbing: 0,
    sesiStrength: 0, sesiEnduranceMobility: 0, volumeClimbing: 0, sends: 0,
    fingerHang20mm: 0, weightedPullupKg: 0, corePlankSec: 0, enduranceArcMin: 0,
  });
  const [climbingData, setClimbingData] = useState<Record<string, ClimbingTrainingWeek[]>>({});

  // Upcoming Training
  const [upcomingForm, setUpcomingForm] = useState({
    Tanggal: '', JenisSesi: '', Lokasi: '', Catatan: ''
  });
  const [upcomingTrainings, setUpcomingTrainings] = useState<any[]>([]);

  // Load data dari Supabase
  const fetchAllData = async () => {
    const { data: atletData } = await supabase.from('atlets').select('Nama');
    if (atletData) setAtletList(atletData.map((a: any) => a.Nama));

    const { data: sessionsData } = await supabase.from('coach_sessions').select('*');
    if (sessionsData) setSessions(sessionsData);

    const { data: prestasiData } = await supabase.from('prestasi_atlet').select('*');
    if (prestasiData) setPrestasiList(prestasiData);

    const { data: climbingRaw } = await supabase.from('climbing_progress').select('*');
    if (climbingRaw) {
      const grouped: Record<string, ClimbingTrainingWeek[]> = {};
      climbingRaw.forEach((item: any) => {
        const name = item.athlete_name;
        if (!grouped[name]) grouped[name] = [];
        grouped[name].push(item);
      });
      setClimbingData(grouped);
    }
  };

  useEffect(() => {
    const savedLogin = localStorage.getItem('coachLoggedIn');
    if (savedLogin === 'true') setIsLoggedIn(true);

    fetchAllData();
    cleanOldUpcoming();
  }, []);

  useEffect(() => {
    if (selectedAtlet) {
      fetchUpcomingTrainings();
    } else {
      setUpcomingTrainings([]);
    }
  }, [selectedAtlet]);

  const fetchUpcomingTrainings = async () => {
    if (!selectedAtlet) return;
    const { data } = await supabase
      .from('upcoming_training')
      .select('*')
      .eq('athlete_name', selectedAtlet)
      .order('tanggal', { ascending: true });
    if (data) setUpcomingTrainings(data);
  };

  const cleanOldUpcoming = async () => {
    const today = new Date().toISOString().split('T')[0];
    await supabase.from('upcoming_training').delete().lt('tanggal', today);
  };

  // LOGIN
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data, error } = await supabase
      .from('coach')
      .select('*')
      .eq('username', username.trim())
      .eq('password', password.trim())
      .single();

    if (error || !data) {
      setError('Username atau password salah!');
    } else {
      setIsLoggedIn(true);
      localStorage.setItem('coachLoggedIn', 'true');
    }
    setLoading(false);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('coachLoggedIn');
    router.push('/');
  };

  // UPLOAD SERTIFIKAT
  const handleUploadCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAthleteForCert || !certificateName || !certificateFile) {
      return alert('Harap lengkapi semua data!');
    }
    if (certificateFile.size > 2 * 1024 * 1024) {
      return alert('Ukuran file maksimal 2MB!');
    }

    try {
      const fileExt = certificateFile.name.split('.').pop();
      const fileName = `${selectedAthleteForCert}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('certificates')
        .upload(fileName, certificateFile);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('certificates')
        .getPublicUrl(fileName);

      const { error: insertError } = await supabase
        .from('certificates')
        .insert([{
          athlete_name: selectedAthleteForCert,
          certificate_name: certificateName,
          file_url: urlData.publicUrl,
          uploaded_by: 'Pelatih'
        }]);

      if (insertError) throw insertError;

      alert(`Sertifikat "${certificateName}" berhasil di-upload!`);
      setSelectedAthleteForCert('');
      setCertificateName('');
      setCertificateFile(null);
    } catch (err: any) {
      alert('Gagal upload: ' + err.message);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setCertificateFile(e.target.files[0]);
  };

  // SAVE SESSION
const saveSession = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!selectedAtlet) return alert('Pilih Atlet terlebih dahulu!');

  const newSession = { ...formSession, NamaAtlet: selectedAtlet };

  const { error } = await supabase.from('coach_sessions').insert([newSession]);

  if (error) {
    alert('Gagal simpan: ' + error.message);
    console.error(error);
  } else {
    alert('Program latihan berhasil disimpan!');
    setFormSession({
      Tanggal: '', JenisSesi: '', Lokasi: '', Durasi: '', Grade: '', AttemptsSends: '',
      FokusTeknik: '', StrengthTraining: '', EnergyLevel: '', Fatigue: '', Catatan: '',
      Kekuatan: '', DayaTahan: '', DayaLedak: '', Kecepatan: '', Kelentukan: '',
      Keseimbangan: '', Koordinasi: '', Ketepatan: '', Prestasi: ''
    });
    fetchAllData();   // Refresh dari Supabase
  }
};

// SAVE PRESTASI
const savePrestasi = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!formPrestasi.NamaAtlet || !formPrestasi.JenisKejuaraan || !formPrestasi.katagori || !formPrestasi.Tanggal || !formPrestasi.Medali) {
    return alert('Mohon isi semua field prestasi!');
  }

  const { error } = await supabase.from('prestasi_atlet').insert([formPrestasi]);

  if (error) {
    alert('Gagal simpan: ' + error.message);
  } else {
    alert('Prestasi Atlet berhasil disimpan!');
    setFormPrestasi({ NamaAtlet: '', JenisKejuaraan: '', katagori: '', Tanggal: '', Lokasi: '', Medali: '' });
    fetchAllData();   // Refresh dari Supabase
  }
};

  // HAPUS PRESTASI
  const deletePrestasi = async (id: number) => {
    if (!confirm('Yakin ingin menghapus prestasi ini?')) return;

    const { error } = await supabase.from('prestasi_atlet').delete().eq('id', id);
    if (error) {
      alert('Gagal menghapus: ' + error.message);
    } else {
      alert('Prestasi berhasil dihapus!');
      fetchAllData();
    }
  };

  // SAVE CLIMBING
  const saveClimbingProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAtlet) return alert('Pilih Atlet terlebih dahulu!');

    const newWeek = {
      athlete_name: selectedAtlet,
      minggu: climbingForm.minggu || 1,
      grade: climbingForm.grade || "6b",
      gradeNumeric: climbingForm.gradeNumeric || " ",
      sesiTotal: climbingForm.sesiTotal || " ",
      sesiClimbing: climbingForm.sesiClimbing || " ",
      sesiStrength: climbingForm.sesiStrength || " ",
      sesiEnduranceMobility: climbingForm.sesiEnduranceMobility || " ",
      volumeClimbing: climbingForm.volumeClimbing || " ",
      sends: climbingForm.sends || " ",
      fingerHang20mm: climbingForm.fingerHang20mm || " ",
      weightedPullupKg: climbingForm.weightedPullupKg || " ",
      corePlankSec: climbingForm.corePlankSec || " ",
      enduranceArcMin: climbingForm.enduranceArcMin || " ",
    };

    const { error } = await supabase.from('climbing_progress').insert([newWeek]);

    if (error) {
      alert('Gagal simpan: ' + error.message);
    } else {
      alert(`Data Minggu ke-${newWeek.minggu} untuk ${selectedAtlet} berhasil disimpan!`);
      fetchAllData();
      setClimbingForm({
        minggu: (climbingForm.minggu || 1) + 1,
        grade: "6b", gradeNumeric: 6.5, sesiTotal: 0, sesiClimbing: 0,
        sesiStrength: 0, sesiEnduranceMobility: 0, volumeClimbing: 0, sends: 0,
        fingerHang20mm: 0, weightedPullupKg: 0, corePlankSec: 0, enduranceArcMin: 0,
      });
    }
  };

  // SAVE UPCOMING
  const saveUpcomingTraining = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAtlet || !upcomingForm.Tanggal || !upcomingForm.JenisSesi) {
      return alert('Pilih atlet, tanggal, dan jenis sesi!');
    }

    const { error } = await supabase.from('upcoming_training').insert([{
      athlete_name: selectedAtlet,
      tanggal: upcomingForm.Tanggal,
      jenis_sesi: upcomingForm.JenisSesi,
      lokasi: upcomingForm.Lokasi,
      catatan: upcomingForm.Catatan
    }]);

    if (error) {
      alert('Gagal menyimpan jadwal: ' + error.message);
    } else {
      alert('Jadwal latihan mendatang berhasil disimpan!');
      setUpcomingForm({ Tanggal: '', JenisSesi: '', Lokasi: '', Catatan: '' });
      fetchUpcomingTrainings();
    }
  };

  const deleteUpcomingTraining = async (id: number) => {
    if (!confirm('Yakin ingin menghapus jadwal ini?')) return;
    const { error } = await supabase.from('upcoming_training').delete().eq('id', id);
    if (error) alert('Gagal menghapus: ' + error.message);
    else {
      alert('Jadwal berhasil dihapus!');
      fetchUpcomingTrainings();
    }
  };

  const deleteSession = async (id: number) => {
    if (!confirm('Yakin ingin menghapus data latihan ini?')) return;
    const { error } = await supabase.from('coach_sessions').delete().eq('id', id);
    if (error) alert('Gagal hapus');
    else {
      alert('Data latihan berhasil dihapus!');
      fetchAllData();
    }
  };

  const deleteClimbingWeek = async (athleteName: string, minggu: number) => {
    if (!confirm(`Yakin ingin menghapus data Minggu ke-${minggu} untuk ${athleteName}?`)) return;
    const { error } = await supabase.from('climbing_progress').delete().eq('athlete_name', athleteName).eq('minggu', minggu);
    if (error) alert('Gagal hapus');
    else {
      alert('Data berhasil dihapus!');
      fetchAllData();
    }
  };

  // Grouping
  const sessionsByDate = sessions.reduce((acc, session) => {
    const date = session.Tanggal;
    if (!acc[date]) acc[date] = [];
    acc[date].push(session);
    return acc;
  }, {} as Record<string, TrainingSession[]>);

  const sortedDates = Object.keys(sessionsByDate).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  const handleDateClick = (date: string) => {
    setSelectedDate(selectedDate === date ? null : date);
  };

  const inputStyle = { width: '100%', padding: '12px', margin: '8px 0', borderRadius: '8px', background: '#334155', color: 'white', border: 'none' };
  const buttonStyle = { padding: '12px 30px', background: '#22c55e', color: 'black', border: 'none', borderRadius: '8px', fontWeight: 'bold', marginTop: '10px' };

  // Filter prestasi berdasarkan atlet yang dipilih di form
  const filteredPrestasi = prestasiList.filter(p => p.NamaAtlet === formPrestasi.NamaAtlet);

  return (
    <div style={{ background: '#0f172a', minHeight: '100vh', color: 'white' }}>
      {!isLoggedIn ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <div style={{ background: '#1e2937', padding: '50px', borderRadius: '24px', width: '400px', textAlign: 'center' }}>
            <h1 style={{ fontSize: '32px', marginBottom: '30px' }}>Login Pelatih</h1>
            <form onSubmit={handleLogin}>
              <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} style={inputStyle} required />
              <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} required />
              {error && <p style={{ color: 'red', margin: '10px 0' }}>{error}</p>}
              <button type="submit" disabled={loading} style={buttonStyle}>
                {loading ? 'Loading...' : 'Login'}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div>
          <nav style={{ padding: '20px 40px', background: '#1e2937', display: 'flex', justifyContent: 'space-between' }}>
            <h1>Coach Dashboard</h1>
            <button onClick={handleLogout} style={{ padding: '10px 20px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '10px' }}>Logout</button>
          </nav>

          <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>

            {/* Upload Sertifikat */}
            <div style={{ background: '#1e2937', padding: '30px', borderRadius: '16px', marginBottom: '40px' }}>
              <h2 style={{ color: '#22c55e' }}>Upload Sertifikat untuk Atlet</h2>
              <form onSubmit={handleUploadCertificate}>
                <select value={selectedAthleteForCert} onChange={(e) => setSelectedAthleteForCert(e.target.value)} style={inputStyle} required>
                  <option value="">-- Pilih Atlet --</option>
                  {atletList.map((nama, i) => <option key={i} value={nama}>{nama}</option>)}
                </select>
                <input type="text" placeholder="Nama Sertifikat" value={certificateName} onChange={(e) => setCertificateName(e.target.value)} style={inputStyle} required />
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} style={{ margin: '15px 0' }} required />
                <button type="submit" style={{ padding: '14px 30px', background: '#22c55e', color: 'black', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>
                  Upload Sertifikat
                </button>
              </form>
            </div>

            {/* Input Program Latihan */}
            <div style={{ background: '#1e2937', padding: '30px', borderRadius: '16px', marginBottom: '40px' }}>
              <h2>Input Program Latihan</h2>
              <form onSubmit={saveSession}>
                <select value={selectedAtlet} onChange={(e) => setSelectedAtlet(e.target.value)} style={inputStyle} required>
                  <option value="">-- Pilih Atlet --</option>
                  {atletList.map((nama, i) => <option key={i} value={nama}>{nama}</option>)}
                </select>

                <input type="date" value={formSession.Tanggal} onChange={(e) => setFormSession({...formSession, Tanggal: e.target.value})} style={inputStyle} required />
                <select value={formSession.JenisSesi} onChange={(e) => setFormSession({...formSession, JenisSesi: e.target.value})} style={inputStyle} required>
                  <option value="">Pilih Jenis Sesi</option>
                  <option value="Bouldering">Bouldering</option>
                  <option value="Lead Climbing">Lead Climbing</option>
                  <option value="Top Rope">Top Rope</option>
                  <option value="Speed">Speed Climbing</option>
                  <option value="Fingerboard">Fingerboard</option>
                  <option value="Campus">Campus Board</option>
                  <option value="Endurance">Endurance Training</option>
                  <option value="Technique">Technique Drill</option>
                </select>

                <input type="text" placeholder="Lokasi / Wall" value={formSession.Lokasi} onChange={(e) => setFormSession({...formSession, Lokasi: e.target.value})} style={inputStyle} />
                <input type="text" placeholder="Durasi (menit)" value={formSession.Durasi} onChange={(e) => setFormSession({...formSession, Durasi: e.target.value})} style={inputStyle} />
                <input type="text" placeholder="Grade" value={formSession.Grade} onChange={(e) => setFormSession({...formSession, Grade: e.target.value})} style={inputStyle} />
                <input type="text" placeholder="Attempts & Sends" value={formSession.AttemptsSends} onChange={(e) => setFormSession({...formSession, AttemptsSends: e.target.value})} style={inputStyle} />
                <input type="text" placeholder="Fokus Teknik" value={formSession.FokusTeknik} onChange={(e) => setFormSession({...formSession, FokusTeknik: e.target.value})} style={inputStyle} />
                <input type="text" placeholder="Strength Training" value={formSession.StrengthTraining} onChange={(e) => setFormSession({...formSession, StrengthTraining: e.target.value})} style={inputStyle} />

                <h3 style={{ marginTop: '20px' }}>8 Unsur Kebugaran Jasmani (Rating 1-10)</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  {['Kekuatan', 'DayaTahan', 'DayaLedak', 'Kecepatan', 'Kelentukan', 'Keseimbangan', 'Koordinasi', 'Ketepatan'].map((item, i) => (
                    <div key={i}>
                      <label>{item}</label>
                      <input type="number" min="1" max="10" placeholder="1-10" value={formSession[item as keyof typeof formSession] || ''} onChange={(e) => setFormSession({...formSession, [item]: e.target.value})} style={inputStyle} />
                    </div>
                  ))}
                </div>

                <input type="text" placeholder="Energy Level (1-10)" value={formSession.EnergyLevel} onChange={(e) => setFormSession({...formSession, EnergyLevel: e.target.value})} style={inputStyle} />
                <input type="text" placeholder="Fatigue (1-10)" value={formSession.Fatigue} onChange={(e) => setFormSession({...formSession, Fatigue: e.target.value})} style={inputStyle} />
                <textarea placeholder="Catatan Latihan" value={formSession.Catatan} onChange={(e) => setFormSession({...formSession, Catatan: e.target.value})} style={{...inputStyle, minHeight: '120px'}} />

                <button type="submit" style={{ marginTop: '20px', padding: '14px 30px', background: '#22c55e', color: 'black', border: 'none', borderRadius: '8px' }}>
                  Simpan Program Latihan
                </button>
              </form>
            </div>

            {/* Input Progres Panjat Tebing */}
            <div style={{ background: '#1e2937', padding: '30px', borderRadius: '16px', marginBottom: '40px' }}>
              <h2 style={{ color: '#3b82f6' }}>Input Progres Latihan Panjat Tebing Detail</h2>
              <p style={{ color: '#94a3b8', marginBottom: '20px' }}>Data otomatis per atlet & reset setelah 12 minggu</p>

              <form onSubmit={saveClimbingProgress}>
                <select value={selectedAtlet} onChange={(e) => setSelectedAtlet(e.target.value)} style={inputStyle} required>
                  <option value="">-- Pilih Atlet --</option>
                  {atletList.map((nama, i) => <option key={i} value={nama}>{nama}</option>)}
                </select>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '15px', marginTop: '15px' }}>
                  <div><label>Minggu ke-</label><input type="number" value={climbingForm.minggu ?? ''} onChange={(e) => setClimbingForm({...climbingForm, minggu: e.target.value ? parseInt(e.target.value) : 1})} style={inputStyle} /></div>
                  <div><label>Grade</label><input type="text" placeholder="contoh: 7a+" value={climbingForm.grade ?? ''} onChange={(e) => setClimbingForm({...climbingForm, grade: e.target.value})} style={inputStyle} /></div>
                  <div><label>Volume</label><input type="number" value={climbingForm.volumeClimbing ?? ''} onChange={(e) => setClimbingForm({...climbingForm, volumeClimbing: e.target.value ? parseInt(e.target.value) : 0})} style={inputStyle} /></div>
                  <div><label>Sends</label><input type="number" value={climbingForm.sends ?? ''} onChange={(e) => setClimbingForm({...climbingForm, sends: e.target.value ? parseInt(e.target.value) : 0})} style={inputStyle} /></div>
                  <div><label>Finger Hang 20mm</label><input type="number" value={climbingForm.fingerHang20mm ?? ''} onChange={(e) => setClimbingForm({...climbingForm, fingerHang20mm: e.target.value ? parseInt(e.target.value) : 0})} style={inputStyle} /></div>
                  <div><label>Weighted Pull-up (kg)</label><input type="number" value={climbingForm.weightedPullupKg ?? ''} onChange={(e) => setClimbingForm({...climbingForm, weightedPullupKg: e.target.value ? parseInt(e.target.value) : 0})} style={inputStyle} /></div>
                  <div><label>Core Plank (detik)</label><input type="number" value={climbingForm.corePlankSec ?? ''} onChange={(e) => setClimbingForm({...climbingForm, corePlankSec: e.target.value ? parseInt(e.target.value) : 0})} style={inputStyle} /></div>
                  <div><label>Endurance ARC (menit)</label><input type="number" value={climbingForm.enduranceArcMin ?? ''} onChange={(e) => setClimbingForm({...climbingForm, enduranceArcMin: e.target.value ? parseInt(e.target.value) : 0})} style={inputStyle} /></div>
                  <div><label>sesiendurancemobility (menit)</label><input type="number" value={climbingForm.sesiEnduranceMobility ?? ''} onChange={(e) => setClimbingForm({...climbingForm, sesiEnduranceMobility: e.target.value ? parseInt(e.target.value) : 0})} style={inputStyle} /></div>
                </div>

                <button type="submit" style={{ marginTop: '20px', padding: '14px 30px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>
                  Simpan Data Minggu Ini
                </button>
              </form>

              {selectedAtlet && climbingData[selectedAtlet] && climbingData[selectedAtlet].length > 0 && (
                <div style={{ marginTop: '30px', background: '#0f172a', padding: '20px', borderRadius: '12px' }}>
                  <h3 style={{ color: '#f97316' }}>Data Progres Panjat Tebing - {selectedAtlet}</h3>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ background: 'rgba(249,115,22,0.2)' }}>
                          <th style={{ padding: '8px' }}>Minggu</th><th>Grade</th><th>Volume</th><th>Sends</th>
                          <th>Finger</th><th>Pull-up</th><th>Core</th><th>Endurance</th><th>Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {climbingData[selectedAtlet].map((c, index) => (
                          <tr key={index} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            <td style={{ padding: '8px', fontWeight: 'bold' }}>{c.minggu}</td>
                            <td><strong style={{ color: '#3b82f6' }}>{c.grade}</strong></td>
                            <td>{c.volumeClimbing}</td><td>{c.sends}</td><td>{c.fingerHang20mm}s</td>
                            <td>{c.weightedPullupKg}kg</td><td>{c.corePlankSec}s</td><td>{c.enduranceArcMin}min</td>
                            <td>
                              <button onClick={() => deleteClimbingWeek(selectedAtlet, c.minggu)} style={{ padding: '4px 10px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px' }}>
                                Hapus
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Input Jadwal Latihan Mendatang */}
            <div style={{ background: '#1e2937', padding: '30px', borderRadius: '16px', marginBottom: '40px' }}>
              <h2 style={{ color: '#eab308' }}>📅 Input Jadwal Latihan Mendatang</h2>
              <form onSubmit={saveUpcomingTraining}>
                <select value={selectedAtlet} onChange={(e) => setSelectedAtlet(e.target.value)} style={inputStyle} required>
                  <option value="">-- Pilih Atlet --</option>
                  {atletList.map((nama, i) => <option key={i} value={nama}>{nama}</option>)}
                </select>

                <input type="date" value={upcomingForm.Tanggal} onChange={(e) => setUpcomingForm({...upcomingForm, Tanggal: e.target.value})} style={inputStyle} required />
                <select value={upcomingForm.JenisSesi} onChange={(e) => setUpcomingForm({...upcomingForm, JenisSesi: e.target.value})} style={inputStyle} required>
                  <option value="">Pilih Jenis Sesi</option>
                  <option value="Bouldering">Bouldering</option>
                  <option value="Lead Climbing">Lead Climbing</option>
                  <option value="Technique">Technique Drill</option>
                  <option value="Endurance">Endurance Training</option>
                </select>
                <input type="text" placeholder="Lokasi" value={upcomingForm.Lokasi} onChange={(e) => setUpcomingForm({...upcomingForm, Lokasi: e.target.value})} style={inputStyle} />
                <textarea placeholder="Catatan" value={upcomingForm.Catatan} onChange={(e) => setUpcomingForm({...upcomingForm, Catatan: e.target.value})} style={{...inputStyle, minHeight: '80px'}} />

                <button type="submit" style={{ marginTop: '15px', padding: '12px 30px', background: '#eab308', color: 'black', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>
                  Simpan Jadwal Mendatang
                </button>
              </form>

              {selectedAtlet && upcomingTrainings.length > 0 && (
                <div style={{ marginTop: '30px' }}>
                  <h4>Jadwal Mendatang untuk {selectedAtlet}</h4>
                  {upcomingTrainings.map((u) => (
                    <div key={u.id} style={{ background: '#0f172a', padding: '15px', marginBottom: '10px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong>{u.tanggal}</strong> — {u.jenis_sesi}<br />
                        Lokasi: {u.lokasi || '-'} | {u.catatan}
                      </div>
                      <button onClick={() => deleteUpcomingTraining(u.id)} style={{ padding: '6px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px' }}>
                        Hapus
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ==================== INPUT PRESTASI + HAPUS PRESTASI ==================== */}
            <div style={{ background: '#1e2937', padding: '30px', borderRadius: '16px', marginBottom: '40px' }}>
              <h2>Input Prestasi Atlet</h2>
              <form onSubmit={savePrestasi}>
                <select value={formPrestasi.NamaAtlet} onChange={(e) => setFormPrestasi({...formPrestasi, NamaAtlet: e.target.value})} style={inputStyle} required>
                  <option value="">-- Pilih Atlet --</option>
                  {atletList.map((nama, i) => <option key={i} value={nama}>{nama}</option>)}
                </select>

                <input type="text" placeholder="Jenis Kejuaraan" value={formPrestasi.JenisKejuaraan} onChange={(e) => setFormPrestasi({...formPrestasi, JenisKejuaraan: e.target.value})} style={inputStyle} required />
                <input type="date" value={formPrestasi.Tanggal} onChange={(e) => setFormPrestasi({...formPrestasi, Tanggal: e.target.value})} style={inputStyle} required />
                <input type="text" placeholder="Lokasi Kejuaraan" value={formPrestasi.Lokasi} onChange={(e) => setFormPrestasi({...formPrestasi, Lokasi: e.target.value})} style={inputStyle} />
                <input type="text" placeholder="katagori" value={formPrestasi.katagori} onChange={(e) => setFormPrestasi({...formPrestasi, katagori: e.target.value})} style={inputStyle} />

                <select value={formPrestasi.Medali} onChange={(e) => setFormPrestasi({...formPrestasi, Medali: e.target.value})} style={inputStyle} required>
                  <option value="">-- Pilih Medali --</option>
                  <option value="Emas">🏅 Emas</option>
                  <option value="Perak">🥈 Perak</option>
                  <option value="Perunggu">🥉 Perunggu</option>
                </select>

                <button type="submit" style={{ marginTop: '20px', padding: '14px 30px', background: '#eab308', color: 'black', border: 'none', borderRadius: '8px' }}>
                  Simpan Prestasi
                </button>
              </form>

              {/* Daftar Prestasi Berdasarkan Atlet yang Dipilih */}
              {formPrestasi.NamaAtlet && (
                <div style={{ marginTop: '40px' }}>
                  <h3 style={{ color: '#eab308' }}>Prestasi {formPrestasi.NamaAtlet}</h3>
                  
                  {filteredPrestasi.length === 0 ? (
                    <p>Belum ada prestasi untuk atlet ini.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '15px' }}>
                      {filteredPrestasi.map((p) => (
                        <div key={p.id} style={{ 
                          background: '#0f172a', 
                          padding: '16px', 
                          borderRadius: '10px', 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center' 
                        }}>
                          <div>
                            <strong>{p.JenisKejuaraan}</strong> — {p.Medali}<br />
                            <small style={{ color: '#94a3b8' }}>
                              {p.Tanggal} | {p.katagori} | {p.Lokasi || '-'}
                            </small>
                          </div>
                          <button 
                            onClick={() => deletePrestasi(p.id)}
                            style={{ 
                              padding: '8px 16px', 
                              background: '#ef4444', 
                              color: 'white', 
                              border: 'none', 
                              borderRadius: '6px' 
                            }}
                          >
                            Hapus
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Riwayat Latihan */}
            <div style={{ background: '#1e2937', padding: '30px', borderRadius: '16px' }}>
              <h2>Riwayat Latihan per Tanggal</h2>

              {sortedDates.length === 0 ? (
                <p>Belum ada data latihan.</p>
              ) : (
                <div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
                    {sortedDates.map((date) => (
                      <button
                        key={date}
                        onClick={() => handleDateClick(date)}
                        style={{
                          padding: '10px 20px',
                          background: selectedDate === date ? '#22c55e' : '#334155',
                          color: selectedDate === date ? 'black' : 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: 'bold'
                        }}
                      >
                        {date} ({sessionsByDate[date].length} sesi)
                      </button>
                    ))}
                  </div>

                  {selectedDate && sessionsByDate[selectedDate] && (
                    <div>
                      <h3 style={{ color: '#22c55e', marginBottom: '15px' }}>
                        Latihan pada tanggal: {selectedDate}
                      </h3>
                      {sessionsByDate[selectedDate].map((s) => (
                        <div key={s.id} style={{ background: '#0f172a', padding: '18px', marginBottom: '12px', borderRadius: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <strong>{s.NamaAtlet}</strong> — {s.JenisSesi}<br />
                              Grade: {s.Grade} | Energy: {s.EnergyLevel} | Fatigue: {s.Fatigue}<br />
                              {s.Catatan && <p style={{ color: '#94a3b8', marginTop: '8px' }}>{s.Catatan}</p>}
                            </div>
                            <button onClick={() => deleteSession(s.id)} style={{ padding: '6px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px' }}>
                              Hapus
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}