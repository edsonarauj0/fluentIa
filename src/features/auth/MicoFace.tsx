export type MicoMood = 'idle' | 'thinking' | 'celebrating' | 'blushing'

interface MicoFaceProps {
  mood?: MicoMood
  className?: string
}

/**
 * Rosto do Mico em SVG, sem dependências, só para a tela de login/cadastro.
 * Se preferir, troque pelo seu <Mascot /> (Rive) mantendo a prop de humor.
 */
export function MicoFace({ mood = 'idle', className = 'h-12 w-12' }: MicoFaceProps) {
  const eyeY = mood === 'thinking' ? 47 : 51

  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label="Mico, o mascote">
      {/* juba */}
      <circle cx="50" cy="52" r="44" fill="var(--color-mico, #FFB020)" />
      <circle cx="22" cy="30" r="11" fill="#FF8A1F" />
      <circle cx="78" cy="30" r="11" fill="#FF8A1F" />
      {/* rosto */}
      <circle cx="50" cy="55" r="31" fill="#FFE9A8" />

      {/* bochechas */}
      <ellipse
        cx="31"
        cy="62"
        rx={mood === 'blushing' ? 8 : 6}
        ry={mood === 'blushing' ? 5.5 : 4}
        fill="var(--color-boto, #F25CA8)"
        opacity={mood === 'blushing' ? 0.7 : 0.45}
      />
      <ellipse
        cx="69"
        cy="62"
        rx={mood === 'blushing' ? 8 : 6}
        ry={mood === 'blushing' ? 5.5 : 4}
        fill="var(--color-boto, #F25CA8)"
        opacity={mood === 'blushing' ? 0.7 : 0.45}
      />

      {/* olhos */}
      {mood === 'celebrating' ? (
        <g stroke="#0B1437" strokeWidth="4" strokeLinecap="round" fill="none">
          <path d="M33 53 q5 -8 10 0" />
          <path d="M57 53 q5 -8 10 0" />
        </g>
      ) : (
        <g fill="#0B1437">
          <circle cx="38" cy={eyeY} r="4.2" />
          <circle cx="62" cy={eyeY} r="4.2" />
        </g>
      )}

      {/* boca */}
      {mood === 'celebrating' && <path d="M38 66 q12 14 24 0 z" fill="#0B1437" />}
      {mood === 'idle' && (
        <path d="M40 68 q10 8 20 0" stroke="#0B1437" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      )}
      {mood === 'thinking' && (
        <path d="M43 70 h14" stroke="#0B1437" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      )}
      {mood === 'blushing' && <ellipse cx="50" cy="70" rx="4" ry="3.2" fill="#0B1437" />}
    </svg>
  )
}
