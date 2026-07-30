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
    NamaAtlet: '', JenisKejuaraan: '', Tanggal: '', Lokasi: '', Medali: ''
  });

  const [selectedAthleteForCert, setSelectedAthleteForCert] = useState('');
  const [certificateName, setCertificateName] = useState('');
  const [certificateFile, setCertificateFile] = useState<File | null>(null);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Climbing
  const [climbingForm, setClimbingForm] = useState<Partial<ClimbingTrainingWeek>>({
    minggu: 1, grade: "6b", gradeNumeric: 6.5, sesiTotal: 3, sesiClimbing: 2,
    sesiStrength: 1, sesiEnduranceMobility: 0, volumeClimbing: 12, sends: 8,
    fingerHang20mm: 25, weightedPullupKg: 0, corePlankSec: 45, enduranceArcMin: 8,
  });
  const [climbingData, setClimbingData] = useState<Record<string, ClimbingTrainingWeek[]>>({});

  // Upcoming Training
  const [upcomingForm, setUpcomingForm] = useState({
    Tanggal: '', JenisSesi: '', Lokasi: '', Catatan: ''
  });
  const [upcomingTrainings, setUpcomingTrainings] = useState<any[]>([]);

  useEffect(() => {
    const savedLogin = localStorage.getItem('coachLoggedIn');
    if (savedLogin === 'true') setIsLoggedIn(true);

    // Perbaikan Daftar Atlet
    const fetchAtlets = async () => {
      const { data, error } = await supabase
        .from('atlets')
        .select('Nama')
        .order('Nama');

      if (data && !error) {
        const namaList = data.map((a: any) => a.Nama);
        setAtletList(namaList);
        localStorage.setItem('adminAtlets', JSON.stringify(data));
      } else {
        const savedAtlets = localStorage.getItem('adminAtlets');
        if (savedAtlets) {
          try {
            const parsed = JSON.parse(savedAtlets);
            setAtletList(parsed.map((a: any) => a.Nama || ''));
          } catch (e) {}
        }
      }
    };

    fetchAtlets();

    const savedSessions = localStorage.getItem('coachSessions');
    if (savedSessions) setSessions(JSON.parse(savedSessions));

    const savedPrestasi = localStorage.getItem('atletPrestasi');
    if (savedPrestasi) setPrestasiList(JSON.parse(savedPrestasi));

    const savedCerts = localStorage.getItem('atletCertificates');
    if (savedCerts) setCertificates(JSON.parse(savedCerts));

    const savedClimbing = localStorage.getItem('climbingProgress');
    if (savedClimbing) setClimbingData(JSON.parse(savedClimbing));

    cleanOldUpcoming();
  }, []);

  useEffect(() => {
    if (selectedAtlet) fetchUpcomingTrainings();
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

    if (error || !data) setError('Username atau password salah!');
    else {
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

  const handleUploadCertificate = async (e: React.FormEvent) => { /* ... kode asli tetap ... */ };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setCertificateFile(e.target.files[0]);
  };

  const saveSession = (e: React.FormEvent) => { /* ... kode asli tetap ... */ };
  const savePrestasi = (e: React.FormEvent) => { /* ... kode asli tetap ... */ };

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

  const deleteSession = (id: number) => {
    if (!confirm('Yakin ingin menghapus data latihan ini?')) return;
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    localStorage.setItem('coachSessions', JSON.stringify(updated));
    alert('Data latihan berhasil dihapus!');
  };

  const saveClimbingProgress = (e: React.FormEvent) => { /* ... kode asli tetap ... */ };
  const deleteClimbingWeek = (athleteName: string, minggu: number) => { /* ... kode asli tetap ... */ };

  const saveUpcomingTraining = async (e: React.FormEvent) => { /* ... kode asli tetap ... */ };
  const deleteUpcomingTraining = async (id: number) => { /* ... kode asli tetap ... */ };

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
            {/* Upload Sertifikat, Input Program Latihan, Input Progres, Jadwal, Prestasi tetap sama seperti kode kamu sebelumnya */}

            {/* Riwayat Latihan per Tanggal */}
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

const inputStyle = { width: '100%', padding: '12px', margin: '8px 0', borderRadius: '8px', background: '#334155', color: 'white', border: 'none' };
const buttonStyle = { padding: '12px 30px', background: '#22c55e', color: 'black', border: 'none', borderRadius: '8px', fontWeight: 'bold', marginTop: '10px' };