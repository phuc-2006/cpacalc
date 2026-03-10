import { useRef } from 'react';
import { Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Semester } from '@/types/gpa';
import { useToast } from '@/hooks/use-toast';

interface ImportExportButtonsProps {
  semesters: Semester[];
  onImport: (semesters: Semester[]) => void;
}

const ImportExportButtons = ({ semesters, onImport }: ImportExportButtonsProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    if (semesters.length === 0) {
      toast({ title: 'Không có dữ liệu', description: 'Chưa có học kỳ nào để xuất', variant: 'destructive' });
      return;
    }

    const exportData = semesters.map(s => ({
      name: s.name,
      type: s.type,
      courses: s.courses.map(c => ({
        code: c.code,
        name: c.name,
        credits: c.credits,
        processScore: c.processScore,
        finalScore: c.finalScore,
        coefficientPair: c.coefficientPair,
      })),
    }));

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gpa-data-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({ title: 'Xuất thành công', description: `Đã xuất ${semesters.length} học kỳ` });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (!Array.isArray(data)) throw new Error('Invalid format');

        // Validate structure
        for (const sem of data) {
          if (!sem.name || !sem.type || !Array.isArray(sem.courses)) {
            throw new Error('Invalid semester format');
          }
          for (const c of sem.courses) {
            if (!c.code || !c.name || c.credits == null || c.processScore == null || c.finalScore == null || !c.coefficientPair) {
              throw new Error('Invalid course format');
            }
          }
        }

        onImport(data);
        toast({ title: 'Import thành công', description: `Đã import ${data.length} học kỳ` });
      } catch {
        toast({ title: 'Lỗi import', description: 'File không đúng định dạng', variant: 'destructive' });
      }
    };
    reader.readAsText(file);

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImport}
        className="hidden"
      />
      <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
        <Upload className="h-4 w-4 mr-1" />
        Import
      </Button>
      <Button variant="outline" size="sm" onClick={handleExport}>
        <Download className="h-4 w-4 mr-1" />
        Export
      </Button>
    </div>
  );
};

export default ImportExportButtons;
