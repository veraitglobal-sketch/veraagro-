import AsyncStorage from '@react-native-async-storage/async-storage';

const JOURNEY_KEY = 'grower_journey_completed_steps';

export async function getCompletedSteps(): Promise<number[]> {
  try {
    const s = await AsyncStorage.getItem(JOURNEY_KEY);
    if (!s) return [];
    const arr = JSON.parse(s) as number[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export async function markStepComplete(step: number): Promise<void> {
  const steps = await getCompletedSteps();
  if (steps.includes(step)) return;
  const next = [...steps, step].sort((a, b) => a - b);
  await AsyncStorage.setItem(JOURNEY_KEY, JSON.stringify(next));
}
