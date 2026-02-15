import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Leaf, MapPin, Package, MapPinned, Check, ChevronRight } from 'lucide-react-native';
import { theme } from '../lib/theme';
import { useAuth } from '../hooks/useAuth';

export default function LandingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [pulseAnim] = useState(() => new Animated.Value(1));

  useEffect(() => {
    AsyncStorage.getItem('grower_journey_completed_steps').then((s) => {
      if (s) {
        try {
          const arr = JSON.parse(s) as number[];
          if (Array.isArray(arr)) setCompletedSteps(arr);
        } catch (_) {}
      }
    });
  }, []);

  useEffect(() => {
    if (completedSteps.length > 0) {
      AsyncStorage.setItem('grower_journey_completed_steps', JSON.stringify(completedSteps));
    }
  }, [completedSteps]);

  useEffect(() => {
    const currentStep = completedSteps.length + 1;
    if (currentStep <= 3) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0.95, duration: 800, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [completedSteps.length, pulseAnim]);

  const currentStep = completedSteps.length + 1;

  const handleStep1 = () => router.push('/register');
  const handleStep2 = () => {
    if (user) {
      router.push('/(producer)/estates/new');
    } else {
      router.push('/partner-login?redirect=estates/new');
    }
  };
  const handleStep3 = () => router.push('/supplier-map');


  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + 16,
          paddingBottom: Math.max(insets.bottom + 24, 32),
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoWrap}>
          <Leaf size={28} color={theme.colors.primary} strokeWidth={1.5} />
        </View>
        <Text style={styles.title}>{t('growerJourney.welcome')}</Text>
        <Text style={styles.subtitle}>{t('growerJourney.subtitlePlan')}</Text>
      </View>

      {/* Stepper */}
      <View style={styles.stepper}>
        {/* Step 1: Register */}
        <StepItem
          number={1}
          title={t('growerJourney.step1.title')}
          description={t('growerJourney.step1.description')}
          icon={Leaf}
          isCompleted={completedSteps.includes(1)}
          isCurrent={currentStep === 1}
          onPress={handleStep1}
          pulseAnim={currentStep === 1 ? pulseAnim : undefined}
        />

        {/* Connector */}
        <View style={[styles.connector, completedSteps.includes(1) && styles.connectorDone]} />

        {/* Step 2: Add fields */}
        <StepItem
          number={2}
          title={t('growerJourney.step2.title')}
          description={t('growerJourney.step2.description')}
          icon={MapPinned}
          isCompleted={completedSteps.includes(2)}
          isCurrent={currentStep === 2}
          onPress={handleStep2}
          pulseAnim={currentStep === 2 ? pulseAnim : undefined}
        />

        {/* Connector */}
        <View style={[styles.connector, completedSteps.includes(2) && styles.connectorDone]} />

        {/* Step 3: Supplier map (final) */}
        <StepItem
          number={3}
          title={t('growerJourney.step3.title')}
          description={t('growerJourney.step3.description')}
          icon={MapPin}
          isCompleted={completedSteps.includes(3)}
          isCurrent={currentStep === 3}
          onPress={handleStep3}
          pulseAnim={currentStep === 3 ? pulseAnim : undefined}
        />
      </View>

      {/* Footer - for returning Vera farmers */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.footerBtnSecondary}
          onPress={() => router.push('/partner-login')}
          activeOpacity={0.7}
        >
          <Text style={styles.footerBtnTextSecondary}>{t('growerJourney.alreadyFarmer')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function StepItem({
  number,
  title,
  description,
  icon: Icon,
  isCompleted,
  isCurrent,
  onPress,
  pulseAnim,
}: {
  number: number;
  title: string;
  description: string;
  icon: typeof MapPin;
  isCompleted: boolean;
  isCurrent: boolean;
  onPress: () => void;
  pulseAnim?: Animated.Value;
}) {
  const iconColor = isCompleted ? theme.colors.success : theme.colors.primary;

  const content = (
    <View style={styles.stepContent}>
      <View style={styles.stepLeft}>
        <Animated.View
          style={[
            styles.stepCircle,
            isCompleted && styles.stepCircleDone,
            isCurrent && styles.stepCircleCurrent,
            pulseAnim && { transform: [{ scale: pulseAnim }] },
          ]}
        >
          {isCompleted ? (
            <Check size={20} color="#fff" strokeWidth={3} />
          ) : (
            <Icon size={20} color={iconColor} strokeWidth={1.5} />
          )}
        </Animated.View>
        <View style={styles.stepText}>
          <Text style={styles.stepTitle}>{title}</Text>
          <Text style={styles.stepDescription}>{description}</Text>
        </View>
      </View>
      {!isCompleted && <ChevronRight size={20} color={theme.colors.text.tertiary} strokeWidth={2} />}
    </View>
  );

  return (
    <TouchableOpacity
      style={[styles.step, isCurrent && styles.stepCurrent]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.stepNumberBadge}>
        <Text style={styles.stepNumberText}>{number}</Text>
      </View>
      {content}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { paddingHorizontal: theme.spacing.lg },

  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  logoWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: 6,
    paddingHorizontal: 16,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: 24,
  },

  stepper: {
    marginBottom: theme.spacing.xl,
  },
  connector: {
    width: 2,
    height: 24,
    backgroundColor: theme.colors.border,
    marginLeft: 28,
    marginVertical: -4,
  },
  connectorDone: {
    backgroundColor: theme.colors.success,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  stepCurrent: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
    backgroundColor: 'rgba(45, 90, 39, 0.06)',
  },
  stepNumberBadge: {
    position: 'absolute',
    top: 8,
    right: 12,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  stepContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  stepCircleDone: {
    backgroundColor: theme.colors.success,
  },
  stepCircleCurrent: {
    backgroundColor: theme.colors.primaryLight,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  stepText: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  stepDescription: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },

  footer: {
    gap: theme.spacing.sm,
  },
  footerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.primary,
  },
  footerBtnSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  footerBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  footerBtnTextSecondary: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.text.secondary,
  },
});
