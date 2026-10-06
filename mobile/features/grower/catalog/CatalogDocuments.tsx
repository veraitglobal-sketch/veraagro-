import { useEffect, useRef, useState } from 'react';
import { View, Text } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useTranslation } from 'react-i18next';
import { EnterpriseButton, EnterpriseTextField } from '../../../design-system';
import { growerCatalogAPI } from '../../../lib/api/grower-catalog';
import { apiErrorMessage } from '../../../lib/api-error';
import { theme } from '../../../lib/theme';

export default function CatalogDocuments({ productId, estateId }: { productId: string; estateId: string }) {
  const { t } = useTranslation();
  const [fields, setFields] = useState({ title: '', issuer: '', issuedAt: '', expiresAt: '' });
  const [file, setFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [kind, setKind] = useState('CERTIFICATE');
  const [rows, setRows] = useState<Awaited<ReturnType<typeof growerCatalogAPI.documents>>>([]);
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const [message, setMessage] = useState('');
  useEffect(() => {
    let active = true;
    growerCatalogAPI.documents(productId).then(r => { if (active) setRows(r); })
      .catch(e => { if (active) setMessage(apiErrorMessage(e, t('producer.catalog.loadFailed'))); });
    return () => { active = false; };
  }, [productId, t]);
  const pick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/jpeg', 'image/png'], copyToCacheDirectory: true });
      if (!result.canceled) {
        if ((result.assets[0].size ?? 0) > 10 * 1024 * 1024) { setMessage(t('producer.catalogMedia.tooLarge')); return; }
        setFile(result.assets[0]); setMessage('');
      }
    } catch (e) { setMessage(apiErrorMessage(e, t('producer.catalog.saveFailed'))); }
  };
  const upload = async () => {
    if (pending.current || !file || !fields.title.trim()) return;
    pending.current = true; setBusy(true); setMessage('');
    try {
      const row = await growerCatalogAPI.uploadDocument(file, {
        ...fields, title: fields.title.trim(), scope: 'PRODUCT', docType: kind,
        catalogProductId: productId, estateId, isPublic: '0',
      });
      setRows(previous => [row, ...previous]); setFile(null);
      setFields({ title: '', issuer: '', issuedAt: '', expiresAt: '' });
      setMessage(t('producer.catalogMedia.reviewNotice'));
    } catch (e) { setMessage(apiErrorMessage(e, t('producer.catalog.saveFailed'))); }
    finally { pending.current = false; setBusy(false); }
  };
  return <View style={{ marginTop: 24, gap: 10 }}>
    <Text style={{ fontWeight: '600', color: theme.colors.text.primary }}>{t('producer.catalogMedia.documents')}</Text>
    {rows.map(row => <Text key={row.id} style={{ color: theme.colors.text.secondary }}>{row.title} · {t(`producer.catalogMedia.${row.verificationStatus}`)}</Text>)}
    {(['title', 'issuer', 'issuedAt', 'expiresAt'] as const).map(key => <EnterpriseTextField key={key}
      label={t(`producer.catalogMedia.${key}`)} value={fields[key]}
      onChangeText={value => setFields(previous => ({ ...previous, [key]: value }))} />)}
    <View style={{ gap: 6 }}>{['CERTIFICATE', 'LAB_RESULT', 'OTHER'].map(value => <EnterpriseButton key={value}
      label={t(`producer.catalogMedia.${value}`)} variant={kind === value ? 'primary' : 'secondary'}
      onPress={() => setKind(value)} disabled={busy} />)}</View>
    <EnterpriseButton label={file?.name ?? t('producer.catalogMedia.pickDocument')} variant="secondary" onPress={() => void pick()} disabled={busy} />
    <EnterpriseButton label={t('producer.catalogMedia.upload')} onPress={() => void upload()} loading={busy} disabled={busy || !file || !fields.title.trim()} />
    {message ? <Text accessibilityRole="alert" style={{ color: theme.colors.text.secondary }}>{message}</Text> : null}
  </View>;
}
