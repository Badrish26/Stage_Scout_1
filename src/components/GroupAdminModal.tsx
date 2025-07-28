import { useState, useEffect } from 'react';
import { X, UserX, ShieldAlert, Trash2, Loader2, Users } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api'; // ✅ Ensure this import path is correct

interface GroupMember {
  _id: string;
  fullName: string;
  role: string;
  avatar?: string;
}

interface Group {
  _id: string;
  name: string;
  description: string;
  members: GroupMember[];
  admin: string;
  isPrivate: boolean;
  coverImageUrl?: string;
}

type GroupAdminModalProps = {
  group: Group;
  onClose: () => void;
  onGroupUpdate: (updatedGroup: Group) => void;
  onGroupDelete: (groupId: string) => void;
};

const GroupAdminModal = ({
  group,
  onClose,
  onGroupUpdate,
  onGroupDelete,
}: GroupAdminModalProps) => {
  const { user: currentUser, token } = useAuth();
  const navigate = useNavigate();

  const [members, setMembers] = useState<GroupMember[]>(group.members);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDeleteGroup, setShowConfirmDeleteGroup] = useState(false);

  useEffect(() => {
    setMembers(group.members);
  }, [group.members]);

  const isAdmin = currentUser && group.admin === currentUser._id;

  const handleRemoveMember = async (memberId: string) => {
    if (!token || !currentUser || group.admin !== currentUser._id) {
      alert('Only group admins can remove members.');
      return;
    }
    if (!window.confirm('Are you sure you want to remove this member from the group?')) {
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      const response = await api.post(
        `/api/groups/${group._id}/remove-member`,
        { memberId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const updatedGroup = response.data as Group;
      setMembers(updatedGroup.members);
      onGroupUpdate(updatedGroup);
    } catch (err: any) {
      console.error('Failed to remove member:', err);
      setError(err.message || 'Failed to remove member.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!token || !currentUser || group.admin !== currentUser._id) {
      alert('Only the group admin can delete the group.');
      return;
    }
    setShowConfirmDeleteGroup(false);
    setIsSubmitting(true);
    setError('');
    try {
      await api.delete(`/api/groups/${group._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onGroupDelete(group._id);
      onClose();
      navigate('/groups');
    } catch (err: any) {
      console.error('Failed to delete group:', err);
      setError(err.message || 'Failed to delete group.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="group-admin-modal-title"
    >
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-700 flex justify-between items-center">
          <h2 id="group-admin-modal-title" className="text-2xl font-bold text-white">
            Manage Group: {group.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
            aria-label="Close modal"
            type="button"
          >
            <X size={24} />
          </button>
        </div>
        <div className="p-6 space-y-6">
          {error && (
            <div className="p-3 text-sm text-red-200 bg-red-900/50 border border-red-500/50 rounded-md" role="alert">
              {error}
            </div>
          )}

          <div className="bg-gray-700 p-4 rounded-lg">
            <h3 className="text-lg font-bold text-white mb-2">Details</h3>
            <p className="text-gray-300">Description: {group.description}</p>
            <p className="text-gray-300">Privacy: {group.isPrivate ? 'Private' : 'Public'}</p>
            {group.coverImageUrl && (
              <div className="mt-4">
                <p className="text-gray-300 mb-2">Cover Image:</p>
                <img
                  src={group.coverImageUrl}
                  alt="Group Cover"
                  className="w-full h-32 object-cover rounded-md"
                />
              </div>
            )}
          </div>

          <div className="bg-gray-700 p-4 rounded-lg">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center">
              <Users size={20} className="mr-2" /> Members ({members.length})
            </h3>
            <div className="space-y-3 max-h-60 overflow-y-auto" tabIndex={0} aria-label="Group members list">
              {members.length > 0 ? (
                members.map((member) => (
                  <div
                    key={member._id}
                    className="flex items-center justify-between p-2 rounded-md bg-gray-800"
                  >
                    <Link to={`/profile/${member._id}`} className="flex items-center space-x-3">
                      <img
                        src={
                          member.avatar ||
                          `https://placehold.co/50x50/1a202c/ffffff?text=${member.fullName.charAt(0)}`
                        }
                        alt={member.fullName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-semibold text-white">{member.fullName}</p>
                        <p className="text-sm text-gray-400">{member.role}</p>
                      </div>
                    </Link>
                    {isAdmin && member._id !== currentUser?._id && (
                      <button
                        onClick={() => handleRemoveMember(member._id)}
                        disabled={isSubmitting}
                        className="px-3 py-1 text-sm font-bold text-red-400 bg-red-900/30 rounded-md hover:bg-red-900/50 disabled:opacity-50"
                        aria-label={`Remove ${member.fullName} from group`}
                        type="button"
                      >
                        {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <UserX size={16} />} Remove
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-gray-400">No members yet.</p>
              )}
            </div>
          </div>

          {isAdmin && (
            <div className="bg-red-900/20 p-4 rounded-lg border border-red-500/50">
              <h3 className="text-lg font-bold text-red-400 mb-2 flex items-center">
                <ShieldAlert size={20} className="mr-2" /> Danger Zone
              </h3>
              <p className="text-red-300 mb-4">
                Deleting this group is permanent and cannot be undone. All group posts will also be deleted.
              </p>
              <button
                onClick={() => setShowConfirmDeleteGroup(true)}
                className="px-5 py-2 font-bold text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                disabled={isSubmitting}
                type="button"
              >
                <Trash2 size={18} className="inline mr-2" /> Delete Group
              </button>
            </div>
          )}

          {showConfirmDeleteGroup && (
            <div
              className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
              role="dialog"
              aria-modal="true"
              aria-labelledby="confirm-delete-group-title"
            >
              <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-sm p-6 space-y-4 text-center">
                <h3 id="confirm-delete-group-title" className="text-xl font-bold text-white">
                  Confirm Group Deletion
                </h3>
                <p className="text-gray-300">
                  Are you absolutely sure you want to delete the group &quot;{group.name}&quot;? This action is irreversible.
                </p>
                <div className="flex justify-center space-x-4 mt-6">
                  <button
                    onClick={() => setShowConfirmDeleteGroup(false)}
                    className="px-6 py-2 font-bold text-gray-300 bg-gray-600 rounded-md hover:bg-gray-500"
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteGroup}
                    className="px-6 py-2 font-bold text-white bg-red-600 rounded-md hover:bg-red-700"
                    type="button"
                  >
                    Delete Permanently
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 font-bold text-gray-300 bg-gray-600 rounded-md hover:bg-gray-500"
              type="button"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupAdminModal;
