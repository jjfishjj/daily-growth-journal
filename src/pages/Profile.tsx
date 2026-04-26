import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Plus, X, User as UserIcon, Tag, Sparkles, Target } from 'lucide-react';
import { toast } from 'sonner';
import {
  useMyProfileDetail,
  useUpsertProfileDetail,
  useMyKeywords,
  useAddKeyword,
  useRemoveKeyword,
  useMyPracticePrefs,
  useTogglePracticePref,
  useMyProfile,
  useUpdateMyName,
} from '@/hooks/useMatching';
import { useHabits } from '@/hooks/useHabits';
import { useAuth } from '@/lib/auth';

export default function Profile() {
  const { user } = useAuth();
  const { data: profile } = useMyProfile();
  const updateName = useUpdateMyName();
  const { data: detail, isLoading } = useMyProfileDetail();
  const upsert = useUpsertProfileDetail();
  const { data: keywords } = useMyKeywords();
  const addKw = useAddKeyword();
  const removeKw = useRemoveKeyword();
  const { data: habits } = useHabits();
  const { data: prefs } = useMyPracticePrefs();
  const togglePref = useTogglePracticePref();

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [region, setRegion] = useState('');
  const [practiceGoal, setPracticeGoal] = useState('');
  const [idealFriendType, setIdealFriendType] = useState('');
  const [newKeyword, setNewKeyword] = useState('');
  const [initialized, setInitialized] = useState(false);
  const [nameInitialized, setNameInitialized] = useState(false);

  // Default name: use profile.name if set, otherwise fall back to Google metadata
  if (profile !== undefined && !nameInitialized) {
    const fallback =
      (user?.user_metadata?.full_name as string | undefined) ||
      (user?.user_metadata?.name as string | undefined) ||
      user?.email?.split('@')[0] ||
      '';
    setDisplayName(profile?.name?.trim() ? profile.name : fallback);
    setNameInitialized(true);
  }

  if (detail && !initialized) {
    setBio(detail.bio ?? '');
    setRegion(detail.region ?? '');
    setPracticeGoal(detail.practice_goal ?? '');
    setIdealFriendType(detail.ideal_friend_type ?? '');
    setInitialized(true);
  }

  const handleSaveName = async () => {
    try {
      await updateName.mutateAsync(displayName);
      toast.success('暱稱已更新');
    } catch (e: any) {
      toast.error(e.message ?? '更新失敗');
    }
  };

  const handleSave = async () => {
    try {
      await upsert.mutateAsync({
        bio: bio.slice(0, 500),
        region: region.slice(0, 50),
        practice_goal: practiceGoal.slice(0, 200),
        ideal_friend_type: idealFriendType.slice(0, 200),
      });
      toast.success('檔案已更新');
    } catch (e: any) {
      toast.error(e.message ?? '更新失敗');
    }
  };

  const handleAddKeyword = async () => {
    if (!newKeyword.trim()) return;
    try {
      await addKw.mutateAsync(newKeyword);
      setNewKeyword('');
    } catch (e: any) {
      toast.error(e.message ?? '新增失敗');
    }
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-serif font-bold text-foreground">個人檔案</h1>
          <p className="text-muted-foreground mt-1">完善資料，提升每日一抽的契合度</p>
        </div>

        {/* Keywords */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Tag className="h-4 w-4" /> 關注關鍵字
            </CardTitle>
            <CardDescription>用來找到關注相同主題的同修（影響契合度）</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={newKeyword}
                onChange={e => setNewKeyword(e.target.value)}
                placeholder="例：冥想、感恩、能量"
                maxLength={20}
                onKeyDown={e => e.key === 'Enter' && handleAddKeyword()}
              />
              <Button onClick={handleAddKeyword} disabled={addKw.isPending || !newKeyword.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {!keywords?.length && <div className="text-xs text-muted-foreground">尚未新增關鍵字</div>}
              {keywords?.map(kw => (
                <Badge key={kw.id} variant="secondary" className="gap-1.5 pr-1">
                  {kw.keyword}
                  <button onClick={() => removeKw.mutate(kw.id)} className="rounded-full hover:bg-destructive/20 p-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Practice preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4" /> 我目前在做的修行
            </CardTitle>
            <CardDescription>標記正在實踐的習慣，找到志同道合的人</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {habits?.map(h => {
                const checked = prefs?.includes(h.id) ?? false;
                return (
                  <label key={h.id} className="flex items-center gap-2 p-2 rounded-md hover:bg-accent cursor-pointer">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={c => togglePref.mutate({ habitId: h.id, enabled: !!c })}
                    />
                    <span className="text-sm">{h.name}</span>
                  </label>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Basic info (moved to bottom) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UserIcon className="h-4 w-4" /> 基本資訊
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>自我介紹</Label>
              <Textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="簡短介紹自己..."
                maxLength={500}
                rows={3}
              />
              <div className="text-xs text-muted-foreground text-right mt-1">{bio.length}/500</div>
            </div>
            <div>
              <Label>所在地區</Label>
              <Input value={region} onChange={e => setRegion(e.target.value)} placeholder="例：台北" maxLength={50} />
            </div>
            <div>
              <Label>修行目標</Label>
              <Input value={practiceGoal} onChange={e => setPracticeGoal(e.target.value)} placeholder="例：每日感恩冥想、保持平靜" maxLength={200} />
            </div>
            <div>
              <Label>想認識的人類型</Label>
              <Input value={idealFriendType} onChange={e => setIdealFriendType(e.target.value)} placeholder="例：同樣熱愛冥想的同修" maxLength={200} />
            </div>
            <Button onClick={handleSave} disabled={upsert.isPending} className="w-full">
              {upsert.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              儲存基本資訊
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-muted/30">
          <CardContent className="pt-6 flex items-start gap-3">
            <Target className="h-5 w-5 text-primary mt-0.5" />
            <div className="text-sm text-muted-foreground">
              填得越完整，每日一抽配對的契合度就越精準。完成後到 <span className="font-medium text-foreground">每日一抽</span> 開始尋找道友吧！
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
