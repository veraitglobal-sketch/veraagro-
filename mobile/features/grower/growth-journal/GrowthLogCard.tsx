import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Modal,
  ScrollView,
  Linking,
  Pressable,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { MapPin, Calendar, ExternalLink, X } from 'lucide-react-native';
import { colors } from '../../../lib/colors';
import { theme } from '../../../lib/theme';
import { enterpriseUi } from '../../../lib/enterprise-ui';
import type { GrowthLog } from '../../../lib/api';
import { useAppLocaleTag } from '../../../lib/date-locale';

interface GrowthLogCardProps {
  log: GrowthLog;
}

export function GrowthLogCard({ log }: GrowthLogCardProps) {
  const { t } = useTranslation();
  const dateLocale = useAppLocaleTag();
  const combinedDateOpts = useMemo(
    () =>
      ({
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }) satisfies Intl.DateTimeFormatOptions,
    [],
  );
  const [detailOpen, setDetailOpen] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${log.gpsLatitude},${log.gpsLongitude}`;

  const openMaps = () => {
    void Linking.openURL(mapsUrl);
  };

  const canShowImage = log.imageUrl && !imageFailed;

  return (
    <>
      <Pressable
        onPress={() => setDetailOpen(true)}
        style={({ pressed }) => [enterpriseUi.inAppPanel, { padding: 16, opacity: pressed ? 0.92 : 1 }]}
      >
        {canShowImage ? (
          <Image
            source={{ uri: log.imageUrl }}
            onError={() => setImageFailed(true)}
            style={{
              width: '100%',
              height: 200,
              borderRadius: theme.borderRadius.sm,
              marginBottom: theme.spacing.sm,
            }}
            resizeMode="cover"
          />
        ) : (
          <View
            style={{
              width: '100%',
              height: 120,
              borderRadius: theme.borderRadius.sm,
              marginBottom: theme.spacing.sm,
              backgroundColor: `${colors.text.tertiary}18`,
              alignItems: 'center',
              justifyContent: 'center',
              padding: 12,
            }}
          >
            <Text style={{ fontSize: 11, color: colors.text.tertiary, textAlign: 'center' }}>
              {t('producer.growthJournal.imageUnavailable')}
            </Text>
          </View>
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.xs }}>
          <MapPin size={14} color={colors.text.secondary} strokeWidth={1} />
          <Text
            style={{
              fontSize: 11,
              fontWeight: '300',
              color: colors.text.secondary,
              marginLeft: 4,
              flex: 1,
            }}
            numberOfLines={1}
          >
            {log.gpsLatitude.toFixed(5)}, {log.gpsLongitude.toFixed(5)}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Calendar size={14} color={colors.text.secondary} strokeWidth={1} />
          <Text
            style={{
              fontSize: 11,
              fontWeight: '300',
              color: colors.text.secondary,
              marginLeft: 4,
            }}
          >
            {new Date(log.createdAt).toLocaleString(dateLocale, combinedDateOpts)}
          </Text>
        </View>
        {log.growthStage ? (
          <Text style={{ fontSize: 12, color: colors.primary, marginTop: theme.spacing.sm }} numberOfLines={2}>
            {t('producer.growthJournal.stageLabel')}: {log.growthStage}
          </Text>
        ) : null}
        {log.notes ? (
          <Text style={{ fontSize: 12, color: colors.text.secondary, marginTop: 4 }} numberOfLines={2}>
            {log.notes}
          </Text>
        ) : null}
        {log.parcel ? (
          <Text style={{ fontSize: 11, color: colors.text.tertiary, marginTop: 6 }}>
            {t('producer.growthJournal.parcelWithType', { type: log.parcel.cropType || '—' })}
          </Text>
        ) : null}
        {log.plan ? (
          <Text style={{ fontSize: 11, color: colors.text.secondary, marginTop: 4 }} numberOfLines={2}>
            {t('producer.growthJournal.logPlanLine', {
              kind:
                log.plan.announcementType === 'PLANTING'
                  ? t('producer.growthJournal.planKindPlanting')
                  : t('producer.growthJournal.planKindHarvest'),
              crop: log.plan.cropType,
              date: String(log.plan.estimatedDate).slice(0, 10),
            })}
          </Text>
        ) : null}
        <Text style={{ fontSize: 10, color: colors.text.tertiary, marginTop: 8 }}>
          {t('producer.growthJournal.tapForDetail')}
        </Text>
      </Pressable>

      <Modal visible={detailOpen} animationType="slide" transparent onRequestClose={() => setDetailOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View
            style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: theme.borderRadius.lg,
              borderTopRightRadius: theme.borderRadius.lg,
              maxHeight: '90%',
              paddingBottom: 24,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: theme.spacing.md,
                borderBottomWidth: 0.5,
                borderBottomColor: colors.border,
              }}
            >
              <Text style={{ fontSize: 17, fontWeight: '600', color: colors.text.primary }}>
                {t('producer.growthJournal.logDetail')}
              </Text>
              <TouchableOpacity onPress={() => setDetailOpen(false)} hitSlop={12}>
                <X size={22} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: theme.spacing.md }}>
              {canShowImage ? (
                <Image
                  source={{ uri: log.imageUrl }}
                  style={{ width: '100%', height: 240, borderRadius: theme.borderRadius.sm, marginBottom: 16 }}
                  resizeMode="cover"
                  onError={() => setImageFailed(true)}
                />
              ) : null}
              <TouchableOpacity
                onPress={openMaps}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  paddingVertical: 10,
                  marginBottom: 8,
                }}
              >
                <ExternalLink size={18} color={colors.primary} />
                <Text style={{ fontSize: 15, color: colors.primary, fontWeight: '600' }}>
                  {t('producer.growthJournal.openInMaps')}
                </Text>
              </TouchableOpacity>
              <Text style={{ fontSize: 13, color: colors.text.secondary, marginBottom: 4 }}>
                {log.gpsLatitude.toFixed(6)}, {log.gpsLongitude.toFixed(6)}
              </Text>
              <Text style={{ fontSize: 13, color: colors.text.secondary, marginBottom: 16 }}>
                {new Date(log.createdAt).toLocaleString(dateLocale, combinedDateOpts)}
              </Text>
              {log.growthStage ? (
                <Text style={{ fontSize: 15, color: colors.text.primary, marginBottom: 8 }}>
                  {t('producer.growthJournal.stageLabel')}: {log.growthStage}
                </Text>
              ) : null}
              {log.notes ? (
                <Text style={{ fontSize: 15, color: colors.text.secondary, lineHeight: 22 }}>
                  {log.notes}
                </Text>
              ) : null}
              {log.parcel ? (
                <Text style={{ fontSize: 13, color: colors.text.tertiary, marginTop: 12 }}>
                  {t('producer.growthJournal.parcelWithType', { type: log.parcel.cropType || '—' })}
                </Text>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}
