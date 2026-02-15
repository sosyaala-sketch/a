
export enum EventCategory {
  RESMI_TATIL = 'RESMİ TATİL',
  DOGUM_GUNU = 'DOĞUM GÜNÜ',
  YAZILI_TARIHI = 'YAZILI TARIHİ',
  OKUL_DONEMI = 'OKUL DÖNEMİ',
  ARA_TATIL = 'ARA TATİL',
  YAZ_TATILI = 'YAZ TATİLİ',
  DIGER = 'DİĞER'
}

export interface CalendarEvent {
  id: string;
  title: string;
  startDate: Date;
  endDate?: Date;
  category: EventCategory;
  description?: string;
  color?: string;
}

export interface WeatherInfo {
  temp: number;
  condition: string;
  suggestion: string;
}
