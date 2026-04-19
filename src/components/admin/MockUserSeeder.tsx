import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, Users, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useHabits } from '@/hooks/useHabits';

const REGIONS = ['台北', '新北', '桃園', '台中', '台南', '高雄', '宜蘭', '花蓮', '台東', '新竹'];
const KEYWORD_POOL = [
  '冥想', '感恩', '能量', '光的療癒', '正念', '靜心', '臣服', '臨在',
  '愛', '寬恕', '吸引力法則', '高我', '靈性', '自我覺察', '放下', '感受',
  '呼吸', '禪', '頻率', '振動', '同步性', '直覺', '智慧', '慈悲',
];
const BIO_TEMPLATES = [
  '在修行的路上靜靜前行，相信每個當下都是禮物。',
  '透過冥想與觀心，學習與自己和解。',
  '熱愛大自然與靜默，喜歡在晨光中感恩。',
  '相信愛的頻率能療癒一切，正在練習臨在。',
  '走在覺醒的路上，渴望遇見同頻的靈魂。',
  '每天靜坐 30 分鐘，紀錄內在的細微變化。',
  '透過光的冥想連結高我，學習無條件的愛。',
  '在城市中尋找寧靜，用書寫整理心緒。',
];
const GOAL_TEMPLATES = [
  '每日感恩、保持內在平靜', '完成 100 天連續冥想', '練習無批判的觀察',
  '深化大悲咒持誦', '建立穩定的晨間靈修習慣', '學習與情緒共處',
  '每日五感恩、培養喜悅', '透過行動修練心',
];
const FRIEND_TEMPLATES = [
  '同樣熱愛冥想的同修', '可以分享靈性書籍的朋友', '一起晨修的夥伴',
  '能傾聽與支持的人', '走在覺醒路上的同行者', '溫暖且願意分享的靈魂',
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function pickN<T>(arr: T[], n: number): T[] {
  const copy = [...arr].sort(() => Math.random() - 0.5);
  return copy.slice(0, n);
}

export function MockUserSeeder() {
  const qc = useQueryClient();
  const { data: habits } = useHabits();
  const [start, setStart] = useState(20);
  const [end, setEnd] = useState(100);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);

  const { data: existing, isLoading } = useQuery({
    queryKey: ['mock-users'],
    queryFn: async () => {
      const { data, error } = await supabase.from('mock_users').select('*').order('handle');
      if (error) throw error;
      return data;
    },
  });

  const handleGenerate = async () => {
    if (start > end || start < 1 || end > 999) {
      toast.error('請設定有效範圍');
      return;
    }
    if (!habits?.length) {
      toast.error('習慣資料載入中，請稍候');
      return;
    }
    setRunning(true);
    setProgress(0);
    const total = end - start + 1;
    let created = 0;
    let skipped = 0;
    const existingHandles = new Set((existing ?? []).map(m => m.handle));

    for (let i = start; i <= end; i++) {
      const handle = `jj${i}`;
      if (existingHandles.has(handle)) {
        skipped++;
        setProgress(((i - start + 1) / total) * 100);
        continue;
      }
      const keywords = pickN(KEYWORD_POOL, 3 + Math.floor(Math.random() * 3));
      const habitIds = pickN(habits, 3 + Math.floor(Math.random() * 4)).map(h => h.id);
      const { error } = await supabase.rpc('admin_seed_mock_user', {
        _handle: handle,
        _bio: pick(BIO_TEMPLATES),
        _region: pick(REGIONS),
        _practice_goal: pick(GOAL_TEMPLATES),
        _ideal_friend_type: pick(FRIEND_TEMPLATES),
        _keywords: keywords,
        _habit_ids: habitIds,
      });
      if (error) {
        console.error('seed error', handle, error);
        skipped++;
      } else {
        created++;
      }
      setProgress(((i - start + 1) / total) * 100);
    }

    setRunning(false);
    qc.invalidateQueries({ queryKey: ['mock-users'] });
    toast.success(`完成：新建 ${created} 筆，略過 ${skipped} 筆`);
  };

  const handleDelete = async (userId: string, handle: string) => {
    if (!confirm(`確定要刪除 ${handle}？此動作會移除其檔案、關鍵字、修行偏好等所有資料。`)) return;
    const tables: Array<'user_keywords' | 'user_practice_preferences' | 'user_interests' | 'profile_details' | 'profiles' | 'mock_users'> = [
      'user_keywords', 'user_practice_preferences', 'user_interests',
      'profile_details', 'profiles', 'mock_users',
    ];
    for (const t of tables) {
      await supabase.from(t).delete().eq('user_id', userId);
    }
    qc.invalidateQueries({ queryKey: ['mock-users'] });
    toast.success(`已刪除 ${handle}`);
  };

  const handleDeleteAll = async () => {
    if (!existing?.length) return;
    if (!confirm(`確定刪除全部 ${existing.length} 個假用戶？`)) return;
    setRunning(true);
    for (const m of existing) {
      const tables: Array<'user_keywords' | 'user_practice_preferences' | 'user_interests' | 'profile_details' | 'profiles' | 'mock_users'> = ['user_keywords', 'user_practice_preferences', 'user_interests', 'profile_details', 'profiles', 'mock_users'];
      for (const t of tables) {
        await supabase.from(t).delete().eq('user_id', m.user_id);
      }
    }
    setRunning(false);
    qc.invalidateQueries({ queryKey: ['mock-users'] });
    toast.success('已清除所有假用戶');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            生成假用戶（jj20 - jj100）
          </CardTitle>
          <CardDescription>
            為每日一抽配對提供測試資料，每個假用戶會自動填入完整檔案、關鍵字與修行偏好
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 max-w-sm">
            <div>
              <Label>起始編號</Label>
              <Input type="number" value={start} onChange={e => setStart(parseInt(e.target.value) || 20)} min={1} max={999} />
            </div>
            <div>
              <Label>結束編號</Label>
              <Input type="number" value={end} onChange={e => setEnd(parseInt(e.target.value) || 100)} min={1} max={999} />
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            將生成 <span className="font-medium text-foreground">{Math.max(0, end - start + 1)}</span> 個帳號（已存在的會自動略過）
          </div>
          {running && <Progress value={progress} className="h-2" />}
          <div className="flex gap-2 flex-wrap">
            <Button onClick={handleGenerate} disabled={running}>
              {running && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              開始生成
            </Button>
            {!!existing?.length && (
              <Button variant="destructive" onClick={handleDeleteAll} disabled={running}>
                <Trash2 className="h-4 w-4 mr-2" />
                清除全部假用戶
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">已建立的假用戶 ({existing?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-sm text-muted-foreground">載入中...</div>
          ) : !existing?.length ? (
            <div className="text-sm text-muted-foreground">尚未建立任何假用戶</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {existing.map(m => (
                <Badge key={m.id} variant="secondary" className="gap-1.5 pr-1">
                  {m.handle}
                  <button
                    onClick={() => handleDelete(m.user_id, m.handle)}
                    className="rounded-full hover:bg-destructive/20 p-0.5"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
