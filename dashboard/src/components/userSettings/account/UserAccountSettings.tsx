import UserProfileSettings from './UserProfileSettings';
import UserSecuritySettings from './UserSecuritySettings';
import UserSessionsSettings from './UserSessionsSettings';
import UserDangerZoneSettings from './UserDangerZoneSettings';

export default function UserAccountSettings() {
  return (
    <>
      <UserProfileSettings />
      <UserSecuritySettings />
      <UserSessionsSettings />
      <UserDangerZoneSettings />
    </>
  );
}
