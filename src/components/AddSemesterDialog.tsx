import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Semester, SemesterType } from '@/types/gpa';
import { generateId } from '@/utils/gpaCalculator';

interface AddSemesterDialogProps {
  onAdd: (semester: Semester) => void;
  existingSemesters: Semester[];
}

const AddSemesterDialog = ({ onAdd, existingSemesters }: AddSemesterDialogProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<SemesterType>('main');

  // Suggest next semester name
  const suggestName = (): string => {
    const mainSemesters = existingSemesters.filter(s => s.type === 'main');
    const summerSemesters = existingSemesters.filter(s => s.type === 'summer');
    
    if (type === 'main') {
      const count = mainSemesters.length + 1;
      const year = Math.ceil(count / 2);
      const term = count % 2 === 1 ? 1 : 2;
      return `Học kỳ ${term} - Năm ${year}`;
    } else {
      const count = summerSemesters.length + 1;
      return `Học kỳ hè ${count}`;
    }
  };

  const handleTypeChange = (newType: SemesterType) => {
    setType(newType);
    // Auto-suggest name based on type
    const mainSemesters = existingSemesters.filter(s => s.type === 'main');
    const summerSemesters = existingSemesters.filter(s => s.type === 'summer');
    
    if (newType === 'main') {
      const count = mainSemesters.length + 1;
      const year = Math.ceil(count / 2);
      const term = count % 2 === 1 ? 1 : 2;
      setName(`Học kỳ ${term} - Năm ${year}`);
    } else {
      const count = summerSemesters.length + 1;
      setName(`Học kỳ hè ${count}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const semesterName = name.trim() || suggestName();
    
    onAdd({
      id: generateId(),
      name: semesterName,
      type,
      courses: [],
    });

    setName('');
    setType('main');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="gradient" size="lg" className="gap-2">
          <Plus className="h-5 w-5" />
          Thêm học kỳ mới
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Thêm học kỳ mới</DialogTitle>
            <DialogDescription>
              Tạo học kỳ mới để bắt đầu nhập điểm các học phần.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="type">Loại học kỳ</Label>
              <Select value={type} onValueChange={(v) => handleTypeChange(v as SemesterType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn loại học kỳ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="main">
                    <div className="flex flex-col items-start">
                      <span>Học kỳ chính</span>
                      <span className="text-xs text-muted-foreground">Tính vào GPA và CPA</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="summer">
                    <div className="flex flex-col items-start">
                      <span>Học kỳ hè</span>
                      <span className="text-xs text-muted-foreground">Chỉ tính vào CPA</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">Tên học kỳ</Label>
              <Input
                id="name"
                placeholder={suggestName()}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Để trống để sử dụng tên gợi ý
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="gradient">
              Tạo học kỳ
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddSemesterDialog;
