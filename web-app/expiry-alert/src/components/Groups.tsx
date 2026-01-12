import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useGroup } from '../contexts/GroupContext';
import {
  getGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  getGroupMembers,
  sendInvitation,
  removeMember,
  updateMemberRole,
  getUserInvitations,
  acceptInvitation,
  declineInvitation,
  joinGroupWithCode,
  verifyInviteCode,
  Group,
  GroupMembership,
  Invitation
} from '../services/postgresApiService';

const Groups: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { refreshGroups, setCurrentGroup, currentGroup } = useGroup();
  
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMembership[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  
  // Form states
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [groupsData, invitationsData] = await Promise.all([
        getGroups(),
        getUserInvitations()
      ]);
      setGroups(groupsData);
      setInvitations(invitationsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      toast.error('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async (groupId: string) => {
    try {
      const membersData = await getGroupMembers(groupId);
      setMembers(membersData);
    } catch (err) {
      toast.error('Failed to load members');
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) {
      toast.error('Group name is required');
      return;
    }

    try {
      setSubmitting(true);
      const newGroup = await createGroup(groupName, groupDescription || undefined);
      setGroups([...groups, newGroup]);
      setCurrentGroup(newGroup); // Set new group as current
      await refreshGroups(); // Refresh groups in context
      toast.success('Group created successfully');
      setShowCreateModal(false);
      setGroupName('');
      setGroupDescription('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create group');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup || !inviteEmail.trim()) {
      toast.error('Email is required');
      return;
    }

    try {
      setSubmitting(true);
      await sendInvitation(selectedGroup.id, inviteEmail);
      toast.success(`Invitation sent to ${inviteEmail}`);
      setShowInviteModal(false);
      setInviteEmail('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      toast.error('Invite code is required');
      return;
    }

    try {
      setSubmitting(true);
      // Verify code first
      const verification = await verifyInviteCode(inviteCode);
      if (!verification.valid) {
        toast.error('Invalid or expired invite code');
        return;
      }
      
      await joinGroupWithCode(inviteCode);
      toast.success(`Successfully joined ${verification.group?.name || 'the group'}`);
      setShowJoinModal(false);
      setInviteCode('');
      await loadData(); // Refresh groups in component
      await refreshGroups(); // Refresh groups in context
      // Set the newly joined group as current (from verification)
      if (verification.group) {
        setCurrentGroup(verification.group);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to join group');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptInvitation = async (invitation: Invitation) => {
    try {
      await acceptInvitation(invitation.id);
      toast.success('Invitation accepted');
      await loadData(); // Refresh groups in component
      await refreshGroups(); // Refresh groups in context
      // After refreshing, the new group will be available in the groups list
      // We can set it as current by finding it from the invitation
      const updatedGroups = await getGroups();
      const newGroup = updatedGroups.find(g => g.id === invitation.group_id);
      if (newGroup) {
        setCurrentGroup(newGroup);
      }
    } catch (err) {
      toast.error('Failed to accept invitation');
    }
  };

  const handleDeclineInvitation = async (invitation: Invitation) => {
    try {
      await declineInvitation(invitation.id);
      toast.success('Invitation declined');
      await loadData();
    } catch (err) {
      toast.error('Failed to decline invitation');
    }
  };

  const handleRemoveMember = async (member: GroupMembership) => {
    if (!selectedGroup) return;
    
    if (!window.confirm(`Remove ${member.user?.full_name || member.user?.email} from the group?`)) {
      return;
    }

    try {
      await removeMember(selectedGroup.id, member.user_id);
      toast.success('Member removed');
      await loadMembers(selectedGroup.id);
    } catch (err) {
      toast.error('Failed to remove member');
    }
  };

  const handleUpdateRole = async (member: GroupMembership, newRole: 'owner' | 'admin' | 'member') => {
    if (!selectedGroup) return;

    try {
      await updateMemberRole(selectedGroup.id, member.user_id, newRole);
      toast.success('Role updated');
      await loadMembers(selectedGroup.id);
    } catch (err) {
      toast.error('Failed to update role');
    }
  };

  const handleDeleteGroup = async (group: Group) => {
    if (!window.confirm(`Delete group "${group.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteGroup(group.id);
      toast.success('Group deleted');
      const updatedGroups = groups.filter(g => g.id !== group.id);
      setGroups(updatedGroups);
      
      // If current group was deleted, switch to first available group or null
      if (currentGroup?.id === group.id) {
        if (updatedGroups.length > 0) {
          setCurrentGroup(updatedGroups[0]);
        } else {
          setCurrentGroup(null);
        }
      }
      
      // Refresh groups in context
      await refreshGroups();
      
      if (selectedGroup?.id === group.id) {
        setSelectedGroup(null);
      }
    } catch (err) {
      toast.error('Failed to delete group');
    }
  };

  const handleViewMembers = async (group: Group) => {
    setSelectedGroup(group);
    await loadMembers(group.id);
    setShowMembersModal(true);
  };

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Invite code copied to clipboard');
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading groups...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="dashboard-header">
        <div className="header-content">
          <h2>👥 Groups & Members</h2>
          <p>Manage your groups and collaborate with family members</p>
        </div>
        <div className="header-actions">
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
            ➕ Create Group
          </button>
          <button onClick={() => setShowJoinModal(true)} className="btn btn-secondary">
            🔗 Join with Code
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <p>{error}</p>
          <button onClick={loadData} className="btn btn-sm">Retry</button>
        </div>
      )}

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-header">
            <h3>📧 Pending Invitations ({invitations.length})</h3>
          </div>
          <div className="card-body">
            {invitations.map(invitation => (
              <div key={invitation.id} className="invitation-item" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem',
                borderBottom: '1px solid var(--theme-border)',
                marginBottom: '0.5rem'
              }}>
                <div>
                  <strong>{invitation.group?.name || 'Unknown Group'}</strong>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.9rem', color: 'var(--theme-text-secondary)' }}>
                    Invited on {new Date(invitation.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleAcceptInvitation(invitation)}
                    className="btn btn-sm btn-success"
                  >
                    ✓ Accept
                  </button>
                  <button
                    onClick={() => handleDeclineInvitation(invitation)}
                    className="btn btn-sm btn-danger"
                  >
                    ✗ Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Groups List */}
      <div className="groups-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {groups.map(group => {
          // Check if user is owner or admin by checking their role in the group
          // If user created the group, they should be the owner
          const isOwner = group.created_by === user?.id;
          const canInvite = isOwner || group.role === 'owner' || group.role === 'admin';
          return (
            <div key={group.id} className="card">
              <div className="card-header">
                <h3>{group.name}</h3>
                {isOwner && <span className="badge badge-primary">Owner</span>}
              </div>
              <div className="card-body">
                {group.description && (
                  <p style={{ marginBottom: '1rem', color: 'var(--theme-text-secondary)' }}>
                    {group.description}
                  </p>
                )}
                
                {group.invite_code && (
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
                      Invite Code:
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="text"
                        value={group.invite_code}
                        readOnly
                        className="form-input"
                        style={{ flex: 1, fontSize: '0.9rem' }}
                      />
                      <button
                        onClick={() => copyInviteCode(group.invite_code!)}
                        className="btn btn-sm btn-secondary"
                      >
                        📋 Copy
                      </button>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                  <button
                    onClick={() => handleViewMembers(group)}
                    className="btn btn-secondary btn-block"
                  >
                    👥 View Members
                  </button>
                  
                  {canInvite && (
                    <button
                      onClick={() => {
                        setSelectedGroup(group);
                        setShowInviteModal(true);
                      }}
                      className="btn btn-primary btn-block"
                    >
                      📧 Invite Member
                    </button>
                  )}
                  {isOwner && (
                    <button
                      onClick={() => handleDeleteGroup(group)}
                      className="btn btn-danger btn-block"
                    >
                      🗑️ Delete Group
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {groups.length === 0 && !loading && (
        <div className="empty-state" style={{ textAlign: 'center', padding: '3rem', color: 'var(--theme-text-secondary)' }}>
          <h3>No groups yet</h3>
          <p>Create a group to start collaborating with family members</p>
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Create Your First Group
          </button>
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Group</h3>
              <button onClick={() => setShowCreateModal(false)} className="btn-close">×</button>
            </div>
            <form onSubmit={handleCreateGroup}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="groupName">Group Name *</label>
                  <input
                    id="groupName"
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="form-input"
                    placeholder="e.g., My Family"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="groupDescription">Description (Optional)</label>
                  <textarea
                    id="groupDescription"
                    value={groupDescription}
                    onChange={(e) => setGroupDescription(e.target.value)}
                    className="form-input"
                    placeholder="What is this group for?"
                    rows={3}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? 'Creating...' : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      {showInviteModal && selectedGroup && (
        <div className="modal-overlay" onClick={() => setShowInviteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Invite Member to {selectedGroup.name}</h3>
              <button onClick={() => setShowInviteModal(false)} className="btn-close">×</button>
            </div>
            <form onSubmit={handleSendInvitation}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="inviteEmail">Email Address *</label>
                  <input
                    id="inviteEmail"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="form-input"
                    placeholder="member@example.com"
                    required
                  />
                  <small style={{ display: 'block', marginTop: '0.5rem', color: 'var(--theme-text-secondary)' }}>
                    They will receive an email invitation to join this group
                  </small>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowInviteModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join Group Modal */}
      {showJoinModal && (
        <div className="modal-overlay" onClick={() => setShowJoinModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Join Group with Invite Code</h3>
              <button onClick={() => setShowJoinModal(false)} className="btn-close">×</button>
            </div>
            <form onSubmit={handleJoinGroup}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="inviteCode">Invite Code *</label>
                  <input
                    id="inviteCode"
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    className="form-input"
                    placeholder="Enter the invite code"
                    required
                  />
                  <small style={{ display: 'block', marginTop: '0.5rem', color: 'var(--theme-text-secondary)' }}>
                    Ask the group owner for the invite code
                  </small>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowJoinModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? 'Joining...' : 'Join Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Members Modal */}
      {showMembersModal && selectedGroup && (
        <div className="modal-overlay" onClick={() => setShowMembersModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>Members of {selectedGroup.name}</h3>
              <button onClick={() => setShowMembersModal(false)} className="btn-close">×</button>
            </div>
            <div className="modal-body">
              {members.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--theme-text-secondary)' }}>No members found</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {members.map(member => {
                    const isCurrentUser = member.user_id === user?.id;
                    const isOwner = selectedGroup.created_by === user?.id;
                    
                    return (
                      <div key={member.id} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '1rem',
                        border: '1px solid var(--theme-border)',
                        borderRadius: '8px'
                      }}>
                        <div>
                          <strong>{member.user?.full_name || member.user?.email}</strong>
                          {isCurrentUser && <span style={{ marginLeft: '0.5rem', color: 'var(--theme-text-secondary)' }}>(You)</span>}
                          <p style={{ margin: '0.25rem 0 0', fontSize: '0.9rem', color: 'var(--theme-text-secondary)' }}>
                            {member.user?.email}
                          </p>
                          <span className={`badge badge-${member.role === 'owner' ? 'primary' : member.role === 'admin' ? 'success' : 'secondary'}`}>
                            {member.role}
                          </span>
                        </div>
                        {isOwner && !isCurrentUser && (
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <select
                              value={member.role}
                              onChange={(e) => handleUpdateRole(member, e.target.value as any)}
                              className="form-input"
                              style={{ fontSize: '0.9rem' }}
                            >
                              <option value="member">Member</option>
                              <option value="admin">Admin</option>
                              <option value="owner">Owner</option>
                            </select>
                            <button
                              onClick={() => handleRemoveMember(member)}
                              className="btn btn-sm btn-danger"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowMembersModal(false)} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Groups;
