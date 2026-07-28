'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
  certificates: string[];
  pengalaman?: string;
  bio?: string;
  lokasi?: string;
};

type Atlet = {
  id: number;
  Nama: string;
  TempatLahir: string;
  TanggalLahir: string;
  Usia: number;
  Alamat: string;
  RiwayatPenyakit: string;
  GolonganDarah: string;
  Foto: string;
  JenisKelamin?: string;
  Level?: string;
  Nokiat : string;
};

type PrestasiAtlet = {
  id: number;
  NamaAtlet: string;
  JenisKejuaraan: string;
  Tanggal: string;
  Lokasi: string;
  Medali: string;
};

export default function AdminPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [atlets, setAtlets] = useState<Atlet[]>([]);
  const [prestasiList, setPrestasiList] = useState<PrestasiAtlet[]>([]);

  const [formCoach, setFormCoach] = useState({ 
    Nama: '', Foto: '', Certificate: '', spesialis: '', username: '', password: '',
    certificates: [] as string[], pengalaman: '', bio: '', lokasi: ''
  });

  const [formAtlet, setFormAtlet] = useState<Partial<Atlet>>({
    Nama: '', TempatLahir: '', TanggalLahir: '', Alamat: '', RiwayatPenyakit: '', 
    GolonganDarah: '', Foto: '', JenisKelamin: '', Level: '', Nokiat  : ''
  });

  const [editingCoach, setEditingCoach] = useState<Coach | null>(null);
  const [editingAtlet, setEditingAtlet] = useState<Atlet | null>(null);

  const [nextId, setNextId] = useState(1);

  const [activeTab, setActiveTab] = useState<'pelatih' | 'atlet'>('pelatih');

  useEffect(() => {
    const savedLogin = localStorage.getItem('adminLoggedIn');
    if (savedLogin === 'true') setIsLoggedIn(true);

    const fetchCoaches = async () => {
      const { data } = await supabase.from('coach').select('*').order('id');
      if (data) setCoaches(data);
    };

    const fetchAtlets = async () => {
      const { data } = await supabase.from('atlets').select('*').order('id');
      if (data) {
        setAtlets(data);
        if (data.length > 0) {
          setNextId(Math.max(...data.map((a: Atlet) => a.id)) + 1);
        }
      }
    };

    const savedPrestasi = localStorage.getItem('atletPrestasi');
    if (savedPrestasi) setPrestasiList(JSON.parse(savedPrestasi));

    fetchCoaches();
    fetchAtlets();
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === "admin" && password === "admin123") {
      setIsLoggedIn(true);
      localStorage.setItem('adminLoggedIn', 'true');
      setError('');
    } else {
      setError('Username atau Password salah!');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('adminLoggedIn');
    router.push('/');
  };

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const saveCoach = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = {
        Nama: formCoach.Nama,
        Foto: formCoach.Foto,
        Certificate: formCoach.Certificate,
        spesialis: formCoach.spesialis,
        username: formCoach.username,
        password: formCoach.password,
        certificates: formCoach.certificates || [],
        pengalaman: formCoach.pengalaman || null,
        bio: formCoach.bio || null,
        lokasi: formCoach.lokasi || null
      };

      let result;

      if (editingCoach) {
        result = await supabase.from('coach').update(payload).eq('id', Number(editingCoach.id));
      } else {
        result = await supabase.from('coach').insert([payload]);
      }

      if (result.error) {
        alert(`Gagal menyimpan: ${result.error.message}`);
        return;
      }

      alert(editingCoach ? 'Pelatih berhasil diupdate!' : 'Pelatih berhasil ditambahkan!');

      const { data } = await supabase.from('coach').select('*').order('id');
      if (data) setCoaches(data);

    } catch (err: any) {
      alert('Gagal menyimpan: ' + (err.message || err));
    }

    setFormCoach({ Nama: '', Foto: '', Certificate: '', spesialis: '', username: '', password: '', certificates: [], pengalaman: '', bio: '', lokasi: '' });
    setEditingCoach(null);
  };

  const saveAtlet = async (e: React.FormEvent) => {
    e.preventDefault();
    const usia = calculateAge(formAtlet.TanggalLahir || '');

    const newAtlet: Atlet = { 
      id: editingAtlet ? editingAtlet.id : Date.now(),
      Nama: formAtlet.Nama || '',
      TempatLahir: formAtlet.TempatLahir || '',
      TanggalLahir: formAtlet.TanggalLahir || '',
      Usia: usia,
      Alamat: formAtlet.Alamat || '',
      RiwayatPenyakit: formAtlet.RiwayatPenyakit || '',
      GolonganDarah: formAtlet.GolonganDarah || '',
      Foto: formAtlet.Foto || '',
      JenisKelamin: formAtlet.JenisKelamin,
      Nokiat: formAtlet.Nokiat || '',
      Level: formAtlet.Level
    };

    try {
      let result;

      if (editingAtlet) {
        result = await supabase.from('atlets').update(newAtlet).eq('id', editingAtlet.id);
      } else {
        result = await supabase.from('atlets').insert([newAtlet]);
      }

      if (result.error) {
        alert('Gagal menyimpan atlet: ' + result.error.message);
        return;
      }

      alert(editingAtlet ? 'Atlet berhasil diupdate!' : 'Atlet berhasil ditambahkan!');
      
      const { data } = await supabase.from('atlets').select('*').order('id');
      if (data) setAtlets(data);

      setFormAtlet({ Nama: '', TempatLahir: '', TanggalLahir: '', Alamat: '', RiwayatPenyakit: '', GolonganDarah: '', Foto: '', JenisKelamin: '', Level: '' });
      setEditingAtlet(null);

    } catch (err: any) {
      alert('Gagal: ' + (err.message || err));
    }
  };

  const deleteItem = async (type: 'coach' | 'atlet', id: number) => {
    if (!confirm('Yakin hapus data ini?')) return;

    if (type === 'coach') {
      const { error } = await supabase.from('coach').delete().eq('id', id);
      if (!error) {
        const { data } = await supabase.from('coach').select('*').order('id');
        if (data) setCoaches(data);
      }
    } else {
      const { error } = await supabase.from('atlets').delete().eq('id', id);
      if (!error) {
        const { data } = await supabase.from('atlets').select('*').order('id');
        if (data) setAtlets(data);
      }
    }
  };

  const deletePrestasi = (id: number) => {
    if (!confirm('Yakin ingin menghapus prestasi ini?')) return;

    const updatedPrestasi = prestasiList.filter(p => p.id !== id);
    setPrestasiList(updatedPrestasi);
    localStorage.setItem('atletPrestasi', JSON.stringify(updatedPrestasi));
    alert('Prestasi berhasil dihapus!');
  };

  return (
    <div style={{ background: '#0f172a', minHeight: '100vh', color: 'white' }}>
      {!isLoggedIn ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <div style={{ background: '#1e2937', padding: '50px', borderRadius: '24px', width: '400px', textAlign: 'center' }}>
            <h1 style={{ fontSize: '32px', marginBottom: '30px' }}>Login Admin</h1>
            <form onSubmit={handleLogin}>
              <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} style={inputStyle} required />
              <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} required />
              {error && <p style={{ color: 'red', margin: '10px 0' }}>{error}</p>}
              <button type="submit" style={buttonStyle}>Masuk sebagai Admin</button>
            </form>
            <Link href="/" style={{ color: '#fb923c', marginTop: '25px', display: 'inline-block' }}>
              ← Kembali ke Dashboard
            </Link>
          </div>
        </div>
      ) : (
        <div>
          <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 40px', background: '#1e2937', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ fontSize: '30px' }}>⚙️</div>
              <h1 style={{ margin: 0, fontSize: '26px' }}>Admin Dashboard</h1>
            </div>
            <div style={{ display: 'flex', gap: '15px' }}>
              <button onClick={handleLogout} style={{ padding: '10px 20px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '10px' }}>Logout</button>
              <Link href="/">
                <button style={{ padding: '10px 20px', background: 'transparent', border: '1px solid #fb923c', color: '#fb923c', borderRadius: '10px' }}>Kembali ke Home</button>
              </Link>
            </div>
          </nav>

          <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '42px' }}>Admin Dashboard - CICAPORA</h1>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '50px' }}>
              {/* Form Pelatih */}
              <div style={{ background: '#1e2937', padding: '30px', borderRadius: '16px' }}>
                <h2>{editingCoach ? 'Edit Pelatih' : 'Tambah Pelatih + Login'}</h2>
                <form onSubmit={saveCoach}>
                  <input type="text" placeholder="Nama Pelatih" value={formCoach.Nama} onChange={e => setFormCoach({...formCoach, Nama: e.target.value})} style={inputStyle} required />
                  <input type="text" placeholder="Link Foto" value={formCoach.Foto} onChange={e => setFormCoach({...formCoach, Foto: e.target.value})} style={inputStyle} required />
                  <input type="text" placeholder="Certificate (Utama)" value={formCoach.Certificate} onChange={e => setFormCoach({...formCoach, Certificate: e.target.value})} style={inputStyle} required />
                  <input type="text" placeholder="Spesialis" value={formCoach.spesialis} onChange={e => setFormCoach({...formCoach, spesialis: e.target.value})} style={inputStyle} required />
                  
                  <input type="text" placeholder="Sertifikasi (pisahkan dengan koma)" onChange={e => {
                    const arr = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                    setFormCoach({...formCoach, certificates: arr});
                  }} style={inputStyle} />

                  <input type="text" placeholder="Pengalaman" value={formCoach.pengalaman} onChange={e => setFormCoach({...formCoach, pengalaman: e.target.value})} style={inputStyle} />
                  <textarea placeholder="Bio / Deskripsi Singkat" value={formCoach.bio} onChange={e => setFormCoach({...formCoach, bio: e.target.value})} style={{...inputStyle, height: '100px', resize: 'vertical'}} />
                  <input type="text" placeholder="Lokasi" value={formCoach.lokasi} onChange={e => setFormCoach({...formCoach, lokasi: e.target.value})} style={inputStyle} />

                  <input type="text" placeholder="Username" value={formCoach.username} onChange={e => setFormCoach({...formCoach, username: e.target.value})} style={inputStyle} required />
                  <input type="password" placeholder="Password" value={formCoach.password} onChange={e => setFormCoach({...formCoach, password: e.target.value})} style={inputStyle} required />

                  <button type="submit" style={buttonStyle}>{editingCoach ? 'Update' : 'Tambah'} Pelatih</button>
                </form>
              </div>

              {/* Form Atlet */}
              <div style={{ background: '#1e2937', padding: '30px', borderRadius: '16px' }}>
                <h2>{editingAtlet ? 'Edit Atlet' : 'Tambah Atlet'}</h2>
                <form onSubmit={saveAtlet}>
                  <input type="text" placeholder="Nama Atlet" value={formAtlet.Nama || ''} onChange={e => setFormAtlet({...formAtlet, Nama: e.target.value})} style={inputStyle} required />
                  <select value={formAtlet.JenisKelamin || ''} onChange={e => setFormAtlet({...formAtlet, JenisKelamin: e.target.value})} style={inputStyle} required>
                    <option value="">Pilih Jenis Kelamin</option>
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                  <select value={formAtlet.Level || ''} onChange={e => setFormAtlet({...formAtlet, Level: e.target.value})} style={inputStyle} required>
                    <option value="">Pilih Level</option>
                    <option value="Beginner">Beginner</option>
                    <option value="intermeidate">Intermediate Training</option>
                    <option value="Intermediate">Intermediate Kelas A</option>
                    <option value="Intermediate">Intermediate Kelas B</option>
                    <option value="Intermediate">Intermediate Kelas C</option>
                    <option value="advanced">Advance Training </option>
                    <option value="Advanced">Advanced</option>
                  </select>
                  <input type="text" placeholder="Tempat Lahir" value={formAtlet.TempatLahir || ''} onChange={e => setFormAtlet({...formAtlet, TempatLahir: e.target.value})} style={inputStyle} required />
                  <input type="date" value={formAtlet.TanggalLahir || ''} onChange={e => setFormAtlet({...formAtlet, TanggalLahir: e.target.value})} style={inputStyle} required />
                  <input type="text" placeholder="Alamat" value={formAtlet.Alamat || ''} onChange={e => setFormAtlet({...formAtlet, Alamat: e.target.value})} style={inputStyle} />
                  <input type="text" placeholder="Riwayat Penyakit" value={formAtlet.RiwayatPenyakit || ''} onChange={e => setFormAtlet({...formAtlet, RiwayatPenyakit: e.target.value})} style={inputStyle} />
                  <input type="text" placeholder="Golongan Darah" value={formAtlet.GolonganDarah || ''} onChange={e => setFormAtlet({...formAtlet, GolonganDarah: e.target.value})} style={inputStyle} />
                  <input type="text" placeholder="No kiat" value={formAtlet.Nokiat || ''} onChange={e => setFormAtlet({...formAtlet, Nokiat: e.target.value})} style={inputStyle} />
                  <label style={{ display: 'block', margin: '15px 0 5px' }}>Upload Foto Atlet</label>
                  <input type="file" accept="image/*" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => setFormAtlet({...formAtlet, Foto: reader.result as string});
                      reader.readAsDataURL(file);
                    }
                  }} />
                  {formAtlet.Foto && <img src={formAtlet.Foto} alt="preview" style={{ width: '150px', borderRadius: '8px', margin: '10px 0' }} />}

                  <button type="submit" style={{ marginTop: '15px', padding: '12px 30px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px' }}>
                    {editingAtlet ? 'Update' : 'Tambah'} Atlet
                  </button>
                </form>
              </div>
            </div>

            <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
              <button onClick={() => setActiveTab('pelatih')} style={{ padding: '12px 30px', background: activeTab === 'pelatih' ? '#22c55e' : '#334155', color: activeTab === 'pelatih' ? 'black' : 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>
                Daftar Pelatih ({coaches.length})
              </button>
              <button onClick={() => setActiveTab('atlet')} style={{ padding: '12px 30px', background: activeTab === 'atlet' ? '#22c55e' : '#334155', color: activeTab === 'atlet' ? 'black' : 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>
                Daftar Atlet ({atlets.length})
              </button>
            </div>

            {activeTab === 'pelatih' && (
              <div>
                <h2>Daftar Pelatih</h2>
                {coaches.length === 0 ? (
                  <p style={{ color: '#94a3b8' }}>Belum ada data pelatih.</p>
                ) : (
                  coaches.map(c => (
                    <div key={`coach-${c.id}`} style={listStyle}>
                      <div>{c.Nama} - {c.Certificate}</div>
                      <div>
                        <button onClick={() => { setEditingCoach(c); setFormCoach({ ...c, certificates: c.certificates || [], pengalaman: c.pengalaman || '', bio: c.bio || '', lokasi: c.lokasi || '' }); }} style={editBtn}>Edit</button>
                        <button onClick={() => deleteItem('coach', c.id)} style={deleteBtn}>Hapus</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'atlet' && (
              <div>
                <h2>Daftar Atlet</h2>
                {atlets.length === 0 ? (
                  <p style={{ color: '#94a3b8' }}>Belum ada data atlet.</p>
                ) : (
                  atlets.map(a => {
                    const atletPrestasi = prestasiList.filter(p => p.NamaAtlet === a.Nama);
                    return (
                      <div key={`atlet-${a.id}`} style={listStyle}>
                        <div>$
                          {a.Nama} ({a.Usia} th) - {a.GolonganDarah} {a.Nokiat ? `- ${a.Nokiat}` : ''}
                          <br />
                          <span style={{ color: '#94a3b8', fontSize: '14px' }}>
                            {a.JenisKelamin} • {a.Level}
                          </span>
                          {atletPrestasi.length > 0 && (
                            <div style={{ marginTop: '12px', color: '#22c55e' }}>
                              <strong>🏆 Prestasi:</strong>
                              {atletPrestasi.map(p => (
                                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '6px 0', background: 'rgba(34,197,94,0.1)', padding: '8px 12px', borderRadius: '8px' }}>
                                  <span>• {p.JenisKejuaraan} ({p.Tanggal}) - {p.Lokasi} → <strong>{p.Medali}</strong></span>
                                  <button onClick={() => deletePrestasi(p.id)} style={{ padding: '4px 10px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px' }}>
                                    Hapus
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div>
                          <button onClick={() => { setEditingAtlet(a); setFormAtlet(a); }} style={editBtn}>Edit</button>
                          <button onClick={() => deleteItem('atlet', a.id)} style={deleteBtn}>Hapus</button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle = { width: '100%', padding: '12px', margin: '8px 0', borderRadius: '8px', background: '#334155', color: 'white', border: 'none' };
const buttonStyle = { padding: '12px 30px', background: '#22c55e', color: 'black', border: 'none', borderRadius: '8px', fontWeight: 'bold', marginTop: '10px' };
const listStyle = { background: '#1e2937', padding: '15px', margin: '10px 0', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const editBtn = { marginRight: '10px', padding: '8px 16px', background: '#eab308', color: 'black', border: 'none', borderRadius: '6px' };
const deleteBtn = { padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px' };