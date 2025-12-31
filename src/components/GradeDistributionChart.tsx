import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { SemesterResult } from '@/types/gpa';

interface GradeDistributionChartProps {
  semesterResults: SemesterResult[];
}

const gradeOrder = ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F'];

const gradeColors: Record<string, string> = {
  'A+': 'hsl(142 76% 36%)',
  'A': 'hsl(142 76% 42%)',
  'B+': 'hsl(168 84% 40%)',
  'B': 'hsl(168 84% 48%)',
  'C+': 'hsl(199 89% 48%)',
  'C': 'hsl(199 89% 56%)',
  'D+': 'hsl(38 92% 50%)',
  'D': 'hsl(38 92% 58%)',
  'F': 'hsl(0 84% 60%)',
};

const GradeDistributionChart = ({ semesterResults }: GradeDistributionChartProps) => {
  // Count courses by letter grade
  const gradeCounts: Record<string, number> = {};
  gradeOrder.forEach(grade => {
    gradeCounts[grade] = 0;
  });

  semesterResults.forEach(result => {
    result.calculatedCourses.forEach(course => {
      if (course.isValid && gradeCounts.hasOwnProperty(course.letterGrade)) {
        gradeCounts[course.letterGrade]++;
      }
    });
  });

  const chartData = gradeOrder.map(grade => ({
    grade,
    count: gradeCounts[grade],
    color: gradeColors[grade],
  }));

  const totalCourses = chartData.reduce((sum, item) => sum + item.count, 0);

  if (totalCourses === 0) {
    return (
      <div className="rounded-2xl bg-card p-6 card-shadow">
        <h3 className="font-semibold text-foreground mb-4">Phân bố điểm</h3>
        <div className="h-[200px] flex items-center justify-center text-muted-foreground">
          Chưa có dữ liệu để hiển thị
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-card p-6 card-shadow animate-scale-in">
      <h3 className="font-semibold text-foreground mb-4">Phân bố điểm ({totalCourses} môn)</h3>
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis 
              dataKey="grade" 
              tick={{ fontSize: 11 }}
              className="text-muted-foreground"
            />
            <YAxis 
              tick={{ fontSize: 11 }}
              className="text-muted-foreground"
              allowDecimals={false}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--foreground))'
              }}
              formatter={(value: number) => [`${value} môn`, 'Số lượng']}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-2 mt-4 justify-center">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: gradeColors['A+'] }} />
          <span className="text-xs text-muted-foreground">Xuất sắc</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: gradeColors['B+'] }} />
          <span className="text-xs text-muted-foreground">Giỏi</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: gradeColors['C+'] }} />
          <span className="text-xs text-muted-foreground">Khá</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: gradeColors['D+'] }} />
          <span className="text-xs text-muted-foreground">TB</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: gradeColors['F'] }} />
          <span className="text-xs text-muted-foreground">Yếu</span>
        </div>
      </div>
    </div>
  );
};

export default GradeDistributionChart;
