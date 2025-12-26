import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAllEntries } from '@/hooks/useAdmin';
import { useHabits } from '@/hooks/useHabits';
import { toast } from 'sonner';
import { Bot, Send, Loader2, Sparkles, MessageSquare } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function AIAnalysis() {
  const { data: entries } = useAllEntries();
  const { data: habits } = useHabits();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summary, setSummary] = useState('');

  const getCommentsData = () => {
    if (!entries) return [];
    return entries
      .filter(e => e.overall_comment && e.overall_comment.trim())
      .map(e => ({
        date: e.date,
        comment: e.overall_comment,
        habits: e.daily_habit_records
          ?.filter(r => r.completed)
          .map(r => habits?.find(h => h.id === r.habit_id)?.name)
          .filter(Boolean) || []
      }));
  };

  const handleGenerateSummary = async () => {
    const comments = getCommentsData();
    if (comments.length === 0) {
      toast.error('沒有足夠的評語資料可供分析');
      return;
    }

    setSummaryLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-comments', {
        body: { comments, analysisType: 'summary' }
      });

      if (error) throw error;
      setSummary(data.result);
    } catch (error: any) {
      toast.error(error.message || '分析失敗');
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const comments = getCommentsData();
    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-comments', {
        body: { comments, analysisType: 'chat', question: userMessage }
      });

      if (error) throw error;
      setMessages(prev => [...prev, { role: 'assistant', content: data.result }]);
    } catch (error: any) {
      toast.error(error.message || '回應失敗');
      setMessages(prev => [...prev, { role: 'assistant', content: '抱歉，無法處理您的問題，請稍後再試。' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            評論總結分析
          </CardTitle>
          <CardDescription>AI 自動分析所有用戶評語，提供洞察和建議</CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleGenerateSummary} 
            disabled={summaryLoading}
            className="mb-4"
          >
            {summaryLoading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />分析中...</>
            ) : (
              <><Sparkles className="mr-2 h-4 w-4" />生成總結分析</>
            )}
          </Button>

          {summary && (
            <div className="p-4 bg-secondary/30 rounded-lg whitespace-pre-wrap">
              {summary}
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Chatbot */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI 數據助手
          </CardTitle>
          <CardDescription>向 AI 提問關於用戶習慣和評語的問題</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-80 mb-4 p-4 border rounded-lg bg-background/50">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <Bot className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>向我提問任何關於用戶習慣數據的問題</p>
                  <p className="text-sm mt-2">例如："哪個習慣完成率最高？"</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, i) => (
                  <div 
                    key={i} 
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-[80%] p-3 rounded-lg ${
                        msg.role === 'user' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-secondary'
                      }`}
                    >
                      {msg.role === 'assistant' && (
                        <Bot className="h-4 w-4 mb-1 inline-block mr-1" />
                      )}
                      <span className="whitespace-pre-wrap">{msg.content}</span>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-secondary p-3 rounded-lg flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      思考中...
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="輸入您的問題..."
              className="min-h-[60px] resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={isLoading || !input.trim()}
              size="icon"
              className="h-[60px] w-[60px]"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
