import { useState } from 'react';
import { Plus, Trash2, CalendarPlus, ChevronDown, ChevronRight, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RegistrationEntry, CurriculumCourse, CurriculumCategory, Module } from '@/types/curriculum';
import { cn } from '@/lib/utils';

interface RegistrationSectionProps {
  registrations: RegistrationEntry[];
  allCategories: CurriculumCategory[];
  selectedModule: Module | null;
  passedCodes: Set<string>;
  failedCodes: Set<string>;
  onAddRegistration: (semesterName: string, courseCode: string, courseName: string, credits: number) => void;
  onDeleteRegistration: (id: string) => void;
  onDeleteSemester: (semesterName: string) => void;
}

// Reusable course row
const CourseRow = ({
  course,
  isPassed,
  isFailed,
  isRegistered,
  canAdd,
  onAdd,
}: {
  course: CurriculumCourse;
  isPassed: boolean;
  isFailed: boolean;
  isRegistered: boolean;
  canAdd: boolean;
  onAdd: () => void;
}) => (
  <div
    className={cn(
      'flex items-center justify-between px-4 py-2 pl-10 group transition-colors',
      isPassed && 'bg-emerald-500/5',
      isFailed && 'bg-red-500/5',
      isRegistered && !isPassed && 'bg-blue-500/5',
    )}
  >
    <div className="flex items-center gap-2 min-w-0 flex-1">
      <span className="text-xs font-mono text-muted-foreground w-14 shrink-0">{course.code}</span>
      <span className="text-sm text-foreground truncate">{course.name}</span>
      <span className="text-xs text-muted-foreground shrink-0">{course.credits}TC</span>
    </div>
    <div className="flex items-center gap-1.5 shrink-0 ml-2">
      {isPassed && (
        <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-3 w-3" /> Đạt
        </span>
      )}
      {isFailed && (
        <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-red-600 dark:text-red-400">
          <XCircle className="h-3 w-3" /> Trượt
        </span>
      )}
      {isRegistered && !isPassed && (
        <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400">Đã ĐK</span>
      )}
      {canAdd && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-primary hover:text-primary"
          onClick={onAdd}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  </div>
);

const RegistrationSection = ({
  registrations,
  allCategories,
  selectedModule,
  passedCodes,
  failedCodes,
  onAddRegistration,
  onDeleteRegistration,
  onDeleteSemester,
}: RegistrationSectionProps) => {
  const [selectedPreset, setSelectedPreset] = useState('');
  const [showNewSemester, setShowNewSemester] = useState(false);
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const [activeSemester, setActiveSemester] = useState<string | null>(null);
  const [expandedSemesters, setExpandedSemesters] = useState<Set<string>>(new Set());

  const toggleSemester = (name: string) => {
    setExpandedSemesters((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const toggleCat = (id: string) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Group registrations by semester
  const semesterGroups = registrations.reduce<Record<string, RegistrationEntry[]>>(
    (acc, reg) => {
      if (!acc[reg.semesterName]) acc[reg.semesterName] = [];
      acc[reg.semesterName].push(reg);
      return acc;
    },
    {}
  );
  const semesterNames = Object.keys(semesterGroups);
  const registeredCodes = new Set(registrations.map((r) => r.courseCode));
  const totalRegisteredCredits = registrations.reduce((sum, r) => sum + r.credits, 0);
  const creditCategories = allCategories.filter((c) => !c.isZeroCredit);

  // Generate preset semester options: 2024.1 -> 2030.3
  const presetSemesters: { value: string; label: string }[] = [];
  for (let year = 2024; year <= 2030; year++) {
    presetSemesters.push({ value: `${year}.1`, label: `${year}.1 — Kỳ 1` });
    presetSemesters.push({ value: `${year}.2`, label: `${year}.2 — Kỳ 2` });
    presetSemesters.push({ value: `${year}.3`, label: `${year}.3 — Kỳ hè` });
  }

  const existingSemesterSet = new Set(semesterNames);
  const availableSemesters = presetSemesters.filter((s) => !existingSemesterSet.has(s.value));

  const handleAddSemester = () => {
    if (!selectedPreset) return;
    setShowNewSemester(false);
    setActiveSemester(selectedPreset);
    setExpandedSemesters((prev) => new Set(prev).add(selectedPreset));
    setSelectedPreset('');
  };

  // Sort semester names newest-first
  const sortedSemesterNames = [...semesterNames].sort((a, b) => b.localeCompare(a));

  const addCourseToSemester = (course: CurriculumCourse) => {
    if (!activeSemester) return;
    onAddRegistration(activeSemester, course.code, course.name, course.credits);
  };

  const renderCourseList = (courses: CurriculumCourse[]) =>
    courses.map((course) => {
      const isPassed = passedCodes.has(course.code);
      const isFailed = failedCodes.has(course.code) && !isPassed;
      const isRegistered = registeredCodes.has(course.code);
      const canAdd = !!activeSemester && !isRegistered && !isPassed;

      return (
        <CourseRow
          key={course.code + course.name}
          course={course}
          isPassed={isPassed}
          isFailed={isFailed}
          isRegistered={isRegistered}
          canAdd={canAdd}
          onAdd={() => addCourseToSemester(course)}
        />
      );
    });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Đăng ký môn học dự trù</h2>
          <p className="text-sm text-muted-foreground">
            Tổng: <span className="font-semibold text-blue-600 dark:text-blue-400">{totalRegisteredCredits} TC</span> đăng ký
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowNewSemester(true)} className="gap-1.5">
          <CalendarPlus className="h-4 w-4" />
          Thêm kỳ
        </Button>
      </div>

      {showNewSemester && (
        <Card className="p-4">
          <div className="flex gap-2">
            <select
              value={selectedPreset}
              onChange={(e) => setSelectedPreset(e.target.value)}
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">Chọn kỳ học...</option>
              {availableSemesters.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <Button size="sm" onClick={handleAddSemester} disabled={!selectedPreset}>Thêm</Button>
            <Button size="sm" variant="ghost" onClick={() => { setShowNewSemester(false); setSelectedPreset(''); }}>
              Hủy
            </Button>
          </div>
        </Card>
      )}

      {/* 2-panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ── Left Panel: Course list by category ── */}
        <Card className="overflow-hidden">
          <div className="p-4 bg-muted/30 border-b border-border">
            <h3 className="font-semibold text-foreground text-sm">Danh sách môn học</h3>
            <p className="text-xs text-muted-foreground">
              {activeSemester
                ? <>Chọn môn để thêm vào <span className="font-semibold text-primary">{activeSemester}</span></>
                : 'Tạo kỳ học trước để đăng ký'
              }
            </p>
          </div>
          <div className="max-h-[600px] overflow-y-auto">
            {/* Credit categories */}
            {creditCategories.map((cat) => {
              const isExpanded = expandedCats.has(cat.id);
              return (
                <div key={cat.id} className="border-b border-border last:border-b-0">
                  <button
                    onClick={() => toggleCat(cat.id)}
                    className="flex items-center justify-between w-full px-4 py-2.5 hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2">
                      {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                      <span className="text-sm font-medium text-foreground">{cat.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{cat.requiredCredits} TC</span>
                  </button>
                  {isExpanded && (
                    <div className="divide-y divide-border/50">
                      {renderCourseList(cat.courses)}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Module courses */}
            {selectedModule && (
              <div className="border-t-2 border-primary/20">
                <button
                  onClick={() => toggleCat('__module__')}
                  className="flex items-center justify-between w-full px-4 py-2.5 hover:bg-muted/50 transition-colors text-left bg-primary/5"
                >
                  <div className="flex items-center gap-2">
                    {expandedCats.has('__module__') ? <ChevronDown className="h-4 w-4 text-primary" /> : <ChevronRight className="h-4 w-4 text-primary" />}
                    <span className="text-sm font-medium text-primary">{selectedModule.name}</span>
                  </div>
                  <span className="text-xs text-primary">{selectedModule.requiredCredits} TC</span>
                </button>
                {expandedCats.has('__module__') && (
                  <div className="divide-y divide-border/50">
                    {renderCourseList(selectedModule.courses)}
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* ── Right Panel: Semesters ── */}
        <div className="space-y-3">
          {semesterNames.length === 0 && !activeSemester && (
            <Card className="p-8 text-center">
              <CalendarPlus className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground">Chưa có kỳ đăng ký nào</p>
              <p className="text-sm text-muted-foreground/60">Nhấn "Thêm kỳ" để bắt đầu</p>
            </Card>
          )}

          {/* Empty new semester */}
          {activeSemester && !semesterNames.includes(activeSemester) && (
            <Card className="overflow-hidden border-2 border-primary/30">
              <div className="flex items-center justify-between p-3 bg-primary/5 border-b border-border">
                <h3 className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                  <ArrowRight className="h-3.5 w-3.5 text-primary" />
                  {activeSemester}
                </h3>
                <p className="text-xs text-muted-foreground">Chọn môn từ bảng bên trái</p>
              </div>
            </Card>
          )}

          {/* Semester cards — sorted newest first */}
          {sortedSemesterNames.map((semName) => {
            const courses = semesterGroups[semName];
            const semCredits = courses.reduce((sum, c) => sum + c.credits, 0);
            const isActive = activeSemester === semName;
            const isExpanded = expandedSemesters.has(semName);

            return (
              <Card key={semName} className={cn('overflow-hidden', isActive && 'border-2 border-primary/30')}>
                <div
                  className={cn(
                    'flex items-center justify-between w-full p-3 border-b border-border transition-colors',
                    isActive ? 'bg-primary/5' : 'bg-muted/30'
                  )}
                >
                  <button
                    onClick={() => toggleSemester(semName)}
                    className="flex items-center gap-1.5 text-left flex-1 min-w-0"
                  >
                    {isExpanded
                      ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                      : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    }
                    <div>
                      <h3 className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                        {isActive && <ArrowRight className="h-3.5 w-3.5 text-primary" />}
                        {semName}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {courses.length} môn • {semCredits} TC
                      </p>
                    </div>
                  </button>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant={isActive ? 'default' : 'outline'}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setActiveSemester(isActive ? null : semName)}
                    >
                      {isActive ? 'Đang chọn' : 'Chọn'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => onDeleteSemester(semName)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="divide-y divide-border">
                    {courses.map((reg) => (
                      <div key={reg.id} className="flex items-center justify-between px-3 py-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-mono text-muted-foreground w-14 shrink-0">{reg.courseCode}</span>
                          <span className="text-sm text-foreground truncate">{reg.courseName}</span>
                          <span className="text-xs text-muted-foreground shrink-0">{reg.credits}TC</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0"
                          onClick={() => onDeleteRegistration(reg.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RegistrationSection;
