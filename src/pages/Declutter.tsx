import { useState } from 'react';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Sparkles, Trash2, Plus, CheckCircle2, Package, Brain, Heart, Repeat, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import {
  useDeclutterItems,
  useDeclutterStats,
  useCreateDeclutter,
  useCompleteDeclutter,
  useDeleteDeclutter,
  CATEGORY_LABELS,
  type DeclutterCategory,
  type DeclutterItem,
} from '@/hooks/useDeclutter';

const CATEGORY_ICONS: Record<DeclutterCategory, typeof Package> = {
  object: Package,
  thought: Brain,
  relation: Heart,
  habit: Repeat,
  other: MoreHorizontal,
};

const CATEGORIES: DeclutterCategory[] = ['object', 'thought', 'relation', 'habit', 'other'];

export default function Declutter() {
  const [tab, setTab] = useState<'pending' | 'completed'>('pending');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<DeclutterCategory>('object');
  const [note, setNote] = useState('');

  const [reflectOpen, setReflectOpen] = useState(false);
  const [reflectItem, setReflectItem] = useState<DeclutterItem | null>(null);
  const [reflection, setReflection] = useState('');

  const { data: items, isLoading } = useDeclutterItems(tab);
  const { data: stats } = useDeclutterStats();
  const createItem = useCreateDeclutter();
  const completeItem = useCompleteDeclutter();
  const deleteItem = useDeleteDeclutter();

  const handleCreate = async () => {
    if (!content.trim()) {
      toast.error('請輸入要斷捨離的項目');
      return;
    }
    try {
      await createItem.mutateAsync({ content: content.trim(), category, note: note.trim() || undefined });
      setContent('');
      setNote('');
      toast.success('已新增斷捨離項目');
    } catch (e) {
      toast.error('新增失敗');
    }
  };

  const handleOpenReflect = (item: DeclutterItem) => {
    setReflectItem(item);
    setReflection('');
    setReflectOpen(true);
  };

  const handleConfirmComplete = async () => {
    if (!reflectItem) return;
    try {
      const res = await completeItem.mutateAsync({
        itemId: reflectItem.id,
        reflection: reflection.trim() || undefined,
      });
      if (res.success) {
        toast.success('已完成斷捨離', {
          description: res.awarded ? '+2 能量點數' : '今日獎勵已達上限',
        });
        setReflectOpen(false);
      } else {
        toast.error(res.error || '操作失敗');
      }
    } catch (e) {
      toast.error('操作失敗');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteItem.mutateAsync(id);
      toast.success('已刪除');
    } catch (e) {
      toast.error('刪除失敗');
    }
  };

  const renderItem = (item: DeclutterItem) => {
    const Icon = CATEGORY_ICONS[item.category as DeclutterCategory] ?? MoreHorizontal;
    return (
      <Card key={item.id} className="border-border/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Checkbox
              checked={item.is_completed}
              disabled={item.is_completed}
              onCheckedChange={() => !item.is_completed && handleOpenReflect(item)}
              className="mt-1"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="gap-1">
                  <Icon className="h-3 w-3" />
                  {CATEGORY_LABELS[item.category as DeclutterCategory] ?? item.category}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(item.date), 'M月 d日', { locale: zhTW })}
                </span>
                {item.is_completed && (
                  <Badge className="bg-primary/10 text-primary border-0 gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    已完成
                  </Badge>
                )}
              </div>
              <p className={`mt-2 text-sm ${item.is_completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                {item.content}
              </p>
              {item.note && (
                <p className="mt-1 text-xs text-muted-foreground">📝 {item.note}</p>
              )}
              {item.completion_reflection && (
                <p className="mt-2 text-xs text-primary/80 bg-primary/5 rounded px-2 py-1">
                  💭 {item.completion_reflection}
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => handleDelete(item.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            斷捨離清單
          </h1>
          <p className="text-muted-foreground mt-1">
            每天列出想要放下的物品、想法、關係或習慣，逐一完成、清空空間。
          </p>
        </div>

        {/* Stats */}
        <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-border/50">
          <CardContent className="p-4">
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <div className="text-2xl font-semibold text-primary">{stats?.completed ?? 0}</div>
                <div className="text-xs text-muted-foreground">已斷捨離</div>
              </div>
              <div>
                <div className="text-2xl font-semibold text-accent">{stats?.pending ?? 0}</div>
                <div className="text-xs text-muted-foreground">待處理</div>
              </div>
              <div>
                <div className="text-2xl font-semibold">{stats?.total ?? 0}</div>
                <div className="text-xs text-muted-foreground">總計</div>
              </div>
              <div>
                <div className="text-2xl font-semibold">{stats?.days ?? 0}</div>
                <div className="text-xs text-muted-foreground">紀錄天數</div>
              </div>
            </div>
            {stats && Object.keys(stats.byCategory).length > 0 && (
              <div className="mt-3 pt-3 border-t border-border/50 flex flex-wrap gap-2 justify-center">
                {CATEGORIES.map(cat => {
                  const n = stats.byCategory[cat] || 0;
                  if (!n) return null;
                  const Icon = CATEGORY_ICONS[cat];
                  return (
                    <Badge key={cat} variant="outline" className="gap-1">
                      <Icon className="h-3 w-3" />
                      {CATEGORY_LABELS[cat]} {n}
                    </Badge>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* New item */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Plus className="h-5 w-5" />
              新增斷捨離
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid sm:grid-cols-[1fr_auto] gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="declutter-content" className="text-xs text-muted-foreground">項目</Label>
                <Input
                  id="declutter-content"
                  placeholder="例：抽屜裡用不到的舊充電線"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">分類</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as DeclutterCategory)}>
                  <SelectTrigger className="w-full sm:w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => (
                      <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="declutter-note" className="text-xs text-muted-foreground">備註（選填）</Label>
              <Textarea
                id="declutter-note"
                placeholder="想法、原因或處理方式..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="min-h-[60px] resize-none"
              />
            </div>
            <Button onClick={handleCreate} disabled={createItem.isPending} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              新增項目
            </Button>
          </CardContent>
        </Card>

        {/* List */}
        <Tabs value={tab} onValueChange={(v) => setTab(v as 'pending' | 'completed')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pending">待處理</TabsTrigger>
            <TabsTrigger value="completed">已完成</TabsTrigger>
          </TabsList>
          <TabsContent value="pending" className="space-y-2 mt-4">
            {isLoading ? (
              <p className="text-center text-muted-foreground py-8">載入中...</p>
            ) : items && items.length > 0 ? (
              items.map(renderItem)
            ) : (
              <Card className="border-dashed">
                <CardContent className="py-10 text-center text-muted-foreground">
                  目前沒有待處理的項目，今天想斷捨離什麼呢？
                </CardContent>
              </Card>
            )}
          </TabsContent>
          <TabsContent value="completed" className="space-y-2 mt-4">
            {isLoading ? (
              <p className="text-center text-muted-foreground py-8">載入中...</p>
            ) : items && items.length > 0 ? (
              items.map(renderItem)
            ) : (
              <Card className="border-dashed">
                <CardContent className="py-10 text-center text-muted-foreground">
                  尚無已完成項目
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Reflection Dialog */}
      <Dialog open={reflectOpen} onOpenChange={setReflectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>完成斷捨離</DialogTitle>
            <DialogDescription>
              {reflectItem?.content}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reflection" className="text-sm">心得感想（選填）</Label>
            <Textarea
              id="reflection"
              placeholder="放下後的感受、學到的事..."
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              className="min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground">完成可獲得 +2 能量點數（每日上限 10 點）</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReflectOpen(false)}>取消</Button>
            <Button onClick={handleConfirmComplete} disabled={completeItem.isPending}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              確認完成
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
