import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Package, Calculator, Award, ShieldAlert, Camera, FilePlus, Wheat, TrendingUp } from 'lucide-react-native';
import { theme } from '../../../lib/theme';

export interface QuickActionsHandlers {
  onMojiProizvodi: () => void;
  onKalkulatorTroskova: () => void;
  onSertifikati: () => void;
  onZabranjenaSredstva: () => void;
  onScanInput: () => void;
  onNewEntry: () => void;
  onReportHarvest: () => void;
  onVeraInsights: () => void;
}

const cardStyle = {
  backgroundColor: theme.colors.surface,
  borderRadius: theme.borderRadius.md,
  padding: theme.spacing.md,
  borderWidth: 0.5,
  borderColor: 'rgba(0, 0, 0, 0.05)',
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  minHeight: 64,
};

export default function QuickActionsSection({ handlers }: { handlers: QuickActionsHandlers }) {
  return (
    <>
      <View style={{ marginBottom: theme.spacing.lg }}>
        <Text style={{ fontSize: 12, fontWeight: '300', color: theme.colors.text.primary, letterSpacing: 0.5, marginBottom: theme.spacing.md }}>
          Brzi pristup
        </Text>
        <View style={{ gap: theme.spacing.sm }}>
          <TouchableOpacity onPress={handlers.onMojiProizvodi} activeOpacity={0.7} style={cardStyle}>
            <View style={{ width: 48, height: 48, borderRadius: theme.borderRadius.sm, backgroundColor: `${theme.colors.primary}15`, alignItems: 'center', justifyContent: 'center', marginRight: theme.spacing.md }}>
              <Package size={24} color={theme.colors.primary} strokeWidth={1} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.text.primary, marginBottom: 2 }}>Moji proizvodi</Text>
              <Text style={{ fontSize: 12, fontWeight: '300', color: theme.colors.text.secondary }}>QR ili ručni unos – šta sadrži</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={handlers.onKalkulatorTroskova} activeOpacity={0.7} style={cardStyle}>
            <View style={{ width: 48, height: 48, borderRadius: theme.borderRadius.sm, backgroundColor: `${theme.colors.accent}15`, alignItems: 'center', justifyContent: 'center', marginRight: theme.spacing.md }}>
              <Calculator size={24} color={theme.colors.accent} strokeWidth={1} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.text.primary, marginBottom: 2 }}>Kalkulator troškova</Text>
              <Text style={{ fontSize: 12, fontWeight: '300', color: theme.colors.text.secondary }}>Dodaj iznose – praćenje troškova</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={handlers.onSertifikati} activeOpacity={0.7} style={cardStyle}>
            <View style={{ width: 48, height: 48, borderRadius: theme.borderRadius.sm, backgroundColor: `${theme.colors.info}15`, alignItems: 'center', justifyContent: 'center', marginRight: theme.spacing.md }}>
              <Award size={24} color={theme.colors.info} strokeWidth={1} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.text.primary, marginBottom: 2 }}>Sertifikacije</Text>
              <Text style={{ fontSize: 12, fontWeight: '300', color: theme.colors.text.secondary }}>Obavezni sertifikati – pošalji foto</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={handlers.onZabranjenaSredstva} activeOpacity={0.7} style={cardStyle}>
            <View style={{ width: 48, height: 48, borderRadius: theme.borderRadius.sm, backgroundColor: `${theme.colors.warning}15`, alignItems: 'center', justifyContent: 'center', marginRight: theme.spacing.md }}>
              <ShieldAlert size={24} color={theme.colors.warning} strokeWidth={1} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.text.primary, marginBottom: 2 }}>Zabranjena sredstva</Text>
              <Text style={{ fontSize: 12, fontWeight: '300', color: theme.colors.text.secondary }}>Lista šta ne sme</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
      <View style={{ marginBottom: theme.spacing.lg }}>
        <Text style={{ fontSize: 12, fontWeight: '300', color: theme.colors.text.tertiary, letterSpacing: 0.5, marginBottom: theme.spacing.sm }}>Ostalo</Text>
        <View style={{ gap: theme.spacing.sm }}>
          <TouchableOpacity onPress={handlers.onScanInput} activeOpacity={0.7} style={{ ...cardStyle, minHeight: 52 }}>
            <Camera size={20} color={theme.colors.text.secondary} strokeWidth={1} style={{ marginRight: 12 }} />
            <Text style={{ fontSize: 14, color: theme.colors.text.primary }}>Skeniraj QR (proizvodi)</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handlers.onNewEntry} activeOpacity={0.7} style={{ ...cardStyle, minHeight: 52 }}>
            <FilePlus size={20} color={theme.colors.text.secondary} strokeWidth={1} style={{ marginRight: 12 }} />
            <Text style={{ fontSize: 14, color: theme.colors.text.primary }}>Unos rada (field log)</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handlers.onReportHarvest} activeOpacity={0.7} style={{ ...cardStyle, minHeight: 52 }}>
            <Wheat size={20} color={theme.colors.text.secondary} strokeWidth={1} style={{ marginRight: 12 }} />
            <Text style={{ fontSize: 14, color: theme.colors.text.primary }}>Prijava berbe</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handlers.onVeraInsights} activeOpacity={0.7} style={{ ...cardStyle, minHeight: 70 }}>
            <View style={{ width: 48, height: 48, borderRadius: theme.borderRadius.sm, backgroundColor: `${theme.colors.accent}15`, alignItems: 'center', justifyContent: 'center', marginRight: theme.spacing.md }}>
              <TrendingUp size={24} color={theme.colors.accent} strokeWidth={1} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, fontWeight: '300', color: theme.colors.text.primary, marginBottom: 2 }}>Vera Insights</Text>
              <Text style={{ fontSize: 9, fontWeight: '300', color: theme.colors.text.secondary }}>Market intelligence and recommendations</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}
