
import React, { useState, useMemo, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, Folder, FolderOpen, Plus, Calendar as CalendarIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { EventCategory, CalendarEvent } from './types';
import { ACADEMIC_EVENTS, MONTHS, WEEKDAYS } from './constants';

const App: React.FC = () => {
  const initialToday = new Date();
  const [today] = useState(initialToday);
  const [currentDate, setCurrentDate] = useState(new Date(initialToday.getFullYear(), initialToday.getMonth(), 1)); 
  const [selectedDate, setSelectedDate] = useState<Date | null>(initialToday);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | 'HEPSİ'>('HEPSİ');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const [customEvents, setCustomEvents] = useState<CalendarEvent[]>([]);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [isAdminMode, setIsAdminMode] = useState(false);
  
  const [newCatName, setNewCatName] = useState('');
  const [newEvTitle, setNewEvTitle] = useState('');

  useEffect(() => {
    const savedEvents = localStorage.getItem('app_stable_v2_events');
    const savedCats = localStorage.getItem('app_stable_v2_cats');
    if (savedEvents) {
      setCustomEvents(JSON.parse(savedEvents).map((e: any) => ({
        ...e,
        startDate: new Date(e.startDate),
        endDate: e.endDate ? new Date(e.endDate) : undefined
      })));
    }
    if (savedCats) setCustomCategories(JSON.parse(savedCats));
  }, []);

  useEffect(() => {
    localStorage.setItem('app_stable_v2_events', JSON.stringify(customEvents));
    localStorage.setItem('app_stable_v2_cats', JSON.stringify(customCategories));
  }, [customEvents, customCategories]);

  useEffect(() => {
    if (searchQuery.toLowerCase() === 'yönetici') setIsAdminMode(true);
    else setIsAdminMode(false);
  }, [searchQuery]);

  const allEvents = useMemo(() => [...ACADEMIC_EVENTS, ...customEvents], [customEvents]);
  const allCategories = useMemo(() => ['HEPSİ', ...Object.values(EventCategory), ...customCategories], [customCategories]);

  const isSameDay = (d1: Date, d2: Date) => d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();

  function isDateInEvent(d: number, m: number, y: number, event: CalendarEvent) {
    const current = new Date(y, m, d);
    current.setHours(0,0,0,0);
    const start = new Date(event.startDate);
    start.setHours(0,0,0,0);
    if (event.endDate) {
      const end = new Date(event.endDate);
      end.setHours(23,59,59,999);
      return current >= start && current <= end;
    }
    return current.getTime() === start.getTime();
  };

  const getEventsForDay = (d: number, m: number, y: number) => {
    return allEvents.filter(event => {
      const isOnDate = isDateInEvent(d, m, y, event);
      if (!isOnDate) return false;
      if (selectedCategory !== 'HEPSİ' && event.category !== selectedCategory) return false;
      return true;
    });
  };

  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const startOffset = firstDay === 0 ? 6 : firstDay - 1;
    const days = [];
    const prevMonthLastDate = new Date(year, month, 0).getDate();
    for (let i = startOffset - 1; i >= 0; i--) days.push({ day: prevMonthLastDate - i, month: month - 1, year, isCurrentMonth: false });
    const lastDate = new Date(year, month + 1, 0).getDate();
    for (let i = 1; i <= lastDate; i++) days.push({ day: i, month, year, isCurrentMonth: true });
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) days.push({ day: i, month: month + 1, year, isCurrentMonth: false });
    return days;
  }, [currentDate]);

  const handleAddEvent = (cat: string) => {
    if (!newEvTitle.trim() || !selectedDate) return;
    const newEv: CalendarEvent = {
      id: Math.random().toString(36).substr(2, 9),
      title: newEvTitle,
      startDate: new Date(selectedDate),
      category: cat as any,
      color: 'bg-white/20'
    };
    setCustomEvents(prev => [...prev, newEv]);
    setNewEvTitle('');
  };

  return (
    <div className="app-container min-h-screen">
      <div className="flex p-6 lg:p-10 gap-6 lg:gap-8 max-w-[1440px] mx-auto">
        
        {/* Sidebar - More compact width */}
        <aside className="hidden lg:flex w-[280px] flex-col gap-6 shrink-0">
          <div className="liquid-glass p-6 rounded-3xl flex flex-col gap-6 h-full sticky top-10">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xl font-black tracking-tight text-white uppercase italic">Belgeler</h2>
              {isAdminMode && <div className="px-1.5 py-0.5 bg-white text-black text-[7px] font-black rounded-md">ADM</div>}
            </div>

            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-700 w-4 h-4" />
              <input 
                type="text" 
                placeholder="ETKİNLİK ARA..." 
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl py-3 pl-10 pr-4 text-[9px] font-bold uppercase tracking-widest focus:outline-none focus:border-white/20 transition-all" 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
              />
            </div>
            
            <div className="flex flex-col gap-0.5 overflow-y-auto scrollbar-hide flex-1">
              {allCategories.map(cat => (
                <div key={cat} className="flex flex-col">
                  <button 
                    onClick={() => {
                      setSelectedCategory(cat);
                      setExpandedCategory(expandedCategory === cat ? null : cat);
                    }} 
                    className={`w-full px-4 py-3 rounded-xl text-[10px] font-black uppercase flex items-center justify-between transition-all ${selectedCategory === cat ? 'text-white bg-white/[0.05]' : 'text-zinc-600 hover:text-zinc-400 hover:bg-white/[0.01]'}`}
                  >
                    <div className="flex items-center gap-2.5">
                      {expandedCategory === cat ? <FolderOpen size={14} /> : <Folder size={14} />}
                      {cat}
                    </div>
                    {expandedCategory === cat ? <ChevronUp size={12} className="opacity-20" /> : <ChevronDown size={12} className="opacity-20" />}
                  </button>
                  
                  <div className={`folder-content ${expandedCategory === cat ? 'open' : ''}`}>
                    <div className="min-h-0 py-1 ml-6 border-l border-white/5 pl-4 flex flex-col gap-1.5">
                      {allEvents.filter(e => e.category === cat || cat === 'HEPSİ').slice(0, 5).map(ev => (
                        <div key={ev.id} className="text-[9px] text-zinc-500 font-bold hover:text-white transition-colors cursor-pointer py-1 truncate">
                          • {ev.title}
                        </div>
                      ))}
                      {isAdminMode && cat !== 'HEPSİ' && (
                        <div className="mt-1.5 flex gap-1.5 pr-2">
                          <input 
                            className="bg-white/5 border border-white/10 rounded-md px-2 py-1 text-[9px] text-white focus:outline-none w-full"
                            placeholder="Yeni..."
                            value={newEvTitle}
                            onChange={(e) => setNewEvTitle(e.target.value)}
                          />
                          <button onClick={() => handleAddEvent(cat)} className="p-1 bg-white/10 rounded-md text-white hover:bg-white/20"><Plus size={12}/></button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {isAdminMode && (
                <div className="mt-4 pt-4 border-t border-white/5 flex flex-col gap-2">
                  <p className="text-[8px] font-black text-zinc-800 uppercase px-1">Klasör Ekle</p>
                  <div className="flex gap-2">
                    <input 
                      className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[9px] text-white focus:outline-none w-full"
                      placeholder="KLASÖR ADI..."
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                    />
                    <button onClick={() => { if(!newCatName.trim()) return; setCustomCategories(p => [...p, newCatName.toUpperCase()]); setNewCatName(''); }} className="p-2 bg-white/10 rounded-lg text-white hover:bg-white/20"><Plus size={14}/></button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content - More balanced typography */}
        <main className="flex-1 flex flex-col gap-6 lg:gap-8">
          <div className="flex items-end justify-between px-2">
            <div>
              <h1 className="text-5xl lg:text-6xl font-black text-white uppercase tracking-tighter leading-none select-none">
                {MONTHS[currentDate.getMonth()]} 
              </h1>
              <div className="text-xl font-light text-zinc-800 tracking-[0.5em] mt-1 ml-1">{currentDate.getFullYear()}</div>
            </div>
            <div className="flex gap-1.5 p-1 bg-white/[0.01] rounded-2xl border border-white/5">
              <button onClick={() => setCurrentDate(p => new Date(p.getFullYear(), p.getMonth() - 1, 1))} className="p-3 text-zinc-800 hover:text-white transition-all active:scale-90"><ChevronLeft size={24} /></button>
              <button onClick={() => setCurrentDate(p => new Date(p.getFullYear(), p.getMonth() + 1, 1))} className="p-3 text-zinc-800 hover:text-white transition-all active:scale-90"><ChevronRight size={24} /></button>
            </div>
          </div>

          <div className="liquid-glass rounded-3xl p-6 lg:p-8">
            <div className="grid grid-cols-7 mb-6">
              {WEEKDAYS.map(day => <div key={day} className="text-center text-[9px] font-black uppercase text-zinc-800 tracking-widest">{day}</div>)}
            </div>
            <div className="calendar-grid">
              {daysInMonth.map((cell, idx) => {
                const cellDate = new Date(cell.year, cell.month, cell.day);
                const events = getEventsForDay(cell.day, cell.month, cell.year);
                const isSelected = selectedDate && isSameDay(cellDate, selectedDate);
                const isToday = isSameDay(cellDate, today);

                return (
                  <div 
                    key={`${cell.year}-${cell.month}-${cell.day}-${idx}`}
                    onClick={() => setSelectedDate(cellDate)} 
                    className={`min-h-[90px] lg:min-h-[110px] rounded-2xl lg:rounded-3xl p-4 lg:p-5 flex flex-col transition-all cursor-pointer ${cell.isCurrentMonth ? 'liquid-glass-card' : 'opacity-0 pointer-events-none'} ${isSelected ? 'selected-day' : ''} ${isToday && !isSelected ? 'ring-1 ring-white/10' : ''}`}
                  >
                    <span className={`text-xl lg:text-2xl font-black transition-colors ${isSelected || isToday ? 'text-white' : 'text-zinc-900'}`}>{cell.day}</span>
                    <div className="mt-auto flex flex-col gap-1">
                      {events.slice(0, 2).map((ev) => (
                        <div key={ev.id} className="text-[7px] lg:text-[8px] font-black truncate px-2 py-1 rounded-md bg-white/[0.02] text-zinc-600 border border-white/[0.03]">
                          {ev.title}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {selectedDate && (
            <div className="liquid-glass rounded-3xl p-6 lg:p-8 flex flex-col gap-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <h3 className="text-[9px] font-black text-zinc-800 uppercase tracking-widest">GÜNLÜK AKIŞ</h3>
                <div className="text-zinc-500 font-bold text-[10px] bg-white/[0.02] px-4 py-1.5 rounded-full border border-white/5">
                  {selectedDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                {getEventsForDay(selectedDate.getDate(), selectedDate.getMonth(), selectedDate.getFullYear()).map((ev) => (
                  <div key={ev.id} className="liquid-glass-card rounded-2xl p-5 lg:p-6 flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>
                      <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">{ev.category}</span>
                    </div>
                    <h4 className="text-base lg:text-lg font-black text-white leading-tight">{ev.title}</h4>
                  </div>
                ))}
                {getEventsForDay(selectedDate.getDate(), selectedDate.getMonth(), selectedDate.getFullYear()).length === 0 && (
                  <div className="col-span-full py-10 text-center text-zinc-900 font-black uppercase tracking-widest italic text-xs">Kayıt yok</div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
