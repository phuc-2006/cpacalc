import { useRef, useState } from 'react';
import { Upload, FileSpreadsheet, Loader2, Trash2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { ParsedTKB } from '@/types/scheduler';

interface Props {
  parsed: ParsedTKB | null;
  onParse: (file: File) => Promise<ParsedTKB>;
  onLoadSample: (url: string, name: string) => Promise<ParsedTKB>;
  onClear: () => Promise<void>;
}

const SAMPLE_URL = '/sample-tkb-20251.xlsx';

const ExcelUploader = ({ parsed, onParse, onLoadSample, onClear }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleFile = async (file: File) => {
    setLoading(true);
    try {
      const next = await onParse(file);
      toast({
        title: 'Đã đọc file TKB',
        description: `${next.sections.length} lớp · kỳ ${next.semester || 'không xác định'}`,
      });
    } catch (err) {
      toast({
        title: 'Lỗi đọc file',
        description: err instanceof Error ? err.message : String(err),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleSample = async () => {
    setLoading(true);
    try {
      const next = await onLoadSample(SAMPLE_URL, 'TKB20251-FULL.xlsx');
      toast({ title: 'Đã tải file mẫu', description: `${next.sections.length} lớp · kỳ ${next.semester}` });
    } catch (err) {
      toast({
        title: 'Không tải được file mẫu',
        description: err instanceof Error ? err.message : String(err),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const totalCourses = parsed ? new Set(parsed.sections.map((s) => s.courseCode)).size : 0;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col gap-4">
          {parsed ? (
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <FileSpreadsheet className="h-10 w-10 text-primary" />
                <div>
                  <p className="font-semibold">{parsed.sourceName}</p>
                  <p className="text-sm text-muted-foreground">
                    Kỳ {parsed.semester || 'không rõ'} · {totalCourses} mã môn · {parsed.sections.length} lớp
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Đã đọc lúc {new Date(parsed.parsedAt).toLocaleString('vi-VN')}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => void onClear()} disabled={loading}>
                <Trash2 className="h-4 w-4 mr-1" />
                Xóa cache
              </Button>
            </div>
          ) : (
            <div className="text-center py-8">
              <FileSpreadsheet className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Chưa có dữ liệu TKB. Upload file Excel của trường để bắt đầu.</p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFile(file);
              }}
            />
            <Button onClick={() => inputRef.current?.click()} disabled={loading} variant="gradient">
              {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
              {parsed ? 'Upload file khác' : 'Upload file Excel'}
            </Button>
            <Button onClick={() => void handleSample()} disabled={loading} variant="outline">
              <Sparkles className="h-4 w-4 mr-1" />
              Dùng file mẫu HUST 20251
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            File TKB là file Excel mà trường công bố trong thông báo đăng ký lớp (định dạng có cột Mã_lớp, Mã_HP, Thứ, BĐ, KT, Tuần, Phòng...). File chỉ được xử lý trên trình duyệt của bạn.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExcelUploader;
