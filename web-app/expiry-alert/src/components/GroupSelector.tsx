import React, { useState } from 'react';
import { useGroup } from '../contexts/GroupContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const GroupSelector: React.FC = () => {
  const { currentGroup, groups, setCurrentGroup, loading } = useGroup();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const [showDropdown, setShowDropdown] = useState(false);

  if (loading || !currentGroup) {
    return (
      <div className="group-selector" style={{ color: theme.textColor }}>
        {loading ? t('status.loading') || 'Loading...' : t('groups.noGroup') || 'No Group'}
      </div>
    );
  }

  const handleGroupChange = (group: typeof currentGroup) => {
    if (group) {
      setCurrentGroup(group);
      setShowDropdown(false);
      toast.success(`${t('groups.groupChanged') || 'Group changed'}: ${group.name}`, {
        duration: 2000,
      });
    }
  };

  return (
    <div className="group-selector-container" style={{ position: 'relative' }}>
      <button
        className="group-selector-btn"
        onClick={() => setShowDropdown(!showDropdown)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          border: `1px solid ${theme.borderColor}`,
          borderRadius: 'var(--radius-md)',
          backgroundColor: theme.cardBackground,
          color: theme.textColor,
          cursor: 'pointer',
          fontSize: '0.875rem',
          fontWeight: 500,
          transition: 'all 0.2s ease',
        }}
        onBlur={() => {
          // Delay to allow click on dropdown items
          setTimeout(() => setShowDropdown(false), 200);
        }}
      >
        <span>👥</span>
        <span style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {currentGroup.name}
        </span>
        <span style={{ fontSize: '0.75rem' }}>{showDropdown ? '▲' : '▼'}</span>
      </button>

      {showDropdown && (
        <div
          className="group-selector-dropdown"
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '0.5rem',
            backgroundColor: theme.cardBackground,
            border: `1px solid ${theme.borderColor}`,
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            zIndex: 1000,
            minWidth: '200px',
            maxHeight: '300px',
            overflowY: 'auto',
          }}
        >
          {groups.length === 0 ? (
            <div style={{ padding: '1rem', color: theme.textSecondary, textAlign: 'center' }}>
              {t('groups.noGroups') || 'No groups found'}
            </div>
          ) : (
            <>
              {groups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => handleGroupChange(group)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: 'none',
                    backgroundColor: group.id === currentGroup.id ? theme.primaryColor : 'transparent',
                    color: group.id === currentGroup.id ? 'white' : theme.textColor,
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    transition: 'background-color 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                  onMouseEnter={(e) => {
                    if (group.id !== currentGroup.id) {
                      e.currentTarget.style.backgroundColor = theme.borderColor;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (group.id !== currentGroup.id) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
                    <span style={{ fontWeight: group.id === currentGroup.id ? 600 : 400 }}>
                      {group.name}
                    </span>
                    {group.description && (
                      <span
                        style={{
                          fontSize: '0.75rem',
                          opacity: 0.8,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {group.description}
                      </span>
                    )}
                  </div>
                  {group.id === currentGroup.id && (
                    <span style={{ marginLeft: '0.5rem', fontSize: '1rem' }}>✓</span>
                  )}
                  {group.role && (
                    <span
                      style={{
                        marginLeft: '0.5rem',
                        fontSize: '0.75rem',
                        padding: '0.125rem 0.5rem',
                        borderRadius: '4px',
                        backgroundColor: group.role === 'owner' ? '#dc2626' : group.role === 'admin' ? '#f59e0b' : '#6b7280',
                        color: 'white',
                      }}
                    >
                      {group.role === 'owner' ? t('groups.owner') : group.role === 'admin' ? t('groups.admin') : t('groups.member')}
                    </span>
                  )}
                </button>
              ))}
              <div
                style={{
                  borderTop: `1px solid ${theme.borderColor}`,
                  marginTop: '0.25rem',
                  paddingTop: '0.25rem',
                }}
              >
                <Link
                  to="/groups"
                  style={{
                    display: 'block',
                    padding: '0.75rem 1rem',
                    color: theme.primaryColor,
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                    textAlign: 'center',
                    fontWeight: 500,
                  }}
                  onClick={() => setShowDropdown(false)}
                >
                  {t('groups.manageGroups') || 'Manage Groups'} →
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default GroupSelector;
