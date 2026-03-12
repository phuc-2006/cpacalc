import { CheckCircle2, Circle, CheckCheck, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CurriculumCategory } from '@/types/curriculum';
import { cn } from '@/lib/utils';

interface ZeroCreditSectionProps {
  category: CurriculumCategory;
  manualPassedCodes: Set<string>;
  onToggle: (code: string) => void;
  onMarkAll: (codes: string[]) => void;
  onClearAll: (codes: string[]) => void;
}

const ZeroCreditSection = ({
  category,
  manualPassedCodes,
  onToggle,
  onMarkAll,
  onClearAll,
}: ZeroCreditSectionProps) => {
  const allCodes = category.courses.map((c) => c.code);
  const passedCount = allCodes.filter((c) => manualPassedCodes.has(c)).length;
  const allPassed = passedCount === allCodes.length;

  return (
    <div>
      <div className="flex items-center justify-between px-4 py-3 bg-muted/20 border-b border-border">
        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{passedCount}</span>/{allCodes.length} đã hoàn thành
        </div>
        <div className="flex gap-2">
          {!allPassed ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onMarkAll(allCodes)}
              className="h-7 text-xs gap-1"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Đạt tất cả
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onClearAll(allCodes)}
              className="h-7 text-xs gap-1 text-muted-foreground"
            >
              <XCircle className="h-3.5 w-3.5" />
              Bỏ tất cả
            </Button>
          )}
        </div>
      </div>
      <div className="divide-y divide-border">
        {category.courses.map((course) => {
          const isPassed = manualPassedCodes.has(course.code);
          return (
            <button
              key={course.code}
              onClick={() => onToggle(course.code)}
              className={cn(
                'flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors hover:bg-muted/50',
                isPassed && 'bg-emerald-500/5'
              )}
            >
              {isPassed ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
              )}
              <span className="text-sm font-mono text-muted-foreground w-16 shrink-0">
                {course.code}
              </span>
              <span className={cn('text-sm', isPassed ? 'text-emerald-700 dark:text-emerald-400' : 'text-foreground')}>
                {course.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ZeroCreditSection;
