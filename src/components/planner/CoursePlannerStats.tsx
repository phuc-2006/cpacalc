import { BookOpen, CheckCircle2, Target, TrendingDown } from 'lucide-react';

interface CoursePlannerStatsProps {
  totalRequired: number;
  creditsPassed: number;
  creditsRegistered: number;
  creditsRemaining: number;
}

const CoursePlannerStats = ({
  totalRequired,
  creditsPassed,
  creditsRegistered,
  creditsRemaining,
}: CoursePlannerStatsProps) => {
  const progress = totalRequired > 0 ? ((creditsPassed) / totalRequired) * 100 : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="rounded-2xl bg-card p-5 card-shadow">
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <Target className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Tổng TC yêu cầu</p>
            <p className="text-2xl font-bold text-foreground">{totalRequired}</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-card p-5 card-shadow">
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10">
            <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">TC đã đạt</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{creditsPassed}</p>
          </div>
        </div>
        <div className="mt-2">
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">{progress.toFixed(0)}% hoàn thành</p>
        </div>
      </div>

      <div className="rounded-2xl bg-card p-5 card-shadow">
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10">
            <BookOpen className="h-4.5 w-4.5 text-blue-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">TC đăng ký dự trù</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{creditsRegistered}</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-card p-5 card-shadow">
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10">
            <TrendingDown className="h-4.5 w-4.5 text-amber-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">TC còn lại dự kiến</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{creditsRemaining}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoursePlannerStats;
