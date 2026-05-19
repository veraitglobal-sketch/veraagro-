import { useIsFocused } from '@react-navigation/native';
import { useGrowerDashboard } from '../contexts/GrowerDashboardContext';

/**
 * Shared dashboard refresh — only show pull-to-refresh on the tab that is visible.
 * Avoids a stuck top spinner when switching tabs mid-refresh.
 */
export function useGrowerTabRefresh() {
  const isFocused = useIsFocused();
  const { refreshing, onRefresh } = useGrowerDashboard();
  const showRefresh = refreshing && isFocused;

  return {
    refreshing: showRefresh,
    onRefresh,
    showHeaderSpinner: showRefresh,
  };
}
