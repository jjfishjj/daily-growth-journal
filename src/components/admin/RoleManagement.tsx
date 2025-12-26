import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAllRoles, useAssignRole, useRemoveRole } from '@/hooks/useRoles';
import { useAllUsers } from '@/hooks/useAdmin';
import { toast } from 'sonner';
import { Shield, UserPlus, Trash2, Loader2 } from 'lucide-react';

export function RoleManagement() {
  const { data: users } = useAllUsers();
  const { data: roles, isLoading: rolesLoading } = useAllRoles();
  const assignRole = useAssignRole();
  const removeRole = useRemoveRole();

  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<'admin' | 'user'>('user');

  const handleAssignRole = async () => {
    if (!selectedUserId) {
      toast.error('請選擇用戶');
      return;
    }

    try {
      await assignRole.mutateAsync({ userId: selectedUserId, role: selectedRole });
      toast.success('角色已分配');
      setSelectedUserId('');
    } catch (error: any) {
      toast.error(error.message || '分配失敗');
    }
  };

  const handleRemoveRole = async (roleId: string) => {
    try {
      await removeRole.mutateAsync(roleId);
      toast.success('角色已移除');
    } catch (error) {
      toast.error('移除失敗');
    }
  };

  const getUserName = (userId: string) => {
    const user = users?.find(u => u.user_id === userId);
    return user?.name || userId.slice(0, 8) + '...';
  };

  return (
    <div className="space-y-6">
      {/* Assign Role */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            分配權限
          </CardTitle>
          <CardDescription>為用戶分配管理員或普通用戶角色</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="選擇用戶" />
              </SelectTrigger>
              <SelectContent>
                {users?.map(user => (
                  <SelectItem key={user.user_id} value={user.user_id}>
                    {user.name || '未命名'} ({user.user_id.slice(0, 8)}...)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedRole} onValueChange={(v: 'admin' | 'user') => setSelectedRole(v)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">管理員</SelectItem>
                <SelectItem value="user">普通用戶</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={handleAssignRole} disabled={assignRole.isPending}>
              {assignRole.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : '分配'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current Roles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            當前角色列表
          </CardTitle>
          <CardDescription>所有已分配角色的用戶</CardDescription>
        </CardHeader>
        <CardContent>
          {rolesLoading ? (
            <div className="text-center py-8 text-muted-foreground">載入中...</div>
          ) : roles?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">暫無角色分配</div>
          ) : (
            <div className="space-y-2">
              {roles?.map(role => (
                <div 
                  key={role.id} 
                  className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{getUserName(role.user_id)}</span>
                    <Badge variant={role.role === 'admin' ? 'default' : 'secondary'}>
                      {role.role === 'admin' ? '管理員' : '普通用戶'}
                    </Badge>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleRemoveRole(role.id)}
                    disabled={removeRole.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
