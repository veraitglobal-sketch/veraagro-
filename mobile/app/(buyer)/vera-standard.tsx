import { View, Text, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, MapPin, Camera, FlaskConical, Clock } from 'lucide-react-native';
import { theme } from '../../lib/theme';

/**
 * Bio Vera Standard Screen
 * Information about Bio Vera certification and trust
 */
export default function VeraStandardScreen() {
  const { t } = useTranslation();

  const requirements = [
    {
      icon: MapPin,
      text: t('buyer.veraStandard.requirements.gps'),
    },
    {
      icon: Camera,
      text: t('buyer.veraStandard.requirements.images'),
    },
    {
      icon: FlaskConical,
      text: t('buyer.veraStandard.requirements.lab'),
    },
    {
      icon: Clock,
      text: t('buyer.veraStandard.requirements.duration'),
    },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ padding: theme.spacing.lg }}>
        {/* Header Card */}
        <View style={{
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.lg,
          padding: theme.spacing.xl,
          marginBottom: theme.spacing.lg,
          borderWidth: 0.5,
          borderColor: 'rgba(0, 0, 0, 0.08)',
          alignItems: 'center',
        }}>
          <View style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: `${theme.colors.primary}10`,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: theme.spacing.md,
            borderWidth: 0.5,
            borderColor: `${theme.colors.primary}20`,
          }}>
            <CheckCircle2 size={32} color={theme.colors.primary} strokeWidth={1} />
          </View>
          
          <Text style={{
            fontSize: 18,
            fontWeight: '300',
            color: theme.colors.text.primary,
            letterSpacing: 1,
            marginBottom: theme.spacing.sm,
            textAlign: 'center',
          }}>
            {t('buyer.veraStandard.title')}
          </Text>
          
          <Text style={{
            fontSize: 13,
            fontWeight: '300',
            color: theme.colors.text.secondary,
            letterSpacing: 0.3,
            textAlign: 'center',
            lineHeight: 20,
          }}>
            {t('buyer.veraStandard.description')}
          </Text>
        </View>

        {/* Requirements Card */}
        <View style={{
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.lg,
          padding: theme.spacing.lg,
          borderWidth: 0.5,
          borderColor: 'rgba(0, 0, 0, 0.08)',
        }}>
          <Text style={{
            fontSize: 13,
            fontWeight: '400',
            color: theme.colors.text.primary,
            letterSpacing: 0.5,
            marginBottom: theme.spacing.lg,
            textTransform: 'uppercase',
          }}>
            {t('buyer.veraStandard.requirements.title')}
          </Text>

          <View style={{ gap: theme.spacing.md }}>
            {requirements.map((req, index) => {
              const IconComponent = req.icon;
              return (
                <View
                  key={index}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: theme.spacing.md,
                    paddingVertical: theme.spacing.sm,
                  }}
                >
                  <View style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: `${theme.colors.primary}08`,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 0.5,
                    borderColor: `${theme.colors.primary}15`,
                  }}>
                    <IconComponent size={16} color={theme.colors.primary} strokeWidth={1} />
                  </View>
                  
                  <Text style={{
                    flex: 1,
                    fontSize: 12,
                    fontWeight: '300',
                    color: theme.colors.text.primary,
                    letterSpacing: 0.3,
                    lineHeight: 18,
                  }}>
                    {req.text}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Additional Info Section */}
        <View style={{
          marginTop: theme.spacing.lg,
          padding: theme.spacing.md,
          backgroundColor: `${theme.colors.primary}05`,
          borderRadius: theme.borderRadius.md,
          borderWidth: 0.5,
          borderColor: `${theme.colors.primary}15`,
        }}>
          <Text style={{
            fontSize: 11,
            fontWeight: '300',
            color: theme.colors.text.secondary,
            letterSpacing: 0.3,
            lineHeight: 16,
            textAlign: 'center',
          }}>
            Every product with Bio Vera Standard is fully traceable from farm to your table.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
