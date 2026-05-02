import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  MapPin,
  ListOrdered,
  Leaf,
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
  onPlantings: () => void;
  onFieldDiary: () => void;
  onMaterials: () => void;
  onAllowedMaterials: () => void;
  onBanned: () => void;
  onCertificates: () => void;
  onMyProducts: () => void;
  onScan: () => void;
  onHarvest: () => void;
  onCompliancePhotos: () => void;
  onQuality: () => void;
  onPartnerOrders: () => void;
  /** Parity with web grower sidebar: batches → transport → missions → badges (materials listed above) */
  onBatches: () => void;
  onRequestTransport: () => void;
  onMissions: () => void;
  onPackageBadges: () => void;
};

const row = {
  backgroundColor: theme.colors.surfaceElevated,
  borderRadius: theme.borderRadius.md,
  paddingVertical: 12,
  paddingHorizontal: theme.spacing.md,
  borderWidth: 1,
  borderColor: theme.colors.border,
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  minHeight: 64,
};

const iconBox = (bg: string, border?: string) => ({
  width: 44,
  height: 44,
  borderRadius: theme.borderRadius.md,
  backgroundColor: bg,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  marginRight: theme.spacing.sm,
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

export type FarmerHomeVariant = 'dashboard' | 'farmTools';

/**
 * Ordered flow: instructions → parcels → plantings → diary → materials → allowed → banned → certificates.
 * On the dedicated Farm tools screen, `farmTools` hides the instructions row (same content as the Uputstva tab).
 */
export default function FarmerHomeSection({
  handlers,
  variant = 'dashboard',
}: {
  handlers: FarmerHomeHandlers;
  variant?: FarmerHomeVariant;
}) {
  const { t } = useTranslation();

  const essentialsAll: Essential[] = [
    {
      key: 'instructions',
      onPress: handlers.onPlantingSteps,
      icon: <ListOrdered size={22} color={theme.colors.primary} strokeWidth={1.75} />,
      titleKey: 'producer.dashboard.farmer.instructionsTitle',
      descKey: 'producer.dashboard.farmer.instructionsDesc',
      accent: theme.colors.primaryLight,
    },
    {
      key: 'parcels',
      onPress: handlers.onParcels,
      icon: <MapPin size={22} color={theme.colors.primary} strokeWidth={1.75} />,
      titleKey: 'producer.dashboard.farmer.parcelsTitle',
      descKey: 'producer.dashboard.farmer.parcelsDesc',
      accent: theme.colors.primaryLight,
    },
    {
      key: 'plantings',
      onPress: handlers.onPlantings,
      icon: <Leaf size={22} color={theme.colors.primary} strokeWidth={1.75} />,
      titleKey: 'producer.dashboard.farmer.plantingsTitle',
      descKey: 'producer.dashboard.farmer.plantingsDesc',
      accent: theme.colors.primaryLight,
    },
    {
      key: 'diary',
      onPress: handlers.onFieldDiary,
      icon: <ClipboardList size={22} color={theme.colors.primary} strokeWidth={1.75} />,
      titleKey: 'producer.dashboard.farmer.diaryTitle',
      descKey: 'producer.dashboard.farmer.diaryDesc',
      accent: theme.colors.primaryLight,
    },
    {
      key: 'materials',
      onPress: handlers.onMaterials,
      icon: <Box size={22} color={theme.colors.primary} strokeWidth={1.75} />,
      titleKey: 'producer.dashboard.farmer.materialsTitle',
      descKey: 'producer.dashboard.farmer.materialsDesc',
      accent: theme.colors.primaryLight,
    },
    {
      key: 'allowed',
      onPress: handlers.onAllowedMaterials,
      icon: <CheckCircle2 size={22} color={theme.colors.success} strokeWidth={1.75} />,
      titleKey: 'producer.dashboard.farmer.allowedTitle',
      descKey: 'producer.dashboard.farmer.allowedDesc',
      accent: theme.colors.successLight,
    },
    {
      key: 'banned',
      onPress: handlers.onBanned,
      icon: <ShieldAlert size={22} color={theme.colors.error} strokeWidth={1.75} />,
      titleKey: 'producer.dashboard.farmer.bannedTitle',
      descKey: 'producer.dashboard.farmer.bannedDesc',
      accent: theme.colors.errorLight,
    },
    {
      key: 'certs',
      onPress: handlers.onCertificates,
      icon: <Award size={22} color={theme.colors.info} strokeWidth={1.75} />,
      titleKey: 'producer.dashboard.farmer.certsTitle',
      descKey: 'producer.dashboard.farmer.certsDesc',
      accent: theme.colors.infoLight,
    },
  ];

  const essentials =
    variant === 'farmTools' ? essentialsAll.filter((e) => e.key !== 'instructions') : essentialsAll;

  const blockTitleKey =
    variant === 'farmTools'
      ? 'producer.dashboard.farmer.blockTitleFarmTools'
      : 'producer.dashboard.farmer.blockTitle';
  const blockHintKey =
    variant === 'farmTools'
      ? 'producer.dashboard.farmer.blockHintFarmTools'
      : 'producer.dashboard.farmer.blockHint';

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
      <View style={{ marginBottom: theme.spacing.md }}>
        <Text
          style={{
            fontSize: 15,
            fontWeight: '600',
            color: theme.colors.text.primary,
            marginBottom: 2,
          }}
        >
          {t(blockTitleKey)}
        </Text>
        <Text
          style={{
            fontSize: 13,
            fontWeight: '400',
            color: theme.colors.text.secondary,
            lineHeight: 18,
            marginBottom: theme.spacing.sm,
          }}
        >
          {t(blockHintKey)}
        </Text>
        <View style={{ gap: theme.spacing.sm }}>
          {essentials.map((item) => (
            <TouchableOpacity key={item.key} onPress={item.onPress} activeOpacity={0.7} style={row}>
              <View style={iconBox(item.accent)}>{item.icon}</View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.text.primary, marginBottom: 2 }}>
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

      <View style={{ marginBottom: theme.spacing.md }}>
        <Text
          style={{
            fontSize: 15,
            fontWeight: '600',
            color: theme.colors.text.primary,
            marginBottom: 2,
          }}
        >
          {t('producer.dashboard.farmer.logisticsBlockTitle')}
        </Text>
        <Text
          style={{
            fontSize: 13,
            fontWeight: '400',
            color: theme.colors.text.secondary,
            lineHeight: 18,
            marginBottom: theme.spacing.sm,
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
                minHeight: 52,
                minWidth: '47%',
                flexGrow: 1,
              }}
            >
              {item.icon}
              <Text
                style={{
                  marginLeft: 8,
                  fontSize: 14,
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

      <View style={{ marginBottom: theme.spacing.md }}>
        <Text
          style={{
            fontSize: 12,
            fontWeight: '600',
            color: theme.colors.text.secondary,
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
                paddingHorizontal: 12,
                borderWidth: 1,
                borderColor: theme.colors.border,
                flexDirection: 'row',
                alignItems: 'center',
                minHeight: 52,
                minWidth: '47%',
                flexGrow: 1,
              }}
            >
              {a.icon}
              <Text
                style={{
                  marginLeft: 8,
                  fontSize: 14,
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
