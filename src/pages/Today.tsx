import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { AppLayout } from '@/components/layout/AppLayout';
import { HabitCard } from '@/components/habits/HabitCard';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useHabits, useDailyEntries, useSaveDailyEntry } from '@/hooks/useHabits';
import { useSaveDailyFeelings, summarizeFeelings } from '@/hooks/useFeelings';
import { FeelingsSelector } from '@/components/feelings/FeelingsSelector';
import { toast } from 'sonner';
import { CalendarDays, Save, Loader2, Plus, FileText, ChevronDown, ChevronUp } from 'lucide-react';

interface HabitState {
  completed: boolean;
  score: number | null;
  note: string;
}

export default function Today() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const { data: habits, isLoading: habitsLoading } = useHabits();
  const { data: todayEntries, isLoading: entriesLoading } = useDailyEntries(today);
  const saveMutation = useSaveDailyEntry();

  const [habitStates, setHabitStates] = useState<Record<string, HabitState>>({});
  const [overallComment, setOverallComment] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [selectedFeelings, setSelectedFeelings] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const saveFeelings = useSaveDailyFeelings();

  const toggleFeeling = (f: string) => {
    setSelectedFeelings((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    );
  };

  const handleAiSummarize = async () => {
    if (!overallComment.trim()) {
      toast.error('請先填寫今日觀心紀錄');
      return;
    }
    setAiLoading(true);
    try {
      const result = await summarizeFeelings(overallComment);
      if (result.length === 0) {
        toast.info('AI 未能從文字中辨識出感覺，請手動點選');
      } else {
        setSelectedFeelings((prev) => Array.from(new Set([...prev, ...result])));
        toast.success(`AI 摘要完成，已加入 ${result.length} 個感覺`);
      }
    } catch (e: any) {
      toast.error('AI 摘要失敗', { description: e?.message });
    } finally {
      setAiLoading(false);
    }
  };

  // Initialize with empty states for new entry
  useEffect(() => {
    if (habits) {
      const initialStates: Record<string, HabitState> = {};
      habits.forEach(habit => {
        initialStates[habit.id] = {
          completed: false,
          score: null,
          note: ''
        };
      });
      setHabitStates(initialStates);
    }
  }, [habits]);

  const updateHabit = (habitId: string, updates: Partial<HabitState>) => {
    setHabitStates(prev => ({
      ...prev,
      [habitId]: {
        ...prev[habitId],
        ...updates,
        score: updates.completed && !prev[habitId]?.score 
          ? 5 
          : (updates.score ?? prev[habitId]?.score)
      }
    }));
  };

  const handleSave = async () => {
    if (!habits) return;

    const habitRecords = habits.map(habit => ({
      habitId: habit.id,
      completed: habitStates[habit.id]?.completed ?? false,
      score: habitStates[habit.id]?.score ?? null,
      note: habitStates[habit.id]?.note ?? ''
    }));

    const hasCompletedHabits = habitRecords.some(r => r.completed);
    if (!hasCompletedHabits && !overallComment.trim()) {
      toast.error('請至少勾選一個習慣或填寫評語');
      return;
    }

    try {
      const entry = await saveMutation.mutateAsync({
        date: today,
        overallComment,
        habitRecords
      });
      if (selectedFeelings.length > 0 && entry?.id) {
        try {
          await saveFeelings.mutateAsync({ dailyEntryId: entry.id, feelings: selectedFeelings });
        } catch (e) {
          console.error('save feelings failed', e);
        }
      }
      toast.success('儲存成功！', { description: '新紀錄已保存' });

      // Reset form for new entry
      const resetStates: Record<string, HabitState> = {};
      habits.forEach(habit => {
        resetStates[habit.id] = { completed: false, score: null, note: '' };
      });
      setHabitStates(resetStates);
      setOverallComment('');
      setSelectedFeelings([]);
    } catch (error) {
      toast.error('儲存失敗', { description: '請稍後再試' });
    }
  };

  const stats = useMemo(() => {
    if (!habits) return { completed: 0, total: 0, avgScore: 0 };
    
    const completedHabits = habits.filter(h => habitStates[h.id]?.completed);
    const scores = completedHabits
      .map(h => habitStates[h.id]?.score)
      .filter((s): s is number => s !== null);

    return {
      completed: completedHabits.length,
      total: habits.length,
      avgScore: scores.length > 0 
        ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
        : '0'
    };
  }, [habits, habitStates]);

  const isLoading = habitsLoading || entriesLoading;

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl md:text-3xl font-semibold text-foreground">
              今日修行
            </h1>
            <p className="text-muted-foreground flex items-center gap-2 mt-1">
              <CalendarDays className="h-4 w-4" />
              {format(new Date(), 'yyyy年 M月 d日 EEEE', { locale: zhTW })}
            </p>
          </div>

          {todayEntries && todayEntries.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-primary">
              <FileText className="h-4 w-4" />
              <span>今日已有 {todayEntries.length} 筆紀錄</span>
            </div>
          )}
        </div>

        {/* Today's Previous Entries */}
        {todayEntries && todayEntries.length > 0 && (
          <Card className="border-border/50">
            <CardHeader 
              className="pb-3 cursor-pointer"
              onClick={() => setShowHistory(!showHistory)}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  今日已記錄 ({todayEntries.length})
                </CardTitle>
                {showHistory ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </CardHeader>
            {showHistory && (
              <CardContent className="space-y-3">
                {todayEntries.map((entry, index) => (
                  <div key={entry.id} className="p-3 bg-secondary/30 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">
                        第 {todayEntries.length - index} 筆 • {format(new Date(entry.created_at), 'HH:mm')}
                      </span>
                      <span className="text-sm text-primary">
                        {entry.daily_habit_records?.filter(r => r.completed).length || 0} 個習慣
                      </span>
                    </div>
                    {entry.overall_comment && (
                      <p className="text-sm text-foreground line-clamp-2">{entry.overall_comment}</p>
                    )}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {entry.daily_habit_records?.filter(r => r.completed).map(record => {
                        const habit = habits?.find(h => h.id === record.habit_id);
                        return habit ? (
                          <span 
                            key={record.id} 
                            className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full"
                          >
                            {habit.name} {record.score && `(${record.score})`}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                ))}
              </CardContent>
            )}
          </Card>
        )}

        {/* Daily Guanxin Note (moved to top) */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium">每日觀心紀錄</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="記錄這次的心得、感悟或反思..."
              value={overallComment}
              onChange={(e) => setOverallComment(e.target.value)}
              className="min-h-[120px] resize-none bg-background/50"
            />
          </CardContent>
        </Card>

        {/* New Entry Form */}
        <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Plus className="h-5 w-5" />
              新增紀錄
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-around text-center">
              <div>
                <div className="text-2xl font-semibold text-primary">
                  {stats.completed}/{stats.total}
                </div>
                <div className="text-sm text-muted-foreground">已選擇</div>
              </div>
              <div className="h-10 w-px bg-border" />
              <div>
                <div className="text-2xl font-semibold text-accent">
                  {stats.avgScore}
                </div>
                <div className="text-sm text-muted-foreground">平均分數</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Habits List */}
        <div className="space-y-3">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-6 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            habits?.map((habit, index) => (
              <div
                key={habit.id}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <HabitCard
                  habit={habit}
                  completed={habitStates[habit.id]?.completed ?? false}
                  score={habitStates[habit.id]?.score ?? null}
                  note={habitStates[habit.id]?.note ?? ''}
                  onCompletedChange={(completed) => 
                    updateHabit(habit.id, { completed })
                  }
                  onScoreChange={(score) => 
                    updateHabit(habit.id, { score })
                  }
                  onNoteChange={(note) => 
                    updateHabit(habit.id, { note })
                  }
                />
              </div>
            ))
          )}
        </div>


        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={saveMutation.isPending || isLoading}
          className="w-full h-12 text-base"
          size="lg"
        >
          {saveMutation.isPending ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <Save className="mr-2 h-5 w-5" />
          )}
          新增紀錄
        </Button>
      </div>
    </AppLayout>
  );
}
