import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isToday, isSameDay, subDays, isAfter, isBefore, startOfDay } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import {
  useGuanxinEntries,
  useGuanxinLeaves,
  useSubmitGuanxin,
  useSubmitLeave,
  useCancelLeave,
} from '@/hooks/useGuanxin';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, BookHeart, CalendarOff } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Check if a given date is allowed for submission based on current time */
function getSubmittableDates(): Date[] {
  const now = new Date();
  const today = startOfDay(now);
  const hour = now.getHours();

  if (hour < 12) {
    // Before 12PM: can submit for today or yesterday
    return [subDays(today, 1), today];
  } else {
    // 12PM onwards: only today
    return [today];
  }
}

function isDateSubmittable(date: Date): boolean {
  const allowed = getSubmittableDates();
  return allowed.some(d => isSameDay(d, date));
}

const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'];
const MAX_CHARS = 2000;

export default function Guanxin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [content, setContent] = useState('');
  const [editingId, setEditingId] = useState<string | undefined>();
  const [showForm, setShowForm] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveDate, setLeaveDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const monthKey = format(currentMonth, 'yyyy-MM');
  const { data: entries = [] } = useGuanxinEntries(monthKey);
  const { data: leaves = [] } = useGuanxinLeaves(monthKey);
  const submitGuanxin = useSubmitGuanxin();
  const submitLeave = useSubmitLeave();
  const cancelLeave = useCancelLeave();

  // Calendar data
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart);

  const entryDates = useMemo(() => new Set(entries.map(e => e.date)), [entries]);
  const leaveDates = useMemo(() => new Map(leaves.map(l => [l.date, l])), [leaves]);

  // Stats
  const monthEntryCount = entries.length;
  const monthLeaveCount = leaves.length;

  const handleDayClick = (day: Date) => {
    if (!isDateSubmittable(day)) {
      // If there's an existing entry, allow viewing it read-only
      const dateStr = format(day, 'yyyy-MM-dd');
      const existing = entries.find(e => e.date === dateStr);
      if (existing) {
        setSelectedDate(day);
        setContent(existing.content);
        setEditingId(existing.id);
        setShowForm(true);
      } else {
        toast({ title: '此日期已無法填寫觀心書', description: '僅能填寫今天或隔天中午前補填前一天', variant: 'destructive' });
      }
      return;
    }
    const dateStr = format(day, 'yyyy-MM-dd');
    setSelectedDate(day);
    const existing = entries.find(e => e.date === dateStr);
    if (existing) {
      setContent(existing.content);
      setEditingId(existing.id);
    } else {
      setContent('');
      setEditingId(undefined);
    }
    setShowForm(true);
  };

  const openDatePickerForWrite = () => {
    const dates = getSubmittableDates();
    if (dates.length === 1) {
      // Only today available, go directly
      handleDayClick(dates[0]);
    } else {
      // Show date picker dialog
      setShowDatePicker(true);
    }
  };

  const selectDateAndOpenForm = (day: Date) => {
    setShowDatePicker(false);
    const dateStr = format(day, 'yyyy-MM-dd');
    setSelectedDate(day);
    const existing = entries.find(e => e.date === dateStr);
    if (existing) {
      setContent(existing.content);
      setEditingId(existing.id);
    } else {
      setContent('');
      setEditingId(undefined);
    }
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!selectedDate || !content.trim()) {
      toast({ title: '請填寫內容', variant: 'destructive' });
      return;
    }
    if (!editingId && !isDateSubmittable(selectedDate)) {
      toast({ title: '此日期已無法填寫', description: '已超過可補填時間', variant: 'destructive' });
      return;
    }
    try {
      await submitGuanxin.mutateAsync({
        date: format(selectedDate, 'yyyy-MM-dd'),
        content: content.trim(),
        existingId: editingId,
      });
      toast({ title: editingId ? '已更新觀心書' : '觀心書已送出 ✨' });
      setShowForm(false);
      setContent('');
      setEditingId(undefined);
    } catch {
      toast({ title: '送出失敗，請稍後再試', variant: 'destructive' });
    }
  };

  const handleLeaveSubmit = async () => {
    if (!leaveDate) {
      toast({ title: '請選擇請假日期', variant: 'destructive' });
      return;
    }
    if (leaveDates.has(leaveDate)) {
      toast({ title: '該日已請假', variant: 'destructive' });
      return;
    }
    try {
      await submitLeave.mutateAsync({ date: leaveDate, reason: leaveReason.trim() || undefined });
      toast({ title: '請假申請已送出，等待管理員審核' });
      setShowLeaveDialog(false);
      setLeaveReason('');
      setLeaveDate('');
    } catch {
      toast({ title: '請假失敗', variant: 'destructive' });
    }
  };

  const handleCancelLeave = async (leaveId: string) => {
    try {
      await cancelLeave.mutateAsync(leaveId);
      toast({ title: '已取消請假' });
    } catch {
      toast({ title: '取消失敗', variant: 'destructive' });
    }
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-serif font-bold text-foreground flex items-center justify-center gap-2">
            <BookHeart className="h-6 w-6 text-primary" />
            觀心書專區
          </h1>
          <p className="text-muted-foreground mt-1">每日觀照內心，記錄成長軌跡</p>
        </div>

        {/* Stats Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">{monthEntryCount}</div>
                <div className="text-sm text-muted-foreground">當月填單數</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-destructive">{monthLeaveCount}</div>
                <div className="text-sm text-muted-foreground">當月請假天數</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calendar */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={() => setCurrentMonth(m => subMonths(m, 1))}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                上一月
              </Button>
              <CardTitle className="text-lg">
                {format(currentMonth, 'yyyy年 M月', { locale: zhTW })}
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => setCurrentMonth(m => addMonths(m, 1))}>
                下一月
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Weekday headers */}
            <div className="grid grid-cols-7 mb-2">
              {WEEKDAY_LABELS.map((label, i) => (
                <div
                  key={label}
                  className={cn(
                    'text-center text-sm font-medium py-2',
                    i === 0 && 'text-destructive',
                    i === 6 && 'text-muted-foreground'
                  )}
                >
                  {label}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7">
              {/* Empty cells for offset */}
              {Array.from({ length: startDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="h-14" />
              ))}

              {daysInMonth.map(day => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const hasEntry = entryDates.has(dateStr);
                const leave = leaveDates.get(dateStr);
                const today = isToday(day);
                const isSelected = selectedDate && isSameDay(day, selectedDate);

                return (
                  <button
                    key={dateStr}
                    onClick={() => handleDayClick(day)}
                    className={cn(
                      'h-14 flex flex-col items-center justify-center rounded-md transition-colors relative',
                      'hover:bg-accent/50',
                      today && 'ring-2 ring-primary',
                      isSelected && 'bg-primary/10'
                    )}
                  >
                    <span className={cn(
                      'text-sm',
                      getDay(day) === 0 && 'text-destructive',
                      getDay(day) === 6 && 'text-muted-foreground'
                    )}>
                      {format(day, 'd')}
                    </span>
                    <div className="flex gap-1 mt-0.5">
                      {hasEntry && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      )}
                      {leave && (
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                已填單
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                請假
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="flex gap-3">
          <Button
            className="flex-1"
            onClick={openDatePickerForWrite}
          >
            <BookHeart className="h-4 w-4 mr-2" />
            填寫觀心書
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setLeaveDate('');
              setShowLeaveDialog(true);
            }}
          >
            <CalendarOff className="h-4 w-4 mr-2" />
            請假
          </Button>
        </div>

        {/* Recent Leaves */}
        {leaves.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">本月請假紀錄</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {leaves.map(leave => (
                <div key={leave.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <span className="text-sm font-medium">{leave.date}</span>
                    {leave.reason && (
                      <span className="text-sm text-muted-foreground ml-2">({leave.reason})</span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => handleCancelLeave(leave.id)}
                  >
                    取消
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Write/Edit Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedDate && (
                <span>
                  ✨ {format(selectedDate, 'yyyy.MM.dd')} 觀心書
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="text-xs text-muted-foreground space-y-1">
              <p>🔒 保密文</p>
              <p>💡 可在隔日 12:00 前補單</p>
            </div>

            <Textarea
              value={content}
              onChange={e => {
                if (e.target.value.length <= MAX_CHARS) {
                  setContent(e.target.value);
                }
              }}
              placeholder={`【語】（言語互動）\n(-) 觀察今日言語...\n\nto do：\n...\n\n【意】（內在心念）\n(+) 觀察今日心念...\n\n🌊 修持轉化\n...`}
              className="min-h-[300px] text-sm leading-relaxed"
            />

            <div className="text-right text-xs text-muted-foreground">
              字數：{content.length} / {MAX_CHARS}
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={handleSubmit}
              disabled={submitGuanxin.isPending || !content.trim()}
              className="w-full"
              size="lg"
            >
              {submitGuanxin.isPending ? '送出中...' : editingId ? '修改' : '送出'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Leave Dialog */}
      <Dialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              請假申請 - {selectedDate && format(selectedDate, 'yyyy/MM/dd')}
            </DialogTitle>
          </DialogHeader>
          <Textarea
            value={leaveReason}
            onChange={e => setLeaveReason(e.target.value)}
            placeholder="請假原因（選填）"
            className="min-h-[80px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLeaveDialog(false)}>取消</Button>
            <Button
              onClick={handleLeaveSubmit}
              disabled={submitLeave.isPending}
            >
              {submitLeave.isPending ? '送出中...' : '確認請假'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Date Picker Dialog - choose today or yesterday */}
      <Dialog open={showDatePicker} onOpenChange={setShowDatePicker}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>選擇填寫日期</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            中午 12:00 前可補填前一天的觀心書，請選擇要填寫的日期：
          </p>
          <div className="flex flex-col gap-3 mt-2">
            {getSubmittableDates().map(date => {
              const dateStr = format(date, 'yyyy-MM-dd');
              const hasEntry = entryDates.has(dateStr);
              const isYesterday = isSameDay(date, subDays(startOfDay(new Date()), 1));
              return (
                <Button
                  key={dateStr}
                  variant={hasEntry ? 'outline' : 'default'}
                  className="w-full justify-between"
                  onClick={() => selectDateAndOpenForm(date)}
                >
                  <span>
                    {format(date, 'yyyy/MM/dd (EEEE)', { locale: zhTW })}
                    {isYesterday && ' （補填）'}
                  </span>
                  {hasEntry && <span className="text-xs text-muted-foreground">已填寫 - 點擊修改</span>}
                </Button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
