import { useState } from 'react';
import { Bookmark, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ScheduleGrid from './ScheduleGrid';
import type { ScoredSchedule, SolverResult } from '@/types/scheduler';

interface Props {
  result: SolverResult | null;
  running: boolean;
  canSave: boolean;
  onSave: (schedule: ScoredSchedule, name: string) => Promise<void> | void;
}

const ResultsList = ({ result, running, canSave, onSave }: Props) => {
  const [index, setIndex] = useState(0);
  const [saveOpen, setSaveOpen] = useState(false);
  const [planName, setPlanName] = useState('');

  if (!result) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          {running ? 'Đang sinh phương án...' : 'Bấm "Sinh TKB" để xem kết quả.'}
        </CardContent>
      </Card>
    );
  }

  if (result.schedules.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 space-y-3">
          <p className="text-sm font-semibold text-destructive">Không tìm được phương án hợp lệ.</p>
          {result.diagnostics.reason && (
            <p className="text-sm text-muted-foreground">{result.diagnostics.reason}</p>
          )}
          {result.diagnostics.conflictingPairs.length > 0 && (
            <div>
              <p className="text-sm font-medium">Các cặp môn xung đột hoàn toàn:</p>
              <ul className="list-disc list-inside text-sm text-muted-foreground">
                {result.diagnostics.conflictingPairs.map((p, i) => (
                  <li key={i}>
                    {p.a} ↔ {p.b}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground mt-2">
                Gợi ý: bỏ bớt 1 trong các môn trên hoặc nới lỏng ràng buộc (ngày nghỉ, online).
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  const current = result.schedules[index];
  const total = result.schedules.length;

  const openSave = () => {
    setPlanName(`Phương án ${index + 1}`);
    setSaveOpen(true);
  };

  const confirmSave = async () => {
    await onSave(current, planName.trim() || `Phương án ${index + 1}`);
    setSaveOpen(false);
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm">
              Phương án <span className="font-semibold">{index + 1}</span> / {total}
              {result.truncated && <span className="text-xs text-muted-foreground"> (dừng sớm)</span>}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}
              disabled={index === total - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="secondary">{current.dayOffCount} ngày nghỉ</Badge>
            <Badge variant="secondary">{current.gapPenalty} tiết trống</Badge>
            <Badge variant="secondary">{(current.morningScore * 100).toFixed(0)}% sáng</Badge>
            <Button size="sm" variant="gradient" onClick={openSave} disabled={!canSave}>
              <Bookmark className="h-4 w-4 mr-1" />
              Lưu
            </Button>
          </div>
        </div>

        <ScheduleGrid sections={current.sections} />

        <div className="text-xs text-muted-foreground">
          {current.sections.length} lớp · {current.sections.reduce((sum, s) => sum + s.credits, 0)} tín chỉ
        </div>

        <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Lưu phương án TKB</DialogTitle>
              <DialogDescription>Đặt tên để dễ tìm lại sau.</DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="plan-name">Tên phương án</Label>
              <Input id="plan-name" value={planName} onChange={(e) => setPlanName(e.target.value)} maxLength={80} />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setSaveOpen(false)}>
                Hủy
              </Button>
              <Button onClick={() => void confirmSave()}>Lưu</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default ResultsList;
