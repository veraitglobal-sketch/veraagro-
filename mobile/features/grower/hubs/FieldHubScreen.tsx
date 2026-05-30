import { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  Home,
  MapPin,
  Leaf,
  Map,
  Sprout,
  FileText,
  TrendingUp,
  Scissors,
  Camera,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react-native';
import { theme } from '../../../lib/theme';
import { useGrowerDashboard } from '../../../contexts/GrowerDashboardContext';
import { useGrowerTabRefresh } from '../../../hooks/useGrowerTabRefresh';
import { parcelStatusLine } from '../dashboard/parcelStatusLine';

type WorkflowStep = {
  key: string;
  icon: LucideIcon;
  titleKey: string;
  descKey: string;
  href: Href;
};

/**
 * Field tab — workflow cards in farmer working order (estates → harvest).
 */
export default function FieldHubScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const data = useGrowerDashboard();
  const tabRefresh = useGrowerTabRefresh();
  const ps = data.parcelSteps;
  const estateCount = data.estates.length;
  const statusLine = parcelStatusLine(t, estateCount, ps, 'producer.hubs.field.leadShort');

  const steps = useMemo(
    (): WorkflowStep[] => [
      {
        key: 'estates',
        icon: Home,
        titleKey: 'producer.hubs.field.workflow.estatesTitle',
        descKey: 'producer.hubs.field.workflow.estatesDesc',
        href: '/(producer)/estates',
      },
      {
        key: 'parcels',
        icon: MapPin,
        titleKey: 'producer.hubs.field.workflow.parcelsTitle',
        descKey: 'producer.hubs.field.workflow.parcelsDesc',
        href: '/(producer)/estates',
      },
      {
        key: 'seed',
        icon: Leaf,
        titleKey: 'producer.hubs.field.workflow.seedTitle',
        descKey: 'producer.hubs.field.workflow.seedDesc',
        href: '/(producer)/seed-registration',
      },
      {
        key: 'plot-map',
        icon: Map,
        titleKey: 'producer.hubs.field.workflow.plotMapTitle',
        descKey: 'producer.hubs.field.workflow.plotMapDesc',
        href: '/(producer)/plot-mapper',
      },
      {
        key: 'plantings',
        icon: Sprout,
        titleKey: 'producer.hubs.field.workflow.plantingsTitle',
        descKey: 'producer.hubs.field.workflow.plantingsDesc',
        href: '/(producer)/plantings',
      },
      {
        key: 'field-log',
        icon: FileText,
        titleKey: 'producer.hubs.field.workflow.fieldLogTitle',
        descKey: 'producer.hubs.field.workflow.fieldLogDesc',
        href: '/(producer)/(tabs)/field-log',
      },
      {
        key: 'vera-bag',
        icon: Camera,
        titleKey: 'producer.hubs.field.workflow.veraBagTitle',
        descKey: 'producer.hubs.field.workflow.veraBagDesc',
        href: '/(producer)/vera-bag',
      },
      {
        key: 'growth-journal',
        icon: TrendingUp,
        titleKey: 'producer.hubs.field.workflow.growthJournalTitle',
        descKey: 'producer.hubs.field.workflow.growthJournalDesc',
        href: '/(producer)/growth-journal',
      },
      {
        key: 'harvest',
        icon: Scissors,
        titleKey: 'producer.hubs.field.workflow.harvestTitle',
        descKey: 'producer.hubs.field.workflow.harvestDesc',
        href: '/(producer)/(tabs)/harvest',
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
            {t('producer.hubs.field.screenTitle')}
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
            {t('producer.hubs.field.screenSubtitle')}
          </Text>
          {ps.loaded ? (
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
          ) : null}
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
