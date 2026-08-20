import { useCallback } from 'react';
import { LayoutChangeEvent } from 'react-native';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  type WithSpringConfig,
  type WithTimingConfig,
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeInLeft,
  FadeInRight,
  SlideInDown,
  SlideInUp,
  SlideInLeft,
  SlideInRight,
  ZoomIn,
  ZoomInDown,
  BounceIn,
  LightSpeedInRight,
  StretchInX,
  StretchInY,
  FlipInXDown,
  type EntryExitAnimationFunction,
} from 'react-native-reanimated';

// ---- Spring Configs ----
export const SPRING_CONFIG: WithSpringConfig = {
  damping: 15,
  stiffness: 200,
  mass: 0.8,
};

export const SPRING_LIGHT: WithSpringConfig = {
  damping: 20,
  stiffness: 150,
  mass: 0.6,
};

export const SPRING_BOUNCE: WithSpringConfig = {
  damping: 10,
  stiffness: 180,
  mass: 0.7,
};

// ---- Timing Configs ----
export const TIMING_FAST: WithTimingConfig = {
  duration: 200,
  easing: Easing.bezier(0.25, 0.1, 0.25, 1),
};

export const TIMING_MEDIUM: WithTimingConfig = {
  duration: 350,
  easing: Easing.bezier(0.22, 1, 0.36, 1),
};

export const TIMING_SLOW: WithTimingConfig = {
  duration: 500,
  easing: Easing.bezier(0.22, 1, 0.36, 1),
};

// ---- Reusable Entry Animations (Reanimated 4 syntax) ----
export const FADE_IN = FadeIn.duration(400);
export const FADE_IN_DOWN = FadeInDown.duration(400);
export const FADE_IN_UP = FadeInUp.duration(400);
export const FADE_IN_LEFT = FadeInLeft.duration(400);
export const FADE_IN_RIGHT = FadeInRight.duration(400);
export const SLIDE_IN_DOWN = SlideInDown.duration(400);
export const ZOOM_IN = ZoomIn.duration(400);
export const BOUNCE_IN = BounceIn.duration(500);
export const LIGHT_SPEED_IN = LightSpeedInRight.duration(500);
export const STRETCH_IN_X = StretchInX.duration(400);
export const FLIP_IN = FlipInXDown.duration(500);

// ---- Hook: Scale on Press ----
export function useScalePress(scaleTo = 0.96) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onPressIn = useCallback(() => {
    scale.value = withSpring(scaleTo, SPRING_LIGHT);
  }, [scale, scaleTo]);

  const onPressOut = useCallback(() => {
    scale.value = withSpring(1, SPRING_LIGHT);
  }, [scale]);

  return { animatedStyle, onPressIn, onPressOut };
}

// ---- Hook: Fade In on Mount ----
export function useFadeIn(delay = 0, duration = 400) {
  const opacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const startAnimation = useCallback(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration, easing: Easing.bezier(0.22, 1, 0.36, 1) }));
  }, [opacity, delay, duration]);

  return { animatedStyle, startAnimation };
}

// ---- Hook: Slide In from direction ----
export function useSlideIn(direction: 'left' | 'right' | 'up' | 'down', distance = 40, delay = 0) {
  const translate = useSharedValue(direction === 'up' || direction === 'down' ? distance : direction === 'left' ? -distance : distance);
  const opacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      direction === 'left' || direction === 'right'
        ? { translateX: translate.value }
        : { translateY: translate.value },
    ],
  }));

  const startAnimation = useCallback(() => {
    translate.value = withDelay(delay, withSpring(0, SPRING_CONFIG));
    opacity.value = withDelay(delay, withTiming(1, TIMING_MEDIUM));
  }, [translate, opacity, delay]);

  return { animatedStyle, startAnimation };
}

// ---- Hook: Staggered List Animation ----
export function useStaggerItem(index: number, baseDelay = 80) {
  const entering = FadeInDown.duration(350).delay(index * baseDelay);

  return { entering };
}

// ---- Hook: Pulse Animation ----
export function usePulse() {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const startPulse = useCallback(() => {
    scale.value = withSequence(
      withTiming(1.08, { duration: 300 }),
      withTiming(1, { duration: 300 }),
      withTiming(1.05, { duration: 300 }),
      withTiming(1, { duration: 300 })
    );
  }, [scale]);

  return { animatedStyle, startPulse };
}

// ---- Hook: Shake Animation ----
export function useShake() {
  const translateX = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const shake = useCallback(() => {
    translateX.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
  }, [translateX]);

  return { animatedStyle, shake };
}

// ---- Hook: Height Expand/Collapse ----
export function useExpandCollapse() {
  const height = useSharedValue(0);
  const opacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
    opacity: opacity.value,
    overflow: 'hidden',
  }));

  const expand = useCallback(() => {
    height.value = withTiming(200, TIMING_MEDIUM);
    opacity.value = withTiming(1, TIMING_MEDIUM);
  }, [height, opacity]);

  const collapse = useCallback(() => {
    height.value = withTiming(0, TIMING_MEDIUM);
    opacity.value = withTiming(0, TIMING_MEDIUM);
  }, [height, opacity]);

  return { animatedStyle, expand, collapse, onLayout: (e: LayoutChangeEvent) => { height.value = e.nativeEvent.layout.height; } };
}

// ---- Hook: Progress Bar Animation ----
export function useProgressBar(targetValue: number) {
  const width = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${width.value}%` as any,
  }));

  const animate = useCallback(() => {
    width.value = withTiming(targetValue, { duration: 800, easing: Easing.bezier(0.22, 1, 0.36, 1) });
  }, [width, targetValue]);

  return { animatedStyle, animate };
}

// ---- Hook: Scale on Mount ----
export function useScaleIn(delay = 0) {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const startAnimation = useCallback(() => {
    scale.value = withDelay(delay, withSpring(1, SPRING_BOUNCE));
    opacity.value = withDelay(delay, withTiming(1, TIMING_MEDIUM));
  }, [scale, opacity, delay]);

  return { animatedStyle, startAnimation };
}

