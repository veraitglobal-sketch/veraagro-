import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  MapPin,
  Sprout,
  ClipboardList,
  CheckCircle2,
  ShieldAlert,
  Award,
  Package,
  Camera,
  FilePlus,
  Image as ImageIcon,
  ClipboardCheck,
  ShoppingBag,
  Box,
  Truck,
  QrCode,
} from 'lucide-react-native';
import { theme } from '../../../lib/theme';

export type FarmerHomeHandlers = {
  onParcels: () => void;
  onPlantingSteps: () => void;
  onFieldDiary: () => void;
  onAllowedMaterials: () => void;
  onBanned: () => void;
  onCertificates: () => void;
  onMyProducts: () => void;
  onScan: () => void;
  onHarvest: () => void;
  onCompliancePhotos: () => void;
  onQuality: () => void;
  onPartnerOrders: () => void;
  /** Parity with web grower sidebar: batches → materials → transport → mission tracker */
  onBatches: () => void;
  onMaterials: () => void;
  onRequestTransport: () => void;
  onMissions: () => void;
  onPackageBadges: () => void;
};

const row = {
  backgroundColor: theme.colors.surfaceElevated,
  borderRadius: theme.borderRadius.lg,
  paddingVertical: theme.spacing.md,
  paddingHorizontal: theme.spacing.md,
  borderWidth: 1,
  borderColor: theme.colors.border,
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  minHeight: 72,
};

const iconBox = (bg: string, border?: string) => ({
  width: 48,
  height: 48,
  borderRadius: theme.borderRadius.md,
  backgroundColor: bg,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  marginRight: theme.spacing.md,
  borderWidth: border ? 1 : 0,
  borderColor: border || 'transparent',
});

type Essential = {
  key: string;
  onPress: () => void;
  icon: React.ReactNode;
  titleKey: string;
  descKey: string;
  accent: string;
};

/**
 * Main items for the farmer: parcels, planting, entry log, allowed / banned list, certificates.
 * Copy comes from i18n (short, plain language).
 */
export default function FarmerHomeSection({ handlers }: { handlers: FarmerHomeHandlers }) {
  const { t } = useTranslation();

  const essentials: Essential[] = [
    {
      key: 'parcels',
      onPress: handlers.onParcels,
      icon: <MapPin size={24} color={theme.colors.primary} strokeWidth={1.75} />,
      titleKey: 'producer.dashboard.farmer.parcelsTitle',
      descKey: 'producer.dashboard.farmer.parcelsDesc',
      accent: theme.colors.primaryLight,
    },
    {
      key: 'planting',
      onPress: handlers.onPlantingSteps,
      icon: <Sprout size={24} color={theme.colors.primary} strokeWidth={1.75} />,
      titleKey: 'producer.dashboard.farmer.plantingTitle',
      descKey: 'producer.dashboard.farmer.plantingDesc',
      accent: theme.colors.primaryLight,
    },
    {
      key: 'diary',
      onPress: handlers.onFieldDiary,
      icon: <ClipboardList size={24} color={theme.colors.primary} strokeWidth={1.75} />,
      titleKey: 'producer.dashboard.farmer.diaryTitle',
      descKey: 'producer.dashboard.farmer.diaryDesc',
      accent: theme.colors.primaryLight,
    },
    {
      key: 'allowed',
      onPress: handlers.onAllowedMaterials,
      icon: <CheckCircle2 size={24} color={theme.colors.success} strokeWidth={1.75} />,
      titleKey: 'producer.dashboard.farmer.allowedTitle',
      descKey: 'producer.dashboard.farmer.allowedDesc',
      accent: theme.colors.successLight,
    },
    {
      key: 'banned',
      onPress: handlers.onBanned,
      icon: <ShieldAlert size={24} color={theme.colors.error} strokeWidth={1.75} />,
      titleKey: 'producer.dashboard.farmer.bannedTitle',
      descKey: 'producer.dashboard.farmer.bannedDesc',
      accent: theme.colors.errorLight,
    },
    {
      key: 'certs',
      onPress: handlers.onCertificates,
      icon: <Award size={24} color={theme.colors.info} strokeWidth={1.75} />,
      titleKey: 'producer.dashboard.farmer.certsTitle',
      descKey: 'producer.dashboard.farmer.certsDesc',
      accent: theme.colors.infoLight,
    },
  ];

  const also: { key: string; onPress: () => void; icon: React.ReactNode; titleKey: string }[] = [
    { key: 'b2b', onPress: handlers.onPartnerOrders, icon: <ShoppingBag size={20} color={theme.colors.text.secondary} strokeWidth={1.5} />, titleKey: 'producer.dashboard.farmer.alsoPartnerOrders' },
    { key: 'prod', onPress: handlers.onMyProducts, icon: <Package size={20} color={theme.colors.text.secondary} strokeWidth={1.5} />, titleKey: 'producer.dashboard.farmer.alsoProducts' },
    { key: 'scan', onPress: handlers.onScan, icon: <Camera size={20} color={theme.colors.text.secondary} strokeWidth={1.5} />, titleKey: 'producer.dashboard.farmer.alsoScan' },
    { key: 'harvest', onPress: handlers.onHarvest, icon: <FilePlus size={20} color={theme.colors.text.secondary} strokeWidth={1.5} />, titleKey: 'producer.dashboard.farmer.alsoHarvest' },
    { key: 'photos', onPress: handlers.onCompliancePhotos, icon: <ImageIcon size={20} color={theme.colors.text.secondary} strokeWidth={1.5} />, titleKey: 'producer.dashboard.farmer.alsoPhotos' },
    { key: 'qual', onPress: handlers.onQuality, icon: <ClipboardCheck size={20} color={theme.colors.text.secondary} strokeWidth={1.5} />, titleKey: 'producer.dashboard.farmer.alsoQuality' },
  ];

  return (
    <>
      <View style={{ marginBottom: theme.spacing.lg }}>
        <Text
          style={{
            fontSize: 13,
            fontWeight: '600',
            color: theme.colors.text.primary,
            marginBottom: 4,
          }}
        >
          {t('producer.dashboard.farmer.blockTitle')}
        </Text>
        <Text
          style={{
            fontSize: 13,
            fontWeight: '400',
            color: theme.colors.text.secondary,
            lineHeight: 20,
            marginBottom: theme.spacing.md,
          }}
        >
          {t('producer.dashboard.farmer.blockHint')}
        </Text>
        <View style={{ gap: theme.spacing.sm }}>
          {essentials.map((item) => (
            <TouchableOpacity key={item.key} onPress={item.onPress} activeOpacity={0.7} style={row}>
              <View style={iconBox(item.accent)}>{item.icon}</View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.text.primary, marginBottom: 4 }}>
                  {t(item.titleKey)}
                </Text>
                <Text style={{ fontSize: 13, fontWeight: '400', color: theme.colors.text.secondary, lineHeight: 18 }}>
                  {t(item.descKey)}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={{ marginBottom: theme.spacing.lg }}>
        <Text
          style={{
            fontSize: 13,
            fontWeight: '600',
            color: theme.colors.text.primary,
            marginBottom: 4,
          }}
        >
          {t('producer.dashboard.farmer.logisticsBlockTitle')}
        </Text>
        <Text
          style={{
            fontSize: 13,
            fontWeight: '400',
            color: theme.colors.text.secondary,
            lineHeight: 20,
            marginBottom: theme.spacing.md,
          }}
        >
          {t('producer.dashboard.farmer.logisticsBlockHint')}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
          {(
            [
              {
                k: 'batches',
                onPress: handlers.onBatches,
                icon: <Package size={20} color={theme.colors.primary} strokeWidth={1.75} />,
                titleKey: 'producer.dashboard.farmer.logisticsBatches',
              },
              {
                k: 'materials',
                onPress: handlers.onMaterials,
                icon: <Box size={20} color={theme.colors.primary} strokeWidth={1.75} />,
                titleKey: 'producer.dashboard.farmer.logisticsMaterials',
              },
              {
                k: 'transport',
                onPress: handlers.onRequestTransport,
                icon: <Truck size={20} color={theme.colors.primary} strokeWidth={1.75} />,
                titleKey: 'producer.dashboard.farmer.logisticsTransport',
              },
              {
                k: 'missions',
                onPress: handlers.onMissions,
                icon: <MapPin size={20} color={theme.colors.primary} strokeWidth={1.75} />,
                titleKey: 'producer.dashboard.farmer.logisticsMissions',
              },
              {
                k: 'badges',
                onPress: handlers.onPackageBadges,
                icon: <QrCode size={20} color={theme.colors.primary} strokeWidth={1.75} />,
                titleKey: 'producer.dashboard.farmer.logisticsBadges',
              },
            ] as const
          ).map((item) => (
            <TouchableOpacity
              key={item.k}
              onPress={item.onPress}
              activeOpacity={0.7}
              style={{
                backgroundColor: theme.colors.primaryLight,
                borderRadius: theme.borderRadius.md,
                paddingVertical: 12,
                paddingHorizontal: 12,
                borderWidth: 1,
                borderColor: theme.colors.border,
                flexDirection: 'row',
                alignItems: 'center',
                minWidth: '47%',
                flexGrow: 1,
              }}
            >
              {item.icon}
              <Text
                style={{
                  marginLeft: 8,
                  fontSize: 13,
                  fontWeight: '600',
                  color: theme.colors.text.primary,
                  flex: 1,
                }}
                numberOfLines={2}
              >
                {t(item.titleKey)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={{ marginBottom: theme.spacing.lg }}>
        <Text
          style={{
            fontSize: 12,
            fontWeight: '500',
            color: theme.colors.text.tertiary,
            marginBottom: theme.spacing.sm,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          {t('producer.dashboard.farmer.alsoBlock')}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
          {also.map((a) => (
            <TouchableOpacity
              key={a.key}
              onPress={a.onPress}
              activeOpacity={0.7}
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.md,
                paddingVertical: 12,
                paddingHorizontal: 14,
                borderWidth: 1,
                borderColor: theme.colors.border,
                flexDirection: 'row',
                alignItems: 'center',
                minWidth: '47%',
                flexGrow: 1,
              }}
            >
              {a.icon}
              <Text
                style={{
                  marginLeft: 8,
                  fontSize: 13,
                  fontWeight: '500',
                  color: theme.colors.text.primary,
                  flex: 1,
                }}
                numberOfLines={2}
              >
                {t(a.titleKey)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </>
  );
}
