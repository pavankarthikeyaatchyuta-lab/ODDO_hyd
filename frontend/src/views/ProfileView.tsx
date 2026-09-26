import React from 'react';
import { useAuth } from '../context/AuthContext';
import { UserProfileCard } from '../components/auth/UserProfileCard';
import { PermissionMatrixCard } from '../components/auth/PermissionMatrixCard';
import { SensitiveOperationsTester } from '../components/auth/SensitiveOperationsTester';

export const ProfileView: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">User Profile & Access Control</h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage your account credentials, view role-based authorization scopes, and test server-side permission enforcement.
        </p>
      </div>

      {/* Profile Card & Info */}
      <UserProfileCard />

      {/* Permissions Breakdown Matrix */}
      <PermissionMatrixCard />

      {/* Live Sensitive Operations Backend Enforcement Tester */}
      <SensitiveOperationsTester />
    </div>
  );
};
