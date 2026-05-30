import { useMemo } from 'react';
import { ClipboardList, ListPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePlannerCloud } from '@/hooks/usePlannerCloud';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { CourseCatalogEntry } from './CourseMultiSelect';

interface Props {
  catalog: CourseCatalogEntry[];
  onImport: (codes: string[]) => void;
}

interface SemesterBucket {
  name: string;
  codes: string[];
}

const PlannerImporter = ({ catalog, onImport }: Props) => {
  const { user } = useAuth();
  const { registrations, loading } = usePlannerCloud();
  const { toast } = useToast();

  const buckets = useMemo<SemesterBucket[]>(() => {
    const map = new Map<string, Set<string>>();
    for (const reg of registrations) {
      const set = map.get(reg.semesterName) ?? new Set<string>();
      set.add(reg.courseCode);
      map.set(reg.semesterName, set);
    }
    return [...map.entries()]
      .map(([name, codes]) => ({ name, codes: [...codes].sort() }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [registrations]);

  const catalogCodes = useMemo(() => new Set(catalog.map((c) => c.code)), [catalog]);

  if (!user) return null;

  const importBucket = (bucket: SemesterBucket) => {
    const matched = bucket.codes.filter((c) => catalogCodes.has(c));
    const missing = bucket.codes.filter((c) => !catalogCodes.has(c));
    onImport(matched);
    if (matched.length === 0) {
      toast({
        title: 'Không có môn nào khớp',
        description: `Không tìm thấy môn nào của ${bucket.name} trong file TKB hiện tại.`,
        variant: 'destructive',
      });
      return;
    }
    toast({
      title: `Đã chọn ${matched.length} môn từ ${bucket.name}`,
      description:
        missing.length > 0
          ? `${missing.length} môn không có trong file TKB: ${missing.slice(0, 5).join(', ')}${missing.length > 5 ? '...' : ''}`
          : undefined,
    });
  };

  const importAll = () => {
    const all = new Set<string>();
    for (const b of buckets) for (const c of b.codes) all.add(c);
    importBucket({ name: 'tất cả kỳ', codes: [...all] });
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-start gap-3">
            <div className="rounded-md bg-primary/10 p-2">
              <ClipboardList className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Lấy môn từ Kế hoạch</h3>
              <p className="text-xs text-muted-foreground">
                Tự động chọn các môn bạn đã đăng ký bên trang Kế hoạch theo từng kỳ.
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={loading || buckets.length === 0}>
                <ListPlus className="h-4 w-4 mr-1" />
                {buckets.length === 0 ? 'Kế hoạch trống' : 'Chọn kỳ'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Lấy từ kỳ</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {buckets.map((bucket) => (
                <DropdownMenuItem key={bucket.name} onSelect={() => importBucket(bucket)}>
                  <div className="flex flex-col">
                    <span className="font-medium">{bucket.name}</span>
                    <span className="text-xs text-muted-foreground">{bucket.codes.length} môn</span>
                  </div>
                </DropdownMenuItem>
              ))}
              {buckets.length > 1 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={importAll}>
                    <span className="font-medium">Tất cả kỳ (gộp)</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlannerImporter;
