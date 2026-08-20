import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { BrandColors } from '@/constants/brand';

const logo = require('@/assets/images/zando-logo.jpeg');
const waves = require('@/assets/images/splash-waves.png');

/** Écran de lancement de Zando na Ndako, affiché avant le parcours d'accueil. */
export default function SplashScreen() {
  const screenOpacity = useRef(new Animated.Value(1)).current;
  const dots = useRef([
    new Animated.Value(0.35),
    new Animated.Value(0.35),
    new Animated.Value(0.35),
  ]).current;

  useEffect(() => {
    const dotsAnimation = Animated.loop(
      Animated.stagger(
        150,
        dots.map((dot) =>
          Animated.sequence([
            Animated.timing(dot, {
              toValue: 1,
              duration: 280,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(dot, {
              toValue: 0.35,
              duration: 430,
              easing: Easing.in(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
        ),
      ),
    );
    const transition = Animated.sequence([
      Animated.delay(2400),
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
      }),
    ]);

    dotsAnimation.start();
    transition.start(({ finished }) => {
      if (finished) router.replace('/onboarding/first');
    });

    return () => {
      dotsAnimation.stop();
      transition.stop();
    };
  }, [dots, screenOpacity]);

  return (
    <Animated.View style={[styles.screen, { opacity: screenOpacity }]}>
      <StatusBar style="dark" />
      <View style={styles.centerBlock}>
        <Image contentFit="contain" source={logo} style={styles.logo} />
        <View style={styles.loader}>
          {dots.map((dot, index) => (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                index === 0
                  ? styles.redDot
                  : index === 1
                    ? styles.yellowDot
                    : styles.blueDot,
                { opacity: dot, transform: [{ scale: dot }] },
              ]}
            />
          ))}
        </View>
        <Text style={styles.loadingText}>Chargement en cours...</Text>
      </View>
      <Image contentFit="fill" pointerEvents="none" source={waves} style={styles.waves} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BrandColors.white,
    overflow: 'hidden',
  },
  centerBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: '18%',
    zIndex: 1,
  },
  logo: {
    width: '74%',
    maxWidth: 320,
    aspectRatio: 0.92,
    marginBottom: 36,
  },
  loader: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 14,
  },
  dot: {
    width: 11,
    height: 11,
    borderRadius: 6,
  },
  redDot: { backgroundColor: BrandColors.red },
  yellowDot: { backgroundColor: BrandColors.yellow },
  blueDot: { backgroundColor: BrandColors.blue },
  loadingText: {
    color: BrandColors.blue,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  waves: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '32%',
  },
});
