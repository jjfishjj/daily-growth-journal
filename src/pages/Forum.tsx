import { useState, useMemo } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  MessageSquare, Heart, Share2, ChevronLeft, Plus, Send, Trash2, Pin, ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import {
  useForumCategories, useForumPosts, useForumPost, useForumComments,
  useCreateForumPost, useToggleForumLike, useCreateForumComment,
  useShareForumPost, useDeleteForumPost,
  type ForumPost, type ForumCategory,
} from '@/hooks/useForum';

function relTime(s: string) {
  try { return formatDistanceToNow(parseISO(s), { addSuffix: true, locale: zhTW }); }
  catch { return ''; }
}

function CategorySidebar({ categories, activeId, onSelect }: {
  categories: ForumCategory[];
  activeId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const habits = categories.filter((c) => c.habit_id);
  const special = categories.filter((c) => !c.habit_id);
  const [habitsOpen, setHabitsOpen] = useState(true);

  const renderItem = (c: ForumCategory | null, label: string, icon?: string) => {
    const id = c?.id ?? null;
    const active = activeId === id;
    return (
      <button
        key={c?.id ?? 'all'}
        onClick={() => onSelect(id)}
        className={cn(
          'w-full text-left flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
          active ? 'bg-primary/15 text-primary font-medium' : 'hover:bg-muted/60'
        )}
      >
        <span className="text-base">{icon ?? c?.icon ?? '🌿'}</span>
        <span className="truncate">{label}</span>
      </button>
    );
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <span className="text-base">📚</span> 精選主題
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 pt-0">
        {renderItem(null, '全部', '🌍')}
        {special.map((c) => renderItem(c, c.name))}
        <Separator className="my-2" />
        <Collapsible open={habitsOpen} onOpenChange={setHabitsOpen}>
          <CollapsibleTrigger className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-muted/60 rounded-md">
            <span className="flex items-center gap-2"><span>🌿</span>16 修行習慣</span>
            <ChevronDown className={cn('h-4 w-4 transition-transform', habitsOpen && 'rotate-180')} />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1 pl-2 mt-1 border-l-2 border-primary/20 ml-3">
            {habits.map((c) => renderItem(c, c.name.replace('🌿 ', '')))}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}

function PostCard({ post, onOpen }: { post: ForumPost; onOpen: () => void }) {
  const { user } = useAuth();
  const toggleLike = useToggleForumLike();
  const share = useShareForumPost();
  const deletePost = useDeleteForumPost();

  const handleShare = async () => {
    try {
      const url = `${window.location.origin}/forum/post/${post.id}`;
      if (navigator.share) {
        await navigator.share({ title: post.title || '修行日誌貼文', text: post.content.slice(0, 100), url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('連結已複製');
      }
      share.mutate(post.id);
    } catch { /* user cancelled */ }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('確定刪除此貼文？')) return;
    try {
      await deletePost.mutateAsync(post.id);
      toast.success('已刪除');
    } catch { toast.error('刪除失敗'); }
  };

  return (
    <Card className="border-border/50 hover:border-primary/30 transition-colors">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback>{post.author_name?.slice(0, 1) || '?'}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">{post.author_name}</span>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground">{relTime(post.created_at)}</span>
              {post.is_pinned && (
                <Badge variant="secondary" className="gap-1 text-[10px]">
                  <Pin className="h-3 w-3" />置頂
                </Badge>
              )}
              {post.source_type === 'guanxin' && <Badge variant="outline" className="text-[10px]">📖 觀心書</Badge>}
              {post.source_type === 'declutter' && <Badge variant="outline" className="text-[10px]">♻️ 斷捨離</Badge>}
            </div>
            <Link to={`/forum/category/${post.category_slug}`} className="text-xs text-primary hover:underline">
              {post.category_name}
            </Link>
          </div>
          {user?.id === post.user_id && (
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={handleDelete}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        <div className="cursor-pointer" onClick={onOpen}>
          {post.title && <h3 className="font-medium text-base mb-1 line-clamp-2">{post.title}</h3>}
          <p className="text-sm text-foreground/90 whitespace-pre-wrap line-clamp-6 leading-relaxed">
            {post.content}
          </p>
        </div>

        <div className="flex items-center gap-1 pt-1 border-t border-border/30">
          <Button
            variant="ghost"
            size="sm"
            className={cn('gap-1.5', post.liked_by_me && 'text-destructive')}
            onClick={() => toggleLike.mutate({ postId: post.id, liked: !!post.liked_by_me })}
          >
            <Heart className={cn('h-4 w-4', post.liked_by_me && 'fill-current')} />
            {post.like_count}
          </Button>
          <Button variant="ghost" size="sm" className="gap-1.5" onClick={onOpen}>
            <MessageSquare className="h-4 w-4" />
            {post.comment_count}
          </Button>
          <Button variant="ghost" size="sm" className="gap-1.5" onClick={handleShare}>
            <Share2 className="h-4 w-4" />
            {post.share_count}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function NewPostDialog({ open, onOpenChange, defaultCategoryId, categories }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultCategoryId: string | null;
  categories: ForumCategory[];
}) {
  const [categoryId, setCategoryId] = useState<string>(defaultCategoryId ?? categories[0]?.id ?? '');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const create = useCreateForumPost();

  const handleSubmit = async () => {
    if (!content.trim()) { toast.error('請輸入內容'); return; }
    if (!categoryId) { toast.error('請選擇分類'); return; }
    try {
      await create.mutateAsync({ category_id: categoryId, title: title.trim() || undefined, content: content.trim() });
      toast.success('發文成功 ✨', { description: '+5 能量點數' });
      setTitle(''); setContent('');
      onOpenChange(false);
    } catch { toast.error('發文失敗'); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>發表新貼文</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">分類</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger><SelectValue placeholder="選擇分類" /></SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">標題（選填）</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="幫貼文取一個名字..." />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">內容</Label>
            <Textarea value={content} onChange={(e) => setContent(e.target.value)}
              placeholder="分享你的修行心得、觀心書反思或斷捨離歷程..."
              className="min-h-[180px] resize-none" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={handleSubmit} disabled={create.isPending}>
            <Send className="h-4 w-4 mr-2" />發布
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PostDetail({ postId, onBack }: { postId: string; onBack: () => void }) {
  const { user } = useAuth();
  const { data: post, isLoading } = useForumPost(postId);
  const { data: comments = [] } = useForumComments(postId);
  const toggleLike = useToggleForumLike();
  const createComment = useCreateForumComment();
  const share = useShareForumPost();

  const [reply, setReply] = useState('');

  const handleReply = async () => {
    if (!reply.trim()) return;
    try {
      await createComment.mutateAsync({ postId, content: reply.trim() });
      setReply('');
      toast.success('回覆成功 +2 能量點數');
    } catch { toast.error('回覆失敗'); }
  };

  const handleShare = async () => {
    if (!post) return;
    try {
      const url = `${window.location.origin}/forum/post/${post.id}`;
      if (navigator.share) await navigator.share({ title: post.title || '修行日誌貼文', text: post.content.slice(0, 100), url });
      else { await navigator.clipboard.writeText(url); toast.success('連結已複製'); }
      share.mutate(post.id);
    } catch { /* */ }
  };

  if (isLoading) return <div className="text-center py-12 text-muted-foreground">載入中...</div>;
  if (!post) return <div className="text-center py-12 text-muted-foreground">找不到貼文</div>;

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
        <ChevronLeft className="h-4 w-4" /> 返回
      </Button>

      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback>{post.author_name?.slice(0, 1) || '?'}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="font-medium">{post.author_name}</div>
              <div className="text-xs text-muted-foreground">
                {relTime(post.created_at)} · {post.category_name}
              </div>
            </div>
          </div>
          {post.title && <h2 className="font-serif text-xl">{post.title}</h2>}
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{post.content}</p>
          <Separator />
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className={cn('gap-1.5', post.liked_by_me && 'text-destructive')}
              onClick={() => toggleLike.mutate({ postId: post.id, liked: !!post.liked_by_me })}>
              <Heart className={cn('h-4 w-4', post.liked_by_me && 'fill-current')} />
              {post.like_count}
            </Button>
            <Button variant="ghost" size="sm" className="gap-1.5">
              <MessageSquare className="h-4 w-4" /> {post.comment_count}
            </Button>
            <Button variant="ghost" size="sm" className="gap-1.5" onClick={handleShare}>
              <Share2 className="h-4 w-4" /> {post.share_count}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">回覆 ({comments.length})</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {user && (
            <div className="flex gap-2">
              <Textarea
                value={reply} onChange={(e) => setReply(e.target.value)}
                placeholder="留下你的回覆..." className="min-h-[60px] resize-none flex-1"
              />
              <Button onClick={handleReply} disabled={createComment.isPending} size="icon" className="self-end">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          )}
          <div className="space-y-3 mt-3">
            {comments.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-6">尚無回覆，搶先留言吧</p>
            ) : comments.map((c) => (
              <div key={c.id} className="flex gap-3 p-3 rounded-md bg-muted/30">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">{c.author_name?.slice(0, 1) || '?'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-medium">{c.author_name}</span>
                    <span className="text-muted-foreground">{relTime(c.created_at)}</span>
                  </div>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{c.content}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Forum() {
  const params = useParams<{ slug?: string; postId?: string }>();
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const [postOpen, setPostOpen] = useState(false);

  const { data: categories = [] } = useForumCategories();
  const activeCategory = useMemo(() => {
    if (!params.slug) return null;
    return categories.find((c) => c.slug === params.slug) ?? null;
  }, [params.slug, categories]);
  const activeId = activeCategory?.id ?? null;

  const { data: posts = [], isLoading } = useForumPosts(activeId);

  if (params.postId) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto">
          <PostDetail postId={params.postId} onBack={() => navigate('/forum')} />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto grid md:grid-cols-[260px_1fr] gap-6">
        <aside className="space-y-4">
          <CategorySidebar
            categories={categories}
            activeId={activeId}
            onSelect={(id) => {
              const cat = id ? categories.find((c) => c.id === id) : null;
              navigate(cat ? `/forum/category/${cat.slug}` : '/forum');
            }}
          />
        </aside>

        <main className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-serif text-2xl font-semibold">
                {activeCategory ? activeCategory.name : '論壇動態牆'}
              </h1>
              {activeCategory?.description && (
                <p className="text-sm text-muted-foreground mt-1">{activeCategory.description}</p>
              )}
            </div>
            <Button onClick={() => setPostOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />發文
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">載入中...</div>
          ) : posts.length === 0 ? (
            <Card className="border-dashed"><CardContent className="py-12 text-center text-muted-foreground">
              這個分類還沒有貼文，成為第一個分享的人吧 ✨
            </CardContent></Card>
          ) : (
            posts.map((p) => (
              <PostCard key={p.id} post={p} onOpen={() => navigate(`/forum/post/${p.id}`)} />
            ))
          )}
        </main>

        <NewPostDialog
          open={postOpen}
          onOpenChange={setPostOpen}
          defaultCategoryId={activeId}
          categories={categories}
        />
      </div>
    </AppLayout>
  );
}
