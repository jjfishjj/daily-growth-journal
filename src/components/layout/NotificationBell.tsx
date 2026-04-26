import { Link } from 'react-router-dom';
import { Bell, Check } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useNotifications, type NotificationItem } from '@/hooks/useNotifications';

function formatTime(item: NotificationItem) {
  if (item.created_at) {
    try {
      return formatDistanceToNow(parseISO(item.created_at), { addSuffix: true, locale: zhTW });
    } catch { return ''; }
  }
  if (item.remind_at) {
    if (item.status === 'overdue') return '已逾期';
    if (item.status === 'due') return '今日到期';
    return `提醒：${item.remind_at}`;
  }
  return '';
}

const STATUS_RING: Record<string, string> = {
  overdue: 'ring-2 ring-destructive/40',
  due: 'ring-2 ring-primary/40',
};

export function NotificationBell() {
  const { data } = useNotifications();
  const items = data?.items ?? [];
  const total = items.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="通知">
          <Bell className="h-5 w-5" />
          {total > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-[10px] flex items-center justify-center bg-destructive text-destructive-foreground border-2 border-background"
            >
              {total > 99 ? '99+' : total}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] p-0">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="font-medium">通知</span>
          {total > 0 && (
            <span className="text-xs text-muted-foreground">{total} 則待處理</span>
          )}
        </div>
        <Separator />
        <ScrollArea className="max-h-[420px]">
          {total === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground space-y-2">
              <Check className="h-8 w-8 mx-auto text-primary/60" />
              <div>目前沒有新通知</div>
            </div>
          ) : (
            <div className="py-1">
              {items.map((item) => (
                <Link
                  key={item.id}
                  to={item.link}
                  className="flex gap-3 px-4 py-3 hover:bg-muted/50 transition-colors border-b border-border/30 last:border-0"
                >
                  <div
                    className={cn(
                      'h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-base shrink-0',
                      item.status && STATUS_RING[item.status],
                    )}
                  >
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-tight">{item.title}</p>
                    {item.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {item.description}
                      </p>
                    )}
                    <p className="text-[11px] text-muted-foreground mt-1">{formatTime(item)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
