import { useEffect, type ReactNode } from 'react';
import {
  Modal,
  View,
  Pressable,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { enterpriseColors } from '../../lib/enterprise-ui';

const DISMISS_DRAG_PX = 72;
const DISMISS_VELOCITY = 650;

type Props = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Wrap sheet body in KeyboardAvoidingView (forms). */
  keyboardAvoiding?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  testID?: string;
};

function SheetHandle() {
  return (
    <View style={styles.handleRow} accessibilityRole="adjustable" accessibilityLabel="Povuci nadole za zatvaranje">
      <View style={styles.handlePill} />
    </View>
  );
}

/**
 * Bottom sheet: iOS native pageSheet (system swipe-down) + Android drag-to-dismiss.
 * Use instead of raw Modal for all in-app sheets.
 */
export function BioVeraBottomSheet({
  visible,
  onClose,
  children,
  keyboardAvoiding = false,
  contentStyle,
  testID,
}: Props) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (visible) translateY.value = 0;
  }, [visible, translateY]);

  const closeFromGesture = () => {
    onClose();
  };

  const pan = Gesture.Pan()
    .activeOffsetY(8)
    .failOffsetX([-24, 24])
    .onUpdate((e) => {
      if (e.translationY > 0) {
        translateY.value = e.translationY;
      }
    })
    .onEnd((e) => {
      if (e.translationY > DISMISS_DRAG_PX || e.velocityY > DISMISS_VELOCITY) {
        translateY.value = withTiming(420, { duration: 200 }, () => {
          runOnJS(closeFromGesture)();
        });
      } else {
        translateY.value = withSpring(0, { damping: 22, stiffness: 280 });
      }
    });

  const sheetAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const body = (
    <>
      <GestureDetector gesture={pan}>
        <Animated.View>
          <SheetHandle />
        </Animated.View>
      </GestureDetector>
      <View style={[styles.body, contentStyle]}>{children}</View>
    </>
  );

  const sheetInner = keyboardAvoiding ? (
    <KeyboardAvoidingView
      style={styles.sheetFill}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
    >
      {body}
    </KeyboardAvoidingView>
  ) : (
    body
  );

  if (Platform.OS === 'ios') {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
        testID={testID}
      >
        <View style={[styles.iosSheet, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <SheetHandle />
          {keyboardAvoiding ? (
            <KeyboardAvoidingView style={styles.sheetFill} behavior="padding" keyboardVerticalOffset={8}>
              <View style={[styles.body, contentStyle]}>{children}</View>
            </KeyboardAvoidingView>
          ) : (
            <View style={[styles.body, contentStyle]}>{children}</View>
          )}
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose} testID={testID}>
      <GestureHandlerRootView style={styles.androidRoot}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" accessibilityLabel="Zatvori" />
        <GestureDetector gesture={pan}>
          <Animated.View
            style={[
              styles.androidSheet,
              { paddingBottom: Math.max(insets.bottom, 16) },
              sheetAnimStyle,
            ]}
          >
            <SheetHandle />
            {sheetInner}
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  handleRow: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 8,
  },
  handlePill: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: enterpriseColors.gray200,
  },
  iosSheet: {
    flex: 1,
    backgroundColor: enterpriseColors.white,
  },
  androidRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  androidSheet: {
    backgroundColor: enterpriseColors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '92%',
  },
  sheetFill: {
    flexShrink: 1,
  },
  body: {
    flexShrink: 1,
  },
});
