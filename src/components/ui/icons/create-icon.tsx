import type { SvgProps } from 'react-native-svg';
import Svg, { Circle, Path } from 'react-native-svg';

type ElementDef = {
  d?: string;
  cx?: number;
  cy?: number;
  r?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  strokeLinecap?: 'round' | 'butt' | 'square';
  strokeLinejoin?: 'round' | 'bevel' | 'miter';
};

type IconOptions = {
  viewBox: string;
  width?: number;
  height?: number;
  elements: ElementDef[];
};

export function createIcon({
  viewBox,
  width = 24,
  height = 24,
  elements,
}: IconOptions) {
  return function Icon({ fill: iconFill, color: iconColor, ...props }: SvgProps) {
    const color = iconFill ?? iconColor;

    return (
      <Svg
        width={width}
        height={height}
        viewBox={viewBox}
        fill="none"
        {...props}
      >
        {elements.map((el, i) => {
          const {
            cx,
            cy,
            r,
            fill: elFill,
            stroke: elStroke,
            ...svgProps
          } = el;
          const resolvedFill = elFill !== undefined
            ? (color ?? elFill)
            : undefined;
          const resolvedStroke = elStroke !== undefined
            ? (color ?? elStroke)
            : undefined;

          if (cx !== undefined && cy !== undefined && r !== undefined) {
            return (
              <Circle
                key={i}
                cx={cx}
                cy={cy}
                r={r}
                fill={resolvedFill}
                stroke={resolvedStroke}
                strokeWidth={svgProps.strokeWidth}
                strokeLinecap={svgProps.strokeLinecap}
                strokeLinejoin={svgProps.strokeLinejoin}
              />
            );
          }

          return (
            <Path
              key={i}
              d={svgProps.d ?? ''}
              fill={resolvedFill}
              stroke={resolvedStroke}
              strokeWidth={svgProps.strokeWidth}
              strokeLinecap={svgProps.strokeLinecap}
              strokeLinejoin={svgProps.strokeLinejoin}
            />
          );
        })}
      </Svg>
    );
  };
}
