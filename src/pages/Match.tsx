import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Sparkles, Zap, Heart, MessageCircle, Loader2, User as UserIcon, Send } from 'lucide-react';
import { toast } from 'sonner';
import {
  useTodayDraws,
  usePerformDraw,
  useUserPublicProfile,
  useSendGreeting,
  useToggleFavorite,
  useMyFavorites,
  DRAW_COSTS,
  MAX_DRAWS_PER_DAY,
} from '@/hooks/useMatching';
import { useEnergyBalance } from '@/hooks/useEnergyPoints';
import { Link, useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

function compatibilityColor(score: number) {
  if (score >= 70) return 'text-emerald-600';
  if (score >= 40) return 'text-amber-600';
  return 'text-muted-foreground';
}

function compatibilityLabel(score: number) {
  if (score >= 80) return '極高契合';
  if (score >= 60) return '高契合';
  if (score >= 40) return '中契合';
  return '低契合';
}

export default function Match() {
  const { data: draws, isLoading } = useTodayDraws();
  const { data: balance } = useEnergyBalance();
  const { data: favorites } = useMyFavorites();
  const performDraw = usePerformDraw();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState<string | null>(null);
  const [greetingOpen, setGreetingOpen] = useState<string | null>(null);
  const [greetingMsg, setGreetingMsg] = useState('哈囉！很高興認識你 🙏');
  const sendGreeting = useSendGreeting();
  const toggleFav = useToggleFavorite();

  const drawCount = draws?.length ?? 0;
  const nextDrawIndex = drawCount; // 0-indexed; cost array uses same index
  const nextCost = nextDrawIndex < MAX_DRAWS_PER_DAY ? DRAW_COSTS[nextDrawIndex] : -1;
  const canDraw = nextCost >= 0 && (nextCost === 0 || (balance?.balance ?? 0) >= nextCost);
  const favoriteIds = new Set((favorites ?? []).map((f: any) => f.favorited_user_id));

  const handleDraw = async () => {
    try {
      const result = await performDraw.mutateAsync();
      if (!result.success) {
        toast.error(result.error ?? '抽取失敗');
        return;
      }
      toast.success(`配對成功！契合度 ${result.compatibility_score}%`);
    } catch (e: any) {
      toast.error(e.message ?? '抽取失敗');
    }
  };

  const handleGreeting = async () => {
    if (!greetingOpen) return;
    try {
      await sendGreeting.mutateAsync({ toUserId: greetingOpen, message: greetingMsg });
      toast.success('已送出打招呼，獲得 +3 能量點');
      setGreetingOpen(null);
      setGreetingMsg('哈囉！很高興認識你 🙏');
    } catch (e: any) {
      toast.error(e.message ?? '送出失敗');
    }
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-serif font-bold text-foreground flex items-center justify-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            每日一抽
          </h1>
          <p className="text-muted-foreground mt-1">透過興趣與修行找到同頻的道友</p>
        </div>

        {/* Status card */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground">今日已抽</div>
                <div className="text-2xl font-bold">{drawCount} / {MAX_DRAWS_PER_DAY}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">能量點數</div>
                <div className="text-2xl font-bold flex items-center gap-1">
                  <Zap className="h-5 w-5 text-primary" />
                  {balance?.balance ?? 0}
                </div>
              </div>
            </div>

            {nextCost === -1 ? (
              <div className="text-center text-sm text-muted-foreground py-2">
                今日抽取次數已達上限，明天再來吧 🌅
              </div>
            ) : (
              <Button
                onClick={handleDraw}
                disabled={!canDraw || performDraw.isPending}
                className="w-full h-12 text-base"
                size="lg"
              >
                {performDraw.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {nextCost === 0 ? '開始今日免費抽取' : `再抽一次（消耗 ${nextCost} 點）`}
              </Button>
            )}

            <div className="text-xs text-muted-foreground text-center">
              第 1 次免費・第 2 次 10 點・第 3 次 30 點
            </div>
          </CardContent>
        </Card>

        {/* Today's matches */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">今日配對結果</h2>
          {isLoading ? (
            <Card><CardContent className="pt-6 text-center text-muted-foreground">載入中...</CardContent></Card>
          ) : !draws?.length ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground space-y-3">
                <div>還沒有配對紀錄，點擊上方按鈕開始抽取！</div>
                <Link to="/profile" className="inline-block text-sm text-primary hover:underline">
                  → 先完善個人檔案以提升契合度
                </Link>
              </CardContent>
            </Card>
          ) : (
            draws.map(draw => (
              <MatchCard
                key={draw.id}
                userId={draw.matched_user_id!}
                score={Number(draw.compatibility_score)}
                drawNumber={draw.draw_number}
                isFavorited={favoriteIds.has(draw.matched_user_id!)}
                onViewProfile={() => setProfileOpen(draw.matched_user_id!)}
                onGreet={() => setGreetingOpen(draw.matched_user_id!)}
                onMessage={() => navigate(`/messages?to=${draw.matched_user_id!}`)}
                onToggleFav={() => toggleFav.mutate({ favoritedUserId: draw.matched_user_id!, favorite: !favoriteIds.has(draw.matched_user_id!) })}
              />
            ))
          )}
        </div>

        {/* Profile dialog */}
        <Dialog open={!!profileOpen} onOpenChange={open => !open && setProfileOpen(null)}>
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>道友檔案</DialogTitle>
            </DialogHeader>
            {profileOpen && <ProfileView userId={profileOpen} />}
          </DialogContent>
        </Dialog>

        {/* Greeting dialog */}
        <Dialog open={!!greetingOpen} onOpenChange={open => !open && setGreetingOpen(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>打招呼</DialogTitle>
              <DialogDescription>送出後獲得 +3 能量點</DialogDescription>
            </DialogHeader>
            <Textarea value={greetingMsg} onChange={e => setGreetingMsg(e.target.value)} maxLength={200} rows={3} />
            <div className="text-xs text-muted-foreground text-right">{greetingMsg.length}/200</div>
            <Button onClick={handleGreeting} disabled={sendGreeting.isPending || !greetingMsg.trim()}>
              {sendGreeting.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              送出
            </Button>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}

function MatchCard({ userId, score, drawNumber, isFavorited, onViewProfile, onGreet, onMessage, onToggleFav }: {
  userId: string;
  score: number;
  drawNumber: number;
  isFavorited: boolean;
  onViewProfile: () => void;
  onGreet: () => void;
  onMessage: () => void;
  onToggleFav: () => void;
}) {
  const { data: profile } = useUserPublicProfile(userId);

  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-start gap-3">
          <button
            onClick={onViewProfile}
            className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 hover:bg-primary/20 transition-colors"
            aria-label="查看檔案"
          >
            <UserIcon className="h-6 w-6 text-primary" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <button onClick={onViewProfile} className="font-medium hover:underline truncate">
                {profile?.name ?? '...'}
              </button>
              <Badge variant="outline" className="text-xs">第 {drawNumber} 抽</Badge>
            </div>
            {profile?.detail?.region && (
              <div className="text-xs text-muted-foreground mt-0.5">{profile.detail.region}</div>
            )}
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">契合度</span>
                <span className={`font-medium ${compatibilityColor(score)}`}>
                  {score.toFixed(0)}% · {compatibilityLabel(score)}
                </span>
              </div>
              <Progress value={Math.min(100, score)} className="h-2" />
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={onViewProfile} className="flex-1">
            查看檔案
          </Button>
          <Button variant="outline" size="sm" onClick={onGreet}>
            <MessageCircle className="h-3.5 w-3.5 mr-1" /> 打招呼
          </Button>
          <Button size="sm" onClick={onMessage} className="flex-1">
            <Send className="h-3.5 w-3.5 mr-1" /> 傳訊息
          </Button>
          <Button variant="ghost" size="sm" onClick={onToggleFav}>
            <Heart className={`h-4 w-4 ${isFavorited ? 'fill-rose-500 text-rose-500' : ''}`} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ProfileView({ userId }: { userId: string }) {
  const { data: profile, isLoading } = useUserPublicProfile(userId);
  if (isLoading) return <div className="text-center py-6 text-muted-foreground">載入中...</div>;
  if (!profile) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <UserIcon className="h-8 w-8 text-primary" />
        </div>
        <div>
          <div className="font-semibold text-lg">{profile.name}</div>
          {profile.detail?.region && <div className="text-sm text-muted-foreground">{profile.detail.region}</div>}
        </div>
      </div>

      {profile.detail?.bio && (
        <div>
          <div className="text-xs font-medium text-muted-foreground mb-1">自我介紹</div>
          <p className="text-sm whitespace-pre-wrap">{profile.detail.bio}</p>
        </div>
      )}

      {profile.detail?.practice_goal && (
        <div>
          <div className="text-xs font-medium text-muted-foreground mb-1">修行目標</div>
          <p className="text-sm">{profile.detail.practice_goal}</p>
        </div>
      )}

      {profile.detail?.ideal_friend_type && (
        <div>
          <div className="text-xs font-medium text-muted-foreground mb-1">想認識的人</div>
          <p className="text-sm">{profile.detail.ideal_friend_type}</p>
        </div>
      )}

      {!!profile.keywords.length && (
        <div>
          <div className="text-xs font-medium text-muted-foreground mb-2">關注關鍵字</div>
          <div className="flex flex-wrap gap-1.5">
            {profile.keywords.map(k => <Badge key={k} variant="secondary">{k}</Badge>)}
          </div>
        </div>
      )}

      {!!profile.practices.length && (
        <div>
          <div className="text-xs font-medium text-muted-foreground mb-2">目前在做的修行</div>
          <div className="flex flex-wrap gap-1.5">
            {profile.practices.map((p: any, i: number) => (
              <Badge key={i} variant="outline">{p.habits?.name ?? '習慣'}</Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
