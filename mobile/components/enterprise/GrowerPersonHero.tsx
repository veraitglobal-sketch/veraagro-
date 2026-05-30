import { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { CheckCircle2, MapPin } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { enterpriseColors } from '../../lib/enterprise-ui';
import { growerHeroText } from '../../design-system/grower-sheet-styles';

type Props = {
  name: string;
  email?: string | null;
  partnerCode?: string | null;
  roleLabel?: string;
  photoUri?: string | null;
  /** Tighter avatar and type — profile tab. */
  compact?: boolean;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

/** Centered profile hero — avatar, badge, white typography on gradient. */
export function GrowerPersonHero({
  name,
  email,
  partnerCode,
  roleLabel,
  photoUri,
  compact = false,
}: Props) {
  const { t } = useTranslation();
  const role = roleLabel ?? t('producer.profile.heroRole');
  const [photoFailed, setPhotoFailed] = useState(false);
  const showPhoto = Boolean(photoUri) && !photoFailed;

  useEffect(() => {
    setPhotoFailed(false);
  }, [photoUri]);

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <View style={[styles.avatarShell, compact && styles.avatarShellCompact]}>
        <View style={[styles.avatarRing, compact && styles.avatarRingCompact]}>
          <View style={[styles.avatar, compact && styles.avatarCompact]}>
            {showPhoto ? (
              <Image
                source={{ uri: photoUri! }}
                style={styles.avatarImage}
                resizeMode="cover"
                onError={() => setPhotoFailed(true)}
                accessibilityIgnoresInvertColors
              />
            ) : (
              <Text style={[styles.initials, compact && styles.initialsCompact]}>{initials(name)}</Text>
            )}
          </View>
        </View>
        <View
          style={[styles.verifiedBadge, compact && styles.verifiedBadgeCompact]}
          accessibilityLabel={t('producer.profile.verifiedA11y')}
        >
          <CheckCircle2 size={compact ? 16 : 18} color="#FFFFFF" strokeWidth={2.2} fill={enterpriseColors.primary} />
        </View>
      </View>

      <View style={[styles.rolePill, compact && styles.rolePillCompact]}>
        <Text style={styles.roleText}>{role}</Text>
      </View>

      <Text
        style={[styles.name, compact && styles.nameCompact, growerHeroText.title]}
        numberOfLines={2}
        accessibilityRole="header"
      >
        {name}
      </Text>

      {email ? (
        <Text
          style={[styles.email, compact && styles.emailCompact, growerHeroText.subtitle]}
          numberOfLines={1}
        >
          {email}
        </Text>
      ) : null}

      {partnerCode ? (
        <View style={[styles.metaRow, compact && styles.metaRowCompact]}>
          <MapPin size={14} color="rgba(255,255,255,0.9)" strokeWidth={1.75} />
          <Text style={styles.metaText}>
            {t('producer.dashboard.partner')} {partnerCode}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    width: '100%',
    paddingTop: 6,
  },
  wrapCompact: {
    paddingTop: 2,
  },
  avatarShell: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarShellCompact: {
    marginBottom: 12,
  },
  avatarRing: {
    padding: 3,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
    shadowColor: '#0a2014',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  avatarRingCompact: {
    borderRadius: 22,
    padding: 2,
  },
  avatar: {
    width: 104,
    height: 104,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.24)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.52)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarCompact: {
    width: 84,
    height: 84,
    borderRadius: 18,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  initials: {
    fontSize: 34,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 1.2,
  },
  initialsCompact: {
    fontSize: 28,
  },
  verifiedBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  verifiedBadgeCompact: {
    width: 28,
    height: 28,
    borderRadius: 14,
    right: 0,
    bottom: 0,
  },
  rolePill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.34)',
    marginBottom: 14,
  },
  rolePillCompact: {
    marginBottom: 10,
    paddingVertical: 6,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.95)',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  name: {
    fontSize: 30,
    fontWeight: '500',
    color: '#FFFFFF',
    letterSpacing: -0.7,
    lineHeight: 36,
    textAlign: 'center',
  },
  nameCompact: {
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.55,
  },
  email: {
    fontSize: 15,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.84)',
    marginTop: 8,
    textAlign: 'center',
    letterSpacing: -0.1,
  },
  emailCompact: {
    fontSize: 14,
    marginTop: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  metaRowCompact: {
    marginTop: 10,
    paddingVertical: 6,
  },
  metaText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.92)',
    letterSpacing: -0.05,
  },
});
