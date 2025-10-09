import { ComponentType, lazy, Suspense, SVGProps } from 'react';

type IconName = 'Mario' | 'Luigi' | 'Peach' | 'Yoshi' | 'Bowser' | 'DK' | 'Toad' | 'Koopa';

const iconComponents: Record<IconName, ComponentType<SVGProps<SVGSVGElement>>> = {
  Mario: lazy(() => import('./mario')),
  Luigi: lazy(() => import('./luigi')),
  Peach: lazy(() => import('./peach')),
  Yoshi: lazy(() => import('./yoshi')),
  Bowser: lazy(() => import('./bowser')),
  DK: lazy(() => import('./dk')),
  Toad: lazy(() => import('./toad')),
  Koopa: lazy(() => import('./koopa')),
};

interface PlayerIconProps extends SVGProps<SVGSVGElement> {
  iconName: string;
}

export function PlayerIcon({ iconName, ...props }: PlayerIconProps) {
  const IconComponent = iconComponents[iconName as IconName] || iconComponents['Mario'];

  return (
    <Suspense fallback={<div style={{ width: props.width, height: props.height }} className="bg-muted rounded-full animate-pulse" />}>
      <IconComponent {...props} />
    </Suspense>
  );
}
