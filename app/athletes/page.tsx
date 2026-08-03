'use client';

import { useState, useEffect, useRef } from 'react';
import { Line, Radar, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  RadarController,
  RadialLinearScale,
} from 'chart.js';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { supabase } from '@/lib/supabase';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  RadarController,
  RadialLinearScale
);

// ==================== TIPE DATA ====================
type Atlet = {
  id: number;
  Nama: string;
  TempatLahir?: string;
  TanggalLahir?: string;
  Usia: number;
  Alamat?: string;
  RiwayatPenyakit?: string;
  GolonganDarah: string;
  Foto?: string;
  Nokiat: string;
  JenisKelamin?: string;
  Level?: string;
};

type TrainingSession = {
  id: number;
  NamaAtlet: string;
  Tanggal: string;
  JenisSesi: string;
  Grade?: string;
  EnergyLevel?: string;
  Fatigue?: string;
  Catatan?: string;
  Durasi?: string;
  Kekuatan?: string;
  DayaTahan?: string;
  DayaLedak?: string;
  Kecepatan?: string;
  Kelentukan?: string;
  Keseimbangan?: string;
  Koordinasi?: string;
  Ketepatan?: string;
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
  id: string;
  athlete_name: string;
  certificate_name: string;
  file_url: string;
  uploaded_at: string;
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

type UpcomingTraining = {
  id: number;
  athlete_name: string;
  tanggal: string;
  jenis_sesi: string;
  lokasi?: string;
  catatan?: string;
};

export default function AthletesPage() {
  const [atlets, setAtlets] = useState<Atlet[]>([]);
  const [allSessions, setAllSessions] = useState<TrainingSession[]>([]);
  const [prestasiList, setPrestasiList] = useState<PrestasiAtlet[]>([]);
  const [certificates, setCertificates] = useState<AthleteCertificate[]>([]);
  const [selectedAtlet, setSelectedAtlet] = useState<Atlet | null>(null);
  const [climbingData, setClimbingData] = useState<Record<string, ClimbingTrainingWeek[]>>({});
  const [upcomingTrainings, setUpcomingTrainings] = useState<UpcomingTraining[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const lineRef = useRef<HTMLDivElement>(null);
  const radarRef = useRef<HTMLDivElement>(null);
  const climbingRef = useRef<HTMLDivElement>(null);
  const strengthChartRef = useRef<HTMLDivElement>(null);
  const combinedChartRef = useRef<HTMLDivElement>(null);

  const calculateAge = (tanggalLahir?: string): string => {
    if (!tanggalLahir) return '-';
    const birthDate = new Date(tanggalLahir);
    const today = new Date();
    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    if (months < 0 || (months === 0 && today.getDate() < birthDate.getDate())) {
      years--;
      months += 12;
    }
    return `${years} tahun ${months} bulan`;
  };

  // Load Data Awal
  useEffect(() => {
    const fetchAtlets = async () => {
      const { data } = await supabase.from('atlets').select('*').order('id');
      if (data) setAtlets(data);
    };

    const fetchSessions = async () => {
      const { data } = await supabase.from('coach_sessions').select('*');
      if (data) setAllSessions(data);
    };

    const fetchPrestasi = async () => {
      const { data } = await supabase.from('prestasi_atlet').select('*');
      if (data) setPrestasiList(data);
    };

    const fetchClimbing = async () => {
      const { data } = await supabase.from('climbing_progress').select('*');
      if (data) {
        const grouped: Record<string, ClimbingTrainingWeek[]> = {};
        data.forEach((item: any) => {
          if (!grouped[item.athlete_name]) grouped[item.athlete_name] = [];
          grouped[item.athlete_name].push(item);
        });
        setClimbingData(grouped);
      }
    };

    fetchAtlets();
    fetchSessions();
    fetchPrestasi();
    fetchClimbing();
  }, []);

  // Refresh Climbing Data
  useEffect(() => {
    if (!selectedAtlet) return;

    const refreshClimbing = async () => {
      const { data } = await supabase
        .from('climbing_progress')
        .select('*')
        .eq('athlete_name', selectedAtlet.Nama);

      if (data) {
        setClimbingData(prev => ({ ...prev, [selectedAtlet.Nama]: data }));
      }
    };

    refreshClimbing();
  }, [selectedAtlet]);

  useEffect(() => {
    if (!selectedAtlet) return;

    const fetchCertificates = async () => {
      const { data } = await supabase
        .from('certificates')
        .select('*')
        .eq('athlete_name', selectedAtlet.Nama)
        .order('uploaded_at', { ascending: false });
      if (data) setCertificates(data || []);
    };

    const fetchUpcoming = async () => {
      const { data } = await supabase
        .from('upcoming_training')
        .select('*')
        .eq('athlete_name', selectedAtlet.Nama)
        .order('tanggal', { ascending: true });
      if (data) setUpcomingTrainings(data);
    };

    fetchCertificates();
    fetchUpcoming();
  }, [selectedAtlet]);

  const filteredAtlets = atlets.filter(atlet =>
    atlet.Nama.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const atletSessions = allSessions
    .filter(s => selectedAtlet && s.NamaAtlet === selectedAtlet.Nama)
    .sort((a, b) => new Date(a.Tanggal).getTime() - new Date(b.Tanggal).getTime());

  const atletPrestasi = prestasiList.filter(p => selectedAtlet && p.NamaAtlet === selectedAtlet.Nama);

  const totalSessions = atletSessions.length;
  const avgEnergy = totalSessions > 0
    ? (atletSessions.reduce((sum, s) => sum + parseInt(s.EnergyLevel || '0'), 0) / totalSessions).toFixed(1)
    : '0';
  const avgFatigue = totalSessions > 0
    ? (atletSessions.reduce((sum, s) => sum + parseInt(s.Fatigue || '0'), 0) / totalSessions).toFixed(1)
    : '0';

  const fitnessKeys = ['Kekuatan', 'DayaTahan', 'DayaLedak', 'Kecepatan', 'Kelentukan', 'Keseimbangan', 'Koordinasi', 'Ketepatan'];

  const fitnessAverages = fitnessKeys.map(key => {
    const values = atletSessions.map(s => parseInt((s as any)[key] || '0')).filter(v => v > 0);
    return values.length > 0 ? parseFloat((values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)) : 0;
  });

  const atletClimbing = selectedAtlet
    ? [...(climbingData[selectedAtlet.Nama] || [])].sort((a, b) => a.minggu - b.minggu)
    : [];

  const weeklyEvaluation = atletClimbing
    .slice(-2)
    .map((week, index, arr) => {
      const prevWeek = arr[index - 1];
      return {
        minggu: week.minggu,
        grade: week.grade,
        gradeNumeric: week.gradeNumeric,
        volume: week.volumeClimbing,
        sends: week.sends,
        fingerHang: week.fingerHang20mm,
        pullUp: week.weightedPullupKg,
        energyAvg: 7.5,
        improvement: prevWeek ? (week.gradeNumeric - prevWeek.gradeNumeric) : 0
      };
    });

  // ==================== STATISTIK BARU ====================
  const gradeToNumber = (grade: string) => {
    if (!grade) return 0;
    const match = grade.match(/(\d)([a-cA-C]?)/);
    if (!match) return 0;
    const num = parseInt(match[1]);
    const letter = (match[2] || 'a').toLowerCase();
    return num + (letter === 'a' ? 0 : letter === 'b' ? 0.3 : 0.6);
  };

  const totalSesi = atletSessions.length;

  const bestGrade = atletSessions.length > 0
    ? atletSessions
        .map(s => s.Grade)
        .filter(Boolean)
        .sort((a, b) => gradeToNumber(a || '') - gradeToNumber(b || ''))
        .pop() || '-'
    : '-';

  const rataRataGrade = atletSessions.length > 0
    ? (
        atletSessions
          .map(s => gradeToNumber(s.Grade || ''))
          .filter(n => n > 0)
          .reduce((a, b) => a + b, 0) /
        (atletSessions.filter(s => s.Grade).length || 1)
      ).toFixed(1)
    : '0';

  const sekarang = new Date();
  const sesiBulanIni = atletSessions.filter(s => {
    const tgl = new Date(s.Tanggal);
    return tgl.getMonth() === sekarang.getMonth() && tgl.getFullYear() === sekarang.getFullYear();
  }).length;

  const totalMenit = atletSessions.reduce((sum, s) => {
    const durasi = parseInt(s.Durasi || '0');
    return sum + (isNaN(durasi) ? 0 : durasi);
  }, 0);
  const totalJam = (totalMenit / 60).toFixed(1) + 'h';

  const highGradeCount = atletSessions.filter(s => gradeToNumber(s.Grade || '') >= 6.5).length;
  const highGradeRate = totalSesi > 0 ? Math.round((highGradeCount / totalSesi) * 100) + '%' : '0%';

  // ==================== GRAFIK KEMAJUAN BARU ====================
  const progressGradeData = {
    labels: atletSessions.map(s => {
      const d = new Date(s.Tanggal);
      return d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
    }),
    datasets: [{
      label: 'Grade',
      data: atletSessions.map(s => gradeToNumber(s.Grade || '')),
      borderColor: '#ef4444',
      backgroundColor: 'rgba(239, 68, 68, 0.15)',
      borderWidth: 3,
      tension: 0.4,
      fill: true,
      pointBackgroundColor: '#ef4444',
      pointRadius: 5,
    }],
  };

  const progressGradeOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { grid: { color: 'rgba(255,255,255,0.08)' }, ticks: { color: '#94a3b8' } },
      x: { grid: { color: 'rgba(255,255,255,0.08)' }, ticks: { color: '#94a3b8' } },
    },
  } as const;

  const monthlySessions: Record<string, number> = {};
  atletSessions.forEach(s => {
    const d = new Date(s.Tanggal);
    const key = d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
    monthlySessions[key] = (monthlySessions[key] || 0) + 1;
  });

  const sessionPerMonthData = {
    labels: Object.keys(monthlySessions),
    datasets: [{
      label: 'Jumlah Sesi',
      data: Object.values(monthlySessions),
      backgroundColor: '#ef4444',
      borderRadius: 8,
    }],
  };

  const sessionPerMonthOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.08)' }, ticks: { color: '#94a3b8', stepSize: 1 } },
      x: { grid: { display: false }, ticks: { color: '#94a3b8' } },
    },
  } as const;

  // Chart Data Lama
  const lineData = {
    labels: atletSessions.map(s => new Date(s.Tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })),
    datasets: [
      { label: 'Energy Level', data: atletSessions.map(s => parseInt(s.EnergyLevel || '0')), borderColor: '#38bdf8', backgroundColor: 'rgba(56,189,248,0.15)', tension: 0.4, fill: true },
      { label: 'Fatigue Level', data: atletSessions.map(s => parseInt(s.Fatigue || '0')), borderColor: '#f97316', backgroundColor: 'rgba(249,115,22,0.15)', tension: 0.4, fill: true },
    ],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#cbd5e1' } } },
    scales: {
      y: { min: 0, max: 10, grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#94a3b8' } },
      x: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#94a3b8' } },
    },
  } as const;

  const radarData = {
    labels: fitnessKeys,
    datasets: [{
      label: 'Rata-rata Performa',
      data: fitnessAverages,
      borderColor: '#fb923c',
      backgroundColor: 'rgba(251,146,60,0.25)',
      borderWidth: 2
    }],
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: { min: 0, max: 10, grid: { color: 'rgba(255,255,255,0.1)' }, pointLabels: { color: '#cbd5e1' }, ticks: { color: '#94a3b8' } }
    },
    plugins: { legend: { labels: { color: '#cbd5e1' } } },
  } as const;

  const gradeChartData = {
    labels: atletClimbing.map(c => `Minggu ${c.minggu}`),
    datasets: [{
      label: 'Grade Maksimal',
      data: atletClimbing.map(c => c.gradeNumeric),
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.25)',
      borderWidth: 3,
      tension: 0.4,
      fill: true,
    }],
  };

  const gradeOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#cbd5e1' } } },
    scales: {
      y: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#94a3b8' } },
      x: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#94a3b8' } },
    },
  } as const;

  const strengthChartData = {
    labels: atletClimbing.map(c => `Minggu ${c.minggu}`),
    datasets: [
      { label: 'Finger Hang (detik)', data: atletClimbing.map(c => c.fingerHang20mm), borderColor: '#8b5cf6', backgroundColor: 'rgba(139, 92, 246, 0.2)', tension: 0.3, borderWidth: 3 },
      { label: 'Weighted Pull-up (kg)', data: atletClimbing.map(c => c.weightedPullupKg), borderColor: '#f97316', backgroundColor: 'rgba(249, 115, 22, 0.2)', tension: 0.3, borderWidth: 3 },
    ],
  };

  const strengthOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#cbd5e1' } } },
    scales: {
      y: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#94a3b8' } },
      x: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#94a3b8' } },
    },
  } as const;

  const combinedChartData = {
    labels: atletClimbing.map(c => `Minggu ${c.minggu}`),
    datasets: [
      {
        label: 'Grade Maksimal',
        data: atletClimbing.map(c => Number(c.gradeNumeric) || 0),
        backgroundColor: '#3b82f6',
        borderColor: '#3b82f6',
        borderWidth: 2,
        yAxisID: 'y'
      },
      {
        label: 'Volume Climbing',
        data: atletClimbing.map(c => Number(c.volumeClimbing) || 0),
        backgroundColor: '#22c55e',
        borderColor: '#22c55e',
        borderWidth: 1,
        yAxisID: 'y1'
      },
      {
        label: 'Total Sends',
        data: atletClimbing.map(c => Number(c.sends) || 0),
        backgroundColor: '#eab308',
        borderColor: '#eab308',
        borderWidth: 1,
        yAxisID: 'y1'
      }
    ]
  };

  const combinedChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#cbd5e1' } }
    },
    scales: {
      y: {
        type: 'linear' as const,
        position: 'left' as const,
        grid: { color: 'rgba(255,255,255,0.1)' },
        ticks: { color: '#94a3b8' }
      },
      y1: {
        type: 'linear' as const,
        position: 'right' as const,
        grid: { drawOnChartArea: false },
        ticks: { color: '#94a3b8' }
      },
      x: {
        grid: { color: 'rgba(255,255,255,0.1)' },
        ticks: { color: '#94a3b8' }
      }
    }
  };

  const captureWithDelay = async (ref: React.RefObject<HTMLDivElement | null>) => {
    if (!ref.current) return null;
    await new Promise(resolve => setTimeout(resolve, 400));
    return await html2canvas(ref.current, { scale: 3, backgroundColor: '#1e2937' });
  };

  const downloadPDF = async () => {
    if (!selectedAtlet) return;
    alert("Sedang membuat PDF... Mohon tunggu sebentar.");

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 45;

    doc.setFillColor(10, 20, 40);
    doc.rect(0, 0, pageWidth, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text('CICAPORA SPORT CLIMBING', pageWidth / 2, 15, { align: 'center' });
    doc.setFontSize(12);
    doc.text('LAPORAN LENGKAP PROGRES ATLET', pageWidth / 2, 23, { align: 'center' });

    doc.setTextColor(0);
    doc.setFontSize(14);
    doc.text('BIODATA ATLET', 20, y);
    y += 6;
    doc.line(20, y, pageWidth - 20, y);
    y += 10;

    if (selectedAtlet.Foto) {
      try { doc.addImage(selectedAtlet.Foto, 'JPEG', pageWidth - 70, y - 3, 50, 50); } catch (e) {}
    }

    doc.setFontSize(11);

    const addLine = (label: string, value: any) => {
      if (y > 280) { doc.addPage(); y = 30; }
      doc.text(label, 20, y);
      const valueText = `: ${value || '-'}`;
      const lines = doc.splitTextToSize(valueText, pageWidth - 100);
      doc.text(lines, 80, y);
      y += lines.length * 7;
    };

    addLine("Nama Lengkap", selectedAtlet.Nama);
    addLine("Usia", calculateAge(selectedAtlet.TanggalLahir));
    addLine("Jenis Kelamin", selectedAtlet.JenisKelamin);
    addLine("Level", selectedAtlet.Level);
    addLine("Tempat Lahir", selectedAtlet.TempatLahir);
    addLine("Tanggal Lahir", selectedAtlet.TanggalLahir);
    addLine("Golongan Darah", selectedAtlet.GolonganDarah);
    addLine("Alamat", selectedAtlet.Alamat);
    addLine("No kiat", selectedAtlet.Nokiat);
    addLine("Riwayat Penyakit", selectedAtlet.RiwayatPenyakit || "Tidak ada");
    y += 10;

    if (atletPrestasi.length > 0) {
      if (y > 200) { doc.addPage(); y = 30; }
      doc.setFontSize(14);
      doc.text('PRESTASI ATLET', 20, y);
      y += 6;
      doc.line(20, y, pageWidth - 20, y);
      y += 12;

      const colWidth = 58;
      let col = 0;
      let startY = y;

      for (let i = 0; i < atletPrestasi.length; i++) {
        const p = atletPrestasi[i];
        const x = 20 + (col * colWidth);

        if (y > 265) { doc.addPage(); y = 40; startY = y; }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        const title = doc.splitTextToSize(`• ${p.JenisKejuaraan}`, colWidth - 5);
        doc.text(title, x, y);
        y += title.length * 5.5;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        doc.text(`  ${p.Tanggal}`, x, y); y += 5;
        doc.text(`  ${p.katagori}`, x, y); y += 5;

        const loc = doc.splitTextToSize(`  ${p.Lokasi || '-'}`, colWidth - 5);
        doc.text(loc, x, y); y += loc.length * 5;

        doc.setTextColor(0, 150, 0);
        doc.text(`  ${p.Medali}`, x, y);
        doc.setTextColor(0);

        col = (col + 1) % 3;
        if (col === 0) {
          y = startY + 48;
          startY = y;
        } else {
          y = startY;
        }
      }
      y += 25;
    }

    if (y > 220) { doc.addPage(); y = 30; }
    doc.setFontSize(14);
    doc.text('RINGKASAN PERFORMA', 20, y);
    y += 6;
    doc.line(20, y, pageWidth - 20, y);
    y += 8;

    doc.setFontSize(11);
    doc.text(`Total Sesi Latihan : ${totalSessions}`, 20, y); y += 6;
    doc.text(`Rata-rata Energy   : ${avgEnergy} / 10`, 20, y); y += 6;
    doc.text(`Rata-rata Fatigue  : ${avgFatigue} / 10`, 20, y); y += 10;

    if (lineRef.current && atletSessions.length > 0) {
      if (y > 180) { doc.addPage(); y = 30; }
      const canvas = await captureWithDelay(lineRef);
      if (canvas) { doc.addImage(canvas.toDataURL('image/png'), 'PNG', 20, y, 165, 75); y += 82; }
    }

    if (radarRef.current && totalSessions > 0) {
      if (y > 180) { doc.addPage(); y = 30; }
      const canvas = await captureWithDelay(radarRef);
      if (canvas) { doc.addImage(canvas.toDataURL('image/png'), 'PNG', 20, y, 165, 75); y += 82; }
    }

    if (atletClimbing.length > 0) {
      if (y > 200) { doc.addPage(); y = 30; }
      doc.setFontSize(14);
      doc.text('PROGRES LATIHAN PANJAT TEBING', 20, y);
      y += 6;
      doc.line(20, y, pageWidth - 20, y);
      y += 8;

      doc.setFontSize(11);
      doc.text(`Total Minggu Data: ${atletClimbing.length}`, 20, y); y += 6;
      if (atletClimbing.length > 1) {
        doc.text(`Grade Awal → Akhir: ${atletClimbing[0].grade} → ${atletClimbing[atletClimbing.length - 1].grade}`, 20, y); y += 6;
      }
      doc.text(`Total Volume: ${atletClimbing.reduce((sum, c) => sum + c.volumeClimbing, 0)}`, 20, y); y += 10;

      atletClimbing.forEach((c, i) => {
        if (y > 255) { doc.addPage(); y = 30; }
        doc.setFontSize(10);
        doc.text(`${i + 1}. Minggu ${c.minggu} | Grade: ${c.grade} | Volume: ${c.volumeClimbing} | Sends: ${c.sends}`, 20, y);
        y += 6;
      });
      y += 8;

      if (combinedChartRef.current) {
        if (y > 170) { doc.addPage(); y = 30; }
        const canvas = await captureWithDelay(combinedChartRef);
        if (canvas) { doc.addImage(canvas.toDataURL('image/png'), 'PNG', 20, y, 165, 75); y += 82; }
      }
    }

    if (y > 200) { doc.addPage(); y = 30; }
    doc.setFontSize(14);
    doc.text('RIWAYAT LATIHAN', 20, y);
    y += 6;
    doc.line(20, y, pageWidth - 20, y);
    y += 8;

    atletSessions.forEach((s, i) => {
      if (y > 255) { doc.addPage(); y = 30; }
      doc.setFontSize(10);
      doc.text(`${i + 1}. ${s.Tanggal} - ${s.JenisSesi} | Grade: ${s.Grade || '-'}`, 20, y);
      doc.text(`   Energy: ${s.EnergyLevel || '-'} | Fatigue: ${s.Fatigue || '-'}`, 25, y + 5);
      y += 14;
    });

    doc.save(`Laporan_Progres_${selectedAtlet.Nama.replace(/\s+/g, '_')}.pdf`);
    alert("PDF berhasil dibuat dan diunduh!");
  };

  const downloadCertificate = async (url: string, fileName: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName || 'sertifikat.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      alert('Gagal mendownload file.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a1428 0%, #1e2937 100%)', color: 'white' }}>
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 40px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ width: '50px', height: '50px', background: '#f97316', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>🏔️</div>
          <div>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold' }}>CICAPORA</h1>
            <p style={{ margin: 0, fontSize: '14px', color: '#fb923c' }}>SPORT CLIMBING</p>
          </div>
        </div>
        <button onClick={() => window.location.href = '/'} style={{ padding: '10px 20px', background: 'transparent', border: '1px solid #fb923c', color: '#fb923c', borderRadius: '10px' }}>Kembali ke Home</button>
      </nav>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '40px 20px' }}>
        <h1 style={{ fontSize: '42px', fontWeight: 'bold', textAlign: 'center', marginBottom: '40px' }}>Area Atlet</h1>

        {!selectedAtlet && (
          <div>
            {/* Search Box */}
            <div style={{ marginBottom: '30px', maxWidth: '500px', margin: '0 auto 30px' }}>
              <input
                type="text"
                placeholder="🔍 Cari atlet berdasarkan nama..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 20px',
                  borderRadius: '14px',
                  border: '1px solid rgba(255,255,255,0.15)',
                  background: 'rgba(255,255,255,0.08)',
                  color: 'white',
                  fontSize: '16px',
                  outline: 'none'
                }}
              />
            </div>

            {/* Daftar Atlet */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
              gap: '18px' 
            }}>
              {filteredAtlets.length === 0 ? (
                <p style={{ 
                  gridColumn: '1 / -1', 
                  textAlign: 'center', 
                  color: '#94a3b8',
                  padding: '40px 0'
                }}>
                  {searchTerm ? 'Tidak ada atlet yang cocok dengan pencarian.' : 'Belum ada data atlet.'}
                </p>
              ) : (
                filteredAtlets.map((atlet) => (
                  <div
                    key={atlet.id}
                    onClick={() => setSelectedAtlet(atlet)}
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(56,189,248,0.3)',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      transition: 'transform 0.2s, box-shadow 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {atlet.Foto ? (
                      <img
                        src={atlet.Foto}
                        alt={atlet.Nama}
                        loading="lazy"
                        style={{
                          width: '100%',
                          height: '240px',
                          objectFit: 'cover',
                          objectPosition: 'center top'
                        }}
                      />
                    ) : (
                      <div style={{
                        height: '240px',
                        background: 'rgba(255,255,255,0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#64748b'
                      }}>
                        No Photo
                      </div>
                    )}
                    <div style={{ padding: '12px', textAlign: 'center' }}>
                      <h3 style={{ margin: '0 0 6px 0', fontSize: '15.5px', fontWeight: 'bold' }}>
                        {atlet.Nama}
                      </h3>
                      <p style={{ color: '#94a3b8', margin: 0, fontSize: '13px' }}>
                        {calculateAge(atlet.TanggalLahir)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {selectedAtlet && (
  <div>
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
      <button 
        onClick={() => setSelectedAtlet(null)} 
        style={{ 
          padding: '8px 16px', 
          background: 'transparent', 
          border: '1px solid #fb923c', 
          color: '#fb923c', 
          borderRadius: '10px',
          cursor: 'pointer'
        }}
      >
        ← Kembali
      </button>
    </div>

    <div style={{ 
      background: 'rgba(255,255,255,0.06)', 
      borderRadius: '24px', 
      padding: '28px',
      border: '1px solid rgba(255,255,255,0.08)'
    }}>
      
      {/* ===== HEADER ATLET (GAYA NANGGALA) ===== */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'flex-start', 
        gap: '24px', 
        marginBottom: '28px',
        flexWrap: 'wrap'
      }}>
        {/* Avatar */}
        <div style={{
          width: '110px',
          height: '110px',
          borderRadius: '20px',
          background: 'rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '48px',
          overflow: 'hidden',
          flexShrink: 0
        }}>
          {selectedAtlet.Foto ? (
            <img 
              src={selectedAtlet.Foto} 
              alt={selectedAtlet.Nama}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <span>🏋️</span>
          )}
        </div>

        {/* Info Atlet */}
        <div style={{ flex: 1, minWidth: '220px' }}>
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: 'bold', 
            margin: '0 0 6px 0',
            color: 'white'
          }}>
            {selectedAtlet.Nama}
          </h1>

          <p style={{ 
            color: '#f87171', 
            fontSize: '15px', 
            margin: '0 0 12px 0',
            fontWeight: '500'
          }}>
            {selectedAtlet.Level || 'Atlet'} • {selectedAtlet.JenisKelamin || '-'}
          </p>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '8px' }}>
            <span style={{
              background: 'rgba(248,113,113,0.15)',
              color: '#f87171',
              padding: '5px 14px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: '500'
            }}>
              Umur: {calculateAge(selectedAtlet.TanggalLahir)}
            </span>
            <span style={{
              background: 'rgba(56,189,248,0.15)',
              color: '#38bdf8',
              padding: '5px 14px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: '500'
            }}>
              Data Real-time
            </span>
          </div>

          {selectedAtlet.Level && (
            <p style={{ color: '#94a3b8', margin: '8px 0 0 0', fontSize: '14px' }}>
              {selectedAtlet.Level}
            </p>
          )}
        </div>

        {/* Tombol PDF */}
        <div>
          <button 
            onClick={downloadPDF} 
            style={{ 
              padding: '12px 24px', 
              background: '#38bdf8', 
              color: 'white', 
              border: 'none', 
              borderRadius: '12px', 
              fontWeight: 'bold',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            📄 Unduh Laporan PDF
          </button>
        </div>
      </div>

      {/* ===== 6 KARTU STATISTIK ===== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '14px',
        marginBottom: '30px'
      }}>
        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '16px', padding: '20px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f87171' }}>{totalSesi}</div>
          <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>Total Sesi</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '16px', padding: '20px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f87171' }}>{bestGrade}</div>
          <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>Best Grade</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '16px', padding: '20px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f87171' }}>{rataRataGrade}</div>
          <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>Rata-rata Grade</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '16px', padding: '20px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f87171' }}>{sesiBulanIni}</div>
          <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>Sesi Bulan Ini</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '16px', padding: '20px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f87171' }}>{totalJam}</div>
          <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>Total Jam Latihan</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '16px', padding: '20px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f87171' }}>{highGradeRate}</div>
          <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>High Grade Rate</div>
        </div>
      </div>
              {/* Prestasi */}
              {atletPrestasi.length > 0 && (
                <div style={{ marginBottom: '30px' }}>
                  <h3 style={{ marginBottom: '16px', color: '#22c55e' }}>🏆 Prestasi Atlet</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
                    {atletPrestasi.map(p => (
                      <div key={p.id} style={{ background: 'rgba(34,197,94,0.1)', padding: '14px 16px', borderRadius: '12px', border: '1px solid #22c55e', fontSize: '14px' }}>
                        <strong>{p.JenisKejuaraan}</strong><br />
                        <small>{p.Tanggal} • {p.katagori} • {p.Lokasi}</small><br />
                        <span style={{ color: '#86efac', fontWeight: 'bold' }}>{p.Medali}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Chart Energy & Fatigue + Radar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', marginBottom: '40px' }}>
                <div ref={lineRef} style={{ background: 'rgba(255,255,255,0.06)', padding: '20px', borderRadius: '16px', width: '100%' }}>
                  <h3>Tren Energy & Fatigue</h3>
                  <div style={{ height: '300px' }}>
                    {atletSessions.length > 0 ? <Line data={lineData} options={lineOptions} /> : <p>Belum ada data</p>}
                  </div>
                </div>

                <div ref={radarRef} style={{ background: 'rgba(255,255,255,0.06)', padding: '20px', borderRadius: '16px', width: '100%' }}>
                  <h3>8 Unsur Kebugaran Jasmani</h3>
                  <div style={{ height: '320px' }}>
                    {totalSessions > 0 ? <Radar data={radarData} options={radarOptions} /> : <p>Belum ada data</p>}
                  </div>
                </div>
              </div>

              {/* Progres Panjat Tebing */}
              <div style={{ marginTop: '40px' }}>
                <h3 style={{ color: '#3b82f6', marginBottom: '16px' }}>🧗 Progres Latihan Panjat Tebing Detail</h3>

                {atletClimbing.length === 0 ? (
                  <div style={{ background: 'rgba(255,255,255,0.06)', padding: '24px', borderRadius: '16px', textAlign: 'center' }}>
                    <p>Belum ada data progres panjat tebing.</p>
                  </div>
                ) : (
                  <>
                    <div style={{ background: 'rgba(255,255,255,0.06)', padding: '20px', borderRadius: '16px', marginBottom: '24px', overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ background: 'rgba(59,130,246,0.2)' }}>
                            <th style={{ padding: '8px' }}>Minggu</th>
                            <th>Grade</th>
                            <th>Volume</th>
                            <th>Sends</th>
                            <th>Finger (s)</th>
                            <th>Pull-up (kg)</th>
                            <th>Core (s)</th>
                            <th>Endurance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {atletClimbing.map((c, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                              <td style={{ padding: '8px', fontWeight: 'bold' }}>{c.minggu}</td>
                              <td><strong style={{ color: '#3b82f6' }}>{c.grade}</strong></td>
                              <td>{c.volumeClimbing}</td>
                              <td>{c.sends}</td>
                              <td>{c.fingerHang20mm}</td>
                              <td>{c.weightedPullupKg}</td>
                              <td>{c.corePlankSec}</td>
                              <td>{c.enduranceArcMin} min</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Chart Gabungan */}
                    <div ref={combinedChartRef} style={{ background: 'rgba(255,255,255,0.06)', padding: '24px', borderRadius: '16px', marginBottom: '24px' }}>
                      <h4 style={{ marginBottom: '16px' }}>📈 Progress Grade Maksimal & Volume</h4>
                      <div style={{ height: '380px' }}>
                        <Bar data={combinedChartData} options={combinedChartOptions} />
                      </div>
                    </div>

                    <div ref={climbingRef} style={{ background: 'rgba(255,255,255,0.06)', padding: '24px', borderRadius: '16px', marginBottom: '24px' }}>
                      <h4>Progres Grade Maksimal (Detail)</h4>
                      <div style={{ height: '320px' }}>
                        <Line data={gradeChartData} options={gradeOptions} />
                      </div>
                    </div>

                    <div ref={strengthChartRef} style={{ background: 'rgba(255,255,255,0.06)', padding: '24px', borderRadius: '16px' }}>
                      <h4>Kekuatan Jari & Pulling Strength</h4>
                      <div style={{ height: '320px' }}>
                        <Line data={strengthChartData} options={strengthOptions} />
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Evaluasi Mingguan */}
              {weeklyEvaluation.length > 0 && (
                <div style={{ marginTop: '40px' }}>
                  <h3 style={{ color: '#a855f7', marginBottom: '16px' }}>📊 Evaluasi 2 Minggu Terakhir</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                    {weeklyEvaluation.map((evalWeek, i) => (
                      <div key={i} style={{
                        background: 'rgba(255,255,255,0.06)',
                        padding: '20px',
                        borderRadius: '16px',
                        border: '1px solid rgba(168, 85, 247, 0.3)'
                      }}>
                        <h4 style={{ color: '#c084fc', marginBottom: '12px' }}>Minggu {evalWeek.minggu}</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '14px' }}>
                          <p><strong>Grade:</strong> <span style={{ color: '#a855f7' }}>{evalWeek.grade}</span></p>
                          <p><strong>Volume:</strong> {evalWeek.volume}</p>
                          <p><strong>Sends:</strong> {evalWeek.sends}</p>
                          <p><strong>Finger Hang:</strong> {evalWeek.fingerHang}s</p>
                          <p><strong>Pull-up:</strong> {evalWeek.pullUp}kg</p>
                          <p><strong>Energy Avg:</strong> {evalWeek.energyAvg.toFixed(1)}/10</p>
                        </div>
                        {evalWeek.improvement !== 0 && (
                          <p style={{ marginTop: '12px', color: evalWeek.improvement > 0 ? '#22c55e' : '#ef4444', fontWeight: 'bold' }}>
                            {evalWeek.improvement > 0 ? '↑' : '↓'} Improvement: {evalWeek.improvement.toFixed(1)} grade
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Jadwal Latihan Mendatang */}
              <div style={{ marginTop: '40px' }}>
                <h3 style={{ color: '#eab308' }}>📊 Jadwal Latihan Mendatang</h3>
                <div style={{ background: 'rgba(255,255,255,0.06)', padding: '24px', borderRadius: '16px' }}>
                  <h4>Jadwal Latihan Mendatang</h4>
                  {upcomingTrainings.length === 0 ? (
                    <p>Belum ada jadwal mendatang untuk atlet ini.</p>
                  ) : (
                    <div style={{ display: 'grid', gap: '12px' }}>
                      {upcomingTrainings.map((u, i) => (
                        <div key={i} style={{ background: 'rgba(234,179,8,0.1)', padding: '14px', borderRadius: '10px', border: '1px solid #eab308' }}>
                          <strong>{u.tanggal}</strong> — {u.jenis_sesi}<br />
                          Lokasi: {u.lokasi || '-'}<br />
                          {u.catatan && <small style={{ color: '#94a3b8' }}>{u.catatan}</small>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Sertifikat */}
              <div style={{ marginTop: '40px' }}>
                <h3 style={{ color: '#22c55e', marginBottom: '16px' }}>📜 Sertifikat Atlet</h3>
                {certificates.length === 0 ? (
                  <div style={{ background: 'rgba(255,255,255,0.06)', padding: '24px', borderRadius: '16px', textAlign: 'center' }}>
                    <p style={{ color: '#94a3b8' }}>Belum ada sertifikat.</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                    {certificates.map((cert) => (
                      <div key={cert.id} style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid #22c55e', borderRadius: '16px', padding: '20px' }}>
                        <h4 style={{ margin: '0 0 8px 0', color: '#86efac' }}>{cert.certificate_name}</h4>
                        <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '12px' }}>
                          Di-upload: {new Date(cert.uploaded_at).toLocaleDateString('id-ID')}
                        </p>
                        <button onClick={() => downloadCertificate(cert.file_url, cert.certificate_name)} style={{ width: '100%', padding: '12px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold' }}>
                          📥 Download Sertifikat
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}