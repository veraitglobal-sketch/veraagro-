import { useEffect } from 'react';
import { useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { theme } from '../lib/theme';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: string[];
  redirectTo?: string;
}

/**
 * Auth Guard Component
 * Protects routes and redirects to login if not authenticated
 */
export function AuthGuard({ children, requiredRole, redirectTo = '/' }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const rootNav = useRootNavigationState();

  useEffect(() => {
    if (loading) return; // Wait for auth to load
    if (!rootNav?.key) return; // Don’t run redirects before navigator is mounted (iOS back gesture)
    const path = segments as string[];
    if (path.length === 0) return; // Transient [] during stack transitions — avoids false “logged out” redirect

    // Check if user is authenticated
    if (!user) {
      // Determine which login screen to show based on route
      const isProducerRoute = path[0] === '(producer)';
      const isLogisticsRoute = path[0] === '(logistics)';
      const isSupplierRoute = path[0] === '(supplier)';
      const isBuyerRoute = path[0] === '(buyer)';

      if (isProducerRoute || isLogisticsRoute || isSupplierRoute) {
        router.replace('/partner-login');
      } else if (isBuyerRoute) {
        router.replace('/buyer-login');
      } else {
        router.replace(redirectTo);
      }
      return;
    }

    // Check role if required
    if (requiredRole && requiredRole.length > 0) {
      const userRoles = user.roles || (user.role ? [user.role] : []);
      const hasRequiredRole = requiredRole.some(role => userRoles.includes(role));
      
      if (!hasRequiredRole) {
        const isProducerRoute2 = path[0] === '(producer)';
        const isLogisticsRoute2 = path[0] === '(logistics)';
        const isSupplierRoute2 = path[0] === '(supplier)';
        if (isProducerRoute2 || isLogisticsRoute2 || isSupplierRoute2) {
          router.replace('/partner-login');
        } else {
          router.replace('/buyer-login');
        }
        return;
      }
    }
  }, [user, loading, requiredRole, router, segments, redirectTo, rootNav?.key]);

  // Show loading while checking auth
  if (loading) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: theme.colors.background,
      }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  // If no user, don't render children (will redirect)
  if (!user) {
    return null;
  }

  // Check role if required
  if (requiredRole && requiredRole.length > 0) {
    const userRoles = user.roles || (user.role ? [user.role] : []);
    const hasRequiredRole = requiredRole.some(role => userRoles.includes(role));
    
    if (!hasRequiredRole) {
      return null; // Will redirect
    }
  }

  return <>{children}</>;
}
