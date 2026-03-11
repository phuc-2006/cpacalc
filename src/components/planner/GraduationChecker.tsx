import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { GraduationRequirement } from '@/types/curriculum';
import { cn } from '@/lib/utils';

interface GraduationCheckerProps {
  requirements: GraduationRequirement[];
}

const GraduationChecker = ({ requirements }: GraduationCheckerProps) => {
  const passedCount = requirements.filter((r) => r.passed).length;
  const total = requirements.length;
  const allPassed = passedCount === total;
  const progress = total > 0 ? (passedCount / total) * 100 : 0;

  return (
    <div className="rounded-2xl bg-card p-6 card-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Kiểm tra tốt nghiệp</h3>
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold',
            allPassed
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
          )}
        >
          {allPassed ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5" />
              Đủ điều kiện
            </>
          ) : (
            <>
              <AlertTriangle className="h-3.5 w-3.5" />
              {passedCount}/{total} điều kiện
            </>
          )}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-5">
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-700',
              allPassed ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-500 to-primary'
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Requirements list */}
      <div className="space-y-2.5">
        {requirements.map((req, idx) => (
          <div
            key={idx}
            className={cn(
              'flex items-center justify-between rounded-xl px-4 py-2.5 transition-colors',
              req.passed ? 'bg-emerald-500/5' : 'bg-destructive/5'
            )}
          >
            <div className="flex items-center gap-3">
              {req.passed ? (
                <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
              ) : (
                <XCircle className="h-4.5 w-4.5 text-destructive shrink-0" />
              )}
              <span className="text-sm font-medium text-foreground">{req.label}</span>
            </div>
            <span
              className={cn(
                'text-xs font-mono',
                req.passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'
              )}
            >
              {req.achieved}/{req.required}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GraduationChecker;
