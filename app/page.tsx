'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Coach {
  id: string | number;
  Nama: string;
  Foto: string;
  Certificate: string;
  spesialis: string;
  // === TAMBAHAN BARU ===
  certificates: string[];     // multiple sertifikasi
  pengalaman?: string;
  bio?: string;
  umur?: number;
  lokasi?: string;
}

export default function Home() {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);

  const getCoachPhotoUrl = (foto: string): string => {
    return foto || '/placeholder-coach.jpg';
  };

  useEffect(() => {
    const loadCoaches = async () => {
      try {
        setLoading(true);
        const { data } = await supabase
          .from('coach')
          .select('*')
          .order('Nama', { ascending: true });

        if (data) setCoaches(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadCoaches();
  }, []);

  const openCoachDetail = (coach: Coach) => {
    setSelectedCoach(coach);
  };

  const closeModal = () => {
    setSelectedCoach(null);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a1428 0%, #1e2937 100%)',
      color: 'white',
      fontFamily: 'Arial, sans-serif',
    }}>
      {/* NAVIGASI - tetap sama persis */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 40px',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <img src="/logo.png" alt="Cicapora" style={{ maxWidth: '90px', height: 'auto' }} />
          <div>
            <h1 style={{ margin: 0, fontSize: '50px', fontWeight: 'bold' }}>CICAPORA</h1>
            <p style={{ margin: 0, fontSize: '35px', color: '#fb923c' }}>SPORT CLIMBING</p>
          </div>
        </div>

        <Link href="/admin">
          <div style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255, 255, 255, 0.4)',
            borderRadius: '16px',
            padding: '12px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: '15px',
            cursor: 'pointer'
          }}
          onMouseOver={(e) => (e.currentTarget as HTMLElement).style.transform = 'scale(1.05)'}
          onMouseOut={(e) => (e.currentTarget as HTMLElement).style.transform = 'scale(1)'}
          >
            <div style={{ fontSize: '32px' }}>⚙️</div>
            <div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '18px' }}>ADMIN</h4>
            </div>
          </div>
        </Link>
      </nav>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '80px 20px' }}>
        {/* HERO SECTION - tetap sama */}
        <div style={{ textAlign: 'center', marginBottom: '80px' }}>
          <h2 style={{ fontSize: '52px', fontWeight: 'bold', marginBottom: '16px' }}>
            CICAPORA <span style={{ color: '#3cf1fb' }}>SPORT CLIMBING</span>
          </h2>
          <p style={{ fontSize: '22px', color: '#94a3b8' }}>
           aplikasi Monitoring Performa Atlet
          </p>
        </div>

        {/* CARD PELATIH & ATLET - tetap sama persis */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '30px', marginBottom: '100px' }}>
          <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(251,146,60,0.4)', borderRadius: '24px', padding: '50px 40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px' }}>
              <div style={{ fontSize: '60px' }}>👨‍🏫</div>
              <div>
                <h3 style={{ fontSize: '32px', margin: '0 0 8px 0' }}>PELATIH</h3>
                <p style={{ color: '#fb923c' }}> Coach Area</p>
              </div>
            </div>
            <p style={{ fontSize: '18px', lineHeight: '1.6', color: '#cbd5e1', marginBottom: '40px' }}>
              program latihan.
            </p>
            <Link href="/coach">
              <button style={{ width: '100%', padding: '24px', fontSize: '20px', fontWeight: 'bold', background: '#f97316', color: 'white', border: 'none', borderRadius: '16px', cursor: 'pointer' }}>
                MASUK SEBAGAI PELATIH →
              </button>
            </Link>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(56,189,248,0.4)', borderRadius: '24px', padding: '50px 40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px' }}>
              <div style={{ fontSize: '60px' }}>🏋️</div>
              <div>
                <h3 style={{ fontSize: '32px', margin: '0 0 8px 0' }}>ATLET</h3>
                <p style={{ color: '#38bdf8' }}> Athlete Area</p>
              </div>
            </div>
            <p style={{ fontSize: '18px', lineHeight: '1.6', color: '#cbd5e1', marginBottom: '40px' }}>
              member cicapora . report performance.
            </p>
            <Link href="/athletes">
              <button style={{ width: '100%', padding: '24px', fontSize: '20px', fontWeight: 'bold', background: '#38bdf8', color: 'white', border: 'none', borderRadius: '16px', cursor: 'pointer' }}>
                MASUK SEBAGAI ATLET →
              </button>
            </Link>
          </div>
        </div>

        {/* DAFTAR TIM PELATIH */}
        <div>
          <h2 style={{ fontSize: '42px', fontWeight: 'bold', textAlign: 'center', marginBottom: '50px' }}>
            Tim Pelatih Profesional ({coaches.length})
          </h2>

          {loading ? (
            <p style={{ textAlign: 'center', color: '#94a3b8' }}>Memuat data...</p>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
              gap: '24px' 
            }}>
              {coaches.map((coach) => {
                const photoUrl = getCoachPhotoUrl(coach.Foto);
                return (
                  <div 
                    key={coach.id} 
                    onClick={() => openCoachDetail(coach)}
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      borderRadius: '24px',
                      overflow: 'hidden',
                      border: '1px solid rgba(251,146,60,0.2)',
                      transition: 'all 0.3s',
                      cursor: 'pointer'
                    }}
                    onMouseOver={(e) => (e.currentTarget as HTMLElement).style.transform = 'translateY(-8px)'}
                    onMouseOut={(e) => (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'}
                  >
                    <div style={{ position: 'relative', height: '260px' }}>
                      <Image 
                        src={photoUrl} 
                        alt={coach.Nama} 
                        fill 
                        style={{ objectFit: 'cover' }}
                        sizes="(max-width: 768px) 100vw, 240px"
                        unoptimized={true}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder-coach.jpg';
                        }}
                      />
                    </div>
                    <div style={{ padding: '20px' }}>
                      <h3 style={{ fontSize: '20px', margin: '0 0 8px 0' }}>{coach.Nama}</h3>
                      <p style={{ color: '#fb923c', margin: '0 0 10px 0', fontWeight: '500', fontSize: '14px' }}>{coach.Certificate}</p>
                      <p style={{ color: '#94a3b8', fontSize: '14px' }}>{coach.spesialis}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ==================== MODAL DETAIL PELATIH ==================== */}
      {selectedCoach && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }} onClick={closeModal}>
          
          <div 
            style={{
              background: '#1e2937',
              borderRadius: '24px',
              width: '90%',
              maxWidth: '620px',
              maxHeight: '92vh',
              overflow: 'auto',
              border: '1px solid rgba(251,146,60,0.4)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ position: 'relative', height: '340px' }}>
              <Image 
                src={getCoachPhotoUrl(selectedCoach.Foto)} 
                alt={selectedCoach.Nama} 
                fill 
                style={{ objectFit: 'cover' }}
                unoptimized={true}
              />
              <button 
                onClick={closeModal}
                style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  background: 'rgba(0,0,0,0.7)',
                  color: 'white',
                  border: 'none',
                  width: '45px',
                  height: '45px',
                  borderRadius: '50%',
                  fontSize: '22px',
                  cursor: 'pointer',
                  zIndex: 10
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '32px' }}>
              <h2 style={{ margin: '0 0 6px 0', fontSize: '34px' }}>{selectedCoach.Nama}</h2>
              <p style={{ color: '#fb923c', fontSize: '18px', marginBottom: '25px' }}>{selectedCoach.spesialis}</p>

              <div style={{ marginBottom: '25px' }}>
                <h4 style={{ color: '#fb923c', marginBottom: '12px' }}>🏆 Sertifikasi</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {selectedCoach.certificates?.length > 0 ? (
                    selectedCoach.certificates.map((cert, i) => (
                      <span key={i} style={{
                        background: 'rgba(251,146,60,0.15)',
                        color: '#fb923c',
                        padding: '8px 18px',
                        borderRadius: '9999px',
                        fontSize: '15px',
                        border: '1px solid rgba(251,146,60,0.3)'
                      }}>
                        {cert}
                      </span>
                    ))
                  ) : (
                    <p style={{ color: '#94a3b8' }}>Tidak ada data sertifikasi</p>
                  )}
                </div>
              </div>

              {selectedCoach.pengalaman && <p><strong>Pengalaman:</strong> {selectedCoach.pengalaman}</p>}
              {selectedCoach.bio && (
                <p style={{ marginTop: '20px', lineHeight: '1.7', color: '#cbd5e1' }}>
                  {selectedCoach.bio}
                </p>
              )}
              {(selectedCoach.umur || selectedCoach.lokasi) && (
                <p style={{ marginTop: '15px', color: '#94a3b8' }}>
                  {selectedCoach.umur && `${selectedCoach.umur} tahun`} 
                  {selectedCoach.lokasi && ` • ${selectedCoach.lokasi}`}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}