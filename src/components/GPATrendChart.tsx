import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { SemesterResult } from '@/types/gpa';

interface GPATrendChartProps {
  semesterResults: SemesterResult[];
}

const GPATrendChart = ({ semesterResults }: GPATrendChartProps) => {
  // Filter only main semesters and prepare data for chart
  const chartData = semesterResults
    .filter(result => result.semester.type === 'main' && result.totalCredits > 0)
    .map((result, index, arr) => {
      // Calculate cumulative CPA up to this semester
      let totalPoints = 0;
      let totalCredits = 0;
      for (let i = 0; i <= index; i++) {
        const r = arr[i];
        totalPoints += r.gpa * r.totalCredits;
        totalCredits += r.totalCredits;
      }
      const cumulativeCPA = totalCredits > 0 ? totalPoints / totalCredits : 0;

      return {
        name: result.semester.name,
        GPA: Number(result.gpa.toFixed(2)),
        CPA: Number(cumulativeCPA.toFixed(2)),
      };
    });

  if (chartData.length === 0) {
    return (
      <div className="rounded-2xl bg-card p-6 card-shadow">
        <h3 className="font-semibold text-foreground mb-4">Biểu đồ xu hướng</h3>
        <div className="h-[200px] flex items-center justify-center text-muted-foreground">
          Chưa có dữ liệu để hiển thị
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-card p-6 card-shadow animate-scale-in">
      <h3 className="font-semibold text-foreground mb-4">Xu hướng GPA & CPA</h3>
      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
            />
            <YAxis 
              domain={[0, 4]} 
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--foreground))'
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="GPA" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="CPA" 
              stroke="hsl(var(--accent))" 
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--accent))', strokeWidth: 2 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-center gap-6 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <span className="text-muted-foreground">GPA học kỳ</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-accent" />
          <span className="text-muted-foreground">CPA tích lũy</span>
        </div>
      </div>
    </div>
  );
};

export default GPATrendChart;
