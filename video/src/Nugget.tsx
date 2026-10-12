import React from 'react'
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'

import { C, MONO, SANS } from './theme'

// Stage geometry (1920×1080). Everything the camera moves lives on one stage.
const WIN = { x: 160, y: 80, w: 1600, h: 860 }
const BAR = 46
const LEFT = 1000
const PAD = 36
const FONT = 22
const LH = 36
const CH = FONT * 0.6 // JetBrains Mono advances 0.6em
const PANE_X = WIN.x + LEFT

// Beats, in frames at 30fps.
const T = {
  windowIn: 45,
  answer: 85,
  cursorIn: 130,
  selectFrom: 155,
  selectTo: 185,
  type1: 205,
  enter1: 240,
  type2: 300,
  enter2: 345,
  tool2: 356,
  click1: 430,
  click2: 460,
  fold: 466,
  outro: 505,
  end: 530,
}

const SELECTED = 'Keep each commit to one logical change'
const CMD1 = '/nugget decision'
const CMD2 = 'nugget the rebase tip, as a task'

const ease = Easing.bezier(0.45, 0, 0.2, 1)
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const

const lerpKeys = (f: number, keys: [number, ...number[]][], i: number) =>
  interpolate(
    f,
    keys.map(k => k[0]),
    keys.map(k => k[i]!),
    { ...clamp, easing: ease },
  )

const useSpring = (from: number, opts?: { damping?: number; mass?: number }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  return spring({ frame: frame - from, fps, config: { damping: opts?.damping ?? 15, mass: opts?.mass ?? 0.6 } })
}

const typed = (f: number, text: string, from: number, perFrame: number) =>
  text.slice(0, Math.max(0, Math.floor((f - from) * perFrame)))

const Star: React.FC<{ size: number; color?: string }> = ({ size, color = C.gold }) => (
  <svg width={size} height={size} viewBox="-10 -10 20 20" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    <path d="M0 -10 L2.6 -2.6 L10 0 L2.6 2.6 L0 10 L-2.6 2.6 L-10 0 L-2.6 -2.6 Z" fill={color} />
  </svg>
)

const StatusIcon: React.FC<{ status: 'todo' | 'doing' | 'done'; color: string }> = ({ status, color }) => (
  <svg width={18} height={18} viewBox="0 0 20 20" style={{ verticalAlign: '-3px' }}>
    {status === 'done' ? (
      <path d="M4 10.5 L8.5 15 L16 6" stroke={color} strokeWidth={2.6} fill="none" strokeLinecap="round" />
    ) : (
      <>
        <circle cx={10} cy={10} r={7.5} stroke={color} strokeWidth={2.2} fill="none" />
        {status === 'doing' && <path d="M10 2.5 A7.5 7.5 0 0 1 10 17.5 Z" fill={color} />}
      </>
    )}
  </svg>
)

const Dot: React.FC<{ color?: string }> = ({ color = C.text }) => (
  <span style={{ display: 'inline-block', width: CH * 2 }}>
    <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 5, background: color, verticalAlign: '2px' }} />
  </span>
)

const Row: React.FC<{ y: number; show: number; children: React.ReactNode }> = ({ y, show, children }) => {
  const s = useSpring(show, { damping: 20 })
  return (
    <div
      style={{
        position: 'absolute',
        left: PAD,
        top: y,
        opacity: s,
        transform: `translateY(${(1 - s) * 10}px)`,
        whiteSpace: 'pre',
        lineHeight: `${LH}px`,
      }}
    >
      {children}
    </div>
  )
}

const UserChip: React.FC<{ text: string }> = ({ text }) => (
  <span style={{ background: C.chip, padding: '4px 12px', borderRadius: 6 }}>
    <span style={{ color: C.dim }}>› </span>
    {text}
  </span>
)

const Transcript: React.FC = () => {
  const f = useCurrentFrame()
  const sel = interpolate(f, [T.selectFrom, T.selectTo], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) })
  // The highlight stays until the command has read it, as in Claude Code.
  const selOpacity = interpolate(f, [T.enter1, T.enter1 + 6], [1, 0], clamp)
  const top = 30
  const line = (i: number) => top + 56 + i * LH
  return (
    <div style={{ position: 'absolute', inset: 0, fontFamily: MONO, fontSize: FONT, color: C.text }}>
      <Row y={top} show={T.windowIn + 12}>
        <UserChip text="how do I keep my git history clean?" />
      </Row>
      <Row y={line(0)} show={T.answer}>
        <Dot />
        <span style={{ position: 'relative' }}>
          <span
            style={{
              position: 'absolute',
              left: -2,
              top: 1,
              bottom: 1,
              width: `calc(${sel * 100}% + 4px)`,
              background: C.selection,
              borderRadius: 3,
              opacity: selOpacity,
            }}
          />
          <span style={{ position: 'relative', fontWeight: 700 }}>{SELECTED}</span>
        </span>
        , so it can be
      </Row>
      <Row y={line(1)} show={T.answer + 4}>{'  reviewed, reverted or bisected on its own.'}</Row>
      <Row y={line(2)} show={T.answer + 8}>
        {'  '}
        <span style={{ fontWeight: 700 }}>Rebase fixups before you push</span>
        {' with '}
        <span style={{ color: C.reference }}>git rebase -i</span>.
      </Row>
      <Row y={line(3)} show={T.answer + 12}>
        {'  '}
        <span style={{ fontWeight: 700 }}>Write subjects as orders</span>
        {': “Add retry to upload”.'}
      </Row>
      <Row y={line(4) + 14} show={T.answer + 18}>
        <span style={{ color: C.dim }}>Worked for 3s · done</span>
      </Row>

      <Row y={line(5) + 36} show={T.enter1}>
        <UserChip text={CMD1} />
      </Row>
      <Row y={line(6) + 44} show={T.enter1 + 3}>
        <span style={{ color: C.dim }}>{'  └ nugget: '}</span>
        <Star size={16} /> saved as <span style={{ color: C.decision }}>decision</span>
      </Row>

      <Row y={line(7) + 66} show={T.enter2}>
        <UserChip text={CMD2} />
      </Row>
      <Row y={line(8) + 74} show={T.tool2}>
        <Dot color={C.decision} />
        <span style={{ fontWeight: 700 }}>nugget</span>
        <span style={{ color: C.dim }}>{' · save_nugget(“Rebase fixups before you push”, task)'}</span>
      </Row>
      <Row y={line(9) + 74} show={T.tool2 + 4}>
        <span style={{ color: C.dim }}>{'  └ '}</span>
        <Star size={16} /> saved as <span style={{ color: C.task }}>task</span>
      </Row>
    </div>
  )
}

const Prompt: React.FC = () => {
  const f = useCurrentFrame()
  let text = ''
  if (f >= T.type1 && f < T.enter1) text = typed(f, CMD1, T.type1, 0.62)
  if (f >= T.type2 && f < T.enter2) text = typed(f, CMD2, T.type2, 0.9)
  const caret = Math.floor(f / 15) % 2 === 0
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        width: LEFT,
        bottom: 0,
        height: 74,
        borderTop: `1px solid ${C.line}`,
        fontFamily: MONO,
        fontSize: FONT,
        color: C.text,
        display: 'flex',
        alignItems: 'center',
        paddingLeft: PAD,
      }}
    >
      <span style={{ color: C.dim, marginRight: 12 }}>›</span>
      <span style={{ whiteSpace: 'pre' }}>{text}</span>
      <span style={{ width: 12, height: 26, background: caret ? C.text : 'transparent', marginLeft: 2 }} />
    </div>
  )
}

type CardProps = {
  y: number
  color: string
  label: string
  text: string
  status?: 'todo' | 'doing' | 'done'
  appear: number
  opacity?: number
  arrows: string
}

const CARD_H = 116

const Card: React.FC<CardProps> = ({ y, color, label, text, status, appear, opacity = 1, arrows }) => {
  const f = useCurrentFrame()
  const s = useSpring(appear, { damping: 12, mass: 0.7 })
  const flash = status ? interpolate(f, [T.click1, T.click1 + 10, T.click2, T.click2 + 10], [1, 0, 1, 0], clamp) : 0
  const stateLabel = status === 'doing' ? 'doing' : status === 'done' ? 'done' : 'to do'
  return (
    <div
      style={{
        position: 'absolute',
        left: 22,
        right: 22,
        top: y,
        height: CARD_H,
        border: `2px solid ${color}`,
        borderRadius: 14,
        padding: '16px 22px',
        background: C.window,
        boxShadow: `0 0 ${24 * s}px ${color}22`,
        opacity: s * opacity,
        transform: `translateY(${(1 - s) * -26}px) scale(${0.94 + 0.06 * s})`,
        fontFamily: MONO,
        fontSize: FONT,
        color: C.text,
      }}
    >
      <div style={{ lineHeight: `${LH}px`, whiteSpace: 'nowrap' }}>{text}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8, lineHeight: `${LH}px` }}>
        <span style={{ color }}>{label}</span>
        {status && (
          <span
            style={{
              border: `1.5px solid ${color}`,
              borderRadius: 8,
              padding: '0 12px',
              color,
              background: `rgba(246, 217, 122, ${0.08 + flash * 0.3})`,
              display: 'inline-flex',
              gap: 8,
              alignItems: 'center',
            }}
          >
            <StatusIcon status={status} color={color} />
            {stateLabel}
          </span>
        )}
        <span style={{ flex: 1 }} />
        <span style={{ color: C.dim, letterSpacing: 6 }}>{arrows}</span>
      </div>
    </div>
  )
}

const Pane: React.FC = () => {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()
  const sp = (from: number, damping = 16) => spring({ frame: f - from, fps, config: { damping, mass: 0.6 } })
  const gapOpen = sp(T.tool2)
  const fold = sp(T.fold, 20)
  const status: 'todo' | 'doing' | 'done' = f >= T.click2 ? 'done' : f >= T.click1 ? 'doing' : 'todo'
  const filters = sp(T.tool2, 20)
  const listTop = 74 + filters * 44
  const taskShown = gapOpen * (1 - fold)
  const decisionY = listTop + taskShown * (CARD_H + 18)
  const todo = f >= T.tool2 + 8 && f < T.click1 ? 1 : 0
  const doing = f >= T.click1 && f < T.click2 ? 1 : 0
  return (
    <div
      style={{
        position: 'absolute',
        left: LEFT,
        top: 0,
        width: WIN.w - LEFT,
        bottom: 0,
        background: C.window,
        borderLeft: `1px solid ${C.line}`,
        fontFamily: MONO,
        fontSize: FONT,
      }}
    >
      <div style={{ position: 'absolute', left: 22, right: 22, top: 22, display: 'flex', alignItems: 'center', gap: 10 }}>
        <Star size={20} />
        <span style={{ color: C.gold, fontWeight: 700 }}>nuggets</span>
        <span style={{ flex: 1 }} />
        <span style={{ color: C.dim, fontSize: 19 }}>
          {todo} to do · {doing} doing
        </span>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 22,
          top: 74,
          display: 'flex',
          gap: 22,
          opacity: filters,
          color: C.dim,
        }}
      >
        <span style={{ color: C.text, textDecoration: 'underline', textUnderlineOffset: 6 }}>all</span>
        <span style={{ color: C.task }}>task</span>
        <span style={{ color: C.decision }}>decision</span>
      </div>
      {f < T.enter1 + 2 && (
        <div style={{ position: 'absolute', left: 22, top: 74, color: C.dim }}>no gold yet — select text, then /nugget</div>
      )}
      {f >= T.tool2 + 8 && taskShown > 0.01 && (
        <Card
          y={listTop}
          color={C.task}
          label="task"
          text="Rebase fixups before you push"
          status={status}
          appear={T.tool2 + 8}
          opacity={1 - fold}
          arrows="↓ ···"
        />
      )}
      {f >= T.enter1 + 2 && (
        <Card
          y={decisionY}
          color={C.decision}
          label="decision"
          text={SELECTED}
          appear={T.enter1 + 2}
          arrows={taskShown > 0.5 ? '↑ ···' : '···'}
        />
      )}
      {f >= T.fold && (
        <div
          style={{
            position: 'absolute',
            left: 26,
            top: listTop + CARD_H + 26,
            color: C.dim,
            opacity: fold,
            display: 'flex',
            gap: 10,
            alignItems: 'center',
          }}
        >
          ▸ <StatusIcon status="done" color={C.dim} /> 1 done
        </div>
      )}
    </div>
  )
}

const Window: React.FC = () => {
  const s = useSpring(T.windowIn, { damping: 18, mass: 0.8 })
  return (
    <div
      style={{
        position: 'absolute',
        left: WIN.x,
        top: WIN.y,
        width: WIN.w,
        height: WIN.h,
        borderRadius: 18,
        overflow: 'hidden',
        background: C.window,
        border: '1px solid rgba(255,255,255,0.09)',
        boxShadow: '0 50px 140px rgba(0,0,0,0.65), 0 0 0 1px rgba(0,0,0,0.4)',
        opacity: s,
        transform: `translateY(${(1 - s) * 70}px)`,
      }}
    >
      <div
        style={{
          height: BAR,
          background: C.chrome,
          display: 'flex',
          alignItems: 'center',
          gap: 9,
          paddingLeft: 18,
          borderBottom: `1px solid ${C.line}`,
        }}
      >
        {['#ff5f57', '#febc2e', '#28c840'].map(c => (
          <span key={c} style={{ width: 13, height: 13, borderRadius: 7, background: c }} />
        ))}
        <span style={{ flex: 1, textAlign: 'center', marginRight: 70, color: C.dim, fontFamily: SANS, fontSize: 17 }}>
          Claude Code
        </span>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: BAR, bottom: 0 }}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: LEFT, bottom: 74 }}>
          <Transcript />
        </div>
        <Prompt />
        <Pane />
      </div>
    </div>
  )
}

const Cursor: React.FC = () => {
  const f = useCurrentFrame()
  const selY = WIN.y + BAR + 30 + 56 + 26
  const selX0 = WIN.x + PAD + CH * 2
  const selX1 = selX0 + CH * SELECTED.length
  const chip = { x: PANE_X + 22 + 22 + 4 * CH + 16 + 60, y: WIN.y + BAR + 74 + 44 + 16 + LH + 8 + 20 }
  const keys: [number, number, number][] = [
    [T.cursorIn, 980, 760],
    [T.selectFrom - 3, selX0 - 2, selY],
    [T.selectFrom, selX0 - 2, selY],
    [T.selectTo, selX1, selY],
    [T.enter1 + 30, selX1 + 40, selY + 120],
    [T.click1 - 22, chip.x, chip.y],
    [T.click2, chip.x, chip.y],
    [T.outro, chip.x + 120, chip.y + 220],
  ]
  const x = lerpKeys(f, keys, 1)
  const y = lerpKeys(f, keys, 2)
  const opacity = interpolate(
    f,
    [T.cursorIn, T.cursorIn + 8, T.enter1 + 22, T.enter1 + 32, T.click1 - 40, T.click1 - 30, T.outro - 10, T.outro],
    [0, 1, 1, 0, 0, 1, 1, 0],
    clamp,
  )
  const ripple = (at: number) => {
    const p = interpolate(f, [at, at + 14], [0, 1], clamp)
    return p > 0 && p < 1 ? (
      <span
        style={{
          position: 'absolute',
          left: -22 * (0.4 + p),
          top: -22 * (0.4 + p),
          width: 44 * (0.4 + p),
          height: 44 * (0.4 + p),
          borderRadius: '50%',
          border: `3px solid ${C.gold}`,
          opacity: 1 - p,
        }}
      />
    ) : null
  }
  return (
    <div style={{ position: 'absolute', left: x, top: y, opacity }}>
      {ripple(T.selectFrom)}
      {ripple(T.click1)}
      {ripple(T.click2)}
      <svg width={30} height={36} viewBox="0 0 30 36" style={{ position: 'absolute', left: -3, top: -2 }}>
        <path
          d="M3 2 L3 28 L10 21.5 L14.5 32 L19 30 L14.6 19.8 L24 19.8 Z"
          fill="#fff"
          stroke="#000"
          strokeWidth={1.6}
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}

const Caption: React.FC<{ n?: number; text: string; from: number; to: number }> = ({ n, text, from, to }) => {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()
  if (f < from || f > to + 12) return null
  const inS = spring({ frame: f - from, fps, config: { damping: 16, mass: 0.6 } })
  const out = interpolate(f, [to, to + 12], [1, 0], clamp)
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 54,
        display: 'flex',
        justifyContent: 'center',
        opacity: inS * out,
        transform: `translateY(${(1 - inS) * 30}px)`,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 18,
          padding: '16px 30px 16px 18px',
          borderRadius: 999,
          background: 'rgba(17, 17, 27, 0.86)',
          border: '1px solid rgba(245, 197, 66, 0.45)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(12px)',
          fontFamily: SANS,
          fontSize: 38,
          fontWeight: 500,
          color: C.text,
        }}
      >
        {n !== undefined ? (
          <span
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              background: C.gold,
              color: '#1e1e2e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 26,
            }}
          >
            {n}
          </span>
        ) : (
          <Star size={34} />
        )}
        {text}
      </div>
    </div>
  )
}

const Title: React.FC = () => {
  const f = useCurrentFrame()
  const s = useSpring(4, { damping: 14 })
  const out = interpolate(f, [T.windowIn - 8, T.windowIn + 8], [1, 0], clamp)
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', opacity: out }}>
      <div style={{ transform: `scale(${0.9 + 0.1 * s})`, opacity: s, textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 26, justifyContent: 'center' }}>
          <Star size={96} />
          <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 132, color: C.gold, letterSpacing: -3 }}>nugget</span>
        </div>
        <div style={{ fontFamily: SANS, fontSize: 46, color: C.text, marginTop: 18 }}>
          keep the gold from Claude Code’s answers
        </div>
      </div>
    </AbsoluteFill>
  )
}

const End: React.FC = () => {
  const s = useSpring(T.end, { damping: 16 })
  const s2 = useSpring(T.end + 10, { damping: 18 })
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', opacity: s, transform: `translateY(${(1 - s) * 30}px)` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 22, justifyContent: 'center' }}>
          <Star size={72} />
          <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 100, color: C.gold, letterSpacing: -2 }}>nugget</span>
        </div>
        <div
          style={{
            marginTop: 40,
            opacity: s2,
            fontFamily: MONO,
            fontSize: 34,
            color: C.text,
            background: 'rgba(17,17,27,0.85)',
            border: `1px solid ${C.line}`,
            borderRadius: 14,
            padding: '20px 34px',
          }}
        >
          <span style={{ color: C.dim }}>› </span>/plugin install nugget --marketplace Miriam2040/nugget
        </div>
        <div style={{ marginTop: 28, opacity: s2, fontFamily: SANS, fontSize: 30, color: C.dim }}>
          a Claude Code mod · free · your notes stay on your machine
        </div>
      </div>
    </AbsoluteFill>
  )
}

export const Nugget: React.FC = () => {
  const f = useCurrentFrame()
  // Camera: [frame, focus x, focus y, zoom]; the focus point lands at stage centre.
  const cam: [number, number, number, number][] = [
    [0, 960, 540, 1],
    [T.cursorIn + 8, 960, 540, 1],
    [T.selectFrom - 2, 520, 250, 1.5],
    [T.selectTo + 12, 520, 250, 1.5],
    [T.type1 + 6, 960, 540, 1],
    [T.enter1 + 4, 960, 540, 1],
    [T.enter1 + 22, 1440, 330, 1.45],
    [T.type2 - 10, 1440, 330, 1.45],
    [T.type2 + 6, 960, 540, 1],
    [T.tool2 + 26, 960, 540, 1],
    [T.click1 - 12, 1420, 330, 1.55],
    [T.fold + 22, 1420, 330, 1.55],
    [T.outro + 8, 960, 540, 1],
  ]
  const fx = lerpKeys(f, cam, 1)
  const fy = lerpKeys(f, cam, 2)
  const z = lerpKeys(f, cam, 3)
  const stageOut = interpolate(f, [T.outro, T.end], [1, 0], clamp)
  const stageScale = interpolate(f, [T.outro, T.end], [1, 0.92], { ...clamp, easing: ease })

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(1200px 700px at 18% 8%, #2a2150 0%, transparent 60%),
          radial-gradient(1100px 700px at 88% 96%, #3b2c0e 0%, transparent 60%),
          ${C.stage}`,
      }}
    >
      <Title />
      <AbsoluteFill style={{ opacity: stageOut, transform: `scale(${stageScale})` }}>
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: 1920,
            height: 1080,
            transformOrigin: '0 0',
            transform: `translate(${960 - fx * z}px, ${540 - fy * z}px) scale(${z})`,
          }}
        >
          <Window />
          <Cursor />
        </div>
      </AbsoluteFill>
      <Caption n={1} text="Select any part of Claude’s answer" from={T.cursorIn + 4} to={T.type1 - 4} />
      <Caption n={2} text="Type /nugget, and it lands as a card" from={T.type1} to={T.type2 - 8} />
      <Caption n={3} text="…or just ask Claude to nugget it" from={T.type2} to={T.tool2 + 36} />
      <Caption n={4} text="Tasks move: to do → doing → done" from={T.tool2 + 42} to={T.outro - 4} />
      {f >= T.end - 4 && <End />}
    </AbsoluteFill>
  )
}
