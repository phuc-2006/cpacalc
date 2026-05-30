import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ALL_DAYS, DAY_LABELS, type Constraints, type DayOfWeek } from '@/types/scheduler';

interface Props {
  constraints: Constraints;
  onToggleDayOff: (day: DayOfWeek) => void;
  onSetBoolean: (key: 'preferMorning' | 'allowOnline', value: boolean) => void;
}

const ConstraintPanel = ({ constraints, onToggleDayOff, onSetBoolean }: Props) => {
  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        <div>
          <h3 className="text-sm font-semibold mb-2">Ngày muốn nghỉ</h3>
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
        </div>
      </CardContent>
    </Card>
  );
};

export default ConstraintPanel;
