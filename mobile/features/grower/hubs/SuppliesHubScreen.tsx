import { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  MapPinned,
  Box,
  ShoppingBag,
  Package,
  Calculator,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react-native';
import { theme } from '../../../lib/theme';
import { useGrowerDashboard } from '../../../contexts/GrowerDashboardContext';
import { useGrowerTabRefresh } from '../../../hooks/useGrowerTabRefresh';
import { suppliesStatusLine } from './suppliesStatusLine';

type WorkflowStep = {
  key: string;
  icon: LucideIcon;
  titleKey: string;
  descKey: string;
  href: Href;
};

/**
 * Supplies tab — procurement workflow (map → materials → orders → products).
 */
export default function SuppliesHubScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const data = useGrowerDashboard();
  const tabRefresh = useGrowerTabRefresh();

  const statusLine = suppliesStatusLine(
    t,
    data.unreadCount,
    data.suppliesSnapshot,
    data.suppliesSnapshotLoaded,
  );

  const steps = useMemo(
    (): WorkflowStep[] => [
      {
        key: 'map',
        icon: MapPinned,
        titleKey: 'producer.hubs.supplies.workflow.mapTitle',
        descKey: 'producer.hubs.supplies.workflow.mapDesc',
        href: '/map',
      },
      {
        key: 'materials',
        icon: Box,
        titleKey: 'producer.hubs.supplies.workflow.materialsTitle',
        descKey: 'producer.hubs.supplies.workflow.materialsDesc',
        href: '/(producer)/materials',
      },
      {
        key: 'partner-orders',
        icon: ShoppingBag,
        titleKey: 'producer.hubs.supplies.workflow.partnerOrdersTitle',
        descKey: 'producer.hubs.supplies.workflow.partnerOrdersDesc',
        href: '/(producer)/partner-orders',
      },
      {
        key: 'products',
        icon: Package,
        titleKey: 'producer.hubs.supplies.workflow.productsTitle',
        descKey: 'producer.hubs.supplies.workflow.productsDesc',
        href: '/(producer)/(tabs)/products',
      },
      {
        key: 'cost-calculator',
        icon: Calculator,
        titleKey: 'producer.hubs.supplies.workflow.costCalculatorTitle',
        descKey: 'producer.hubs.supplies.workflow.costCalculatorDesc',
        href: '/(producer)/(tabs)/cost-calculator',
      },
    ],
    [],
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: theme.spacing.md, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={tabRefresh.refreshing}
            onRefresh={() => void tabRefresh.onRefresh()}
            tintColor={theme.colors.primary}
          />
        }
      >
        <View style={{ paddingTop: 60, paddingBottom: theme.spacing.md }}>
          <Text
            style={{
              fontSize: 22,
              fontWeight: '600',
              color: theme.colors.text.primary,
              lineHeight: 30,
            }}
          >
            {t('producer.hubs.supplies.screenTitle')}
          </Text>
          <Text
            style={{
              marginTop: 4,
              fontSize: 14,
              fontWeight: '400',
              color: theme.colors.text.secondary,
              lineHeight: 20,
            }}
          >
            {t('producer.hubs.supplies.screenSubtitle')}
          </Text>
          <Text
            style={{
              marginTop: 10,
              fontSize: 14,
              fontWeight: '400',
              color: theme.colors.text.secondary,
              lineHeight: 20,
            }}
          >
            {statusLine}
          </Text>
        </View>

        <View style={{ gap: 12 }}>
          {steps.map((item) => {
            const Icon = item.icon;
            const title = t(item.titleKey);
            const desc = t(item.descKey);
            return (
              <TouchableOpacity
                key={item.key}
                onPress={() => router.push(item.href)}
                activeOpacity={0.72}
                accessibilityRole="button"
                accessibilityLabel={`${title}. ${desc}`}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  minHeight: 72,
                  paddingHorizontal: theme.spacing.md,
                  paddingVertical: theme.spacing.sm + 4,
                  gap: 12,
                  backgroundColor: theme.colors.background,
                  borderWidth: 0.5,
                  borderColor: theme.colors.border,
                  borderRadius: theme.borderRadius.md,
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: theme.colors.primaryLight,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={22} color={theme.colors.primary} strokeWidth={1.5} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: '500',
                      color: theme.colors.text.primary,
                      lineHeight: 22,
                    }}
                  >
                    {title}
                  </Text>
                  <Text
                    numberOfLines={2}
                    style={{
                      marginTop: 2,
                      fontSize: 14,
                      fontWeight: '400',
                      color: theme.colors.text.secondary,
                      lineHeight: 20,
                    }}
                  >
                    {desc}
                  </Text>
                </View>
                <ChevronRight size={20} color={theme.colors.text.secondary} strokeWidth={1.5} />
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
