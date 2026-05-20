import { useEffect } from 'react';
import { runPostLoginPermissionsIfFirstTime } from '../lib/post-login-permissions';

/** Mount once inside the authenticated grower shell. */
export function PostLoginPermissions() {
  useEffect(() => {
    void runPostLoginPermissionsIfFirstTime();
  }, []);
  return null;
}
