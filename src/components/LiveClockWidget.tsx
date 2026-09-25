import React, { useState, useEffect } from 'react';
import { Calendar, Clock } from 'lucide-react';

interface LiveClockWidgetProps {
  className?: string;
  theme?: 'dark' | 'light';
  showSeconds?: boolean;
}

export const LiveClockWidget: React.FC<LiveClockWidgetProps> = ({
  className = '',
  theme = 'dark',
  showSeconds = true,
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ];
  const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  const dayName = days[currentDate.getDay()];
  const dateNum = currentDate.getDate();
  const monthName = months[currentDate.getMonth()];
  const shortMonthName = shortMonths[currentDate.getMonth()];
  const year = currentDate.getFullYear();

  const hours = String(currentDate.getHours()).padStart(2, '0');
  const minutes = String(currentDate.getMinutes()).padStart(2, '0');
  const seconds = String(currentDate.getSeconds()).padStart(2, '0');

  const formattedDayDate = `${dayName}, ${dateNum} ${monthName} ${year}`;
  const formattedDayDateShort = `${dayName}, ${dateNum} ${shortMonthName}`;
  const formattedTime = showSeconds ? `${hours}:${minutes}:${seconds}` : `${hours}:${minutes}`;

  if (theme === 'light') {
    return (
      <div
        id="live-datetime-widget"
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/95 backdrop-blur border border-[#E3D3C4] shadow-sm text-xs text-[#5A3E29] select-none ${className}`}
        title={`Waktu Sistem: ${formattedDayDate} • ${formattedTime} WIB`}
      >
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-[#7D4F27] shrink-0" />
          <span className="font-bold text-[#25180E] hidden sm:inline">{formattedDayDate}</span>
          <span className="font-bold text-[#25180E] sm:hidden">{formattedDayDateShort}</span>
        </div>
        <span className="text-[#C4AD99] font-light">•</span>
        <div className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-[#7D4F27] shrink-0 animate-pulse" />
          <span className="font-mono font-black text-[#7D4F27] tracking-wider">{formattedTime}</span>
          <span className="text-[9px] uppercase font-bold text-stone-500 bg-stone-100 px-1 py-0.2 rounded border border-stone-200">
            WIB
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      id="live-datetime-widget"
      className={`flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#1A1007]/90 border border-[#3D2817] text-[11px] sm:text-xs shadow-inner select-none ${className}`}
      title={`Waktu Sistem: ${formattedDayDate} • ${formattedTime} WIB`}
    >
      <div className="flex items-center gap-1.5 text-[#E6CEB8]">
        <Calendar className="w-3.5 h-3.5 text-[#D4A373] shrink-0" />
        <span className="font-semibold text-[#F7E6D4] whitespace-nowrap hidden sm:inline">
          {formattedDayDate}
        </span>
        <span className="font-semibold text-[#F7E6D4] whitespace-nowrap sm:hidden">
          {formattedDayDateShort}
        </span>
      </div>
      <span className="text-[#5A3E26]">•</span>
      <div className="flex items-center gap-1 text-[#F5EBE1]">
        <Clock className="w-3.5 h-3.5 text-[#E5A869] shrink-0 animate-pulse" />
        <span className="font-mono font-bold tracking-wider text-[#FFECC7]">
          {formattedTime}
        </span>
        <span className="text-[9px] uppercase font-bold text-[#A88C74] bg-[#2E1F13] px-1 py-0.2 rounded border border-[#4A3220]">
          WIB
        </span>
      </div>
    </div>
  );
};
