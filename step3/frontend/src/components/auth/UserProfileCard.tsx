import React, { useState } from 'react';
import { ShieldCheck, LogOut, Edit3, Key, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const UserProfileCard: React.FC = () => {
  const { user, logout, updateProfile, changePassword } = useAuth();
  const [showEdit, setShowEdit] = useState(false);
  const [showChangePass, setShowChangePass] = useState(false);

  // Edit profile state
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passLoading, setPassLoading] = useState(false);
  const [passMsg, setPassMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  if (!user) return null;

  const roleColors: Record<string, { bg: string; text: string; border: string }> = {
    ADMIN: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
    INVENTORY_MANAGER: { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/20' },
    WAREHOUSE_STAFF: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
    VIEWER_AUDITOR: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  };

  const currentRoleStyle = roleColors[user.role] || roleColors.WAREHOUSE_STAFF;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg(null);
    try {
      await updateProfile({ firstName, lastName });
      setProfileMsg('Profile updated successfully!');
      setTimeout(() => setShowEdit(false), 1200);
    } catch {
      setProfileMsg('Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassLoading(true);
    setPassMsg(null);
    try {
      await changePassword({ currentPassword, newPassword, confirmPassword });
      setPassMsg({ type: 'success', text: 'Password successfully changed!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setShowChangePass(false), 1500);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      setPassMsg({ type: 'error', text: e.response?.data?.error?.message || 'Password update failed' });
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div className="flex items-center space-x-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-sky-500/10">
            {user.firstName[0]}{user.lastName[0]}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-white tracking-tight">
                {user.firstName} {user.lastName}
              </h2>
              <span className={`text-[11px] uppercase font-bold px-2.5 py-0.5 rounded-full border ${currentRoleStyle.bg} ${currentRoleStyle.text} ${currentRoleStyle.border}`}>
                {user.role}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{user.email}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setFirstName(user.firstName);
              setLastName(user.lastName);
              setShowEdit(true);
            }}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700/60 transition"
          >
            <Edit3 className="h-3.5 w-3.5 text-sky-400" />
            <span>Edit Profile</span>
          </button>

          <button
            onClick={() => setShowChangePass(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700/60 transition"
          >
            <Key className="h-3.5 w-3.5 text-amber-400" />
            <span>Change Password</span>
          </button>

          <button
            onClick={logout}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-medium border border-rose-500/20 transition"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80">
          <span className="text-slate-400 block mb-0.5">Account Status</span>
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <CheckCircle className="h-3.5 w-3.5" /> Active & Verified
          </span>
        </div>
        <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80">
          <span className="text-slate-400 block mb-0.5">Active Role Privileges</span>
          <span className="text-slate-200 font-semibold flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-sky-400" /> {user.permissions.length} Granted Permissions
          </span>
        </div>
        <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80">
          <span className="text-slate-400 block mb-0.5">Security Protocol</span>
          <span className="text-slate-300 font-mono">JWT Bearer + Token Blacklist</span>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-sm p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl">
            <h3 className="text-base font-semibold text-white mb-4">Edit Profile</h3>
            {profileMsg && <div className="mb-3 text-xs text-emerald-400">{profileMsg}</div>}
            <form onSubmit={handleUpdateProfile} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">First Name</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                />
              </div>
              <div>
                <label className="text-slate-300 block mb-1">Last Name</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEdit(false)}
                  className="px-3 py-2 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="px-4 py-2 bg-sky-600 text-white rounded-xl font-medium"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-sm p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl">
            <h3 className="text-base font-semibold text-white mb-4">Change Password</h3>
            {passMsg && (
              <div className={`mb-3 text-xs p-2.5 rounded-lg flex items-center gap-1.5 ${
                passMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}>
                {passMsg.type === 'success' ? <CheckCircle className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                <span>{passMsg.text}</span>
              </div>
            )}
            <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                />
              </div>
              <div>
                <label className="text-slate-300 block mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                  placeholder="Min 8 chars, 1 uppercase, 1 digit"
                />
              </div>
              <div>
                <label className="text-slate-300 block mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowChangePass(false)}
                  className="px-3 py-2 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passLoading}
                  className="px-4 py-2 bg-amber-600 text-white rounded-xl font-medium"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
