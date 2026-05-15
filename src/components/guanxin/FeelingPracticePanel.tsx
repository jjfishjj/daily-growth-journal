import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Heart, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { FEELINGS, FEELING_COLORS } from '@/lib/feelings';
import {
  useFeelingPractices,
  useCreateFeelingPractice,
  useToggleFeelingPractice,
  useDeleteFeelingPractice,
} from '@/hooks/useFeelings';

export function FeelingPracticePanel() {
  const { toast } = useToast();
  const { data: practices = [], isLoading } = useFeelingPractices('all');
  const createP = useCreateFeelingPractice();
  const toggleP = useToggleFeelingPractice();
  const deleteP = useDeleteFeelingPractice();

  const [feeling, setFeeling] = useState<string>(FEELINGS[0]);
  const [note, setNote] = useState('');

  const pending = practices.filter((p) => !p.is_practiced);
  const done = practices.filter((p) => p.is_practiced);

  const handleCreate = async () => {
    if (!feeling) return;
    try {
      await createP.mutateAsync({ feeling, note: note.trim() || undefined });
      toast({ title: '已加入要實行的感覺 💗' });
      setNote('');
    } catch {
      toast({ title: '新增失敗', variant: 'destructive' });
    }
  };

  const renderItem = (p: typeof practices[number]) => (
    <div
      key={p.id}
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg border transition-colors',
        p.is_practiced && 'bg-muted/30 opacity-70'
      )}
    >
      <Checkbox
        checked={p.is_practiced}
        onCheckedChange={(v) => toggleP.mutate({ id: p.id, is_practiced: !!v })}
        className="mt-1"
      />
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn('px-2 py-0.5 rounded-full text-xs border', FEELING_COLORS[p.feeling])}>
            {p.feeling}
          </span>
          {p.is_practiced && p.practiced_at && (
            <Badge variant="outline" className="gap-1 text-xs">
              <CheckCircle2 className="h-3 w-3" />
              {format(parseISO(p.practiced_at), 'MM/dd')} 完成
            </Badge>
          )}
        </div>
        {p.note && (
          <p className={cn('text-sm leading-relaxed text-muted-foreground', p.is_practiced && 'line-through')}>
            {p.note}
          </p>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-muted-foreground hover:text-destructive"
        onClick={() => deleteP.mutate(p.id)}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Heart className="h-4 w-4 text-primary" /> 需要實行的感覺
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Select value={feeling} onValueChange={setFeeling}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FEELINGS.map((f) => (
                  <SelectItem key={f} value={f}>{f}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="可加註：例 在工作中保持平等心..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            <Button onClick={handleCreate} disabled={createP.isPending} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="pending">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="pending">
            進行中 {pending.length > 0 && `(${pending.length})`}
          </TabsTrigger>
          <TabsTrigger value="done">
            已完成 {done.length > 0 && `(${done.length})`}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="pending" className="space-y-2 mt-4">
          {isLoading ? (
            <p className="text-center text-sm text-muted-foreground py-8">載入中...</p>
          ) : pending.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">尚無要實行的感覺</p>
          ) : (
            pending.map(renderItem)
          )}
        </TabsContent>
        <TabsContent value="done" className="space-y-2 mt-4">
          {done.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">尚無完成紀錄</p>
          ) : (
            done.map(renderItem)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
