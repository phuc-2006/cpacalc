import { useMemo, useState } from 'react';
import { Check, Plus, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export interface CourseCatalogEntry {
  code: string;
  name: string;
  credits: number;
  sectionCount: number;
}

interface Props {
  catalog: CourseCatalogEntry[];
  selectedCodes: string[];
  onToggle: (code: string) => void;
  onRemove: (code: string) => void;
}

const CourseMultiSelect = ({ catalog, selectedCodes, onToggle, onRemove }: Props) => {
  const [open, setOpen] = useState(false);
  const selectedSet = useMemo(() => new Set(selectedCodes), [selectedCodes]);
  const selectedEntries = useMemo(
    () => selectedCodes.map((c) => catalog.find((e) => e.code === c) ?? { code: c, name: c, credits: 0, sectionCount: 0 }),
    [selectedCodes, catalog],
  );

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold">Mã học phần muốn đăng ký</h3>
            <p className="text-xs text-muted-foreground">Có thể chọn nhiều môn — solver sẽ ghép thành tổ hợp không trùng giờ.</p>
          </div>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" disabled={catalog.length === 0}>
                <Plus className="h-4 w-4 mr-1" />
                Thêm môn
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[360px] p-0" align="end">
              <Command>
                <CommandInput placeholder="Tìm theo mã hoặc tên..." />
                <CommandList>
                  <CommandEmpty>Không có môn phù hợp.</CommandEmpty>
                  <CommandGroup>
                    {catalog.slice(0, 200).map((entry) => {
                      const checked = selectedSet.has(entry.code);
                      return (
                        <CommandItem
                          key={entry.code}
                          value={`${entry.code} ${entry.name}`}
                          onSelect={() => onToggle(entry.code)}
                        >
                          <Check className={`mr-2 h-4 w-4 ${checked ? 'opacity-100' : 'opacity-0'}`} />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium">{entry.code}</div>
                            <div className="text-xs text-muted-foreground truncate">{entry.name}</div>
                          </div>
                          <span className="text-xs text-muted-foreground ml-2">{entry.sectionCount} lớp</span>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex flex-wrap gap-2 min-h-[2.5rem]">
          {selectedEntries.length === 0 ? (
            <p className="text-xs text-muted-foreground">Chưa chọn môn nào.</p>
          ) : (
            selectedEntries.map((entry) => (
              <Badge key={entry.code} variant="secondary" className="gap-1 pl-3">
                <span className="font-mono">{entry.code}</span>
                <span className="text-muted-foreground">·</span>
                <span className="max-w-[200px] truncate">{entry.name}</span>
                {entry.credits > 0 && <span className="text-muted-foreground">({entry.credits} TC)</span>}
                <button
                  type="button"
                  onClick={() => onRemove(entry.code)}
                  className="ml-1 rounded-full p-0.5 hover:bg-background"
                  aria-label={`Bỏ ${entry.code}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CourseMultiSelect;
