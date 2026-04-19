import { useState } from 'react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Bell, CheckCircle2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  useGuanxinActions,
  useCreateAction,
  useCompleteAction,
  useDeleteAction,
  useUpdateActionRemind,
} from '@/hooks/useGuanxinActions';

const REMIND_OPTIONS = [
  { value: '0', label: '不提醒' },
  { value: '1', label: '1 天後' },
  { value: '3', label: '3 天後' },
  { value: '7', label: '7 天後' },
];

export function ActionPlanPanel() {
  const { toast } = useToast();
  const { data: actions = [], isLoading } = useGuanxinActions('all');
  const createAction = useCreateAction();
  const completeAction = useCompleteAction();
  const deleteAction = useDeleteAction();
  const updateRemind = useUpdateActionRemind();

  const [newContent, setNewContent] = useState('');
  const [newRemind, setNewRemind] = useState('3');

  const pending = actions.filter((a) => !a.is_completed);
  const completed = actions.filter((a) => a.is_completed);

  const handleCreate = async () => {
    if (!newContent.trim()) {
      toast({ title: '請輸入行動方案內容', variant: 'destructive' });
      return;
    }
    try {
      await createAction.mutateAsync({
        content: newContent.trim(),
        source: 'manual',
        remind_days: parseInt(newRemind) || null,
      });
      toast({ title: '已新增行動方案 ✨' });
      setNewContent('');
    } catch {
      toast({ title: '新增失敗', variant: 'destructive' });
    }
  };

  const handleComplete = async (id: string) => {
    try {
      const result = await completeAction.mutateAsync(id);
      if (result.success) {
        toast({
          title: '完成行動方案 🎉',
          description: result.awarded ? '獲得 3 能量點數！' : '今日獎勵已達上限',
        });
      } else {
        toast({ title: result.error || '操作失敗', variant: 'destructive' });
      }
    } catch {
      toast({ title: '操作失敗', variant: 'destructive' });
    }
  };

  const renderAction = (a: typeof actions[number]) => {
    const remindDate = a.remind_at ? parseISO(a.remind_at) : null;
    const daysLeft = remindDate ? differenceInDays(remindDate, new Date()) : null;
    const isOverdue = !a.is_completed && daysLeft !== null && daysLeft < 0;
    const isDueSoon = !a.is_completed && daysLeft !== null && daysLeft >= 0 && daysLeft <= 1;

    return (
      <div
        key={a.id}
        className={cn(
          'flex items-start gap-3 p-3 rounded-lg border transition-colors',
          a.is_completed && 'bg-muted/30 opacity-70',
          isOverdue && 'border-destructive/40 bg-destructive/5',
          isDueSoon && !isOverdue && 'border-primary/40 bg-primary/5',
        )}
      >
        <Checkbox
          checked={a.is_completed}
          onCheckedChange={() => !a.is_completed && handleComplete(a.id)}
          disabled={a.is_completed || completeAction.isPending}
          className="mt-1"
        />
        <div className="flex-1 min-w-0 space-y-1.5">
          <p className={cn('text-sm leading-relaxed', a.is_completed && 'line-through')}>
            {a.content}
          </p>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {a.source === 'auto' && (
              <Badge variant="secondary" className="gap-1">
                <Sparkles className="h-3 w-3" /> 來自觀心書
              </Badge>
            )}
            {a.is_completed && a.completed_at && (
              <Badge variant="outline" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                {format(parseISO(a.completed_at), 'MM/dd')} 完成
              </Badge>
            )}
            {!a.is_completed && remindDate && (
              <Badge
                variant={isOverdue ? 'destructive' : isDueSoon ? 'default' : 'outline'}
                className="gap-1"
              >
                <Bell className="h-3 w-3" />
                {isOverdue
                  ? `逾期 ${Math.abs(daysLeft!)} 天`
                  : daysLeft === 0
                  ? '今天到期'
                  : `${daysLeft} 天後檢視`}
              </Badge>
            )}
            {!a.is_completed && (
              <Select
                value={String(a.remind_days ?? 0)}
                onValueChange={(v) =>
                  updateRemind.mutate({ actionId: a.id, remind_days: parseInt(v) || null })
                }
              >
                <SelectTrigger className="h-6 w-auto text-xs px-2 py-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REMIND_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={() => deleteAction.mutate(a.id)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* New action form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="h-4 w-4" /> 新增行動方案
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="例：每日提醒自己以平等心看待流程不順..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">提醒：</span>
            <Select value={newRemind} onValueChange={setNewRemind}>
              <SelectTrigger className="h-8 flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REMIND_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleCreate} disabled={createAction.isPending} size="sm">
              新增
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            💡 完成行動方案可獲得 3 能量點數（每日上限 15 點）
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="pending">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="pending">
            進行中 {pending.length > 0 && `(${pending.length})`}
          </TabsTrigger>
          <TabsTrigger value="completed">
            已完成 {completed.length > 0 && `(${completed.length})`}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="pending" className="space-y-2 mt-4">
          {isLoading ? (
            <p className="text-center text-sm text-muted-foreground py-8">載入中...</p>
          ) : pending.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              尚無進行中的行動方案
            </p>
          ) : (
            pending.map(renderAction)
          )}
        </TabsContent>
        <TabsContent value="completed" className="space-y-2 mt-4">
          {completed.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">尚無完成紀錄</p>
          ) : (
            completed.map(renderAction)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
