import Svg, { Circle, Path, Rect } from 'react-native-svg';

// Rounded stroke icons drawn for Side Friends (24×24 grid).
type P = { name: string; size?: number; color: string };

export function Icon({ name, size = 24, color }: P) {
  const s = { stroke: color, strokeWidth: 2.4, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  const dot = (cx: number, cy: number, r = 1.3) => <Circle cx={cx} cy={cy} r={r} fill={color} />;
  const body = (() => {
    switch (name) {
      case 'quest': return <><Path d="M12 4v10" {...s} strokeWidth={2.8} />{dot(12, 19.5, 1.8)}</>;
      case 'vote': return <><Rect x={3.5} y={3.5} width={17} height={17} rx={6} {...s} /><Path d="m8 12.5 3 3 5-6" {...s} /></>;
      case 'podium': return <><Rect x={9} y={5} width={6} height={15} rx={2} {...s} /><Rect x={3} y={10} width={6} height={10} rx={2} {...s} /><Rect x={15} y={13} width={6} height={7} rx={2} {...s} /></>;
      case 'user': return <><Circle cx={12} cy={8.5} r={4} {...s} /><Path d="M4.5 20c1.2-3.8 4-5.5 7.5-5.5s6.3 1.7 7.5 5.5" {...s} /></>;
      case 'crown': return <Path fill={color} d="M3.2 8.6a1 1 0 0 1 1.6-.9l3.7 3 2.7-5.1a1 1 0 0 1 1.6 0l2.7 5.1 3.7-3a1 1 0 0 1 1.6.9l-1.4 9.1a1.5 1.5 0 0 1-1.5 1.3H6.1a1.5 1.5 0 0 1-1.5-1.3z" />;
      case 'star': return <Path fill={color} d="M12 3.2a1 1 0 0 1 .9.6l2.2 4.6 5 .7a1 1 0 0 1 .6 1.7l-3.7 3.5.9 5a1 1 0 0 1-1.5 1.1L12 18l-4.5 2.4A1 1 0 0 1 6 19.3l.9-5-3.7-3.5a1 1 0 0 1 .6-1.7l5-.7 2.2-4.6a1 1 0 0 1 1-.6z" />;
      case 'check': return <Path d="m5 12.5 4.5 4.5L19 7.5" {...s} strokeWidth={3} />;
      case 'x': return <Path d="M6.5 6.5l11 11M17.5 6.5l-11 11" {...s} strokeWidth={3} />;
      case 'plus': return <Path d="M12 5v14M5 12h14" {...s} strokeWidth={3} />;
      case 'camera': return <><Path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.8l1.5-2h4.4l1.5 2h1.8A2.5 2.5 0 0 1 20 8.5v8a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5z" {...s} /><Circle cx={12} cy={12.5} r={3.5} {...s} /></>;
      case 'image': return <><Rect x={3.5} y={4.5} width={17} height={15} rx={4} {...s} /><Circle cx={9} cy={10} r={1.8} {...s} /><Path d="m4.5 17.5 5-4.5 4 3.5 2.5-2 3.5 3" {...s} /></>;
      case 'video': return <><Rect x={3} y={6} width={13} height={12} rx={3} {...s} /><Path d="m16 10.5 5-3v9l-5-3z" {...s} /></>;
      case 'play': return <Path fill={color} d="M7 4.9a1.2 1.2 0 0 1 1.8-1l11 6.9a1.4 1.4 0 0 1 0 2.4l-11 6.9A1.2 1.2 0 0 1 7 19.1z" />;
      case 'trophy': return <><Path d="M8 4h8v5a4 4 0 0 1-8 0z" {...s} /><Path d="M8 6H5.5a2.5 2.5 0 0 0 2.6 3.6M16 6h2.5a2.5 2.5 0 0 1-2.6 3.6M12 13v3.5M8.5 20h7M9.5 16.5h5" {...s} /></>;
      case 'bolt': return <Path fill={color} d="M13.6 2.6a.8.8 0 0 1 1.4.7L13.4 10H19a.8.8 0 0 1 .6 1.3l-9.2 10.1a.8.8 0 0 1-1.4-.7l1.6-6.7H5a.8.8 0 0 1-.6-1.3z" />;
      case 'lock': return <><Rect x={5} y={10.5} width={14} height={10} rx={3} {...s} /><Path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" {...s} /></>;
      case 'list': return <><Path d="M9 7h11M9 12h11M9 17h11" {...s} />{dot(4.5, 7)}{dot(4.5, 12)}{dot(4.5, 17)}</>;
      case 'palette': return <><Path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.3 0 1.8-1 1.3-2l-.4-.8c-.6-1.2.3-2.7 1.7-2.7h1.9a3.5 3.5 0 0 0 3.5-3.5c0-4.4-3.8-8-8-8z" {...s} />{dot(8, 11, 1.2)}{dot(11, 7.5, 1.2)}{dot(15.5, 8.5, 1.2)}</>;
      case 'fork': return <Path d="M7 3.5v6a2 2 0 0 0 4 0v-6M9 9.5v11M16.5 3.5c-2 1.5-2.5 4-2.5 7h2.5v10" {...s} />;
      case 'coffee': return <><Path d="M4.5 10h11v4a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z" {...s} /><Path d="M15.5 11h1.5a2.5 2.5 0 0 1 0 5h-1.6M8 3.5c0 1.5 1.5 1.5 1.5 3.5M12 3.5c0 1.5 1.5 1.5 1.5 3.5" {...s} /></>;
      case 'sunrise': return <><Path d="M3 19.5l6-9 4 5 3-3.5 5 7.5z" {...s} /><Circle cx={16.5} cy={6.5} r={2.2} {...s} /></>;
      case 'film': return <><Rect x={4} y={5} width={16} height={14} rx={3} {...s} /><Path d="M4 10h16M9 5v5M15 5v5" {...s} /></>;
      case 'mic': return <><Rect x={9} y={3.5} width={6} height={11} rx={3} {...s} /><Path d="M6 11.5a6 6 0 0 0 12 0M12 17.5v3" {...s} /></>;
      case 'ball': return <><Circle cx={12} cy={12} r={8.5} {...s} /><Path d="M12 7.5l4 3-1.5 4.5h-5L8 10.5z" {...s} /></>;
      case 'map': return <><Path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" {...s} /><Circle cx={12} cy={10} r={2.3} {...s} /></>;
      case 'chat': return <Path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4A1.5 1.5 0 0 1 4 14.5zM8.5 9.5h7M8.5 12.5h4" {...s} />;
      case 'bus': return <><Rect x={5} y={3.5} width={14} height={14} rx={3} {...s} /><Path d="M5 10.5h14M8 17.5v2.5M16 17.5v2.5" {...s} />{dot(8.5, 14, 0.9)}{dot(15.5, 14, 0.9)}</>;
      case 'gift': return <><Rect x={4} y={9} width={16} height={11} rx={2.5} {...s} /><Path d="M3.5 9h17M12 9v11M12 9c-1.5-3.5-5.5-4-5.5-1.5S10 9 12 9zM12 9c1.5-3.5 5.5-4 5.5-1.5S14 9 12 9z" {...s} /></>;
      case 'cart': return <><Path d="M3 4h2.5l2.2 10.5a1.5 1.5 0 0 0 1.5 1.2h7.6a1.5 1.5 0 0 0 1.5-1.1L20 8H6.3" {...s} /><Circle cx={9.5} cy={19.5} r={1.3} {...s} /><Circle cx={16.5} cy={19.5} r={1.3} {...s} /></>;
      case 'pencil': return <Path d="M15.5 4.5l4 4L9 19H5v-4zM13 7l4 4" {...s} />;
      case 'box': return <Path d="M4 8.5 12 4l8 4.5v7L12 20l-8-4.5zM4 8.5 12 13l8-4.5M12 13v7" {...s} />;
      case 'users': return <><Circle cx={9} cy={8.5} r={3.3} {...s} /><Path d="M3.5 19.5c.8-3.3 2.9-5 5.5-5s4.7 1.7 5.5 5M16 14.5c2.3 0 4 1.4 4.6 4.5" {...s} /><Circle cx={16.5} cy={9} r={2.7} {...s} /></>;
      case 'phoneoff': return <><Rect x={7} y={3} width={10} height={18} rx={2.5} {...s} /><Path d="M11 17.5h2M4 4l16 16" {...s} /></>;
      case 'copy': return <><Rect x={8} y={8} width={12} height={12} rx={3} {...s} /><Path d="M16 8V6.5A2.5 2.5 0 0 0 13.5 4h-7A2.5 2.5 0 0 0 4 6.5v7A2.5 2.5 0 0 0 6.5 16H8" {...s} /></>;
      case 'share': return <Path d="M12 3.5v11M7.5 8 12 3.5 16.5 8M5 13v4.5A2.5 2.5 0 0 0 7.5 20h9a2.5 2.5 0 0 0 2.5-2.5V13" {...s} />;
      case 'veto': return <><Circle cx={12} cy={12} r={8.5} {...s} /><Path d="M6 6l12 12" {...s} /></>;
      case 'bell': return <><Path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15z" {...s} /><Path d="M10 20.5a2.2 2.2 0 0 0 4 0" {...s} /></>;
      case 'refresh': return <Path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3M19.5 4.5v4h-4" {...s} />;
      default: return <Path fill={color} d="M12 3.2a1 1 0 0 1 .9.6l2.2 4.6 5 .7a1 1 0 0 1 .6 1.7l-3.7 3.5.9 5a1 1 0 0 1-1.5 1.1L12 18l-4.5 2.4A1 1 0 0 1 6 19.3l.9-5-3.7-3.5a1 1 0 0 1 .6-1.7l5-.7 2.2-4.6a1 1 0 0 1 1-.6z" />;
    }
  })();
  return <Svg width={size} height={size} viewBox="0 0 24 24">{body}</Svg>;
}

// The logo mark: three "!" of different heights, a podium in the friend colours.
export function Mark({ size = 96, colors }: { size?: number; colors: [string, string, string] }) {
  const col = (x: number, top: number, c: string) => (
    <>
      <Rect x={x} y={top} width={20} height={62 - top} rx={10} fill={c} />
      <Circle cx={x + 10} cy={78} r={10} fill={c} />
    </>
  );
  return (
    <Svg width={size} height={size} viewBox="0 0 96 96">
      {col(10, 24, colors[0])}{col(38, 8, colors[1])}{col(66, 36, colors[2])}
    </Svg>
  );
}
