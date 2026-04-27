import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Download, MapPin, ChevronRight, Plus } from 'lucide-react-native';
import { colors } from '../../../lib/colors';
import { theme } from '../../../lib/theme';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';
import { BioVeraSubpageHeader } from '../../../components/BioVeraSubpageHeader';
import { useMaterialsData } from './useMaterialsData';
import { WhitelistSearch } from './WhitelistSearch';
import { MaterialList } from './MaterialList';
import { AddMaterialSheet } from './AddMaterialSheet';

/**
 * Materials (whitelist) screen: header, search + filters, list with refresh.
 * Uses useMaterialsData once and passes data to WhitelistSearch and MaterialList.
 */
export function MaterialsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const data = useMaterialsData();
  const p = useBioVeraScreenPadding();
  const [addOpen, setAddOpen] = useState(false);

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <BioVeraSubpageHeader
        title={t('producer.materials.screenTitle')}
        left="back"
        right={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <TouchableOpacity onPress={() => setAddOpen(true)} hitSlop={8} accessibilityLabel={t('producer.materials.addButton')}>
              <Plus size={22} color={theme.colors.primary} strokeWidth={2} />
            </TouchableOpacity>
            {data.lastSync ? (
              <TouchableOpacity onPress={data.loadMaterials} hitSlop={8} accessibilityLabel={t('producer.materials.loading')}>
                <Download size={20} color={colors.text.secondary} strokeWidth={1} />
              </TouchableOpacity>
            ) : null}
          </View>
        }
      />

      <View
        style={{
          paddingLeft: p.screenPaddingLeft,
          paddingRight: p.screenPaddingRight,
          paddingBottom: theme.spacing.sm,
        }}
      >
        <TouchableOpacity
          onPress={() => setAddOpen(true)}
          activeOpacity={0.8}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 12,
            paddingHorizontal: theme.spacing.md,
            backgroundColor: `${theme.colors.primary}12`,
            borderRadius: theme.borderRadius.lg,
            borderWidth: 1,
            borderColor: `${theme.colors.primary}35`,
            marginBottom: theme.spacing.sm,
            gap: 8,
          }}
        >
          <Plus size={20} color={theme.colors.primary} strokeWidth={2} />
          <Text style={{ fontSize: 15, fontWeight: '600', color: theme.colors.primary }}>{t('producer.materials.addButton')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push('/map')}
          activeOpacity={0.75}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: theme.spacing.md,
            backgroundColor: '#FFF7ED',
            borderRadius: theme.borderRadius.lg,
            borderWidth: 1,
            borderColor: '#FDBA74',
            gap: theme.spacing.sm,
          }}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: theme.borderRadius.md,
              backgroundColor: '#FFEDD5',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MapPin size={22} color="#C2410C" strokeWidth={1.5} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text.primary }}>{t('producer.materials.mapBannerTitle')}</Text>
            <Text style={{ fontSize: 12, color: theme.colors.primary, marginTop: 4, fontWeight: '500' }}>{t('producer.materials.mapBannerCta')}</Text>
          </View>
          <ChevronRight size={20} color={colors.text.secondary} strokeWidth={1.5} />
        </TouchableOpacity>
      </View>

      <WhitelistSearch
        searchQuery={data.searchQuery}
        setSearchQuery={data.setSearchQuery}
        filterType={data.filterType}
        setFilterType={data.setFilterType}
      />

      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={data.refreshing}
            onRefresh={data.onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <View
          style={{
            paddingTop: theme.spacing.md,
            paddingLeft: p.screenPaddingLeft,
            paddingRight: p.screenPaddingRight,
            paddingBottom: Math.max(p.bottomInset, theme.spacing.lg),
          }}
        >
          <MaterialList
            filteredMaterials={data.filteredMaterials}
            loading={data.loading}
            searchQuery={data.searchQuery}
            filterType={data.filterType}
            lastSync={data.lastSync}
            getTypeColor={data.getTypeColor}
            getTypeLabel={data.getTypeLabel}
          />
        </View>
      </ScrollView>

      <AddMaterialSheet
        visible={addOpen}
        onClose={() => setAddOpen(false)}
        onSuccess={data.loadMaterials}
      />
    </View>
  );
}
