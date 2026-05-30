import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  ALL_DAYS,
  DAY_LABELS,
  MAX_MAX_RESULTS,
  MIN_MAX_RESULTS,
  type Constraints,
  type DayOfWeek,
} from '@/types/scheduler';

interface Props {
  constraints: Constraints;
  onToggleDayOff: (day: DayOfWeek) => void;
  onSetBoolean: (key: 'preferMorning' | 'allowOnline', value: boolean) => void;
  onTogglePrograms: (program: string) => void;
  availablePrograms: { name: string; count: number }[];
  maxResults: number;
  onSetMaxResults: (value: number) => void;
}

const PROGRAM_LABELS: Record<string, string> = {
  'CT CHUẨN': 'Chương trình chuẩn',
  ELITECH: 'Chương trình Elitech (Tài năng / CLC)',
  KSCSDT: 'Kỹ sư chuyên sâu đặc thù',
  SIE: 'SIE (Trường QT)',
};

const ConstraintPanel = ({
  constraints,
  onToggleDayOff,
  onSetBoolean,
  onTogglePrograms,
  availablePrograms,
  maxResults,
  onSetMaxResults,
}: Props) => {
  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        {availablePrograms.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-1">Chương trình đào tạo</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Chỉ xếp lớp thuộc các chương trình được chọn (mặc định Chương trình chuẩn).
            </p>
            <div className="flex flex-wrap gap-3">
              {availablePrograms.map((p) => {
                const checked = constraints.programs.includes(p.name);
                return (
                  <label
                    key={p.name}
                    className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5 cursor-pointer hover:bg-muted/60"
                  >
                    <Checkbox checked={checked} onCheckedChange={() => onTogglePrograms(p.name)} />
                    <span className="text-sm">
                      {PROGRAM_LABELS[p.name] ?? p.name}{' '}
                      <span className="text-xs text-muted-foreground">({p.count})</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <h3 className="text-sm font-semibold mb-1">Ngày muốn nghỉ</h3>
          <p className="text-xs text-muted-foreground mb-3">Solver sẽ loại các phương án có lớp vào những ngày này.</p>
          <div className="flex flex-wrap gap-3">
            {ALL_DAYS.map((day) => (
              <label
                key={day}
                className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5 cursor-pointer hover:bg-muted/60"
              >
                <Checkbox
                  checked={constraints.dayOff.includes(day)}
                  onCheckedChange={() => onToggleDayOff(day)}
                />
                <span className="text-sm">{DAY_LABELS[day]}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="prefer-morning" className="text-sm font-medium">
                Ưu tiên buổi sáng
              </Label>
              <p className="text-xs text-muted-foreground">Xếp hạng phương án theo số tiết buổi sáng (tiết 1-6).</p>
            </div>
            <Switch
              id="prefer-morning"
              checked={constraints.preferMorning}
              onCheckedChange={(v) => onSetBoolean('preferMorning', v)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="allow-online" className="text-sm font-medium">
                Cho phép lớp online
              </Label>
              <p className="text-xs text-muted-foreground">Lớp không có phòng học sẽ bị coi là online.</p>
            </div>
            <Switch
              id="allow-online"
              checked={constraints.allowOnline}
              onCheckedChange={(v) => onSetBoolean('allowOnline', v)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="max-results" className="text-sm font-medium">
                Số phương án tối đa
              </Label>
              <p className="text-xs text-muted-foreground">
                Solver dừng sau khi tìm đủ số phương án này. Tối thiểu {MIN_MAX_RESULTS}, tối đa {MAX_MAX_RESULTS}.
              </p>
            </div>
            <Input
              id="max-results"
              type="number"
              min={MIN_MAX_RESULTS}
              max={MAX_MAX_RESULTS}
              value={maxResults}
              onChange={(e) => onSetMaxResults(Number(e.target.value))}
              className="w-24 text-right"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConstraintPanel;
