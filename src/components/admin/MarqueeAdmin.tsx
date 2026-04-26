import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  useAllMarqueeMessages,
  useMarqueeConfig,
  useUpsertMarqueeMessage,
  useDeleteMarqueeMessage,
  useUpdateMarqueeConfig,
  type MarqueeMessage,
} from '@/hooks/useMarquee';
import { Megaphone, Plus, Trash2, Save } from 'lucide-react';

interface DraftMessage {
  id?: string;
  content: string;
  link_url: string;
  text_color: string;
  bg_color: string;
  is_active: boolean;
  sort_order: number;
  starts_at: string;
  ends_at: string;
}

const emptyDraft = (): DraftMessage => ({
  content: '',
  link_url: '',
  text_color: '#ffffff',
  bg_color: '#f59e0b',
  is_active: true,
  sort_order: 0,
  starts_at: '',
  ends_at: '',
});

const fromMessage = (m: MarqueeMessage): DraftMessage => ({
  id: m.id,
  content: m.content,
  link_url: m.link_url ?? '',
  text_color: m.text_color,
  bg_color: m.bg_color,
  is_active: m.is_active,
  sort_order: m.sort_order,
  starts_at: m.starts_at ? m.starts_at.slice(0, 16) : '',
  ends_at: m.ends_at ? m.ends_at.slice(0, 16) : '',
});

export function MarqueeAdmin() {
  const { data: config } = useMarqueeConfig();
  const { data: messages } = useAllMarqueeMessages();
  const upsert = useUpsertMarqueeMessage();
  const remove = useDeleteMarqueeMessage();
  const updateConfig = useUpdateMarqueeConfig();

  const [draft, setDraft] = useState<DraftMessage>(emptyDraft());
  const [enabled, setEnabled] = useState(config?.is_enabled ?? true);
  const [speed, setSpeed] = useState(config?.scroll_speed ?? 40);

  // Sync local config state when loaded
  if (config && enabled !== config.is_enabled && draft.content === '' && !draft.id) {
    // no-op guard – just to read latest defaults once
  }

  const handleSave = async () => {
    if (!draft.content.trim()) {
      toast.error('請輸入跑馬燈內容');
      return;
    }
    if (draft.content.length > 200) {
      toast.error('內容不可超過 200 字');
      return;
    }
    try {
      await upsert.mutateAsync({
        ...draft,
        link_url: draft.link_url || null,
        starts_at: draft.starts_at ? new Date(draft.starts_at).toISOString() : null,
        ends_at: draft.ends_at ? new Date(draft.ends_at).toISOString() : null,
      } as any);
      toast.success(draft.id ? '已更新' : '已新增');
      setDraft(emptyDraft());
    } catch (e: any) {
      toast.error(e.message || '儲存失敗');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('確定刪除這則跑馬燈訊息？')) return;
    try {
      await remove.mutateAsync(id);
      toast.success('已刪除');
    } catch (e: any) {
      toast.error(e.message || '刪除失敗');
    }
  };

  const handleSaveConfig = async () => {
    if (!config) return;
    try {
      await updateConfig.mutateAsync({ id: config.id, is_enabled: enabled, scroll_speed: speed });
      toast.success('設定已更新');
    } catch (e: any) {
      toast.error(e.message || '更新失敗');
    }
  };

  return (
    <div className="space-y-6">
      {/* Global config */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            跑馬燈全站設定
          </CardTitle>
          <CardDescription>控制跑馬燈是否顯示與捲動速度（秒/輪）</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Switch checked={enabled} onCheckedChange={setEnabled} />
            <Label>啟用跑馬燈</Label>
          </div>
          <div className="flex items-center gap-3">
            <Label className="w-32">捲動週期 (秒)</Label>
            <Input
              type="number"
              min={10}
              max={300}
              value={speed}
              onChange={e => setSpeed(parseInt(e.target.value) || 40)}
              className="w-32"
            />
            <span className="text-xs text-muted-foreground">數值越大越慢</span>
          </div>
          <Button onClick={handleSaveConfig} size="sm" className="gap-2">
            <Save className="h-4 w-4" /> 儲存設定
          </Button>
        </CardContent>
      </Card>

      {/* Editor */}
      <Card>
        <CardHeader>
          <CardTitle>{draft.id ? '編輯訊息' : '新增訊息'}</CardTitle>
          <CardDescription>支援多則輪播，可設定文字、顏色、連結、起訖時間</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>內容（最多 200 字）</Label>
            <Textarea
              value={draft.content}
              maxLength={200}
              onChange={e => setDraft(d => ({ ...d, content: e.target.value }))}
              placeholder="例：📢 本週新功能上線，立即體驗！"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>連結網址（可空白）</Label>
              <Input
                value={draft.link_url}
                onChange={e => setDraft(d => ({ ...d, link_url: e.target.value }))}
                placeholder="/forum 或 https://..."
              />
            </div>
            <div className="space-y-2">
              <Label>排序（數字越小越前面）</Label>
              <Input
                type="number"
                value={draft.sort_order}
                onChange={e => setDraft(d => ({ ...d, sort_order: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-2">
              <Label>文字顏色</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={draft.text_color}
                  onChange={e => setDraft(d => ({ ...d, text_color: e.target.value }))}
                  className="w-16 h-10 p-1"
                />
                <Input
                  value={draft.text_color}
                  onChange={e => setDraft(d => ({ ...d, text_color: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>背景顏色</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={draft.bg_color}
                  onChange={e => setDraft(d => ({ ...d, bg_color: e.target.value }))}
                  className="w-16 h-10 p-1"
                />
                <Input
                  value={draft.bg_color}
                  onChange={e => setDraft(d => ({ ...d, bg_color: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>開始時間（可空白）</Label>
              <Input
                type="datetime-local"
                value={draft.starts_at}
                onChange={e => setDraft(d => ({ ...d, starts_at: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>結束時間（可空白）</Label>
              <Input
                type="datetime-local"
                value={draft.ends_at}
                onChange={e => setDraft(d => ({ ...d, ends_at: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              checked={draft.is_active}
              onCheckedChange={v => setDraft(d => ({ ...d, is_active: v }))}
            />
            <Label>啟用</Label>
          </div>

          {/* Preview */}
          <div className="space-y-1">
            <Label>預覽</Label>
            <div
              className="px-4 py-2 rounded text-sm inline-block"
              style={{ backgroundColor: draft.bg_color, color: draft.text_color }}
            >
              {draft.content || '訊息預覽'}
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={upsert.isPending} className="gap-2">
              <Save className="h-4 w-4" /> {draft.id ? '更新' : '新增'}
            </Button>
            {draft.id && (
              <Button variant="outline" onClick={() => setDraft(emptyDraft())}>
                取消編輯
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            訊息列表
            <Badge variant="secondary">{messages?.length || 0}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {!messages?.length ? (
            <p className="text-sm text-muted-foreground py-6 text-center">尚無訊息，點擊上方「新增」</p>
          ) : (
            messages.map(m => (
              <div
                key={m.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition"
              >
                <div
                  className="px-3 py-1 rounded text-xs whitespace-nowrap"
                  style={{ backgroundColor: m.bg_color, color: m.text_color }}
                >
                  #{m.sort_order}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">{m.content}</div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    {m.is_active ? (
                      <Badge variant="default" className="h-4 px-1.5 text-[10px]">啟用</Badge>
                    ) : (
                      <Badge variant="outline" className="h-4 px-1.5 text-[10px]">停用</Badge>
                    )}
                    {m.link_url && <span className="truncate max-w-[200px]">→ {m.link_url}</span>}
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setDraft(fromMessage(m))}>
                  編輯
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(m.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDraft(emptyDraft())}
            className="gap-2 mt-2"
          >
            <Plus className="h-4 w-4" /> 新增訊息
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
