import apiClient from './ApiClient';

export interface Group {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  invite_code: string;
  max_members: number;
  created_at: string;
  updated_at: string;
  role?: string;
  member_count?: number;
}

export interface GroupMember {
  id: string;
  role: string;
  joined_at: string;
  user_id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
}

class GroupService {
  // Create new group
  async createGroup(name: string, description?: string): Promise<{ success: boolean; group?: Group; error?: string }> {
    const response = await apiClient.post<{ group: Group }>('/groups', {
      name,
      description,
    });

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true, group: response.data!.group };
  }

  // Get user's groups
  async getGroups(): Promise<{ success: boolean; groups?: Group[]; error?: string }> {
    const response = await apiClient.get<{ groups: Group[] }>('/groups');

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true, groups: response.data!.groups };
  }

  // Get group by ID
  async getGroup(groupId: string): Promise<{ success: boolean; group?: Group; error?: string }> {
    const response = await apiClient.get<{ group: Group }>(`/groups/${groupId}`);

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true, group: response.data!.group };
  }

  // Update group
  async updateGroup(groupId: string, updates: { name?: string; description?: string }): Promise<{ success: boolean; group?: Group; error?: string }> {
    const response = await apiClient.patch<{ group: Group }>(`/groups/${groupId}`, updates);

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true, group: response.data!.group };
  }

  // Delete group
  async deleteGroup(groupId: string): Promise<{ success: boolean; error?: string }> {
    const response = await apiClient.delete(`/groups/${groupId}`);

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true };
  }

  // Get group members
  async getMembers(groupId: string): Promise<{ success: boolean; members?: GroupMember[]; error?: string }> {
    const response = await apiClient.get<{ members: GroupMember[] }>(`/groups/${groupId}/members`);

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true, members: response.data!.members };
  }

  // Remove member from group
  async removeMember(groupId: string, memberId: string): Promise<{ success: boolean; error?: string }> {
    const response = await apiClient.delete(`/groups/${groupId}/members/${memberId}`);

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true };
  }

  // Update member role
  async updateMemberRole(groupId: string, memberId: string, role: string): Promise<{ success: boolean; error?: string }> {
    const response = await apiClient.patch(`/groups/${groupId}/members/${memberId}`, { role });

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true };
  }
}

export const groupService = new GroupService();
export default groupService;

