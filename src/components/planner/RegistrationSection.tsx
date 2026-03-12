import { useState } from 'react';
import { Plus, Trash2, CalendarPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RegistrationEntry, CurriculumCourse } from '@/types/curriculum';
import { cn } from '@/lib/utils';

interface RegistrationSectionProps {
  registrations: RegistrationEntry[];
  availableCourses: CurriculumCourse[]; // courses not yet passed
  onAddRegistration: (semesterName: string, courseCode: string, courseName: string, credits: number) => void;
  onDeleteRegistration: (id: string) => void;
  onDeleteSemester: (semesterName: string) => void;
}

const RegistrationSection = ({
  registrations,
  availableCourses,
  onAddRegistration,
  onDeleteRegistration,
  onDeleteSemester,
}: RegistrationSectionProps) => {
  const [newSemesterName, setNewSemesterName] = useState('');
  const [showNewSemester, setShowNewSemester] = useState(false);
  const [addingToSemester, setAddingToSemester] = useState<string | null>(null);
  const [selectedCourseCode, setSelectedCourseCode] = useState('');

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

  // Filter out already registered courses
  const registeredCodes = new Set(registrations.map((r) => r.courseCode));
  const filteredAvailable = availableCourses.filter(
    (c) => !registeredCodes.has(c.code) && c.credits > 0
  );

  const handleAddSemester = () => {
    if (!newSemesterName.trim()) return;
    setShowNewSemester(false);
    setNewSemesterName('');
    // Just create the semester name; user adds courses to it
    setAddingToSemester(newSemesterName.trim());
  };

  const handleAddCourse = (semesterName: string) => {
    const course = filteredAvailable.find((c) => c.code === selectedCourseCode);
    if (!course) return;
    onAddRegistration(semesterName, course.code, course.name, course.credits);
    setSelectedCourseCode('');
  };

  const totalRegisteredCredits = registrations.reduce((sum, r) => sum + r.credits, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Đăng ký môn học dự trù</h2>
          <p className="text-sm text-muted-foreground">
            Tổng: <span className="font-semibold text-blue-600 dark:text-blue-400">{totalRegisteredCredits} TC</span> đăng ký
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowNewSemester(true)}
          className="gap-1.5"
        >
          <CalendarPlus className="h-4 w-4" />
          Thêm kỳ
        </Button>
      </div>

      {/* New semester form */}
      {showNewSemester && (
        <Card className="p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newSemesterName}
              onChange={(e) => setNewSemesterName(e.target.value)}
              placeholder="Tên kỳ (VD: 20252, Hè 2026...)"
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              onKeyDown={(e) => e.key === 'Enter' && handleAddSemester()}
            />
            <Button size="sm" onClick={handleAddSemester}>
              Tạo
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowNewSemester(false);
                setNewSemesterName('');
              }}
            >
              Hủy
            </Button>
          </div>
        </Card>
      )}

      {/* Semester cards */}
      {semesterNames.length === 0 && !showNewSemester && (
        <div className="rounded-2xl border-2 border-dashed border-border p-8 text-center">
          <CalendarPlus className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-muted-foreground">Chưa có kỳ đăng ký nào</p>
          <p className="text-sm text-muted-foreground/60">Nhấn "Thêm kỳ" để bắt đầu</p>
        </div>
      )}

      {semesterNames.map((semName) => {
        const courses = semesterGroups[semName];
        const semCredits = courses.reduce((sum, c) => sum + c.credits, 0);
        const isAdding = addingToSemester === semName;

        return (
          <Card key={semName} className="overflow-hidden">
            <div className="flex items-center justify-between p-4 bg-muted/30 border-b border-border">
              <div>
                <h3 className="font-semibold text-foreground">{semName}</h3>
                <p className="text-xs text-muted-foreground">
                  {courses.length} môn • {semCredits} TC
                </p>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => onDeleteSemester(semName)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Course list */}
            <div className="divide-y divide-border">
              {courses.map((reg) => (
                <div
                  key={reg.id}
                  className="flex items-center justify-between px-4 py-2.5"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-muted-foreground w-16">
                      {reg.courseCode}
                    </span>
                    <span className="text-sm text-foreground">{reg.courseName}</span>
                    <span className="text-xs text-muted-foreground">{reg.credits} TC</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => onDeleteRegistration(reg.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Add course to semester */}
            <div className="p-3 border-t border-border bg-muted/10">
              {isAdding ? (
                <div className="flex gap-2">
                  <select
                    value={selectedCourseCode}
                    onChange={(e) => setSelectedCourseCode(e.target.value)}
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="">Chọn môn học...</option>
                    {filteredAvailable.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} - {c.name} ({c.credits} TC)
                      </option>
                    ))}
                  </select>
                  <Button
                    size="sm"
                    onClick={() => handleAddCourse(semName)}
                    disabled={!selectedCourseCode}
                  >
                    Thêm
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setAddingToSemester(null)}
                  >
                    Đóng
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-dashed gap-1"
                  onClick={() => setAddingToSemester(semName)}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Thêm môn
                </Button>
              )}
            </div>
          </Card>
        );
      })}

      {/* Quick add to new semester that was just created but has no courses yet */}
      {addingToSemester && !semesterNames.includes(addingToSemester) && (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between p-4 bg-muted/30 border-b border-border">
            <div>
              <h3 className="font-semibold text-foreground">{addingToSemester}</h3>
              <p className="text-xs text-muted-foreground">Kỳ mới • 0 môn</p>
            </div>
          </div>
          <div className="p-3 border-t border-border bg-muted/10">
            <div className="flex gap-2">
              <select
                value={selectedCourseCode}
                onChange={(e) => setSelectedCourseCode(e.target.value)}
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">Chọn môn học...</option>
                {filteredAvailable.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} - {c.name} ({c.credits} TC)
                  </option>
                ))}
              </select>
              <Button
                size="sm"
                onClick={() => handleAddCourse(addingToSemester)}
                disabled={!selectedCourseCode}
              >
                Thêm
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setAddingToSemester(null)}
              >
                Đóng
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default RegistrationSection;
