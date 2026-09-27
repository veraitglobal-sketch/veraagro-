import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppLocaleTag } from '../../../lib/date-locale';
import { formatEur } from '../../../lib/format-money';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { Package, MessageCircle, Send } from 'lucide-react-native';
import { GrowerStackHeader } from '../../../components/grower/GrowerStackHeader';
import { enterpriseColors, enterpriseUi } from '../../../lib/enterprise-ui';
import { growerUi } from '../../../lib/grower-ui';
import { EnterpriseButton, EnterpriseTextField, EnterpriseTextArea } from '../../../design-system';
import { b2bSuppliersAPI } from '../../../lib/api';
import { apiErrorMessage } from '../../../lib/api-error';
import { partnerSignInHref } from '../../../lib/post-login-redirect';
import { useAuth } from '../../../hooks/useAuth';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';
import type { SupplierPublicStore } from './supplier-store-types';
import { SupplierThreadPanel } from './SupplierThreadPanel';

function paramFirst(raw: string | string[] | undefined): string {
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw) && raw[0]) return raw[0];
  return '';
}

export default function SupplierStoreScreen() {
  const { t } = useTranslation();
  const locale = useAppLocaleTag();
  const params = useLocalSearchParams<{
    userId: string;
    threadId?: string | string[];
    panel?: string | string[];
  }>();
  const userId = paramFirst(params.userId);
  const threadIdFromLink = paramFirst(params.threadId);
  const panel = paramFirst(params.panel);
  const showMessages = panel === 'messages';

  const router = useRouter();
  const { token } = useAuth();
  const p = useBioVeraScreenPadding();

  const [store, setStore] = useState<SupplierPublicStore | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successId, setSuccessId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = (await b2bSuppliersAPI.getPublic(userId)) as SupplierPublicStore;
      setStore(data);
      const init: Record<string, string> = {};
      data.catalog?.forEach((c) => {
        init[c.id] = '';
      });
      setQuantities(init);
    } catch (e: unknown) {
      setStore(null);
      Alert.alert(t('error'), apiErrorMessage(e, t('b2bSupplier.store.loadFailed')));
    } finally {
      setLoading(false);
    }
  }, [userId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(producer)/partner-orders');
    }
  };

  const openMessages = () => {
    const q = threadIdFromLink ? `?panel=messages&threadId=${encodeURIComponent(threadIdFromLink)}` : '?panel=messages';
    router.push(`/b2b-supplier/${encodeURIComponent(userId)}${q}` as Href);
  };

  const openStore = () => {
    router.push(`/b2b-supplier/${encodeURIComponent(userId)}` as Href);
  };

  const onSubmit = async () => {
    if (!store || !token) {
      Alert.alert(t('b2bSupplier.signInTitle'), t('b2bSupplier.signInBody'));
      return;
    }
    const items: { label: string; quantity: number; unit?: string }[] = [];
    for (const line of store.catalog) {
      const raw = (quantities[line.id] || '').trim().replace(',', '.');
      if (!raw) continue;
      const q = parseFloat(raw);
      if (Number.isNaN(q) || q <= 0) {
        Alert.alert(t('error'), t('b2bSupplier.store.invalidQty', { name: line.name }));
        return;
      }
      items.push({
        label: line.sku ? `${line.name} (${line.sku})` : line.name,
        quantity: q,
        unit: line.unit || undefined,
      });
    }
    if (items.length === 0) {
      if (store.catalog.length === 0 && note.trim()) {
        items.push({
          label: t('b2bSupplier.store.inquiryLineLabel', { snippet: note.trim().slice(0, 500) }),
          quantity: 1,
          unit: 'inquiry',
        });
      } else {
        Alert.alert(t('error'), t('b2bSupplier.store.needQtyOrNote'));
        return;
      }
    }

    setSubmitting(true);
    try {
      const thread = await b2bSuppliersAPI.getOrCreateThread(userId);
      const order = (await b2bSuppliersAPI.createOrder({
        supplierUserId: userId,
        items,
        note: note.trim() || undefined,
        threadId: thread.id,
      })) as { id?: string };
      setSuccessId(order?.id || 'ok');
    } catch (e: unknown) {
      Alert.alert(t('error'), apiErrorMessage(e, t('b2bSupplier.orderFailed')));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !store) {
    return (
      <View style={growerUi.canvas}>
        <GrowerStackHeader title={t('producer.dashboard.partnerOrders.openStore')} onBack={goBack} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={enterpriseColors.primary} />
        </View>
      </View>
    );
  }

  if (!store) {
    return (
      <View style={growerUi.canvas}>
        <GrowerStackHeader title={t('producer.dashboard.partnerOrders.openStore')} onBack={goBack} />
        <View style={[growerUi.scrollContent, styles.centered]}>
          <Text style={enterpriseUi.navRowSubtitle}>{t('b2bSupplier.store.loadFailed')}</Text>
        </View>
      </View>
    );
  }

  if (showMessages) {
    return (
      <View style={growerUi.canvas}>
        <GrowerStackHeader
          title={t('producer.dashboard.partnerOrders.messageSupplier')}
          subtitle={store.businessName}
          onBack={goBack}
        />
        <SupplierThreadPanel
          supplierUserId={userId}
          threadIdFromLink={threadIdFromLink}
          onOpenStore={openStore}
        />
      </View>
    );
  }

  // List prices are the supplier's indicative prices; the supplier confirms the final amount.
  const orderTotal = store.catalog.reduce((sum, line) => {
    const qty = Number(String(quantities[line.id] ?? '').replace(',', '.'));
    return line.listPrice != null && Number.isFinite(qty) && qty > 0 ? sum + qty * line.listPrice : sum;
  }, 0);

  const addressLine = [store.address, [store.postalCode, store.city].filter(Boolean).join(' '), store.country]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={growerUi.canvas}>
      <GrowerStackHeader
        title={store.businessName}
        subtitle={t('b2bSupplier.store.screenLead')}
        onBack={goBack}
      />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            growerUi.scrollContent,
            { paddingBottom: Math.max(p.bottomInset, 16) + 88 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {store.mapOnPublicDirectory === false ? (
            <View style={[enterpriseUi.inAppPanel, styles.notice]}>
              <Text style={enterpriseUi.navRowSubtitle}>{t('b2bSupplier.store.notOnMap')}</Text>
            </View>
          ) : null}

          {addressLine ? (
            <Text style={[enterpriseUi.navRowSubtitle, styles.address]}>{addressLine}</Text>
          ) : null}

          {successId ? (
            <View style={[enterpriseUi.inAppPanel, styles.successBox]}>
              <Text style={enterpriseUi.navRowTitle}>{t('b2bSupplier.store.successTitle')}</Text>
              <Text style={[enterpriseUi.navRowSubtitle, styles.successBody]}>
                {t('b2bSupplier.store.successBody')}
              </Text>
              <TouchableOpacity onPress={() => setSuccessId(null)} activeOpacity={0.72} style={styles.linkBtn}>
                <Text style={styles.linkText}>{t('b2bSupplier.store.placeAnother')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={enterpriseUi.inAppSectionLabel}>{t('b2bSupplier.store.catalogTitle')}</Text>
              {store.catalog.length === 0 ? (
                <View style={growerUi.emptyCard}>
                  <Text style={enterpriseUi.navRowSubtitle}>{t('b2bSupplier.store.emptyCatalog')}</Text>
                </View>
              ) : (
                store.catalog.map((line) => (
                  <View key={line.id} style={[enterpriseUi.inAppPanel, styles.productRow]}>
                    <View style={styles.productMain}>
                      <View style={styles.imageWrap}>
                        {line.imageUrl ? (
                          <Image source={{ uri: line.imageUrl }} style={styles.productImage} resizeMode="cover" />
                        ) : (
                          <View style={styles.imagePlaceholder}>
                            <Package size={28} color={enterpriseColors.gray600} strokeWidth={1.5} />
                          </View>
                        )}
                      </View>
                      <View style={styles.productCopy}>
                        <Text style={enterpriseUi.navRowTitle}>{line.name}</Text>
                        {line.description ? (
                          <Text style={enterpriseUi.navRowSubtitle} numberOfLines={2}>
                            {line.description}
                          </Text>
                        ) : null}
                        <Text style={styles.productMeta}>
                          {[`${t('b2bSupplier.store.unit')} ${line.unit}`, line.sku].filter(Boolean).join(' · ')}
                        </Text>
                        {line.listPrice != null ? (
                          <Text style={styles.price}>
                            {formatEur(line.listPrice, locale)}
                            <Text style={styles.priceUnit}> / {line.unit}</Text>
                          </Text>
                        ) : null}
                      </View>
                    </View>
                    <View style={styles.qtyRow}>
                      <Text style={styles.qtyLabel}>{t('b2bSupplier.store.qty')}</Text>
                      <EnterpriseTextField
                        value={quantities[line.id] ?? ''}
                        onChangeText={(v) => setQuantities((q) => ({ ...q, [line.id]: v }))}
                        placeholder={t('b2bSupplier.store.qtyPlaceholder')}
                        keyboardType="decimal-pad"
                        containerStyle={styles.qtyField}
                      />
                    </View>
                  </View>
                ))
              )}

              <EnterpriseTextArea
                label={t('b2bSupplier.store.noteLabel')}
                value={note}
                onChangeText={setNote}
                placeholder={t('b2bSupplier.store.notePlaceholder')}
                minRows={2}
              />

              {!token ? (
                <View style={[enterpriseUi.inAppPanel, styles.signInBox]}>
                  <Text style={enterpriseUi.navRowSubtitle}>{t('b2bSupplier.signInBody')}</Text>
                  <TouchableOpacity
                    onPress={() => router.push(partnerSignInHref() as Href)}
                    activeOpacity={0.88}
                    style={[enterpriseUi.authBtnPrimary, styles.signInBtn]}
                  >
                    <Text style={enterpriseUi.authBtnPrimaryText}>{t('b2bSupplier.signInTitle')}</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </>
          )}

          <TouchableOpacity onPress={openMessages} activeOpacity={0.72} style={[enterpriseUi.inAppPanel, styles.msgLink]}>
            <MessageCircle size={20} color={enterpriseColors.primary} strokeWidth={1.5} />
            <Text style={styles.msgLinkText}>{t('producer.dashboard.partnerOrders.messageSupplier')}</Text>
          </TouchableOpacity>
        </ScrollView>

        {token && !successId ? (
          <View style={[styles.footer, { paddingBottom: Math.max(p.bottomInset, 12) }]}>
            {orderTotal > 0 ? (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>{t('b2bSupplier.store.estimatedTotal')}</Text>
                <Text style={styles.totalValue}>{formatEur(orderTotal, locale)}</Text>
              </View>
            ) : null}
            <EnterpriseButton
              label={t('b2bSupplier.store.submit')}
              onPress={() => void onSubmit()}
              loading={submitting}
              disabled={submitting}
              fullWidth
              size="large"
              icon={<Send size={20} color={enterpriseColors.white} strokeWidth={1.5} />}
            />
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  price: { fontSize: 15, fontWeight: '700', color: enterpriseColors.primary, marginTop: 4, fontVariant: ['tabular-nums'] },
  priceUnit: { fontSize: 12, fontWeight: '500', color: enterpriseColors.gray600 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 },
  totalLabel: { fontSize: 13, color: enterpriseColors.gray600 },
  totalValue: { fontSize: 17, fontWeight: '700', color: enterpriseColors.gray900, fontVariant: ['tabular-nums'] },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  notice: {
    padding: 14,
    marginBottom: 12,
  },
  address: {
    marginBottom: 16,
  },
  successBox: {
    padding: 18,
    marginBottom: 16,
  },
  successBody: {
    marginTop: 8,
  },
  linkBtn: {
    marginTop: 14,
    minHeight: 44,
    justifyContent: 'center',
  },
  linkText: {
    fontSize: 15,
    fontWeight: '600',
    color: enterpriseColors.primary,
  },
  productRow: {
    padding: 14,
    marginBottom: 10,
  },
  productMain: {
    flexDirection: 'row',
    gap: 12,
  },
  imageWrap: {
    width: 72,
    height: 72,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: enterpriseColors.gray100,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: enterpriseColors.gray200,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productCopy: {
    flex: 1,
    minWidth: 0,
  },
  productMeta: {
    fontSize: 13,
    color: enterpriseColors.gray600,
    marginTop: 6,
    lineHeight: 18,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },
  qtyLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: enterpriseColors.gray600,
    width: 40,
  },
  qtyField: {
    flex: 1,
    marginBottom: 0,
  },
  signInBox: {
    padding: 16,
    marginTop: 12,
  },
  signInBtn: {
    marginTop: 12,
    minHeight: 48,
    justifyContent: 'center',
  },
  msgLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    marginTop: 8,
  },
  msgLinkText: {
    fontSize: 16,
    fontWeight: '500',
    color: enterpriseColors.primary,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: enterpriseColors.gray200,
    backgroundColor: enterpriseColors.white,
  },
});
