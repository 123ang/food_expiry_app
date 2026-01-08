import apiClient from './ApiClient';

export interface Invitation {
  id: string;
  group_id: string;
  invited_by: string;
  invited_email: string;
  invite_code: string;
  status: string;
  expires_at: string;
  created_at: string;
  group_name?: string;
  group_description?: string;
  invited_by_name?: string;
  invited_by_email?: string;
}

class InvitationService {
  // Send invitation
  async sendInvitation(groupId: string, email: string): Promise<{ success: boolean; invitation?: Invitation; error?: string }> {
    const response = await apiClient.post<{ invitation: Invitation }>('/invitations/send', {
      group_id: groupId,
      email,
    });

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true, invitation: response.data!.invitation };
  }

  // Get user's pending invitations
  async getInvitations(): Promise<{ success: boolean; invitations?: Invitation[]; error?: string }> {
    const response = await apiClient.get<{ invitations: Invitation[] }>('/invitations');

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true, invitations: response.data!.invitations };
  }

  // Join group via invite code
  async joinWithCode(inviteCode: string): Promise<{ success: boolean; error?: string }> {
    const response = await apiClient.post('/invitations/join', {
      invite_code: inviteCode,
    });

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true };
  }

  // Accept invitation
  async acceptInvitation(invitationId: string): Promise<{ success: boolean; error?: string }> {
    const response = await apiClient.post(`/invitations/${invitationId}/accept`);

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true };
  }

  // Decline invitation
  async declineInvitation(invitationId: string): Promise<{ success: boolean; error?: string }> {
    const response = await apiClient.post(`/invitations/${invitationId}/decline`);

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { success: true };
  }

  // Verify invite code
  async verifyInviteCode(inviteCode: string): Promise<{ success: boolean; valid?: boolean; group?: any; error?: string }> {
    const response = await apiClient.get<{ valid: boolean; group?: any; error?: string }>(`/invitations/verify/${inviteCode}`);

    if (response.error) {
      return { success: false, error: response.error };
    }

    return { 
      success: true, 
      valid: response.data!.valid,
      group: response.data!.group,
      error: response.data!.error,
    };
  }
}

export const invitationService = new InvitationService();
export default invitationService;

