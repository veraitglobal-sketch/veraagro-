import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Package, Camera, FilePlus, Award, Calculator, ShieldAlert, TrendingUp, MapPinned, Sprout, Map } from 'lucide-react-native';
import { theme } from '../../../lib/theme';

export interface QuickActionsHandlers {
  onMyProducts: () => void;
  onCostCalculator: () => void;
  onCertifications: () => void;
  onBannedSubstances: () => void;
  onScanInput: () => void;
  onNewEntry: () => void;
  onReportHarvest: () => void;
  onVeraInsights: () => void;
  onEstates: () => void;
  onFieldSeason: () => void;
  /** Map: B2B suppliers (seeds, boxes, industrial packaging) + retail points */
  onSuppliersMap: () => void;
}

const cardStyle = {
  backgroundColor: theme.colors.surfaceElevated,
  borderRadius: theme.borderRadius.lg,
  padding: theme.spacing.md,
  borderWidth: 1,
  borderColor: theme.colors.border,
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  minHeight: 56,
};

export default function QuickActionsSection({ handlers }: { handlers: QuickActionsHandlers }) {
  const { t } = useTranslation();

  return (
    <>
      <View style={{ marginBottom: theme.spacing.lg }}>
        <Text style={{ fontSize: 12, fontWeight: '400', color: theme.colors.text.tertiary, letterSpacing: 1.2, marginBottom: theme.spacing.sm, textTransform: 'uppercase' }}>
          {t('producer.dashboard.quickActions')}
        </Text>
        <View style={{ gap: theme.spacing.sm }}>
          <TouchableOpacity onPress={handlers.onSuppliersMap} activeOpacity={0.7} style={cardStyle}>
            <View style={{ width: 44, height: 44, borderRadius: theme.borderRadius.md, backgroundColor: '#FFF7ED', alignItems: 'center', justifyContent: 'center', marginRight: theme.spacing.sm, borderWidth: 1, borderColor: '#FDBA74' }}>
              <Map size={22} color="#C2410C" strokeWidth={1.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: theme.colors.text.primary }}>{t('producer.dashboard.suppliersMap')}</Text>
              <Text style={{ fontSize: 12, fontWeight: '400', color: theme.colors.text.secondary }}>{t('producer.dashboard.suppliersMapDesc')}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={handlers.onFieldSeason} activeOpacity={0.7} style={cardStyle}>
            <View style={{ width: 44, height: 44, borderRadius: theme.borderRadius.md, backgroundColor: theme.colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: theme.spacing.sm }}>
              <Sprout size={22} color={theme.colors.primary} strokeWidth={1.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: theme.colors.text.primary }}>{t('producer.dashboard.fieldSeason')}</Text>
              <Text style={{ fontSize: 12, fontWeight: '400', color: theme.colors.text.secondary }}>{t('producer.dashboard.fieldSeasonDesc')}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={handlers.onMyProducts} activeOpacity={0.7} style={cardStyle}>
            <View style={{ width: 44, height: 44, borderRadius: theme.borderRadius.md, backgroundColor: theme.colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: theme.spacing.sm }}>
              <Package size={22} color={theme.colors.primary} strokeWidth={1.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: theme.colors.text.primary }}>{t('producer.dashboard.myProducts')}</Text>
              <Text style={{ fontSize: 12, fontWeight: '400', color: theme.colors.text.secondary }}>{t('producer.dashboard.myProductsDesc')}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={handlers.onScanInput} activeOpacity={0.7} style={cardStyle}>
            <View style={{ width: 44, height: 44, borderRadius: theme.borderRadius.md, backgroundColor: theme.colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: theme.spacing.sm }}>
              <Camera size={22} color={theme.colors.primary} strokeWidth={1.5} />
            </View>
            <Text style={{ fontSize: 15, fontWeight: '600', color: theme.colors.text.primary }}>{t('producer.dashboard.scanQr')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handlers.onNewEntry} activeOpacity={0.7} style={cardStyle}>
            <View style={{ width: 44, height: 44, borderRadius: theme.borderRadius.md, backgroundColor: theme.colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: theme.spacing.sm }}>
              <FilePlus size={22} color={theme.colors.primary} strokeWidth={1.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: theme.colors.text.primary }}>{t('producer.dashboard.fieldLog')}</Text>
              <Text style={{ fontSize: 12, fontWeight: '400', color: theme.colors.text.secondary }}>{t('producer.dashboard.fieldLogDesc')}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={handlers.onCertifications} activeOpacity={0.7} style={cardStyle}>
            <View style={{ width: 44, height: 44, borderRadius: theme.borderRadius.md, backgroundColor: theme.colors.infoLight, alignItems: 'center', justifyContent: 'center', marginRight: theme.spacing.sm }}>
              <Award size={22} color={theme.colors.info} strokeWidth={1.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: theme.colors.text.primary }}>{t('producer.dashboard.certifications')}</Text>
              <Text style={{ fontSize: 12, fontWeight: '400', color: theme.colors.text.secondary }}>{t('producer.dashboard.certificationsDesc')}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
      <View style={{ marginBottom: theme.spacing.lg }}>
        <Text style={{ fontSize: 12, fontWeight: '400', color: theme.colors.text.tertiary, letterSpacing: 1.2, marginBottom: theme.spacing.sm, textTransform: 'uppercase' }}>
          {t('producer.dashboard.more')}
        </Text>
        <View style={{ gap: theme.spacing.xs }}>
          <TouchableOpacity onPress={handlers.onCostCalculator} activeOpacity={0.7} style={[cardStyle, { minHeight: 48 }]}>
            <Calculator size={20} color={theme.colors.text.secondary} strokeWidth={1.5} style={{ marginRight: 12 }} />
            <Text style={{ fontSize: 14, color: theme.colors.text.primary }}>{t('producer.dashboard.costCalculator')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handlers.onBannedSubstances} activeOpacity={0.7} style={[cardStyle, { minHeight: 48 }]}>
            <ShieldAlert size={20} color={theme.colors.text.secondary} strokeWidth={1.5} style={{ marginRight: 12 }} />
            <Text style={{ fontSize: 14, color: theme.colors.text.primary }}>{t('producer.dashboard.bannedSubstances')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handlers.onReportHarvest} activeOpacity={0.7} style={[cardStyle, { minHeight: 48 }]}>
            <FilePlus size={20} color={theme.colors.text.secondary} strokeWidth={1.5} style={{ marginRight: 12 }} />
            <Text style={{ fontSize: 14, color: theme.colors.text.primary }}>{t('producer.dashboard.reportHarvest')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handlers.onVeraInsights} activeOpacity={0.7} style={[cardStyle, { minHeight: 48 }]}>
            <TrendingUp size={20} color={theme.colors.text.secondary} strokeWidth={1.5} style={{ marginRight: 12 }} />
            <Text style={{ fontSize: 14, color: theme.colors.text.primary }}>{t('producer.dashboard.veraInsights')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handlers.onEstates} activeOpacity={0.7} style={[cardStyle, { minHeight: 48 }]}>
            <MapPinned size={20} color={theme.colors.text.secondary} strokeWidth={1.5} style={{ marginRight: 12 }} />
            <Text style={{ fontSize: 14, color: theme.colors.text.primary }}>{t('producer.dashboard.parcelMapping')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}
