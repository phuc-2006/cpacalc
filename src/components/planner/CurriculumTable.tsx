import { CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CurriculumCourse } from '@/types/curriculum';

interface CurriculumTableProps {
  courses: CurriculumCourse[];
  passedCodes: Set<string>;
  failedCodes: Set<string>;
  isZeroCredit?: boolean;
}

const CurriculumTable = ({
  courses,
  passedCodes,
  failedCodes,
  isZeroCredit,
}: CurriculumTableProps) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Mã HP
            </th>
            <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Tên học phần
            </th>
            {!isZeroCredit && (
              <th className="px-4 py-2.5 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                TC
              </th>
            )}
            <th className="px-4 py-2.5 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Kỳ
            </th>
            <th className="px-4 py-2.5 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Trạng thái
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {courses.map((course) => {
            const isPassed = passedCodes.has(course.code);
            const isFailed = failedCodes.has(course.code);

            return (
              <tr
                key={course.code + course.name}
                className={cn(
                  'transition-colors',
                  isPassed && 'bg-emerald-500/5',
                  isFailed && 'bg-red-500/5'
                )}
              >
                <td className="px-4 py-2.5 text-sm font-mono text-muted-foreground">
                  {course.code}
                </td>
                <td className="px-4 py-2.5 text-sm font-medium text-foreground">
                  {course.name}
                </td>
                {!isZeroCredit && (
                  <td className="px-4 py-2.5 text-center text-sm text-foreground">
                    {course.credits}
                  </td>
                )}
                <td className="px-4 py-2.5 text-center text-sm text-muted-foreground">
                  {course.semester || '–'}
                </td>
                <td className="px-4 py-2.5 text-center">
                  {isPassed ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" />
                      Đã đạt
                    </span>
                  ) : isFailed ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-600 dark:text-red-400">
                      <XCircle className="h-3 w-3" />
                      Trượt
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground/50">Chưa học</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default CurriculumTable;
