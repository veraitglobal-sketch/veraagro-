import { Stack } from 'expo-router';
import { View } from 'react-native';
import { AuthGuard } from '../../components/AuthGuard';
import { bioVeraStackScreenOptions } from '../../lib/stack-navigation-options';

/** Seed producer mobile entry — web portal notice only; not the full grower stack. */
export default function SeedProducerLayout() {
  return (
    <AuthGuard requiredRole={['SEED_PRODUCER']}>
      <View style={{ flex: 1 }}>
        <Stack screenOptions={bioVeraStackScreenOptions({ headerShown: false })}>
          <Stack.Screen name="seed-producer-web" />
        </Stack>
      </View>
    </AuthGuard>
  );
}
