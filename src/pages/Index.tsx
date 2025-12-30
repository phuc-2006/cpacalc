import { Calculator, BookOpen, TrendingUp, Award } from 'lucide-react';
import Header from '@/components/Header';
import StatsCard from '@/components/StatsCard';
import SemesterCard from '@/components/SemesterCard';
import AddSemesterDialog from '@/components/AddSemesterDialog';
import GradeTable from '@/components/GradeTable';
import { useSemesters } from '@/hooks/useSemesters';

const Index = () => {
  const {
    semesters,
    semesterResults,
    cpa,
    cpaTotalCredits,
    overallGPA,
    gpaTotalCredits,
    addSemester,
    deleteSemester,
    addCourse,
    deleteCourse,
    updateCourse,
  } = useSemesters();

  const totalCourses = semesters.reduce((sum, s) => sum + s.courses.length, 0);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-6 lg:py-10">
        {/* Hero Section */}
        <section className="mb-8 lg:mb-12">
          <div className="rounded-3xl bg-gradient-to-br from-primary/5 via-accent/5 to-transparent p-6 lg:p-10">
            <div className="max-w-2xl">
              <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-3">
                Tính điểm <span className="gradient-text">GPA & CPA</span>
              </h1>
              <p className="text-muted-foreground text-lg">
                Công cụ tính điểm trung bình tích lũy dành cho sinh viên Việt Nam. 
                Nhập điểm, tự động quy đổi và xem xếp loại học lực.
              </p>
            </div>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard
            title="GPA Tổng"
            value={overallGPA}
            subtitle={`${gpaTotalCredits} tín chỉ (kỳ chính)`}
            showClassification
            variant="primary"
          />
          <StatsCard
            title="CPA Toàn khóa"
            value={cpa}
            subtitle={`${cpaTotalCredits} tín chỉ (tất cả)`}
            showClassification
            variant="secondary"
          />
          <div className="rounded-2xl bg-card p-6 card-shadow animate-scale-in">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Học kỳ</p>
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
                <p className="text-sm text-muted-foreground">Học phần</p>
                <p className="text-2xl font-bold text-foreground">{totalCourses}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Semesters List */}
          <div className="xl:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">Danh sách học kỳ</h2>
              <AddSemesterDialog onAdd={addSemester} existingSemesters={semesters} />
            </div>

            {semesterResults.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-border p-12 text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Award className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Chưa có học kỳ nào
                </h3>
                <p className="text-muted-foreground mb-4">
                  Bắt đầu bằng cách thêm học kỳ đầu tiên của bạn
                </p>
                <AddSemesterDialog onAdd={addSemester} existingSemesters={semesters} />
              </div>
            ) : (
              <div className="space-y-4">
                {semesterResults.map((result) => (
                  <SemesterCard
                    key={result.semester.id}
                    result={result}
                    onDeleteSemester={deleteSemester}
                    onAddCourse={addCourse}
                    onDeleteCourse={deleteCourse}
                    onUpdateCourse={updateCourse}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <GradeTable />
            
            {/* Tips Card */}
            <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 p-6 card-shadow">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">Mẹo sử dụng</h3>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Học kỳ chính tính vào cả GPA và CPA</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent">•</span>
                  <span>Học kỳ hè chỉ tính vào CPA</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Dữ liệu được lưu tự động trên trình duyệt</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent">•</span>
                  <span>Điểm QT và CK phải ≥ 3 để được tính</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12">
        <div className="container py-6 text-center text-sm text-muted-foreground">
          <p>GPA Calculator - Công cụ tính điểm cho sinh viên Việt Nam</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
