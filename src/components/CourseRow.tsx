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

const CourseRow = ({ course, onDelete, onUpdate }: CourseRowProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    code: course.code,
    name: course.name,
    credits: course.credits.toString(),
    processScore: course.processScore.toString(),
    finalScore: course.finalScore.toString(),
    coefficientPair: course.coefficientPair as string,
  });

  const coefficientDisplay = course.coefficientPair.split('-').join(' - ');

  const handleSave = () => {
    onUpdate({
      code: editData.code.toUpperCase(),
      name: editData.name,
      credits: parseInt(editData.credits),
      processScore: parseFloat(editData.processScore),
      finalScore: parseFloat(editData.finalScore),
      coefficientPair: editData.coefficientPair as CoefficientPair,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({
      code: course.code,
      name: course.name,
      credits: course.credits.toString(),
      processScore: course.processScore.toString(),
      finalScore: course.finalScore.toString(),
      coefficientPair: course.coefficientPair,
    });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <tr className="bg-muted/30">
        <td className="px-4 py-2">
          <Input value={editData.code} onChange={e => setEditData(d => ({ ...d, code: e.target.value }))} className="h-8 uppercase text-sm" />
        </td>
        <td className="px-4 py-2">
          <Input value={editData.name} onChange={e => setEditData(d => ({ ...d, name: e.target.value }))} className="h-8 text-sm" />
        </td>
        <td className="px-4 py-2">
          <Select value={editData.credits} onValueChange={v => setEditData(d => ({ ...d, credits: v }))}>
            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[1,2,3,4,5,6].map(c => <SelectItem key={c} value={c.toString()}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </td>
        <td className="px-4 py-2">
          <Input type="number" value={editData.processScore} onChange={e => setEditData(d => ({ ...d, processScore: e.target.value }))} className="h-8 text-sm text-center" min="0" max="10" step="0.1" />
        </td>
        <td className="px-4 py-2">
          <Input type="number" value={editData.finalScore} onChange={e => setEditData(d => ({ ...d, finalScore: e.target.value }))} className="h-8 text-sm text-center" min="0" max="10" step="0.1" />
        </td>
        <td className="px-4 py-2">
          <Select value={editData.coefficientPair} onValueChange={v => setEditData(d => ({ ...d, coefficientPair: v }))}>
            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="3-7">3-7</SelectItem>
              <SelectItem value="4-6">4-6</SelectItem>
              <SelectItem value="5-5">5-5</SelectItem>
            </SelectContent>
          </Select>
        </td>
        <td colSpan={3} />
        <td className="px-4 py-2">
          <div className="flex gap-1 justify-center">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary" onClick={handleSave}>
              <Check className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={handleCancel}>
              <X className="h-4 w-4" />
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

export default CourseRow;
