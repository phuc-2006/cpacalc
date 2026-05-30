import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import ScheduleGrid from './ScheduleGrid';
import type { SavedPlan } from '@/hooks/useScheduler';

interface Props {
  plans: SavedPlan[];
  loading: boolean;
  onDelete: (id: string) => Promise<void> | void;
}

const SavedPlansList = ({ plans, loading, onDelete }: Props) => {
  const [busy, setBusy] = useState<string | null>(null);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-sm text-muted-foreground">Đang tải...</CardContent>
      </Card>
    );
  }

  if (plans.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-sm text-muted-foreground">
          Bạn chưa lưu phương án nào.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <Accordion type="multiple" className="space-y-2">
          {plans.map((plan) => (
            <AccordionItem key={plan.id} value={plan.id} className="border rounded-md">
              <AccordionTrigger className="px-3">
                <div className="flex-1 text-left">
                  <div className="font-semibold">{plan.name}</div>
                  <div className="text-xs text-muted-foreground">
                    Kỳ {plan.semester || '—'} · {plan.sections.length} lớp ·{' '}
                    {new Date(plan.createdAt).toLocaleString('vi-VN')}
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-3 space-y-3">
                <ScheduleGrid sections={plan.sections} compact />
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={busy === plan.id}
                    onClick={async () => {
                      setBusy(plan.id);
                      try {
                        await onDelete(plan.id);
                      } finally {
                        setBusy(null);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Xóa
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default SavedPlansList;
