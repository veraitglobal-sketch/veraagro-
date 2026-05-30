import { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  Package,
  Plus,
  Camera,
  ClipboardCheck,
  Truck,
  QrCode,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react-native';
import { theme } from '../../../lib/theme';
import { useGrowerTabRefresh } from '../../../hooks/useGrowerTabRefresh';
import { chainStatusLine } from './chainStatusLine';
import { useGrowerDashboard } from '../../../contexts/GrowerDashboardContext';

type WorkflowStep = {
  key: string;
  icon: LucideIcon;
  titleKey: string;
  descKey: string;
  href: Href;
};

/**
 * Chain tab — post-harvest workflow (lots → delivery).
 */
export default function ChainHubScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const data = useGrowerDashboard();
  const tabRefresh = useGrowerTabRefresh();

  const statusLine = chainStatusLine(t, {
    batchTotal: data.batchTotalCount,
    lotsReady: data.batchesReadyForTransport,
    activeMissions: data.activeMissions.length,
  });

  const steps = useMemo(
    (): WorkflowStep[] => [
      {
        key: 'batches',
        icon: Package,
        titleKey: 'producer.hubs.chain.workflow.batchesTitle',
        descKey: 'producer.hubs.chain.workflow.batchesDesc',
        href: '/(producer)/batches',
      },
      {
        key: 'batch-new',
        icon: Plus,
        titleKey: 'producer.hubs.chain.workflow.createTitle',
        descKey: 'producer.hubs.chain.workflow.createDesc',
        href: '/(producer)/batch-new',
      },
      {
        key: 'packing',
        icon: Camera,
        titleKey: 'producer.hubs.chain.workflow.packingTitle',
        descKey: 'producer.hubs.chain.workflow.packingDesc',
        href: '/(producer)/packing-flow',
      },
      {
        key: 'quality',
        icon: ClipboardCheck,
        titleKey: 'producer.hubs.chain.workflow.qualityTitle',
        descKey: 'producer.hubs.chain.workflow.qualityDesc',
        href: '/(producer)/quality-entry',
      },
      {
        key: 'compliance',
        icon: Camera,
        titleKey: 'producer.hubs.chain.workflow.complianceTitle',
        descKey: 'producer.hubs.chain.workflow.complianceDesc',
        href: '/(producer)/compliance-photos',
      },
      {
        key: 'missions',
        icon: Truck,
        titleKey: 'producer.hubs.chain.workflow.missionsTitle',
        descKey: 'producer.hubs.chain.workflow.missionsDesc',
        href: '/(producer)/missions',
      },
      {
        key: 'badges',
        icon: QrCode,
        titleKey: 'producer.hubs.chain.workflow.badgesTitle',
        descKey: 'producer.hubs.chain.workflow.badgesDesc',
        href: '/(producer)/package-badges',
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
            {t('producer.hubs.chain.screenTitle')}
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
            {t('producer.hubs.chain.screenSubtitle')}
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
