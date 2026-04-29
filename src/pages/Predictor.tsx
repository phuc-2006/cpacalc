import { Calculator, BookOpen, Download, Info, Search, ListPlus } from 'lucide-react';
import Header from '@/components/Header';
import StatsCard from '@/components/StatsCard';
import PredictorSemesterCard from '@/components/predictor/PredictorSemesterCard';
import AddSemesterDialog from '@/components/AddSemesterDialog';
import { useSemestersCloud } from '@/hooks/useSemestersCloud';
import { usePlannerCloud } from '@/hooks/usePlannerCloud';
import { usePredictor } from '@/hooks/usePredictor';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

const Predictor = () => {
  const { semesters: cloudSemesters, loading: dataLoading } = useSemestersCloud();
  const { registrations, loading: plannerLoading } = usePlannerCloud();
  
  const {
    semesters,
    semesterResults,
    cpa,
    cpaTotalCredits,
    syncFromData,
    addPlannedSemesters,
    addSemester,
    deleteSemester,
    addCourse,
    deleteCourse,
    updateCourse,
  } = usePredictor();

  const handleSync = () => {
    if (dataLoading) return;
    syncFromData(cloudSemesters);
    toast.success('Đã tải lại dữ liệu từ Trang chủ');
  };

  const handleAddPlanned = (semesterName: string) => {
    if (plannerLoading) return;
    const targetedRegistrations = registrations.filter(r => r.semesterName === semesterName);
    addPlannedSemesters(targetedRegistrations);
    toast.success(`Đã thêm ${semesterName} từ kế hoạch`);
  };

  const totalCourses = semesters.reduce((sum, s) => sum + s.courses.length, 0);

  // Extract unique planned semesters
  const plannedSemesterNames = Array.from(new Set(registrations.map(r => r.semesterName)));
  const availablePlannedSemesters = plannedSemesterNames.filter(
    name => !semesters.some(s => s.name === name)
  );

  const renderAddPlannedDropdown = (variant: "secondary" | "outline" = "secondary") => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} className="gap-2" disabled={plannerLoading || registrations.length === 0}>
          <ListPlus className="w-4 h-4" />
          Thêm môn Kế hoạch
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Chọn học kỳ Kế hoạch</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {availablePlannedSemesters.length === 0 ? (
          <DropdownMenuItem disabled className="text-muted-foreground">
            Không còn kỳ nào mới
          </DropdownMenuItem>
        ) : (
          availablePlannedSemesters.map(name => (
            <DropdownMenuItem key={name} onClick={() => handleAddPlanned(name)} className="cursor-pointer">
              {name}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-6 lg:py-10">
        {/* Hero Section */}
        <section className="mb-8 lg:mb-12">
          <div className="rounded-3xl bg-secondary/30 border border-border p-6 lg:p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-8 -mt-8 text-primary/10">
              <Search className="w-48 h-48" />
            </div>
            <div className="max-w-2xl relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <h1 className="text-3xl lg:text-4xl font-bold text-foreground">
                  Dự đoán điểm <span className="gradient-text">CPA/GPA</span>
                </h1>
              </div>
              <p className="text-muted-foreground text-lg">
                Dễ dàng giả lập các kết quả điểm cho học kỳ tới hoặc từ danh sách các môn đã chọn ở mục Đăng ký (Course Planner). Thay đổi ở đây không ảnh hưởng đến dữ liệu thực tế của bạn.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Button onClick={handleSync} className="gap-2">
                  <Download className="w-4 h-4" />
                  Đồng bộ điểm Trang chủ
                </Button>
                {renderAddPlannedDropdown("secondary")}
                <div className="flex items-center text-sm text-muted-foreground gap-1.5 bg-background/50 px-3 py-1.5 rounded-full border border-border">
                  <Info className="w-4 h-4 text-blue-500" />
                  <span>Dữ liệu giả lập được lưu tạm trên thiết bị này.</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <StatsCard
            title="CPA Giả định"
            value={cpa}
            subtitle={`${cpaTotalCredits} tín chỉ trong giả lập`}
            showClassification
            variant="primary"
          />
          <div className="rounded-2xl bg-card p-6 card-shadow animate-scale-in">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Học kỳ giả định</p>
                <p className="text-2xl font-bold text-foreground">{semesters.length}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-card p-6 card-shadow animate-scale-in">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                <Calculator className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Môn học giả định</p>
                <p className="text-2xl font-bold text-foreground">{totalCourses}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Action Bar */}
        <section className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            Danh sách học kỳ (Simulated)
          </h2>
          <div className="flex items-center gap-2">
            <AddSemesterDialog onAdd={addSemester} existingSemesters={semesters} />
          </div>
        </section>

        {/* Semesters List */}
        <section className="space-y-6">
          {semesters.length === 0 ? (
            <div className="text-center py-12 rounded-2xl border border-dashed border-border bg-muted/20">
              <p className="text-muted-foreground mb-4">Chưa có học kỳ nào để dự đoán.</p>
              <div className="flex gap-2 justify-center">
                <Button onClick={handleSync} variant="outline" className="gap-2">
                  <Download className="w-4 h-4" />
                  Đồng bộ Trang chủ
                </Button>
                {renderAddPlannedDropdown("secondary")}
              </div>
            </div>
          ) : (
            semesterResults.map((result) => (
              <PredictorSemesterCard
                key={result.semester.id}
                result={result}
                onDeleteSemester={deleteSemester}
                onAddCourse={addCourse}
                onDeleteCourse={deleteCourse}
                onUpdateCourse={updateCourse}
              />
            ))
          )}
        </section>
      </main>
    </div>
  );
};

export default Predictor;
