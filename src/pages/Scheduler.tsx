import { CalendarRange, Sparkles, Wand2 } from 'lucide-react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ExcelUploader from '@/components/scheduler/ExcelUploader';
import CourseMultiSelect from '@/components/scheduler/CourseMultiSelect';
import ConstraintPanel from '@/components/scheduler/ConstraintPanel';
import PlannerImporter from '@/components/scheduler/PlannerImporter';
import ResultsList from '@/components/scheduler/ResultsList';
import SolverProgress from '@/components/scheduler/SolverProgress';
import SavedPlansList from '@/components/scheduler/SavedPlansList';
import { useScheduler } from '@/hooks/useScheduler';
import { useAuth } from '@/contexts/AuthContext';

const Scheduler = () => {
  const { user } = useAuth();
  const scheduler = useScheduler();

  const sourceReady = !!scheduler.parsed;
  const canRun = sourceReady && scheduler.selectedCodes.length > 0 && !scheduler.running;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-6 space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-primary/10 p-3">
              <CalendarRange className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Sinh thời khóa biểu tự động</h2>
              <p className="text-sm text-muted-foreground">
                Upload file TKB của trường, chọn các môn muốn học, đặt ràng buộc — solver sẽ tự sinh các phương án không trùng giờ.
              </p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="data">
          <TabsList>
            <TabsTrigger value="data">1. Dữ liệu</TabsTrigger>
            <TabsTrigger value="pick" disabled={!sourceReady}>
              2. Chọn môn & ràng buộc
            </TabsTrigger>
            <TabsTrigger value="result" disabled={!sourceReady}>
              3. Kết quả
            </TabsTrigger>
            <TabsTrigger value="saved">Đã lưu</TabsTrigger>
          </TabsList>

          <TabsContent value="data" className="space-y-4 pt-4">
            <ExcelUploader
              parsed={scheduler.parsed}
              onParse={scheduler.parseFile}
              onLoadSample={scheduler.loadSampleFromUrl}
              onClear={scheduler.clearCache}
            />
          </TabsContent>

          <TabsContent value="pick" className="space-y-4 pt-4">
            <PlannerImporter catalog={scheduler.courseCatalog} onImport={scheduler.setSelectedCodes} />
            <CourseMultiSelect
              catalog={scheduler.courseCatalog}
              selectedCodes={scheduler.selectedCodes}
              onToggle={scheduler.toggleCourse}
              onRemove={scheduler.removeCourse}
            />
            <ConstraintPanel
              constraints={scheduler.constraints}
              onToggleDayOff={scheduler.toggleDayOff}
              onSetBoolean={scheduler.setBooleanConstraint}
              onTogglePrograms={scheduler.togglePrograms}
              availablePrograms={scheduler.availablePrograms}
              maxResults={scheduler.maxResults}
              onSetMaxResults={scheduler.setMaxResults}
            />
            <div className="flex justify-end">
              <Button
                size="lg"
                variant="gradient"
                onClick={scheduler.runSolve}
                disabled={!canRun}
              >
                <Wand2 className="h-4 w-4 mr-2" />
                Sinh TKB
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="result" className="space-y-4 pt-4">
            <SolverProgress progress={scheduler.progress} running={scheduler.running} />
            {scheduler.error && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                {scheduler.error}
              </div>
            )}
            <ResultsList
              result={scheduler.result}
              running={scheduler.running}
              canSave={!!user}
              onSave={scheduler.savePlan}
            />
            {!user && scheduler.result && scheduler.result.schedules.length > 0 && (
              <p className="text-xs text-muted-foreground text-center">
                <Sparkles className="inline h-3 w-3 mr-1" />
                Đăng nhập để lưu phương án và đồng bộ giữa các thiết bị.
              </p>
            )}
          </TabsContent>

          <TabsContent value="saved" className="space-y-4 pt-4">
            {user ? (
              <SavedPlansList
                plans={scheduler.savedPlans}
                loading={scheduler.loadingSaved}
                onDelete={scheduler.deletePlan}
              />
            ) : (
              <div className="rounded-md border border-border p-6 text-center text-sm text-muted-foreground">
                Đăng nhập để lưu và xem lại các phương án TKB của bạn.
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Scheduler;
