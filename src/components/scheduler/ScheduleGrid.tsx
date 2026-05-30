import { useMemo } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ALL_DAYS, DAY_LABELS, MAX_SLOTS_PER_DAY, type ClassSection, type DayOfWeek } from '@/types/scheduler';
import { cn } from '@/lib/utils';

interface Props {
  sections: ClassSection[];
  compact?: boolean;
}

interface Cell {
  section: ClassSection;
  startSlot: number;
  endSlot: number;
  weeks: number[];
  room: string;
}

type Grid = Record<DayOfWeek, Cell[]>;

const buildGrid = (sections: ClassSection[]): Grid => {
  const grid: Grid = { 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [] };
  for (const section of sections) {
    for (const m of section.meetings) {
      grid[m.day].push({
        section,
        startSlot: m.startSlot,
        endSlot: m.endSlot,
        weeks: m.weeks,
        room: m.room,
      });
    }
  }
  for (const day of ALL_DAYS) grid[day].sort((a, b) => a.startSlot - b.startSlot);
  return grid;
};

const courseColor = (code: string): string => {
  let hash = 0;
  for (let i = 0; i < code.length; i++) hash = (hash * 31 + code.charCodeAt(i)) >>> 0;
  const palette = [
    'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/40',
    'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40',
    'bg-amber-500/15 text-amber-800 dark:text-amber-200 border-amber-500/40',
    'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/40',
    'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/40',
    'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/40',
    'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/40',
    'bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/40',
  ];
  return palette[hash % palette.length];
};

const summarizeWeeks = (weeks: number[]): string => {
  if (weeks.length === 0) return '—';
  const sorted = [...weeks].sort((a, b) => a - b);
  const ranges: string[] = [];
  let start = sorted[0];
  let prev = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
    const w = sorted[i];
    if (w === prev + 1) {
      prev = w;
      continue;
    }
    ranges.push(start === prev ? String(start) : `${start}-${prev}`);
    start = w;
    prev = w;
  }
  ranges.push(start === prev ? String(start) : `${start}-${prev}`);
  return ranges.join(',');
};

const ScheduleGrid = ({ sections, compact = false }: Props) => {
  const grid = useMemo(() => buildGrid(sections), [sections]);
  const slots = Array.from({ length: MAX_SLOTS_PER_DAY }, (_, i) => i + 1);

  return (
    <TooltipProvider delayDuration={150}>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-muted/40">
              <th className={cn('border-b border-border p-1.5 text-center font-medium', compact ? 'w-8' : 'w-10')}>Tiết</th>
              {ALL_DAYS.map((day) => (
                <th key={day} className="border-b border-l border-border p-1.5 text-center font-medium">
                  {DAY_LABELS[day]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slots.map((slot) => (
              <tr key={slot} className="even:bg-muted/20">
                <td className={cn('border-r border-border p-1 text-center text-muted-foreground', compact && 'p-0.5')}>
                  {slot}
                </td>
                {ALL_DAYS.map((day) => {
                  const cell = grid[day].find((c) => c.startSlot === slot);
                  if (cell) {
                    const span = cell.endSlot - cell.startSlot + 1;
                    return (
                      <td
                        key={day}
                        rowSpan={span}
                        className={cn('border border-border align-top', compact ? 'p-0.5' : 'p-1.5')}
                      >
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(
                                'h-full rounded-md border px-2 py-1 cursor-default',
                                courseColor(cell.section.courseCode),
                                compact && 'px-1 py-0.5',
                              )}
                            >
                              <div className={cn('font-semibold leading-tight', compact ? 'text-[10px]' : 'text-xs')}>
                                {cell.section.courseCode}
                              </div>
                              {!compact && <div className="truncate text-[11px]">{cell.section.courseName}</div>}
                              <div className={cn('text-[10px] opacity-80', compact && 'truncate')}>
                                {cell.room || 'online'} · #{cell.section.classId}
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-xs">
                            <div className="font-semibold">{cell.section.courseName}</div>
                            <div className="text-xs">Lớp {cell.section.classId} · {cell.section.classType}</div>
                            <div className="text-xs">Tiết {cell.startSlot}-{cell.endSlot} · {cell.room || 'online'}</div>
                            <div className="text-xs">Tuần: {summarizeWeeks(cell.weeks)}</div>
                          </TooltipContent>
                        </Tooltip>
                      </td>
                    );
                  }
                  const occupiedBy = grid[day].find((c) => c.startSlot < slot && c.endSlot >= slot);
                  if (occupiedBy) return null;
                  return <td key={day} className="border border-border" />;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </TooltipProvider>
  );
};

export default ScheduleGrid;
