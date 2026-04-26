import { useState } from 'react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Bell, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  useDeclutterActions,
  useCreateDeclutterAction,
  useCompleteDeclutterAction,
  useDeleteDeclutterAction,
  useUpdateDeclutterActionRemind,
} from '@/hooks/useDeclutterActions';

const REMIND_OPTIONS = [
  { value: '0', label: '不提醒' },
  { value: '1', label: '1 天後' },
  { value: '3', label: '3 天後' },
  { value: '7', label: '7 天後' },
];

export function DeclutterActionPlanPanel() {
  const { data: actions = [], isLoading } = useDeclutterActions('all');
  const create = useCreateDeclutterAction();
  const complete = useCompleteDeclutterAction();
  const del = useDeleteDeclutterAction();
  const updateRemind = useUpdateDeclutterActionRemind();

  const [content, setContent] = useState('');
  const [remind, setRemind] = useState('3');

  const pending = actions.filter((a) => !a.is_completed);
  const completed = actions.filter((a) => a.is_completed);

  const handleCreate = async () => {
    if (!content.trim()) { toast.error('請輸入行動內容'); return; }
    try {
      await create.mutateAsync({ content: content.trim(), source: 'manual', remind_days: parseInt(remind) || null });
      toast.success('已新增斷捨離行動 ✨');
      setContent('');
    } catch { toast.error('新增失敗'); }
  };

  const handleComplete = async (id: string) => {
    try {
      const res = await complete.mutateAsync(id);
      if (res.success) {
        toast.success('完成行動 🎉', { description: res.awarded ? '+2 能量點數' : '今日獎勵已達上限' });
      } else { toast.error(res.error || '操作失敗'); }
    } catch { toast.error('操作失敗'); }
  };

  const renderItem = (a: typeof actions[number]) => {
    const remindDate = a.remind_at ? parseISO(a.remind_at) : null;
    const daysLeft = remindDate ? differenceInDays(remindDate, new Date()) : null;
    const isOverdue = !a.is_completed && daysLeft !== null && daysLeft < 0;
    const isDueSoon = !a.is_completed && daysLeft !== null && daysLeft >= 0 && daysLeft <= 1;
    return (
      <div key={a.id} className={cn(
        'flex items-start gap-3 p-3 rounded-lg border transition-colors',
        a.is_completed && 'bg-muted/30 opacity-70',
        isOverdue && 'border-destructive/40 bg-destructive/5',
        isDueSoon && !isOverdue && 'border-primary/40 bg-primary/5',
      )}>
        <Checkbox
          checked={a.is_completed}
          onCheckedChange={() => !a.is_completed && handleComplete(a.id)}
          disabled={a.is_completed || complete.isPending}
          className="mt-1"
        />
        <div className="flex-1 min-w-0 space-y-1.5">
          <p className={cn('text-sm leading-relaxed', a.is_completed && 'line-through')}>{a.content}</p>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {a.is_completed && a.completed_at && (
              <Badge variant="outline" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                {format(parseISO(a.completed_at), 'MM/dd')} 完成
              </Badge>
            )}
            {!a.is_completed && remindDate && (
              <Badge variant={isOverdue ? 'destructive' : isDueSoon ? 'default' : 'outline'} className="gap-1">
                <Bell className="h-3 w-3" />
                {isOverdue ? `逾期 ${Math.abs(daysLeft!)} 天`
                  : daysLeft === 0 ? '今天到期'
                  : `${daysLeft} 天後檢視`}
              </Badge>
            )}
            {!a.is_completed && (
              <Select
                value={String(a.remind_days ?? 0)}
                onValueChange={(v) => updateRemind.mutate({ actionId: a.id, remind_days: parseInt(v) || null })}
              >
                <SelectTrigger className="h-6 w-auto text-xs px-2 py-0"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {REMIND_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={() => del.mutate(a.id)}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="h-4 w-4" /> 新增斷捨離行動
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="例：本週清理書桌抽屜..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">提醒：</span>
            <Select value={remind} onValueChange={setRemind}>
              <SelectTrigger className="h-8 flex-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {REMIND_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleCreate} disabled={create.isPending} size="sm">新增</Button>
          </div>
          <p className="text-xs text-muted-foreground">💡 完成行動可獲得 2 能量點數（每日上限 10 點）</p>
        </CardContent>
      </Card>

      <Tabs defaultValue="pending">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="pending">進行中 {pending.length > 0 && `(${pending.length})`}</TabsTrigger>
          <TabsTrigger value="completed">已完成 {completed.length > 0 && `(${completed.length})`}</TabsTrigger>
        </TabsList>
        <TabsContent value="pending" className="space-y-2 mt-4">
          {isLoading ? <p className="text-center text-sm text-muted-foreground py-8">載入中...</p>
            : pending.length === 0 ? <p className="text-center text-sm text-muted-foreground py-8">尚無進行中的斷捨離行動</p>
            : pending.map(renderItem)}
        </TabsContent>
        <TabsContent value="completed" className="space-y-2 mt-4">
          {completed.length === 0 ? <p className="text-center text-sm text-muted-foreground py-8">尚無完成紀錄</p>
            : completed.map(renderItem)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
