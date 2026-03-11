import { useState, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronRight, GraduationCap, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import CoursePlannerStats from '@/components/planner/CoursePlannerStats';
import CurriculumTable from '@/components/planner/CurriculumTable';
import ModuleSelector from '@/components/planner/ModuleSelector';
import GraduationChecker from '@/components/planner/GraduationChecker';
import { categories, modules, TOTAL_REQUIRED_CREDITS } from '@/data/curriculumData';
import { GraduationRequirement, PlannerState } from '@/types/curriculum';
import { useSemestersCloud } from '@/hooks/useSemestersCloud';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'cpacalc_planner_state';

const loadPlannerState = (): PlannerState => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return { selectedModule: null, registeredCourses: [] };
};

const savePlannerState = (state: PlannerState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
};

const CoursePlanner = () => {
  const { user } = useAuth();
  const { semesters } = useSemestersCloud();

  const [plannerState, setPlannerState] = useState<PlannerState>(loadPlannerState);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(categories.map((c) => c.id))
  );
  const [expandedModule, setExpandedModule] = useState(true);

  // Save to localStorage on change
  useEffect(() => {
    savePlannerState(plannerState);
  }, [plannerState]);

  // Build set of passed course codes from semester data
  const passedCodes = useMemo(() => {
    const codes = new Set<string>();
    for (const sem of semesters) {
      for (const course of sem.courses) {
        // A course is "passed" if it has been entered in any semester
        // We consider it passed if the code exists (user entered it with grades)
        codes.add(course.code);
      }
    }
    return codes;
  }, [semesters]);

  const registeredCodes = useMemo(
    () => new Set(plannerState.registeredCourses),
    [plannerState.registeredCourses]
  );

  const selectedModule = useMemo(
    () => modules.find((m) => m.id === plannerState.selectedModule) || null,
    [plannerState.selectedModule]
  );

  // Calculate credits
  const stats = useMemo(() => {
    let creditsPassed = 0;
    let creditsRegistered = 0;

    // Count from categories (non-zero credit)
    for (const cat of categories) {
      if (cat.isZeroCredit) continue;
      for (const course of cat.courses) {
        if (passedCodes.has(course.code)) {
          creditsPassed += course.credits;
        } else if (registeredCodes.has(course.code)) {
          creditsRegistered += course.credits;
        }
      }
    }

    // Count from selected module
    if (selectedModule) {
      for (const course of selectedModule.courses) {
        if (passedCodes.has(course.code)) {
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
  }, [passedCodes, registeredCodes, selectedModule]);

  // Graduation requirements
  const graduationRequirements = useMemo((): GraduationRequirement[] => {
    const countPassedCredits = (categoryId: string) => {
      const cat = categories.find((c) => c.id === categoryId);
      if (!cat) return 0;
      return cat.courses
        .filter((c) => passedCodes.has(c.code) || registeredCodes.has(c.code))
        .reduce((sum, c) => sum + c.credits, 0);
    };

    const countPassedCourses = (categoryId: string) => {
      const cat = categories.find((c) => c.id === categoryId);
      if (!cat) return 0;
      return cat.courses.filter((c) => passedCodes.has(c.code) || registeredCodes.has(c.code)).length;
    };

    const llctCredits = countPassedCredits('LLCT');
    const tkhcbCredits = countPassedCredits('TKHCB');
    const csclnCredits = countPassedCredits('CSCLN');
    const ktbtCredits = countPassedCredits('KTBT');
    const ttCredits = countPassedCredits('TT');
    const dakltnCredits = countPassedCredits('DAKLTN');

    // PE: need 5 courses total (including Lý luận TDTT)
    const peCoursesPassed = countPassedCourses('GDTC');

    // GDQP-AN: all 4 courses
    const gdqpCoursesPassed = countPassedCourses('GDQPAN');

    // English: all 5 levels
    const englishCoursesPassed = countPassedCourses('NN');

    // Module
    let moduleCredits = 0;
    let moduleRequired = 15;
    if (selectedModule) {
      moduleRequired = selectedModule.requiredCredits;
      moduleCredits = selectedModule.courses
        .filter((c) => passedCodes.has(c.code) || registeredCodes.has(c.code))
        .reduce((sum, c) => sum + c.credits, 0);
    }

    return [
      {
        label: 'Lý luận chính trị + Pháp luật',
        required: 13,
        achieved: llctCredits,
        passed: llctCredits >= 13,
      },
      {
        label: 'Toán và Khoa học cơ bản',
        required: 32,
        achieved: tkhcbCredits,
        passed: tkhcbCredits >= 32,
      },
      {
        label: 'Cơ sở và cốt lõi ngành',
        required: 49,
        achieved: csclnCredits,
        passed: csclnCredits >= 49,
      },
      {
        label: 'Kiến thức bổ trợ',
        required: 9,
        achieved: ktbtCredits,
        passed: ktbtCredits >= 9,
      },
      {
        label: 'Module chuyên ngành',
        required: moduleRequired,
        achieved: moduleCredits,
        passed: selectedModule !== null && moduleCredits >= moduleRequired,
      },
      {
        label: 'Thực tập kỹ thuật',
        required: 2,
        achieved: ttCredits,
        passed: ttCredits >= 2,
      },
      {
        label: 'Đồ án tốt nghiệp',
        required: 6,
        achieved: dakltnCredits,
        passed: dakltnCredits >= 6,
      },
      {
        label: 'Giáo dục thể chất (5 môn)',
        required: '5 môn',
        achieved: `${peCoursesPassed} môn`,
        passed: peCoursesPassed >= 5,
      },
      {
        label: 'Giáo dục Quốc phòng - An ninh',
        required: '4 HP',
        achieved: `${gdqpCoursesPassed} HP`,
        passed: gdqpCoursesPassed >= 4,
      },
      {
        label: 'Ngoại ngữ',
        required: '5 cấp',
        achieved: `${englishCoursesPassed} cấp`,
        passed: englishCoursesPassed >= 5,
      },
    ];
  }, [passedCodes, registeredCodes, selectedModule]);

  // Handlers
  const toggleRegister = (code: string) => {
    setPlannerState((prev) => {
      const isRegistered = prev.registeredCourses.includes(code);
      return {
        ...prev,
        registeredCourses: isRegistered
          ? prev.registeredCourses.filter((c) => c !== code)
          : [...prev.registeredCourses, code],
      };
    });
  };

  const selectModule = (moduleId: string) => {
    setPlannerState((prev) => ({
      ...prev,
      selectedModule: prev.selectedModule === moduleId ? null : moduleId,
    }));
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-6 lg:py-10">
        {/* Back + Title */}
        <section className="mb-8">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
            <ArrowLeft className="h-4 w-4" />
            Quay lại trang chính
          </Link>
          <div className="rounded-3xl bg-gradient-to-br from-accent/5 via-primary/5 to-transparent p-6 lg:p-10">
            <div className="max-w-2xl">
              <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-3">
                Đăng ký môn học <span className="gradient-text">Dự trù</span>
              </h1>
              <p className="text-muted-foreground text-lg">
                Xem danh sách môn theo CTĐT, đăng ký dự trù và kiểm tra điều kiện tốt nghiệp.
              </p>
              {!user && (
                <p className="text-sm text-accent mt-3">
                  💡 Đăng nhập để đối chiếu tự động với điểm đã nhập
                </p>
              )}
            </div>
          </div>
        </section>

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
          {/* Left: Course list */}
          <div className="xl:col-span-2 space-y-4">
            {/* Module selection */}
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

            {/* Module courses (if selected) */}
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
                  passedCodes={passedCodes}
                  registeredCodes={registeredCodes}
                  onToggleRegister={toggleRegister}
                />
              </div>
            )}

            {/* Categories */}
            {categories.map((category) => {
              const isExpanded = expandedCategories.has(category.id);
              const passedCount = category.courses.filter((c) =>
                passedCodes.has(c.code)
              ).length;
              const registeredCount = category.courses.filter(
                (c) => !passedCodes.has(c.code) && registeredCodes.has(c.code)
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
                          {category.isZeroCredit
                            ? `${category.courses.length} HP`
                            : `${category.requiredCredits} TC`}
                          {' • '}
                          {passedCount > 0 && (
                            <span className="text-emerald-600 dark:text-emerald-400">
                              {passedCount} đạt
                            </span>
                          )}
                          {registeredCount > 0 && (
                            <span className="text-blue-600 dark:text-blue-400 ml-1">
                              {registeredCount} dự trù
                            </span>
                          )}
                          {passedCount === 0 && registeredCount === 0 && (
                            <span>{category.courses.length} môn</span>
                          )}
                        </p>
                      </div>
                    </div>
                    {/* Mini progress */}
                    <div className="flex items-center gap-2">
                      {!category.isZeroCredit && (
                        <span className={cn(
                          'text-xs font-mono',
                          passedCount + registeredCount >= category.courses.length
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-muted-foreground'
                        )}>
                          {category.courses
                            .filter((c) => passedCodes.has(c.code) || registeredCodes.has(c.code))
                            .reduce((s, c) => s + c.credits, 0)}
                          /{category.requiredCredits} TC
                        </span>
                      )}
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="border-t border-border">
                      <CurriculumTable
                        courses={category.courses}
                        passedCodes={passedCodes}
                        registeredCodes={registeredCodes}
                        onToggleRegister={toggleRegister}
                        isZeroCredit={category.isZeroCredit}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right sidebar: Graduation checker */}
          <div className="space-y-6">
            <GraduationChecker requirements={graduationRequirements} />

            {/* Tips */}
            <div className="rounded-2xl bg-gradient-to-br from-accent/10 to-primary/10 p-6 card-shadow">
              <h3 className="font-semibold text-foreground mb-3">Hướng dẫn</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500">●</span>
                  <span>Môn <strong>xanh lá</strong> = đã có điểm đạt trong hệ thống</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">●</span>
                  <span>Môn <strong>xanh dương</strong> = đăng ký dự trù</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">●</span>
                  <span>Chọn 1 module chuyên ngành (bắt buộc)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent">●</span>
                  <span>Thể dục: cần 5 môn (kể cả Lý luận TDTT)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">●</span>
                  <span>Bổ trợ: chọn đủ 9 tín chỉ từ danh sách</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
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
