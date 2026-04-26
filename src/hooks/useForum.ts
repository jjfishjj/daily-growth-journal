import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

export interface ForumCategory {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  habit_id: string | null;
  slug: string;
  sort_order: number;
}

export interface ForumPost {
  id: string;
  user_id: string;
  category_id: string;
  title: string | null;
  content: string;
  source_type: 'manual' | 'guanxin' | 'declutter' | string;
  source_id: string | null;
  like_count: number;
  comment_count: number;
  share_count: number;
  is_pinned: boolean;
  created_at: string;
  author_name?: string;
  category_name?: string;
  category_slug?: string;
  liked_by_me?: boolean;
}

export interface ForumComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author_name?: string;
}

export function useForumCategories() {
  return useQuery({
    queryKey: ['forum-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('forum_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data as ForumCategory[];
    },
  });
}

export function useForumPosts(categoryId?: string | null) {
  const { user } = useAuth();
  const qc = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('forum-posts-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'forum_posts' }, () =>
        qc.invalidateQueries({ queryKey: ['forum-posts'] }))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'forum_likes' }, () =>
        qc.invalidateQueries({ queryKey: ['forum-posts'] }))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  return useQuery({
    queryKey: ['forum-posts', categoryId ?? 'all'],
    queryFn: async () => {
      let q = supabase
        .from('forum_posts')
        .select('*, forum_categories(name, slug)')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(50);
      if (categoryId) q = q.eq('category_id', categoryId);
      const { data, error } = await q;
      if (error) throw error;

      const userIds = Array.from(new Set((data ?? []).map((p) => p.user_id)));
      let nameMap: Record<string, string> = {};
      if (userIds.length) {
        const { data: profiles } = await supabase.from('profiles').select('user_id, name').in('user_id', userIds);
        nameMap = Object.fromEntries((profiles ?? []).map((p) => [p.user_id, p.name || '匿名']));
      }

      let likedSet = new Set<string>();
      if (user && data?.length) {
        const { data: likes } = await supabase
          .from('forum_likes')
          .select('post_id')
          .eq('user_id', user.id)
          .in('post_id', data.map((p) => p.id));
        likedSet = new Set((likes ?? []).map((l) => l.post_id));
      }

      return (data ?? []).map((p) => ({
        ...p,
        author_name: nameMap[p.user_id] || '匿名',
        category_name: (p as any).forum_categories?.name,
        category_slug: (p as any).forum_categories?.slug,
        liked_by_me: likedSet.has(p.id),
      })) as ForumPost[];
    },
  });
}

export function useForumPost(postId: string | null) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['forum-post', postId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('forum_posts')
        .select('*, forum_categories(name, slug)')
        .eq('id', postId!)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const { data: profile } = await supabase.from('profiles').select('name').eq('user_id', data.user_id).maybeSingle();
      let liked = false;
      if (user) {
        const { data: like } = await supabase.from('forum_likes')
          .select('id').eq('post_id', data.id).eq('user_id', user.id).maybeSingle();
        liked = !!like;
      }
      return {
        ...data,
        author_name: profile?.name || '匿名',
        category_name: (data as any).forum_categories?.name,
        category_slug: (data as any).forum_categories?.slug,
        liked_by_me: liked,
      } as ForumPost;
    },
    enabled: !!postId,
  });
}

export function useForumComments(postId: string | null) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!postId) return;
    const channel = supabase
      .channel(`forum-comments-${postId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'forum_comments', filter: `post_id=eq.${postId}` }, () =>
        qc.invalidateQueries({ queryKey: ['forum-comments', postId] }))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [postId, qc]);

  return useQuery({
    queryKey: ['forum-comments', postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('forum_comments')
        .select('*')
        .eq('post_id', postId!)
        .order('created_at');
      if (error) throw error;
      const userIds = Array.from(new Set((data ?? []).map((c) => c.user_id)));
      let nameMap: Record<string, string> = {};
      if (userIds.length) {
        const { data: profiles } = await supabase.from('profiles').select('user_id, name').in('user_id', userIds);
        nameMap = Object.fromEntries((profiles ?? []).map((p) => [p.user_id, p.name || '匿名']));
      }
      return (data ?? []).map((c) => ({ ...c, author_name: nameMap[c.user_id] || '匿名' })) as ForumComment[];
    },
    enabled: !!postId,
  });
}

export function useCreateForumPost() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      category_id: string; title?: string; content: string;
      source_type?: 'manual' | 'guanxin' | 'declutter'; source_id?: string | null;
    }) => {
      const { error, data } = await supabase.from('forum_posts').insert({
        user_id: user!.id,
        category_id: params.category_id,
        title: params.title || null,
        content: params.content,
        source_type: params.source_type ?? 'manual',
        source_id: params.source_id ?? null,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['forum-posts'] });
      qc.invalidateQueries({ queryKey: ['energy-balance'] });
    },
  });
}

export function useDeleteForumPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('forum_posts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['forum-posts'] }),
  });
}

export function useToggleForumLike() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, liked }: { postId: string; liked: boolean }) => {
      if (liked) {
        const { error } = await supabase.from('forum_likes').delete().eq('post_id', postId).eq('user_id', user!.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('forum_likes').insert({ post_id: postId, user_id: user!.id });
        if (error) throw error;
      }
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['forum-posts'] });
      qc.invalidateQueries({ queryKey: ['forum-post', vars.postId] });
    },
  });
}

export function useCreateForumComment() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, content }: { postId: string; content: string }) => {
      const { error } = await supabase.from('forum_comments').insert({
        post_id: postId, user_id: user!.id, content,
      });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['forum-comments', vars.postId] });
      qc.invalidateQueries({ queryKey: ['forum-posts'] });
      qc.invalidateQueries({ queryKey: ['forum-post', vars.postId] });
      qc.invalidateQueries({ queryKey: ['energy-balance'] });
    },
  });
}

export function useShareForumPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase.rpc('increment_forum_share', { _post_id: postId });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['forum-posts'] }),
  });
}
