import { useState } from 'react';
import { Trash2, Pencil, Check, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { CalculatedCourse, Course } from '@/types/gpa';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface PredictorCourseRowProps {
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

// Map letter grades to a dummy score10 that will produce the same grade back
const letterToScoreMap: Record<string, { processScore: number, finalScore: number }> = {
  'A+': { processScore: 10, finalScore: 10 },
  'A': { processScore: 9, finalScore: 9 },
  'B+': { processScore: 8.2, finalScore: 8.2 },
  'B': { processScore: 7.5, finalScore: 7.5 },
  'C+': { processScore: 6.8, finalScore: 6.8 },
  'C': { processScore: 6, finalScore: 6 },
  'D+': { processScore: 5.2, finalScore: 5.2 },
  'D': { processScore: 4.5, finalScore: 4.5 },
  'F': { processScore: 0, finalScore: 0 }
};

const PredictorCourseRow = ({ course, onDelete, onUpdate }: PredictorCourseRowProps) => {
  const [isEditing, setIsEditing] = useState(false);
  // Default letter is F if not calculated properly yet.
  const currentLetter = course.isValid ? course.letterGrade : 'F';
  
  const handleLetterChange = (letter: string) => {
      const scores = letterToScoreMap[letter] || { processScore: 0, finalScore: 0 };
      onUpdate({
        processScore: scores.processScore,
        finalScore: scores.finalScore
      });
  };

  if (isEditing) {
    return (
      <tr className="bg-muted/30">
        <td className="px-4 py-2 text-sm uppercase">
          {course.code}
        </td>
        <td className="px-4 py-2 text-sm">
          {course.name}
        </td>
        <td className="px-4 py-2 text-sm text-center">
          {course.credits}
        </td>
        <td className="px-4 py-2 text-center" colSpan={4}>
          <div className="flex justify-center w-full">
              <Select value={currentLetter} onValueChange={handleLetterChange}>
                <SelectTrigger className="h-8 w-24 text-sm font-semibold mx-auto">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(letterToScoreMap).map(l => <SelectItem key={l} value={l} className="font-semibold">{l}</SelectItem>)}
                </SelectContent>
              </Select>
          </div>
        </td>
        <td className="px-4 py-2 text-sm text-center font-bold text-foreground">
          {course.isValid ? course.gradePoint4.toFixed(1) : '-'}
        </td>
        <td className="px-4 py-2">
          <div className="flex gap-1 justify-center">
            <Button variant="default" size="sm" className="h-8 text-xs" onClick={() => setIsEditing(false)}>
              Hoàn tất
            </Button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className={cn(
      "hover:bg-muted/50 transition-colors",
      !course.isValid && "bg-destructive/5"
    )}>
      <td className="px-4 py-3 text-sm font-medium text-foreground uppercase">
        {course.code}
      </td>
      <td className="px-4 py-3 text-sm text-foreground">
        <div className="flex items-center gap-2">
          {course.name}
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-center text-foreground font-medium">
        {course.credits}
      </td>
      <td className="px-4 py-3 text-center" colSpan={4}>
        <div className="flex justify-center w-full">
            <span className={cn(
            "inline-flex items-center justify-center px-4 py-1 rounded-full text-sm font-semibold cursor-pointer shadow-sm hover:opacity-80 transition-opacity",
            getGradeColor(course.letterGrade)
            )}
            onClick={() => setIsEditing(true)}>
            {course.isValid ? course.letterGrade : 'Chọn điểm'}
            </span>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-center font-bold text-foreground">
        {course.isValid ? course.gradePoint4.toFixed(1) : '-'}
      </td>
      <td className="px-4 py-3 text-center">
        <div className="flex gap-1 justify-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsEditing(true)}
            className="h-8 w-8 text-muted-foreground hover:text-primary"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </td>
    </tr>
  );
};

export default PredictorCourseRow;