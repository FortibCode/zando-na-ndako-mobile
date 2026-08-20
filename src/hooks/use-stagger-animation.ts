import { useMemo } from 'react';
import { FadeInDown, FadeInLeft, FadeInRight, ZoomIn, StretchInX, type WithSpringConfig } from 'react-native-reanimated';

const SPRING_CONFIG: WithSpringConfig = {
  damping: 15,
  stiffness: 180,
  mass: 0.7,
};

type Direction = 'down' | 'left' | 'right';
type Animation = 'fade' | 'zoom' | 'stretch';

export function useStaggerAnimation(
  index: number,
  options?: {
    baseDelay?: number;
    direction?: Direction;
    animation?: Animation;
    springConfig?: WithSpringConfig;
  }
) {
  const {
    baseDelay = 80,
    direction = 'down',
    animation = 'fade',
    springConfig = SPRING_CONFIG,
  } = options || {};

  const entering = useMemo(() => {
    const delay = index * baseDelay;
    let anim: any;

    switch (animation) {
      case 'zoom':
        anim = ZoomIn.delay(delay).springify();
        break;
      case 'stretch':
        anim = StretchInX.delay(delay).springify();
        break;
      default:
        switch (direction) {
          case 'left':
            anim = FadeInLeft.delay(delay).springify();
            break;
          case 'right':
            anim = FadeInRight.delay(delay).springify();
            break;
          default:
            anim = FadeInDown.delay(delay).springify();
        }
    }

    return anim;
  }, [index, baseDelay, direction, animation, springConfig]);

  return { entering };
}

export function getStaggerDelay(index: number, baseDelay = 80): number {
  return index * baseDelay;
}
