import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Target, TrendingUp } from 'lucide-react';

interface GPAPredictorProps {
  currentCPA: number;
  currentTotalCredits: number;
}

type TargetClassification = 'excellent' | 'good';

interface GradeOption {
  letter: string;
  point: number;
  color: string;
}

const GRADE_OPTIONS: GradeOption[] = [
  { letter: 'A+', point: 4.0, color: 'bg-emerald-500' },
  { letter: 'A', point: 4.0, color: 'bg-emerald-400' },
  { letter: 'B+', point: 3.5, color: 'bg-blue-500' },
  { letter: 'B', point: 3.0, color: 'bg-blue-400' },
  { letter: 'C+', point: 2.5, color: 'bg-yellow-500' },
  { letter: 'C', point: 2.0, color: 'bg-yellow-400' },
];

const TARGET_GPA: Record<TargetClassification, { min: number; label: string }> = {
  excellent: { min: 3.6, label: 'Xuất sắc (≥3.6)' },
  good: { min: 3.2, label: 'Giỏi (≥3.2)' },
};

const GPAPredictor = ({ currentCPA, currentTotalCredits }: GPAPredictorProps) => {
  const [targetClassification, setTargetClassification] = useState<TargetClassification>('excellent');
  const [futureCredits, setFutureCredits] = useState<number>(15);

  const predictions = useMemo(() => {
    const targetGPA = TARGET_GPA[targetClassification].min;
    
    // If already achieved target
    if (currentCPA >= targetGPA && currentTotalCredits > 0) {
      return { achieved: true, results: [] };
    }

    // Calculate required average grade point for future credits
    // Formula: (currentCPA * currentCredits + requiredGPA * futureCredits) / (currentCredits + futureCredits) >= targetGPA
    // requiredGPA >= (targetGPA * (currentCredits + futureCredits) - currentCPA * currentCredits) / futureCredits
    
    const currentPoints = currentCPA * currentTotalCredits;
    const totalCreditsNeeded = currentTotalCredits + futureCredits;
    const totalPointsNeeded = targetGPA * totalCreditsNeeded;
    const futurePointsNeeded = totalPointsNeeded - currentPoints;
    const requiredAvgGPA = futurePointsNeeded / futureCredits;

    // Generate different grade combinations
    const results: { grades: { letter: string; credits: number; color: string }[]; avgGPA: number; possible: boolean }[] = [];

    // Single grade scenarios
    GRADE_OPTIONS.forEach(grade => {
      const avgGPA = grade.point;
      const newCPA = (currentPoints + avgGPA * futureCredits) / totalCreditsNeeded;
      results.push({
        grades: [{ letter: grade.letter, credits: futureCredits, color: grade.color }],
        avgGPA,
        possible: newCPA >= targetGPA,
      });
    });

    // Mixed grade scenarios (2 grades)
    for (let i = 0; i < GRADE_OPTIONS.length - 1; i++) {
      const highGrade = GRADE_OPTIONS[i];
      const lowGrade = GRADE_OPTIONS[i + 1];
      
      // Calculate how many credits of high grade needed
      // highGrade.point * x + lowGrade.point * (futureCredits - x) >= futurePointsNeeded
      // x * (highGrade.point - lowGrade.point) >= futurePointsNeeded - lowGrade.point * futureCredits
      const pointDiff = highGrade.point - lowGrade.point;
      if (pointDiff > 0) {
        const minHighCredits = Math.ceil(
          (futurePointsNeeded - lowGrade.point * futureCredits) / pointDiff
        );
        
        if (minHighCredits > 0 && minHighCredits < futureCredits) {
          const highCredits = Math.min(minHighCredits, futureCredits);
          const lowCredits = futureCredits - highCredits;
          const avgGPA = (highGrade.point * highCredits + lowGrade.point * lowCredits) / futureCredits;
          const newCPA = (currentPoints + avgGPA * futureCredits) / totalCreditsNeeded;
          
          results.push({
            grades: [
              { letter: highGrade.letter, credits: highCredits, color: highGrade.color },
              { letter: lowGrade.letter, credits: lowCredits, color: lowGrade.color },
            ],
            avgGPA,
            possible: newCPA >= targetGPA,
          });
        }
      }
    }

    return { achieved: false, results, requiredAvgGPA };
  }, [currentCPA, currentTotalCredits, targetClassification, futureCredits]);

  if (currentTotalCredits === 0) {
    return (
      <Card className="card-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-5 w-5 text-primary" />
            Dự đoán điểm cần đạt
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Thêm môn học để xem dự đoán điểm cần đạt.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-shadow animate-scale-in">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="h-5 w-5 text-primary" />
          Dự đoán điểm cần đạt
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current CPA display */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <span className="text-sm text-muted-foreground">CPA hiện tại</span>
          <span className="font-bold text-lg text-primary">{currentCPA.toFixed(2)}</span>
        </div>

        {/* Target selection */}
        <div className="space-y-2">
          <Label className="text-sm">Mục tiêu xếp loại</Label>
          <Select
            value={targetClassification}
            onValueChange={(value) => setTargetClassification(value as TargetClassification)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="excellent">Xuất sắc (≥3.6)</SelectItem>
              <SelectItem value="good">Giỏi (≥3.2)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Future credits input */}
        <div className="space-y-2">
          <Label className="text-sm">Số tín chỉ dự kiến học thêm</Label>
          <Input
            type="number"
            min={1}
            max={100}
            value={futureCredits}
            onChange={(e) => setFutureCredits(Math.max(1, parseInt(e.target.value) || 1))}
          />
        </div>

        {/* Results */}
        <div className="space-y-3 pt-2">
          {predictions.achieved ? (
            <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="h-5 w-5" />
                <span className="font-medium">Bạn đã đạt mục tiêu {TARGET_GPA[targetClassification].label}!</span>
              </div>
            </div>
          ) : (
            <>
              <div className="text-sm text-muted-foreground">
                Với <strong>{futureCredits} tín chỉ</strong> tiếp theo, bạn cần:
              </div>
              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                {predictions.results
                  .filter(r => r.possible)
                  .slice(0, 5)
                  .map((result, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50"
                    >
                      <div className="flex flex-wrap gap-2">
                        {result.grades.map((g, gIdx) => (
                          <Badge key={gIdx} variant="secondary" className="font-medium">
                            <span className={`w-2 h-2 rounded-full ${g.color} mr-1.5`} />
                            {g.credits} TC {g.letter}
                          </Badge>
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                        TB: {result.avgGPA.toFixed(2)}
                      </span>
                    </div>
                  ))}
                {predictions.results.filter(r => r.possible).length === 0 && (
                  <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                    <p className="text-sm text-destructive">
                      Với {futureCredits} tín chỉ, không thể đạt được mục tiêu. Hãy thử tăng số tín chỉ dự kiến.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default GPAPredictor;
