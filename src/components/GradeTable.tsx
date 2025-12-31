import { Card } from '@/components/ui/card';
import { Info } from 'lucide-react';

const gradeData = [
  { range: '9.5 – 10.0', letter: 'A+', point: '4.0' },
  { range: '8.5 – 9.4', letter: 'A', point: '4.0' },
  { range: '8.0 – 8.4', letter: 'B+', point: '3.5' },
  { range: '7.0 – 7.9', letter: 'B', point: '3.0' },
  { range: '6.5 – 6.9', letter: 'C+', point: '2.5' },
  { range: '5.5 – 6.4', letter: 'C', point: '2.0' },
  { range: '5.0 – 5.4', letter: 'D+', point: '1.5' },
  { range: '4.0 – 4.9', letter: 'D', point: '1.0' },
  { range: '0.0 – 3.9', letter: 'F', point: '0' },
];

const classificationData = [
  { range: '3.60 – 4.00', classification: 'Xuất sắc', color: 'bg-grade-excellent' },
  { range: '3.20 – 3.59', classification: 'Giỏi', color: 'bg-grade-good' },
  { range: '2.50 – 3.19', classification: 'Khá', color: 'bg-grade-good' },
  { range: '2.00 – 2.49', classification: 'Trung bình', color: 'bg-grade-average' },
  { range: '< 2.00', classification: 'Yếu', color: 'bg-grade-poor' },
];

const GradeTable = () => {
  return (
    <Card className="p-6 card-shadow">
      <div className="flex items-center gap-2 mb-4">
        <Info className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">Bảng quy đổi điểm</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Thang điểm</h4>
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Thang 10</th>
                  <th className="px-3 py-2 text-center font-medium text-muted-foreground">Chữ</th>
                  <th className="px-3 py-2 text-center font-medium text-muted-foreground">Thang 4</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {gradeData.map((grade) => (
                  <tr key={grade.letter} className="hover:bg-muted/30">
                    <td className="px-3 py-2 text-foreground">{grade.range}</td>
                    <td className="px-3 py-2 text-center font-medium text-foreground">{grade.letter}</td>
                    <td className="px-3 py-2 text-center font-medium text-foreground">{grade.point}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Xếp loại học lực</h4>
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">GPA/CPA</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Xếp loại</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {classificationData.map((item) => (
                  <tr key={item.classification} className="hover:bg-muted/30">
                    <td className="px-3 py-2 text-foreground">{item.range}</td>
                    <td className="px-3 py-2">
                      <span className={`${item.color} px-2 py-1 rounded-full text-xs font-medium text-primary-foreground whitespace-nowrap`}>
                        {item.classification}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">
              <strong>Lưu ý:</strong> Điểm quá trình và điểm cuối kỳ phải ≥ 3 để tính điểm học phần.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default GradeTable;
