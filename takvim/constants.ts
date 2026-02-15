
import { EventCategory, CalendarEvent } from './types';

export const ACADEMIC_EVENTS: CalendarEvent[] = [
  // Birinci Dönem
  {
    id: 'd1-start',
    title: '1. Dönem Başlangıcı',
    startDate: new Date(2025, 8, 8),
    category: EventCategory.OKUL_DONEMI,
    color: 'bg-emerald-500'
  },
  {
    id: 'd1-end',
    title: '1. Dönem Sonu',
    startDate: new Date(2026, 0, 16),
    category: EventCategory.OKUL_DONEMI,
    color: 'bg-emerald-500'
  },
  // Ara Tatiller
  {
    id: 'ara-1',
    title: '1. Dönem Ara Tatili',
    startDate: new Date(2025, 10, 10),
    endDate: new Date(2025, 10, 14),
    category: EventCategory.ARA_TATIL,
    color: 'bg-orange-500'
  },
  {
    id: 'yariyil',
    title: 'Yarıyıl Tatili',
    startDate: new Date(2026, 0, 19),
    endDate: new Date(2026, 0, 30),
    category: EventCategory.ARA_TATIL,
    color: 'bg-orange-500'
  },
  // İkinci Dönem
  {
    id: 'd2-start',
    title: '2. Dönem Başlangıcı',
    startDate: new Date(2026, 1, 2),
    category: EventCategory.OKUL_DONEMI,
    color: 'bg-emerald-500'
  },
  {
    id: 'd2-end',
    title: '2. Dönem Sonu',
    startDate: new Date(2026, 5, 26),
    category: EventCategory.OKUL_DONEMI,
    color: 'bg-emerald-500'
  },
  {
    id: 'ara-2',
    title: '2. Dönem Ara Tatili',
    startDate: new Date(2026, 2, 16),
    endDate: new Date(2026, 2, 20),
    category: EventCategory.ARA_TATIL,
    color: 'bg-orange-500'
  },
  // Bayramlar
  {
    id: 'ramazan-2026',
    title: 'Ramazan Bayramı',
    startDate: new Date(2026, 2, 19),
    endDate: new Date(2026, 2, 22),
    category: EventCategory.RESMI_TATIL,
    color: 'bg-red-500'
  },
  {
    id: 'kurban-2026',
    title: 'Kurban Bayramı',
    startDate: new Date(2026, 4, 26),
    endDate: new Date(2026, 4, 30),
    category: EventCategory.RESMI_TATIL,
    color: 'bg-red-500'
  },
  // Diğer Tatiller
  {
    id: 'yılbası-2026',
    title: 'Yılbaşı Tatili',
    startDate: new Date(2026, 0, 1),
    category: EventCategory.RESMI_TATIL,
    color: 'bg-red-500'
  },
  {
    id: '23-nisan',
    title: '23 Nisan Ulusal Egemenlik',
    startDate: new Date(2026, 3, 23),
    category: EventCategory.RESMI_TATIL,
    color: 'bg-red-500'
  },
  {
    id: '1-mayis',
    title: '1 Mayıs İşçi Bayramı',
    startDate: new Date(2026, 4, 1),
    category: EventCategory.RESMI_TATIL,
    color: 'bg-red-500'
  },
  {
    id: '19-mayis',
    title: '19 Mayıs Gençlik ve Spor',
    startDate: new Date(2026, 4, 19),
    category: EventCategory.RESMI_TATIL,
    color: 'bg-red-500'
  }
];

export const MONTHS = [
  'OCAK', 'ŞUBAT', 'MART', 'NİSAN', 'MAYIS', 'HAZİRAN',
  'TEMMUZ', 'AĞUSTOS', 'EYLÜL', 'EKİM', 'KASIM', 'ARALIK'
];

export const WEEKDAYS = ['PZT', 'SALI', 'ÇARŞ', 'PERŞ', 'CUMA', 'CMT', 'PAZ'];
