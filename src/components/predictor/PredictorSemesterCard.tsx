import { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Trash2, Sun, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { SemesterResult } from '@/types/gpa';
import { getClassification, getClassificationColor } from '@/utils/gpaCalculator';
import AddCourseForm from '@/components/AddCourseForm';
import PredictorCourseRow from './PredictorCourseRow';

interface PredictorSemesterCardProps {
  result: SemesterResult;
  onDeleteSemester: (id: string) => void;
  onAddCourse: (semesterId: string, course: Omit<import('@/types/gpa').Course, 'id'>) => void;
  onDeleteCourse: (semesterId: string, courseId: string) => void;
  onUpdateCourse: (semesterId: string, courseId: string, course: Partial<import('@/types/gpa').Course>) => void;
}

const PredictorSemesterCard = ({ 
  result, 
  onDeleteSemester, 
  onAddCourse, 
  onDeleteCourse,
  onUpdateCourse 
}: PredictorSemesterCardProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  const { semester, calculatedCourses, gpa, totalCredits } = result;
  
  // Calculate specific metrics for predictor
  const validCourses = calculatedCourses.filter(c => c.letterGrade !== 'F' && c.gradePoint4 > 0);
  const isValidGPA = validCourses.length > 0;
  
  const classification = isValidGPA ? getClassification(gpa) : 'Nhập điểm';
  const colorClass = isValidGPA ? getClassificationColor(classification) : 'bg-muted text-muted-foreground';

  return (
    <Card className="overflow-hidden animate-slide-up card-shadow">
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl",
            semester.type === 'summer' ? 'bg-warning/10 text-warning' : 'bg-emerald-500/10 text-emerald-500'
          )}>
            {semester.type === 'summer' ? <Sun className="h-5 w-5" /> : <BookOpen className="h-5 w-5" />}
          </div>
          <div>
            <h3 className="font-semibold text-foreground flex items-center gap-2">
                {semester.name}
            </h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{semester.type === 'summer' ? 'Học kỳ hè' : 'Học kỳ chính'}</span>
              <span>•</span>
              <span>{calculatedCourses.length} môn</span>
              <span>•</span>
              <span>{totalCredits} tín chỉ</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right flex-col gap-1 hidden sm:flex">
            <div className="flex items-center justify-end gap-2">
              <span className="text-2xl font-bold text-foreground">
                {isValidGPA ? gpa.toFixed(2) : '-.--'}
              </span>
              <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap", colorClass)}>
                {classification}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {semester.type === 'main' ? 'GPA dự kiến' : 'Điểm TB dự kiến'}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteSemester(semester.id);
              }}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-border">
          {calculatedCourses.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Mã HP</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Tên học phần</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">Tín chỉ</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider" colSpan={4}>Chọn điểm (Chữ)</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">Hệ 4</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {calculatedCourses.map((course) => (
                    <PredictorCourseRow 
                      key={course.id} 
                      course={course}
                      onDelete={() => onDeleteCourse(semester.id, course.id)}
                      onUpdate={(updates) => onUpdateCourse(semester.id, course.id, updates)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Học kỳ này trống</p>
              <p className="text-sm">Nhấn nút bên dưới để thêm dự kiến cho môn học</p>
            </div>
          )}

          <div className="p-4 border-t border-border bg-muted/20">
            {showAddForm ? (
              <AddCourseForm
                onAdd={(course) => {
                  onAddCourse(semester.id, course);
                  setShowAddForm(false);
                }}
                onCancel={() => setShowAddForm(false)}
              />
            ) : (
              <Button
                variant="outline"
                onClick={() => setShowAddForm(true)}
                className="w-full border-dashed"
              >
                <Plus className="h-4 w-4 mr-2" />
                Thêm môn vào kỳ dự đoán
              </Button>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

export default PredictorSemesterCard;