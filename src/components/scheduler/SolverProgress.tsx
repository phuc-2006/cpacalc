import { Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import type { SolverProgress as SolverProgressType } from '@/types/scheduler';

interface Props {
  progress: SolverProgressType | null;
  running: boolean;
  maxNodes?: number;
}

const SolverProgress = ({ progress, running, maxNodes = 500_000 }: Props) => {
  if (!progress && !running) return null;
  const explored = progress?.explored ?? 0;
  const found = progress?.found ?? 0;
  const percent = Math.min(100, (explored / maxNodes) * 100);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-2">
          {running && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Đã duyệt {explored.toLocaleString('vi-VN')} bước
        </span>
        <span>{found.toLocaleString('vi-VN')} phương án</span>
      </div>
      <Progress value={percent} />
    </div>
  );
};

export default SolverProgress;
