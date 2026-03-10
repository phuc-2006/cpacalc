import { useState } from 'react';
import { Trash2, AlertCircle, Pencil, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { CalculatedCourse, Course, CoefficientPair } from '@/types/gpa';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface CourseRowProps {
  course: CalculatedCourse;
  onDelete: () => void;
  onUpdate: (updates: Partial<Course>) => void;
}

const getGradeColor = (letterGrade: string): string => {
  if (['A+', 'A'].includes(letterGrade)) return 'bg-grade-excellent text-success-foreground';
  if (['B+', 'B'].includes(letterGrade)) return 'bg-grade-good text-accent-foreground';
  if (['C+', 'C'].includes(letterGrade)) return 'bg-warning/20 text-warning';
  if (['D+', 'D'].includes(letterGrade)) return 'bg-warning/10 text-warning';
  return 'bg-destructive/20 text-destructive';
};

const CourseRow = ({ course, onDelete }: CourseRowProps) => {
  const coefficientDisplay = course.coefficientPair.split('-').join(' - ');

  return (
    <tr className={cn(
      "hover:bg-muted/50 transition-colors",
      !course.isValid && "bg-destructive/5"
    )}>
      <td className="px-4 py-3 text-sm font-medium text-foreground">
        {course.code}
      </td>
      <td className="px-4 py-3 text-sm text-foreground">
        <div className="flex items-center gap-2">
          {course.name}
          {!course.isValid && (
            <Tooltip>
              <TooltipTrigger>
                <AlertCircle className="h-4 w-4 text-destructive" />
              </TooltipTrigger>
              <TooltipContent>
                <p>{course.validationError}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-center text-foreground font-medium">
        {course.credits}
      </td>
      <td className="px-4 py-3 text-sm text-center text-foreground">
        <span className={cn(
          "inline-flex items-center justify-center w-10 h-6 rounded",
          course.processScore < 3 ? "bg-destructive/20 text-destructive" : "bg-muted"
        )}>
          {course.processScore}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-center text-foreground">
        <span className={cn(
          "inline-flex items-center justify-center w-10 h-6 rounded",
          course.finalScore < 3 ? "bg-destructive/20 text-destructive" : "bg-muted"
        )}>
          {course.finalScore}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-center text-muted-foreground">
        {coefficientDisplay}
      </td>
      <td className="px-4 py-3 text-sm text-center font-semibold text-foreground">
        {course.isValid ? course.score10.toFixed(1) : '-'}
      </td>
      <td className="px-4 py-3 text-center">
        <span className={cn(
          "inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-semibold",
          getGradeColor(course.letterGrade)
        )}>
          {course.letterGrade}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-center font-bold text-foreground">
        {course.isValid ? course.gradePoint4.toFixed(1) : '-'}
      </td>
      <td className="px-4 py-3 text-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </td>
    </tr>
  );
};

export default CourseRow;
