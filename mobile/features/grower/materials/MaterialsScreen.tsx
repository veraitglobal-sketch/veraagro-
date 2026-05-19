import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { EnterpriseScreen } from '../../../components/enterprise/EnterpriseScreen';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react-native';
import { enterpriseColors, enterpriseUi } from '../../../lib/enterprise-ui';
import { growerUi } from '../../../lib/grower-ui';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';
import { GrowerStackHeader } from '../../../components/grower/GrowerStackHeader';
import { useMaterialsData } from './useMaterialsData';
import { WhitelistSearch } from './WhitelistSearch';
import { MaterialList } from './MaterialList';
import { AddMaterialSheet } from './AddMaterialSheet';

export function MaterialsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const data = useMaterialsData();
  const p = useBioVeraScreenPadding();
  const [addOpen, setAddOpen] = useState(false);

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(producer)/(tabs)/supplies');
    }
  };

  return (
    <View style={growerUi.canvas}>
      <EnterpriseScreen
        refreshing={data.refreshing}
        onRefresh={data.onRefresh}
        contentPaddingBottom={Math.max(p.bottomInset, 20) + 12}
        header={
          <>
            <GrowerStackHeader
              title={t('producer.materials.screenTitle')}
              subtitle={t('producer.materials.screenLeadShort')}
              onBack={goBack}
            />
            <WhitelistSearch
              searchQuery={data.searchQuery}
              setSearchQuery={data.setSearchQuery}
              filterType={data.filterType}
              setFilterType={data.setFilterType}
            />
          </>
        }
      >
        <View style={[growerUi.scrollContent, { paddingTop: 16 }]}>
        <TouchableOpacity
          onPress={() => setAddOpen(true)}
          activeOpacity={0.88}
          style={growerUi.btnPrimary}
          accessibilityRole="button"
        >
          <Text style={growerUi.btnPrimaryText}>{t('producer.materials.addButton')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/map')}
          activeOpacity={0.72}
          style={[enterpriseUi.inAppPanel, styles.mapLink]}
          accessibilityRole="button"
        >
          <Text style={enterpriseUi.navRowTitle}>{t('producer.materials.mapBannerTitle')}</Text>
          <Text style={styles.mapLinkCta}>{t('producer.materials.mapBannerCta')}</Text>
        </TouchableOpacity>

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
      </EnterpriseScreen>

      <AddMaterialSheet
        visible={addOpen}
        onClose={() => setAddOpen(false)}
        onSuccess={data.loadMaterials}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  mapLink: {
    marginTop: 12,
    marginBottom: 16,
    padding: 16,
  },
  mapLinkCta: {
    fontSize: 14,
    fontWeight: '500',
    color: enterpriseColors.primary,
    marginTop: 6,
  },
});
