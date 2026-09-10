import { useMemo } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { useAppStore } from '../../store/useAppStore';

interface Props {
  startHour: number;
  endHour: number;
  onChange: (startHour: number, endHour: number) => void;
  dayStartHour?: number;
  dayEndHour?: number;
}

/** Convert decimal hour (e.g. 9.25 = 9:15) to a Dayjs object */
function decimalToDayjs(dec: number): Dayjs {
  const norm = ((dec % 24) + 24) % 24;
  const h = Math.floor(norm);
  const m = Math.round((norm - h) * 60) % 60;
  return dayjs().hour(h).minute(m).second(0);
}

/** Convert Dayjs object to decimal hour */
function dayjsToDecimal(d: Dayjs | null, fallback: number): number {
  if (!d || !d.isValid()) return fallback;
  return d.hour() + d.minute() / 60;
}

/** Formats duration nicely: e.g. "1 hr 15 min" */
function formatDuration(start: number, end: number): string {
  const diffHours = Math.max(0, end - start);
  const totalMin = Math.round(diffHours * 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} hr`;
  return `${h} hr ${m} min`;
}

export function TimeRangePicker({ startHour, endHour, onChange }: Props) {
  const themeMode = useAppStore((s) => s.preferences.theme);
  const isDark = themeMode === 'dark';

  const muiTheme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: isDark ? 'dark' : 'light',
          primary: {
            main: '#8b5cf6', // Violet brand color
          },
          background: {
            paper: isDark ? '#1e1b2e' : '#ffffff',
            default: isDark ? '#13111c' : '#f8f9fa',
          },
          text: {
            primary: isDark ? '#f4f4f5' : '#18181b',
            secondary: isDark ? '#a1a1aa' : '#71717a',
          },
        },
        shape: {
          borderRadius: 14,
        },
        components: {
          MuiTextField: {
            styleOverrides: {
              root: {
                width: '100%',
                '& .MuiOutlinedInput-root': {
                  borderRadius: '14px',
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                  '& fieldset': {
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
                  },
                  '&:hover fieldset': {
                    borderColor: '#8b5cf6',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#8b5cf6',
                    borderWidth: '2px',
                  },
                },
                '& .MuiInputLabel-root': {
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: isDark ? '#a1a1aa' : '#71717a',
                  '&.Mui-focused': {
                    color: '#8b5cf6',
                  },
                },
                '& .MuiInputBase-input': {
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  fontFamily: 'monospace',
                },
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                borderRadius: '16px',
                border: isDark ? '1px solid rgba(139, 92, 246, 0.25)' : '1px solid rgba(0, 0, 0, 0.08)',
                boxShadow: isDark
                  ? '0 20px 40px -10px rgba(0, 0, 0, 0.7), 0 0 20px rgba(139, 92, 246, 0.15)'
                  : '0 20px 30px -10px rgba(0, 0, 0, 0.15)',
              },
            },
          },
        },
      }),
    [isDark]
  );

  const startValue = useMemo(() => decimalToDayjs(startHour), [startHour]);
  const endValue = useMemo(() => decimalToDayjs(endHour), [endHour]);

  const handleStartChange = (newValue: Dayjs | null) => {
    if (!newValue || !newValue.isValid()) return;
    const newStartDec = dayjsToDecimal(newValue, startHour);
    const duration = Math.max(0.25, endHour - startHour);
    const newEndDec = newStartDec + duration;
    onChange(newStartDec, newEndDec);
  };

  const handleEndChange = (newValue: Dayjs | null) => {
    if (!newValue || !newValue.isValid()) return;
    let newEndDec = dayjsToDecimal(newValue, endHour);
    if (newEndDec <= startHour) {
      newEndDec += 24;
    }
    if (newEndDec - startHour < 5 / 60) {
      newEndDec = startHour + 15 / 60;
    }
    onChange(startHour, newEndDec);
  };

  const presets = [
    { label: '+15m', minutes: 15 },
    { label: '+30m', minutes: 30 },
    { label: '+45m', minutes: 45 },
    { label: '+1h', minutes: 60 },
    { label: '+1.5h', minutes: 90 },
    { label: '+2h', minutes: 120 },
  ];

  return (
    <MuiThemeProvider theme={muiTheme}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <div className="space-y-3.5">
          {/* Pickers Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TimePicker
              label="Start Time"
              value={startValue}
              onChange={handleStartChange}
              slotProps={{
                textField: {
                  size: 'small',
                },
              }}
            />

            <TimePicker
              label="End Time"
              value={endValue}
              onChange={handleEndChange}
              slotProps={{
                textField: {
                  size: 'small',
                },
              }}
            />
          </div>

          {/* Duration summary bar */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-secondary-surface border border-base text-xs">
            <span className="text-muted font-medium">Scheduled Duration:</span>
            <span className="font-bold text-violet-400 bg-violet-500/10 px-2.5 py-0.5 rounded-lg font-mono">
              ⏱️ {formatDuration(startHour, endHour)}
            </span>
          </div>

          {/* Quick End Time presets */}
          <div className="pt-0.5">
            <span className="text-[10px] font-semibold text-muted uppercase tracking-wider block mb-1.5">
              Quick Duration Presets:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {presets.map(({ label, minutes }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => onChange(startHour, startHour + minutes / 60)}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-secondary-surface border border-base text-secondary hover:text-violet-400 hover:border-violet-500/40 transition-all"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </LocalizationProvider>
    </MuiThemeProvider>
  );
}
