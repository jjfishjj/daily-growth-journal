import { useState, useMemo } from 'react';
import { format, subMonths, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAllGuanxinEntries, useAllGuanxinLeaves, useReviewLeave } from '@/hooks/useGuanxin';
import { useAllUsers } from '@/hooks/useAdmin';
import { ChevronLeft, ChevronRight, Check, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'];

export default function GuanxinAdmin() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedUserId, setSelectedUserId] = useState<string>('all');
  const [viewContent, setViewContent] = useState<{ date: string; content: string; userName: string } | null>(null);
  const [reviewingLeave, setReviewingLeave] = useState<any | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const { toast } = useToast();
  const reviewLeave = useReviewLeave();

  const monthKey = format(currentMonth, 'yyyy-MM');
  const { data: entries = [] } = useAllGuanxinEntries(monthKey);
  const { data: leaves = [] } = useAllGuanxinLeaves(monthKey);
  const { data: users = [] } = useAllUsers();

  const userMap = useMemo(() => {
    const map = new Map<string, string>();
    users.forEach(u => map.set(u.user_id, u.name || '未命名'));
    return map;
  }, [users]);

  const filteredEntries = useMemo(() =>
    selectedUserId === 'all' ? entries : entries.filter(e => e.user_id === selectedUserId),
    [entries, selectedUserId]
  );

  const filteredLeaves = useMemo(() =>
    selectedUserId === 'all' ? leaves : leaves.filter(l => l.user_id === selectedUserId),
    [leaves, selectedUserId]
  );

  // Per-user summary
  const userSummary = useMemo(() => {
    const summary = new Map<string, { entries: number; leaves: number }>();
    entries.forEach(e => {
      const s = summary.get(e.user_id) || { entries: 0, leaves: 0 };
      s.entries++;
      summary.set(e.user_id, s);
    });
    leaves.forEach(l => {
      const s = summary.get(l.user_id) || { entries: 0, leaves: 0 };
      s.leaves++;
      summary.set(l.user_id, s);
    });
    return summary;
  }, [entries, leaves]);

  // Calendar view data
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart);

  const entryDateCounts = useMemo(() => {
    const map = new Map<string, number>();
    filteredEntries.forEach(e => map.set(e.date, (map.get(e.date) || 0) + 1));
    return map;
  }, [filteredEntries]);

  const leaveDateCounts = useMemo(() => {
    const map = new Map<string, number>();
    filteredLeaves.forEach(l => map.set(l.date, (map.get(l.date) || 0) + 1));
    return map;
  }, [filteredLeaves]);

  return (
    <div className="space-y-6">
      {/* Month selector + filter */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setCurrentMonth(m => subMonths(m, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-medium text-lg min-w-[120px] text-center">
            {format(currentMonth, 'yyyy年 M月', { locale: zhTW })}
          </span>
          <Button variant="outline" size="sm" onClick={() => setCurrentMonth(m => addMonths(m, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <Select value={selectedUserId} onValueChange={setSelectedUserId}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="篩選會員" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部會員</SelectItem>
            {users.map(u => (
              <SelectItem key={u.user_id} value={u.user_id}>
                {u.name || u.user_id.slice(0, 8)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-primary">{filteredEntries.length}</div>
            <div className="text-sm text-muted-foreground">總填單數</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-destructive">{filteredLeaves.length}</div>
            <div className="text-sm text-muted-foreground">總請假數</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold">{userSummary.size}</div>
            <div className="text-sm text-muted-foreground">活躍會員</div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">月曆總覽</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 mb-2">
            {WEEKDAY_LABELS.map((label, i) => (
              <div key={label} className={cn(
                'text-center text-xs font-medium py-1',
                i === 0 && 'text-destructive',
                i === 6 && 'text-muted-foreground'
              )}>
                {label}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({ length: startDayOfWeek }).map((_, i) => (
              <div key={`e-${i}`} className="h-12" />
            ))}
            {daysInMonth.map(day => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const ec = entryDateCounts.get(dateStr) || 0;
              const lc = leaveDateCounts.get(dateStr) || 0;
              return (
                <div key={dateStr} className="h-12 flex flex-col items-center justify-center text-xs">
                  <span>{format(day, 'd')}</span>
                  <div className="flex gap-0.5">
                    {ec > 0 && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                    {lc > 0 && <span className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" />有填單</div>
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" />有請假</div>
          </div>
        </CardContent>
      </Card>

      {/* Per-user summary table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">會員填寫概覽</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>會員</TableHead>
                <TableHead className="text-center">填單數</TableHead>
                <TableHead className="text-center">請假數</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from(userSummary.entries()).map(([userId, stats]) => (
                <TableRow key={userId}>
                  <TableCell>{userMap.get(userId) || userId.slice(0, 8)}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{stats.entries}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {stats.leaves > 0 ? (
                      <Badge variant="destructive">{stats.leaves}</Badge>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {userSummary.size === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                    本月尚無紀錄
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent entries list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">填寫紀錄明細</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>日期</TableHead>
                <TableHead>會員</TableHead>
                <TableHead>內容預覽</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.slice(0, 50).map(entry => (
                <TableRow key={entry.id}>
                  <TableCell className="whitespace-nowrap">{entry.date}</TableCell>
                  <TableCell>{userMap.get(entry.user_id) || entry.user_id.slice(0, 8)}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{entry.content.slice(0, 50)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewContent({
                        date: entry.date,
                        content: entry.content,
                        userName: userMap.get(entry.user_id) || entry.user_id.slice(0, 8),
                      })}
                    >
                      查看
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredEntries.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    尚無填寫紀錄
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View content dialog */}
      <Dialog open={!!viewContent} onOpenChange={() => setViewContent(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              ✨ {viewContent?.date} 觀心書 · {viewContent?.userName}
            </DialogTitle>
          </DialogHeader>
          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {viewContent?.content}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
