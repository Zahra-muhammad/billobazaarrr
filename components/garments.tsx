import type { ReactNode } from 'react';
import type { GarmentId } from '@/data/site';

/**
 * Hand-sketched fashion flats for the shop row: a front and a back of each garment, drawn
 * through the still pencil filter (#pencil-still in PencilFilters). On hover the card flips
 * from one to the other.
 */
const INK = '#2A0606';
const PAPER = '#F7F5F0';
const ROSE = '#B23A5B';
const TEAL = '#2F6A73';
const OCHRE = '#8A5A1C';
const LILAC = '#4D3A7A';
const SABZ = '#3E6B36';

function Flat({ side, children }: { side: 'front' | 'back'; children: ReactNode }) {
  return (
    <svg className={`flat ${side}`} viewBox="0 0 300 360" aria-hidden="true" focusable="false">
      <g filter="url(#pencil-still)" fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
        {children}
      </g>
    </svg>
  );
}

export const GARMENTS: Record<GarmentId, { front: ReactNode; back: ReactNode }> = {
  kurta: {
    front: (
      <Flat side="front">
        <path d="M110 40 L60 70 L38 170 L62 178 L78 112 L78 332 L222 332 L222 112 L238 178 L262 170 L240 70 L190 40 Q150 58 110 40 Z" fill={PAPER} />
        <path d="M134 34 Q150 46 166 34 L166 24 Q150 34 134 24 Z" fill={PAPER} />
        <path d="M150 50 L150 140" />
        <circle cx="150" cy="72" r="3" fill={INK} />
        <circle cx="150" cy="94" r="3" fill={INK} />
        <circle cx="150" cy="116" r="3" fill={INK} />
        <path d="M42 158 L66 166 M258 158 L234 166" strokeWidth={2} />
        <path d="M78 268 L92 268 M222 268 L208 268" strokeWidth={2} />
        <path d="M84 312 L216 312" stroke={ROSE} strokeWidth={2.4} strokeDasharray="2 9" />
        <path d="M84 300 Q100 290 116 300 T148 300 T180 300 T214 300" stroke={ROSE} strokeWidth={2} />
        <path d="M126 52 Q150 66 174 52" stroke={ROSE} strokeWidth={2} strokeDasharray="2 7" />
      </Flat>
    ),
    back: (
      <Flat side="back">
        <path d="M110 40 L60 70 L38 170 L62 178 L78 112 L78 332 L222 332 L222 112 L238 178 L262 170 L240 70 L190 40 Q150 46 110 40 Z" fill={PAPER} />
        <path d="M134 30 Q150 36 166 30 L166 22 Q150 28 134 22 Z" fill={PAPER} />
        <path d="M92 92 Q150 104 208 92" strokeWidth={2} />
        <path d="M42 158 L66 166 M258 158 L234 166" strokeWidth={2} />
        <path d="M78 268 L92 268 M222 268 L208 268" strokeWidth={2} />
        <path d="M150 150 C132 132 126 168 150 186 C174 168 168 132 150 150 Z" stroke={ROSE} strokeWidth={2.2} />
        <path d="M150 186 L150 214 M136 200 L164 200" stroke={ROSE} strokeWidth={2} />
        <path d="M84 312 L216 312" stroke={ROSE} strokeWidth={2.4} strokeDasharray="2 9" />
        <path d="M84 300 Q100 290 116 300 T148 300 T180 300 T214 300" stroke={ROSE} strokeWidth={2} />
      </Flat>
    ),
  },

  bomber: {
    front: (
      <Flat side="front">
        <path d="M100 52 L56 76 L30 204 L60 212 L80 124 L80 252 L220 252 L220 124 L240 212 L270 204 L244 76 L200 52 Q150 72 100 52 Z" fill={PAPER} />
        <path d="M100 52 Q150 28 200 52 Q150 42 100 52 Z" fill={PAPER} />
        <path d="M150 62 L150 252" strokeWidth={2.4} />
        <path d="M80 252 L80 272 L220 272 L220 252" fill={PAPER} />
        <path d="M96 254 L96 270 M112 254 L112 270 M128 254 L128 270 M172 254 L172 270 M188 254 L188 270 M204 254 L204 270" strokeWidth={1.6} />
        <path d="M30 204 L27 222 L57 228 L60 212" fill={PAPER} />
        <path d="M270 204 L273 222 L243 228 L240 212" fill={PAPER} />
        <path d="M100 196 L118 172 M200 196 L182 172" strokeWidth={2.4} />
        <path d="M98 100 C110 84 132 96 124 112 C118 124 102 118 106 108 M176 140 C188 124 210 136 202 152 C196 164 180 158 184 148 M104 220 C114 210 130 218 124 230" stroke={TEAL} strokeWidth={2.2} />
        <path d="M196 92 L212 84 L216 112 L200 118 Z" stroke={TEAL} strokeWidth={2} />
      </Flat>
    ),
    back: (
      <Flat side="back">
        <path d="M100 52 L56 76 L30 204 L60 212 L80 124 L80 252 L220 252 L220 124 L240 212 L270 204 L244 76 L200 52 Q150 58 100 52 Z" fill={PAPER} />
        <path d="M100 52 Q150 40 200 52 L198 62 Q150 52 102 62 Z" fill={PAPER} />
        <path d="M80 252 L80 272 L220 272 L220 252" fill={PAPER} />
        <path d="M96 254 L96 270 M112 254 L112 270 M128 254 L128 270 M144 254 L144 270 M156 254 L156 270 M172 254 L172 270 M188 254 L188 270 M204 254 L204 270" strokeWidth={1.6} />
        <path d="M30 204 L27 222 L57 228 L60 212" fill={PAPER} />
        <path d="M270 204 L273 222 L243 228 L240 212" fill={PAPER} />
        <circle cx="150" cy="150" r="46" stroke={TEAL} strokeWidth={2.4} />
        <circle cx="150" cy="150" r="30" stroke={TEAL} strokeWidth={1.6} strokeDasharray="3 6" />
        <path d="M150 104 L150 196 M104 150 L196 150 M118 118 L182 182 M182 118 L118 182" stroke={TEAL} strokeWidth={1.6} />
        <circle cx="150" cy="150" r="8" fill={TEAL} stroke="none" />
      </Flat>
    ),
  },

  waistcoat: {
    front: (
      <Flat side="front">
        <path d="M106 46 L82 60 Q72 100 92 132 L86 302 L214 302 L208 132 Q228 100 218 60 L194 46 L150 164 Z" fill={PAPER} />
        <path d="M106 46 Q150 30 194 46 L190 56 Q150 42 110 56 Z" fill={PAPER} />
        <path d="M150 164 L150 302" />
        <circle cx="158" cy="182" r="3" fill={INK} />
        <circle cx="158" cy="214" r="3" fill={INK} />
        <circle cx="158" cy="246" r="3" fill={INK} />
        <circle cx="158" cy="278" r="3" fill={INK} />
        <path d="M100 232 L132 232 M168 232 L200 232 M172 124 L196 118" strokeWidth={2.4} />
        <path d="M98 150 L140 150 M96 170 L142 170 M95 190 L142 190 M94 210 L142 210 M160 150 L202 150 M160 170 L204 170 M160 190 L205 190 M160 210 L206 210" stroke={OCHRE} strokeWidth={1.4} strokeDasharray="1 7" />
      </Flat>
    ),
    back: (
      <Flat side="back">
        <path d="M106 46 L82 60 Q72 100 92 132 L86 302 L214 302 L208 132 Q228 100 218 60 L194 46 Q150 56 106 46 Z" fill={PAPER} />
        <path d="M106 46 Q150 36 194 46 L192 54 Q150 46 108 54 Z" fill={PAPER} />
        <path d="M150 54 L150 302" strokeWidth={1.6} opacity={0.6} />
        <path d="M92 236 L208 236 L208 254 L92 254 Z" fill={PAPER} strokeWidth={2.4} />
        <rect x="140" y="232" width="20" height="26" rx="3" strokeWidth={2.4} />
        <path d="M98 130 L202 130 M96 160 L204 160 M95 190 L205 190 M94 216 L206 216" stroke={OCHRE} strokeWidth={1.4} strokeDasharray="1 7" />
      </Flat>
    ),
  },

  shalwar: {
    front: (
      <Flat side="front">
        <path d="M88 40 L212 40 L216 64 L248 332 L166 332 L150 124 L134 332 L52 332 L84 64 Z" fill={PAPER} />
        <path d="M84 64 L216 64" strokeWidth={2.4} />
        <path d="M140 64 Q138 84 128 96 M160 64 Q162 84 172 96" strokeWidth={2} />
        <path d="M108 70 L96 320 M192 70 L204 320" strokeWidth={1.6} opacity={0.6} />
        <path d="M56 304 L132 304 M168 304 L244 304" stroke={LILAC} strokeWidth={2.4} />
        <path d="M58 316 Q76 308 94 316 T130 316 M170 316 Q188 308 206 316 T242 316" stroke={LILAC} strokeWidth={2} />
      </Flat>
    ),
    back: (
      <Flat side="back">
        <path d="M88 40 L212 40 L216 64 L248 332 L166 332 L150 124 L134 332 L52 332 L84 64 Z" fill={PAPER} />
        <path d="M84 64 L216 64" strokeWidth={2.4} />
        <path d="M150 64 L150 124" strokeWidth={2} />
        <path d="M98 82 L136 82 L134 118 L102 120 Z M164 82 L202 82 L198 120 L166 118 Z" strokeWidth={2.2} />
        <path d="M56 304 L132 304 M168 304 L244 304" stroke={LILAC} strokeWidth={2.4} />
        <path d="M58 316 Q76 308 94 316 T130 316 M170 316 Q188 308 206 316 T242 316" stroke={LILAC} strokeWidth={2} />
      </Flat>
    ),
  },

  puffer: {
    front: (
      <Flat side="front">
        <path d="M96 52 L46 80 L28 212 L62 220 L78 132 L78 262 Q150 280 222 262 L222 132 L238 220 L272 212 L254 80 L204 52 Q150 30 96 52 Z" fill={PAPER} />
        <path d="M96 52 Q150 22 204 52 L198 34 Q150 12 102 34 Z" fill={PAPER} />
        <path d="M150 46 L150 270" strokeWidth={2.4} />
        <path d="M80 108 Q115 116 148 108 M152 108 Q185 116 220 108 M79 152 Q115 160 148 152 M152 152 Q185 160 221 152 M78 196 Q115 204 148 196 M152 196 Q185 204 222 196 M78 238 Q115 246 148 238 M152 238 Q185 246 222 238" strokeWidth={2} />
        <path d="M40 120 L72 128 M36 160 L68 168 M32 196 L64 204 M260 120 L228 128 M264 160 L232 168 M268 196 L236 204" strokeWidth={2} />
        <path d="M96 126 L112 138 M188 172 L204 182 M110 214 L124 226" stroke={SABZ} strokeWidth={2.6} />
      </Flat>
    ),
    back: (
      <Flat side="back">
        <path d="M96 52 L46 80 L28 212 L62 220 L78 132 L78 262 Q150 280 222 262 L222 132 L238 220 L272 212 L254 80 L204 52 Q150 44 96 52 Z" fill={PAPER} />
        <path d="M96 52 Q150 44 204 52 L200 34 Q150 24 100 34 Z" fill={PAPER} />
        <path d="M80 108 Q150 120 220 108 M79 152 Q150 164 221 152 M78 196 Q150 208 222 196 M78 238 Q150 250 222 238" strokeWidth={2} />
        <path d="M40 120 L72 128 M36 160 L68 168 M32 196 L64 204 M260 120 L228 128 M264 160 L232 168 M268 196 L236 204" strokeWidth={2} />
        <path d="M120 170 L134 178 M150 126 L164 134 M168 214 L182 222 M104 220 L116 228" stroke={SABZ} strokeWidth={2.6} />
      </Flat>
    ),
  },
};
