import { useEffect, useRef, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, User as UserIcon, ArrowLeft, Loader2 } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import {
  useConversations,
  useConversationMessages,
  useSendMessage,
  useMarkConversationRead,
} from '@/hooks/useMessages';
import { useUserPublicProfile } from '@/hooks/useMatching';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function Messages() {
  const [params, setParams] = useSearchParams();
  const partnerId = params.get('to');
  const { data: conversations, isLoading } = useConversations();

  const selectPartner = (id: string | null) => {
    if (id) setParams({ to: id });
    else setParams({});
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto">
        <div className="grid md:grid-cols-[320px_1fr] gap-4 h-[calc(100vh-10rem)]">
          {/* Conversation list */}
          <Card className={cn('overflow-hidden flex flex-col', partnerId && 'hidden md:flex')}>
            <div className="p-4 border-b">
              <h1 className="font-serif text-lg font-semibold flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                訊息
              </h1>
              <p className="text-xs text-muted-foreground mt-1">與道友互傳訊息</p>
            </div>
            <ScrollArea className="flex-1">
              {isLoading ? (
                <div className="p-6 text-center text-muted-foreground text-sm">載入中...</div>
              ) : !conversations?.length ? (
                <div className="p-6 text-center text-muted-foreground text-sm space-y-2">
                  <div>還沒有訊息</div>
                  <Link to="/match" className="text-primary hover:underline text-xs">
                    → 到每日一抽認識新道友
                  </Link>
                </div>
              ) : (
                <div className="divide-y">
                  {conversations.map(c => (
                    <button
                      key={c.partner_id}
                      onClick={() => selectPartner(c.partner_id)}
                      className={cn(
                        'w-full text-left p-3 hover:bg-accent transition-colors flex items-start gap-3',
                        partnerId === c.partner_id && 'bg-accent'
                      )}
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <UserIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium truncate">{c.partner_name}</span>
                          <span className="text-[10px] text-muted-foreground flex-shrink-0">
                            {formatDistanceToNow(new Date(c.last_at), { locale: zhTW, addSuffix: false })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground truncate">{c.last_message}</span>
                          {Number(c.unread_count) > 0 && (
                            <Badge className="h-5 min-w-5 px-1.5 text-[10px]">{c.unread_count}</Badge>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </Card>

          {/* Thread */}
          <Card className={cn('overflow-hidden flex flex-col', !partnerId && 'hidden md:flex')}>
            {partnerId ? (
              <Thread partnerId={partnerId} onBack={() => selectPartner(null)} />
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                從左側選擇道友開始對話
              </div>
            )}
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

function Thread({ partnerId, onBack }: { partnerId: string; onBack: () => void }) {
  const { user } = useAuth();
  const { data: profile } = useUserPublicProfile(partnerId);
  const { data: messages, isLoading } = useConversationMessages(partnerId);
  const send = useSendMessage();
  const markRead = useMarkConversationRead(partnerId);
  const [text, setText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages?.length) {
      markRead.mutate();
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages?.length]);

  const handleSend = async () => {
    if (!text.trim()) return;
    try {
      await send.mutateAsync({ toUserId: partnerId, content: text });
      setText('');
    } catch (e: any) {
      toast.error(e.message ?? '送出失敗');
    }
  };

  return (
    <>
      <div className="p-3 border-b flex items-center gap-3">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
          <UserIcon className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{profile?.name ?? '...'}</div>
          {profile?.detail?.region && (
            <div className="text-xs text-muted-foreground">{profile.detail.region}</div>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1" viewportRef={scrollRef as any}>
        <div className="p-4 space-y-3">
          {isLoading ? (
            <div className="text-center text-muted-foreground text-sm">載入中...</div>
          ) : !messages?.length ? (
            <div className="text-center text-muted-foreground text-sm py-8">
              還沒有訊息，開始第一句問候吧 🙏
            </div>
          ) : (
            messages.map(m => {
              const mine = m.from_user_id === user?.id;
              return (
                <div key={m.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                  <div
                    className={cn(
                      'max-w-[75%] rounded-2xl px-3.5 py-2 text-sm',
                      mine
                        ? 'bg-primary text-primary-foreground rounded-br-sm'
                        : 'bg-muted text-foreground rounded-bl-sm'
                    )}
                  >
                    <div className="whitespace-pre-wrap break-words">{m.content}</div>
                    <div
                      className={cn(
                        'text-[10px] mt-1',
                        mine ? 'text-primary-foreground/70' : 'text-muted-foreground'
                      )}
                    >
                      {format(new Date(m.created_at), 'MM/dd HH:mm')}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      <div className="p-3 border-t flex gap-2">
        <Input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="輸入訊息..."
          maxLength={1000}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <Button onClick={handleSend} disabled={send.isPending || !text.trim()}>
          {send.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </>
  );
}
