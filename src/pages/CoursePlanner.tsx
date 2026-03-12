import { useState, useMemo, useRef } from 'react';
import {
  ChevronDown,
  ChevronRight,
  GraduationCap,
  ArrowLeft,
  Upload,
  Download,
  FileText,
  Loader2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import CoursePlannerStats from '@/components/planner/CoursePlannerStats';
import CurriculumTable from '@/components/planner/CurriculumTable';
import ModuleSelector from '@/components/planner/ModuleSelector';
import GraduationChecker from '@/components/planner/GraduationChecker';
import ZeroCreditSection from '@/components/planner/ZeroCreditSection';
import RegistrationSection from '@/components/planner/RegistrationSection';
import {
  categories as defaultCategories,
  modules,
  TOTAL_REQUIRED_CREDITS,
} from '@/data/curriculumData';
import { GraduationRequirement, CurriculumCategory, CurriculumCourse } from '@/types/curriculum';
import { useSemestersCloud } from '@/hooks/useSemestersCloud';
import { usePlannerCloud } from '@/hooks/usePlannerCloud';
import { calculateCourseScore } from '@/utils/gpaCalculator';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const CoursePlanner = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { semesters } = useSemestersCloud();
  const {
    plannerState,
    registrations,
    manualPassedCodes,
    loading,
    updateSelectedModule,
    setCurriculumImported,
    addRegistration,
    deleteRegistration,
    deleteRegistrationsBySemester,
    toggleManualPassed,
    setAllManualPassed,
    clearAllManualPassed,
  } = usePlannerCloud();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedModule, setExpandedModule] = useState(true);

  // Use default categories as curriculum data (shown after import)
  const categories = defaultCategories;

  // ── Build passed/failed codes from semester data (FIX: check grade) ──
  const { passedCodes, failedCodes } = useMemo(() => {
    const passed = new Set<string>();
    const failed = new Set<string>();
    for (const sem of semesters) {
      for (const course of sem.courses) {
        const calculated = calculateCourseScore(course);
        if (calculated.gradePoint4 > 0 && calculated.letterGrade !== 'F') {
          passed.add(course.code);
        } else {
          failed.add(course.code);
        }
      }
    }
    return { passedCodes: passed, failedCodes: failed };
  }, [semesters]);

  // Combine with manual passed (zero-credit courses)
  const allPassedCodes = useMemo(() => {
    const combined = new Set(passedCodes);
    manualPassedCodes.forEach((code) => combined.add(code));
    return combined;
  }, [passedCodes, manualPassedCodes]);

  const registeredCodes = useMemo(
    () => new Set(registrations.map((r) => r.courseCode)),
    [registrations]
  );

  const selectedModule = useMemo(
    () => modules.find((m) => m.id === plannerState.selectedModule) || null,
    [plannerState.selectedModule]
  );

  // ── Available courses for registration (not passed, not failed or want to retake) ──
  const availableCourses = useMemo((): CurriculumCourse[] => {
    const allCourses: CurriculumCourse[] = [];
    for (const cat of categories) {
      if (!cat.isZeroCredit) {
        for (const c of cat.courses) {
          if (!allPassedCodes.has(c.code)) {
            allCourses.push(c);
          }
        }
      }
    }
    if (selectedModule) {
      for (const c of selectedModule.courses) {
        if (!allPassedCodes.has(c.code) && !allCourses.some((a) => a.code === c.code)) {
          allCourses.push(c);
        }
      }
    }
    return allCourses;
  }, [categories, selectedModule, allPassedCodes]);

  // ── Stats ──
  const stats = useMemo(() => {
    let creditsPassed = 0;
    let creditsRegistered = 0;

    for (const cat of categories) {
      if (cat.isZeroCredit) continue;
      for (const course of cat.courses) {
        if (allPassedCodes.has(course.code)) {
          creditsPassed += course.credits;
        } else if (registeredCodes.has(course.code)) {
          creditsRegistered += course.credits;
        }
      }
    }

    if (selectedModule) {
      for (const course of selectedModule.courses) {
        // Avoid double counting courses that are in both category and module
        const alreadyCounted = categories.some(
          (cat) => !cat.isZeroCredit && cat.courses.some((c) => c.code === course.code)
        );
        if (alreadyCounted) continue;
        if (allPassedCodes.has(course.code)) {
          creditsPassed += course.credits;
        } else if (registeredCodes.has(course.code)) {
          creditsRegistered += course.credits;
        }
      }
    }

    const totalRequired = selectedModule
      ? TOTAL_REQUIRED_CREDITS - 15 + selectedModule.requiredCredits
      : TOTAL_REQUIRED_CREDITS;

    const creditsRemaining = Math.max(0, totalRequired - creditsPassed - creditsRegistered);
    return { totalRequired, creditsPassed, creditsRegistered, creditsRemaining };
  }, [categories, allPassedCodes, registeredCodes, selectedModule]);

  // ── Graduation requirements ──
  const graduationRequirements = useMemo((): GraduationRequirement[] => {
    const countCredits = (categoryId: string) => {
      const cat = categories.find((c) => c.id === categoryId);
      if (!cat) return 0;
      return cat.courses
        .filter((c) => allPassedCodes.has(c.code) || registeredCodes.has(c.code))
        .reduce((sum, c) => sum + c.credits, 0);
    };

    const countCourses = (categoryId: string) => {
      const cat = categories.find((c) => c.id === categoryId);
      if (!cat) return 0;
      return cat.courses.filter(
        (c) => allPassedCodes.has(c.code) || registeredCodes.has(c.code)
      ).length;
    };

    const llct = countCredits('LLCT');
    const tkhcb = countCredits('TKHCB');
    const cscln = countCredits('CSCLN');
    const ktbt = countCredits('KTBT');
    const tt = countCredits('TT');
    const da = countCredits('DAKLTN');
    const pe = countCourses('GDTC');
    const gdqp = countCourses('GDQPAN');
    const eng = countCourses('NN');

    let modCredits = 0;
    let modReq = 15;
    if (selectedModule) {
      modReq = selectedModule.requiredCredits;
      modCredits = selectedModule.courses
        .filter((c) => allPassedCodes.has(c.code) || registeredCodes.has(c.code))
        .reduce((sum, c) => sum + c.credits, 0);
    }

    return [
      { label: 'Lý luận chính trị + Pháp luật', required: 13, achieved: llct, passed: llct >= 13 },
      { label: 'Toán và Khoa học cơ bản', required: 32, achieved: tkhcb, passed: tkhcb >= 32 },
      { label: 'Cơ sở và cốt lõi ngành', required: 49, achieved: cscln, passed: cscln >= 49 },
      { label: 'Kiến thức bổ trợ', required: 9, achieved: ktbt, passed: ktbt >= 9 },
      { label: 'Module chuyên ngành', required: modReq, achieved: modCredits, passed: selectedModule !== null && modCredits >= modReq },
      { label: 'Thực tập kỹ thuật', required: 2, achieved: tt, passed: tt >= 2 },
      { label: 'Đồ án tốt nghiệp', required: 6, achieved: da, passed: da >= 6 },
      { label: 'Giáo dục thể chất (5 môn)', required: '5 môn', achieved: `${pe} môn`, passed: pe >= 5 },
      { label: 'Giáo dục QP-AN', required: '4 HP', achieved: `${gdqp} HP`, passed: gdqp >= 4 },
      { label: 'Ngoại ngữ', required: '5 cấp', achieved: `${eng} cấp`, passed: eng >= 5 },
    ];
  }, [categories, allPassedCodes, registeredCodes, selectedModule]);

  // ── Handlers ──
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        JSON.parse(reader.result as string);
        setCurriculumImported(true);
        toast({ title: 'Thành công', description: 'Đã import danh sách môn học' });
      } catch {
        toast({ title: 'Lỗi', description: 'File JSON không hợp lệ', variant: 'destructive' });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExport = () => {
    const data = {
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        requiredCredits: c.requiredCredits,
        isZeroCredit: c.isZeroCredit || false,
        courses: c.courses,
      })),
      modules: modules.map((m) => ({
        id: m.id,
        name: m.name,
        requiredCredits: m.requiredCredits,
        courses: m.courses,
      })),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'curriculum_data.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
  };

  const selectModule = (moduleId: string) => {
    const newId = plannerState.selectedModule === moduleId ? null : moduleId;
    updateSelectedModule(newId);
  };

  // Separate zero-credit categories
  const zeroCreditCategories = categories.filter((c) => c.isZeroCredit);
  const creditCategories = categories.filter((c) => !c.isZeroCredit);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-6 lg:py-10">
        {/* Header */}
        <section className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại trang chính
          </Link>
          <div className="rounded-3xl bg-gradient-to-br from-accent/5 via-primary/5 to-transparent p-6 lg:p-10">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="max-w-2xl">
                <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-3">
                  Đăng ký môn học <span className="gradient-text">Dự trù</span>
                </h1>
                <p className="text-muted-foreground text-lg">
                  Import danh sách CTĐT, xem tiến độ, đăng ký dự trù và kiểm tra tốt nghiệp.
                </p>
                {!user && (
                  <p className="text-sm text-accent mt-3">
                    💡 Đăng nhập để lưu dữ liệu trên cloud
                  </p>
                )}
              </div>
              {/* Import/Export */}
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleImport}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                  Import
                </Button>
                {plannerState.curriculumImported && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={handleExport}
                  >
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="rounded-2xl border-2 border-dashed border-border p-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Đang tải dữ liệu...</p>
          </div>
        ) : !plannerState.curriculumImported ? (
          /* Empty state - need import */
          <div className="rounded-2xl border-2 border-dashed border-border p-12 text-center">
            <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Chưa có danh sách môn học
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Import file JSON chương trình đào tạo để bắt đầu. File JSON chứa
              danh sách các category và các module chuyên ngành.
            </p>
            <Button
              className="gap-2"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              Import danh sách CTĐT
            </Button>
          </div>
        ) : (
          <>
            {/* Stats */}
            <section className="mb-8">
              <CoursePlannerStats
                totalRequired={stats.totalRequired}
                creditsPassed={stats.creditsPassed}
                creditsRegistered={stats.creditsRegistered}
                creditsRemaining={stats.creditsRemaining}
              />
            </section>

            {/* Main content */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 space-y-6">
                {/* ── Registration Section ── */}
                <RegistrationSection
                  registrations={registrations}
                  allCategories={categories}
                  passedCodes={allPassedCodes}
                  failedCodes={failedCodes}
                  onAddRegistration={addRegistration}
                  onDeleteRegistration={deleteRegistration}
                  onDeleteSemester={deleteRegistrationsBySemester}
                />

                {/* ── Module selection ── */}
                <div className="rounded-2xl bg-card p-6 card-shadow">
                  <button
                    onClick={() => setExpandedModule(!expandedModule)}
                    className="flex items-center gap-2 w-full text-left"
                  >
                    {expandedModule ? (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    )}
                    <GraduationCap className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold text-foreground">
                      Chọn Module chuyên ngành
                    </h2>
                    {selectedModule && (
                      <span className="ml-2 text-sm text-primary font-medium">
                        — {selectedModule.name}
                      </span>
                    )}
                  </button>
                  {expandedModule && (
                    <div className="mt-4">
                      <ModuleSelector
                        modules={modules}
                        selectedModuleId={plannerState.selectedModule}
                        onSelect={selectModule}
                      />
                    </div>
                  )}
                </div>

                {/* Module courses */}
                {selectedModule && (
                  <div className="rounded-2xl bg-card overflow-hidden card-shadow">
                    <div className="p-4 border-b border-border bg-primary/5">
                      <h3 className="font-semibold text-foreground">
                        {selectedModule.name}
                        <span className="text-sm font-normal text-muted-foreground ml-2">
                          ({selectedModule.requiredCredits} TC • {selectedModule.courses.length} môn)
                        </span>
                      </h3>
                    </div>
                    <CurriculumTable
                      courses={selectedModule.courses}
                      passedCodes={allPassedCodes}
                      failedCodes={failedCodes}
                    />
                  </div>
                )}

                {/* ── Zero-credit sections (PE / English / Military) ── */}
                {zeroCreditCategories.map((cat) => {
                  const isExpanded = expandedCategories.has(cat.id);
                  const passedCount = cat.courses.filter(
                    (c) => manualPassedCodes.has(c.code)
                  ).length;

                  return (
                    <div
                      key={cat.id}
                      className="rounded-2xl bg-card overflow-hidden card-shadow"
                    >
                      <button
                        onClick={() => toggleCategory(cat.id)}
                        className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {isExpanded ? (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          )}
                          <div className="text-left">
                            <h3 className="font-semibold text-foreground text-sm">
                              {cat.name}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              {passedCount}/{cat.courses.length} hoàn thành • Tick thủ công
                            </p>
                          </div>
                        </div>
                        <span
                          className={cn(
                            'text-xs font-mono',
                            passedCount >= (cat.id === 'GDTC' ? 5 : cat.courses.length)
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-muted-foreground'
                          )}
                        >
                          {passedCount}/{cat.id === 'GDTC' ? '5 môn' : `${cat.courses.length} HP`}
                        </span>
                      </button>
                      {isExpanded && (
                        <div className="border-t border-border">
                          <ZeroCreditSection
                            category={cat}
                            manualPassedCodes={manualPassedCodes}
                            onToggle={toggleManualPassed}
                            onMarkAll={setAllManualPassed}
                            onClearAll={clearAllManualPassed}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* ── Credit categories (readonly view) ── */}
                <h2 className="text-lg font-semibold text-foreground mt-4">
                  Danh sách môn học CTĐT
                </h2>
                {creditCategories.map((category) => {
                  const isExpanded = expandedCategories.has(category.id);
                  const passedCount = category.courses.filter((c) =>
                    allPassedCodes.has(c.code)
                  ).length;
                  const failedCount = category.courses.filter((c) =>
                    failedCodes.has(c.code) && !allPassedCodes.has(c.code)
                  ).length;

                  return (
                    <div
                      key={category.id}
                      className="rounded-2xl bg-card overflow-hidden card-shadow"
                    >
                      <button
                        onClick={() => toggleCategory(category.id)}
                        className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {isExpanded ? (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          )}
                          <div className="text-left">
                            <h3 className="font-semibold text-foreground text-sm">
                              {category.name}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              {category.requiredCredits} TC
                              {passedCount > 0 && (
                                <span className="text-emerald-600 dark:text-emerald-400 ml-1">
                                  • {passedCount} đạt
                                </span>
                              )}
                              {failedCount > 0 && (
                                <span className="text-red-600 dark:text-red-400 ml-1">
                                  • {failedCount} trượt
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <span
                          className={cn(
                            'text-xs font-mono',
                            category.courses
                              .filter((c) => allPassedCodes.has(c.code))
                              .reduce((s, c) => s + c.credits, 0) >= category.requiredCredits
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-muted-foreground'
                          )}
                        >
                          {category.courses
                            .filter((c) => allPassedCodes.has(c.code))
                            .reduce((s, c) => s + c.credits, 0)}
                          /{category.requiredCredits} TC
                        </span>
                      </button>
                      {isExpanded && (
                        <div className="border-t border-border">
                          <CurriculumTable
                            courses={category.courses}
                            passedCodes={allPassedCodes}
                            failedCodes={failedCodes}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <GraduationChecker requirements={graduationRequirements} />

                <div className="rounded-2xl bg-gradient-to-br from-accent/10 to-primary/10 p-6 card-shadow">
                  <h3 className="font-semibold text-foreground mb-3">Hướng dẫn</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500">●</span>
                      <span><strong>Xanh lá</strong> = đã đạt (từ điểm hoặc tick thủ công)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500">●</span>
                      <span><strong>Đỏ</strong> = trượt (điểm F)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500">●</span>
                      <span><strong>Đăng ký dự trù</strong>: tạo kỳ → thêm môn</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">●</span>
                      <span>Thể dục/TA/GDQP: tick thủ công từng môn</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent">●</span>
                      <span>Import JSON để xem danh sách CTĐT</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      <footer className="border-t border-border mt-12">
        <div className="container py-6 text-center text-sm text-muted-foreground">
          <p>GPA Calculator - Công cụ tính điểm cho sinh viên Việt Nam</p>
        </div>
      </footer>
    </div>
  );
};

export default CoursePlanner;
