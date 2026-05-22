import UserProfileSettings from './UserProfileSettings';
import UserSecuritySettings from './UserSecuritySettings';
import UserDangerZoneSettings from './UserDangerZoneSettings';

/**
 * Account tab content — composes the personal-info, security, and
 * destructive sections into a single scrollable stack. Each child renders
 * its own `<UserSettingsSection>`, so they become direct siblings in the
 * DOM and the section dividers (first:pt-0 / last:border-b-0) work
 * correctly across the whole tab.
 *
 * Section order is deliberate: identity first, then security, then 2FA,
 * with Danger Zone last so the destructive action sits at the bottom of
 * the scroll where it's hard to hit by accident.
 */
export default function UserAccountSettings() {
  return (
    <>
      <UserProfileSettings />
      <UserSecuritySettings />
      <UserDangerZoneSettings />
    </>
  );
}
