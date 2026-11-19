"""Generate the Buenos Aires Cosmology logo family as SVG.

The mark is drawn by hand from placed points: a stylised CMB temperature power
spectrum (D_ell vs ell) whose first acoustic peak is the Obelisco de Buenos Aires.
Text is converted to outlines from the site's Source Sans 3 / Source Serif 4
fonts, so the SVGs need no installed fonts.

Run:  .venv/bin/python logo/build_logo.py   (needs fonttools + brotli)
"""
from __future__ import annotations

import math
import pathlib

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = pathlib.Path(__file__).resolve().parent
FONTS = ROOT.parent / 'assets' / 'fonts'
OUT = ROOT / 'svg'
SANS = FONTS / '47df9ba1c7236d3b-s.p.0cqfp9mgbqxvb.woff2'   # Source Sans 3, latin subset
SERIF = FONTS / 'cef856781ea24bd1-s.p.17m2ldfggy3u-.woff2'  # Source Serif 4, latin subset

COLORS = {
    'gold': '#E9B949',        # sketch colour, for dark backgrounds
    'ink': '#1C2541',         # deep night blue, for light backgrounds
    'white': '#FFFFFF',
    'black': '#000000',
    'terracotta': '#A4552B',  # close to the site accent
}

# ---------------------------------------------------------------- the mark
# Coordinates in a 400 x 200 box, y grows downwards, D_ell = 0 at y = 200.
# Sachs-Wolfe plateau and rise (left of the obelisk); it steepens into the shaft.
RISE = [(0, 170), (34, 170.5), (66, 169), (88, 165.5), (106, 159)]
FILLET_IN, FILLET_UP = 10, 13   # handle lengths of the rise -> shaft fillet
# The Obelisco: square-section shaft tapering slightly, topped by a pyramidion.
OB_BASE_L, OB_TOP_L, OB_TIP, OB_TOP_R, OB_BASE_R = (125.5, 140), (129.5, 25), (135, 9), (140.5, 25), (144.5, 140)
TROUGH1_X = 157
DROP, TROUGH_HANDLE = 13, 6     # handle lengths of the shaft -> first trough curve


def tail_points(x0=TROUGH1_X, x1=400, step=3):
    """Damped acoustic oscillations after the first peak: peaks 2 and 3 of
    similar height, then the Silk damping tail. Period ~46 units."""
    pts = []
    x = x0
    while x <= x1 + 1e-6:
        u = x - x0
        background = 29 * math.exp(-u / 120) - 6 * math.exp(-u / 25)
        amp = 46 * math.exp(-((u / 150) ** 1.6))
        c = 0.5 - 0.5 * math.cos(2 * math.pi * u / 46)
        pts.append((round(x, 2), round(190 - background - amp * c - 3 * (1 - u / (x1 - x0)), 2)))
        x += step
    return pts


TAIL = tail_points()


def catmull(points, start_tangent=None, end_tangent=None, k=1 / 6):
    """Cubic Bezier segments ('C ...') through points (uniform Catmull-Rom).
    start/end_tangent override the end tangents (vector already scaled)."""
    pts = list(points)
    out = []
    for i in range(len(pts) - 1):
        p1, p2 = pts[i], pts[i + 1]
        if i > 0:
            t1 = (p2[0] - pts[i - 1][0], p2[1] - pts[i - 1][1])
        else:
            t1 = start_tangent or (2 * (p2[0] - p1[0]), 2 * (p2[1] - p1[1]))
        if i + 2 < len(pts):
            t2 = (pts[i + 2][0] - p1[0], pts[i + 2][1] - p1[1])
        else:
            t2 = end_tangent or (2 * (p2[0] - p1[0]), 2 * (p2[1] - p1[1]))
        c1 = (p1[0] + t1[0] * k, p1[1] + t1[1] * k)
        c2 = (p2[0] - t2[0] * k, p2[1] - t2[1] * k)
        out.append(f'C{c1[0]:.2f} {c1[1]:.2f} {c2[0]:.2f} {c2[1]:.2f} {p2[0]:.2f} {p2[1]:.2f}')
    return ' '.join(out)


def unit(v, length):
    n = (v[0] ** 2 + v[1] ** 2) ** .5
    return (v[0] / n * length, v[1] / n * length)


def mark_paths(style='line'):
    """SVG elements (colour via currentColor) for the mark.

    style: 'line'   one continuous stroke, obelisk drawn as an outline
           'solid'  filled obelisk silhouette
           'shaded' left face filled, right face outlined: reads as a 3-D obelisk
    """
    up_l = unit((OB_TOP_L[0] - OB_BASE_L[0], OB_TOP_L[1] - OB_BASE_L[1]), 1)
    down_r = unit((OB_BASE_R[0] - OB_TOP_R[0], OB_BASE_R[1] - OB_TOP_R[1]), 1)
    # rise -> fillet that turns vertical exactly at the shaft's left edge
    p, q = RISE[-1], RISE[-2]
    d = unit((p[0] - q[0], p[1] - q[1]), FILLET_IN)
    fillet = (f'C{p[0] + d[0]:.2f} {p[1] + d[1]:.2f} {OB_BASE_L[0] - up_l[0] * FILLET_UP:.2f} '
              f'{OB_BASE_L[1] - up_l[1] * FILLET_UP:.2f} {OB_BASE_L[0]} {OB_BASE_L[1]}')
    rise = f'M{RISE[0][0]} {RISE[0][1]} ' + catmull(RISE, end_tangent=unit(d, 30)) + ' ' + fillet
    shaft = f'L{OB_TOP_L[0]} {OB_TOP_L[1]} L{OB_TIP[0]} {OB_TIP[1]} L{OB_TOP_R[0]} {OB_TOP_R[1]} L{OB_BASE_R[0]} {OB_BASE_R[1]}'
    # shaft's right edge keeps going down, then bottoms out (flat) at the first trough
    t0 = TAIL[0]
    drop = (f'C{OB_BASE_R[0] + down_r[0] * DROP:.2f} {OB_BASE_R[1] + down_r[1] * DROP:.2f} '
            f'{t0[0] - TROUGH_HANDLE:.2f} {t0[1]} {t0[0]} {t0[1]}')
    tail = drop + ' ' + catmull(TAIL, start_tangent=(TAIL[1][0] - TAIL[0][0], 0))
    stroke = 'fill="none" stroke="currentColor" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"'
    els = [f'<path d="{rise} {shaft} {tail}" {stroke}/>']
    mid_base = ((OB_BASE_L[0] + OB_BASE_R[0]) / 2, OB_BASE_L[1])
    mid_top = (OB_TIP[0], OB_TOP_L[1])
    if style == 'solid':
        els.append(f'<path d="M{OB_BASE_L[0]} {OB_BASE_L[1]} {shaft} Z" fill="currentColor"/>')
    elif style == 'shaded':
        els.append(f'<path d="M{OB_BASE_L[0]} {OB_BASE_L[1]} L{OB_TOP_L[0]} {OB_TOP_L[1]} L{OB_TIP[0]} {OB_TIP[1]} '
                   f'L{mid_top[0]} {mid_top[1]} L{mid_base[0]} {mid_base[1]} Z" fill="currentColor" '
                   f'stroke="currentColor" stroke-width="{{dw}}" stroke-linejoin="round"/>')
    return els


# ---------------------------------------------------------------- text
_fonts: dict = {}


def font(path, wght):
    key = (path, wght)
    if key not in _fonts:
        f = TTFont(path)
        axes = {'wght': wght}
        if any(a.axisTag == 'opsz' for a in f['fvar'].axes):
            axes['opsz'] = 32
        _fonts[key] = instantiateVariableFont(f, axes)
    return _fonts[key]


def text_path(s, size, x, y, *, face=SANS, wght=600, tracking=0.12, anchor='start'):
    """Outline text as a single path 'd'. y is the baseline, tracking in em."""
    f = font(face, wght)
    gs, cmap, upm = f.getGlyphSet(), f.getBestCmap(), f['head'].unitsPerEm
    scale = size / upm
    names = [cmap[ord(c)] for c in s]
    adv = [gs[n].width * scale for n in names]
    width = sum(adv) + tracking * size * (len(s) - 1)
    if anchor == 'middle':
        x -= width / 2
    elif anchor == 'end':
        x -= width
    pen = SVGPathPen(gs, lambda v: f'{v:.2f}')
    cursor = x
    for n, a in zip(names, adv):
        gs[n].draw(TransformPen(pen, (scale, 0, 0, -scale, cursor, y)))
        cursor += a + tracking * size
    return pen.getCommands(), width


# ---------------------------------------------------------------- lockups
def svg(viewbox, body, color, bg=None, title='Buenos Aires Cosmology'):
    x, y, w, h = viewbox
    back = f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{bg}"/>' if bg else ''
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x} {y} {w} {h}" role="img" '
            f'style="color:{color}"><title>{title}</title>{back}{body}</svg>\n')


def mark_group(style, tx=0, ty=0, s=1.0, w=5.0):
    """The mark placed at (tx, ty), scaled by s, with a visual stroke width w."""
    sw = w / s
    els = ''.join(e.replace('{w}', f'{sw:.2f}').replace('{dw}', f'{sw * .5:.2f}') for e in mark_paths(style))
    return f'<g transform="translate({tx} {ty}) scale({s})">{els}</g>'


def lockup(kind, style='shaded', face=SANS):
    """Return (viewbox, body). Colour applied via currentColor."""
    def tp(*a, **k):
        return text_path(*a, face=face, **k)[0]
    fill = 'fill="currentColor"'
    if kind == 'mark':
        return (-6, 2, 412, 196), mark_group(style, w=5.5)
    if kind == 'oval':            # sketch 1: full ellipse, words under the mark
        body = '<ellipse cx="300" cy="175" rx="292" ry="165" fill="none" stroke="currentColor" stroke-width="6"/>'
        body += mark_group(style, 120, 18, 0.9, 5.5)
        body += f'<path {fill} d="{tp("BUENOS AIRES", 30, 300, 240, anchor="middle", tracking=.18)}"/>'
        body += f'<path {fill} d="{tp("COSMOLOGY", 30, 300, 280, anchor="middle", tracking=.34, wght=400)}"/>'
        return (0, 0, 600, 350), body
    if kind == 'dome':            # sketch 5/6: half ellipse closed by the spectrum baseline
        # drawn in mark coordinates: the arc springs from the start of the plateau
        # and lands on the end of the damping tail
        end = TAIL[-1]
        body = (f'<path d="M{RISE[0][0]} {RISE[0][1]} A200 {RISE[0][1] + 20} 0 0 1 200 -20 A200 {end[1] + 20} 0 0 1 {end[0]} {end[1]}" fill="none" '
                f'stroke="currentColor" stroke-width="4.5" stroke-linecap="round"/>')
        body += mark_group(style, 0, 0, 1, 4.5)
        body += f'<path {fill} d="{tp("BUENOS AIRES", 19, 190, 80, tracking=.14)}"/>'
        body += f'<path {fill} d="{tp("COSMOLOGY", 19, 190, 106, tracking=.32, wght=400)}"/>'
        return (-10, -24, 420, 224), body
    if kind == 'horizontal':      # mark + two-line wordmark
        body = mark_group(style, 0, 0, 1, 5.5)
        body += f'<path {fill} d="{tp("BUENOS AIRES", 46, 430, 98, tracking=.14)}"/>'
        body += f'<path {fill} d="{tp("COSMOLOGY", 46, 430, 156, tracking=.30, wght=400)}"/>'
        return (-6, 2, 836, 196), body
    if kind == 'stacked':         # mark above the wordmark
        body = mark_group(style, 0, 0, 1, 5.5)
        body += f'<path {fill} d="{tp("BUENOS AIRES COSMOLOGY", 25.5, 200, 236, anchor="middle", tracking=.16)}"/>'
        return (-6, 2, 412, 252), body
    if kind == 'ba':              # sketch 2: B.A. COSMOLOGY in the oval
        body = '<ellipse cx="300" cy="175" rx="292" ry="165" fill="none" stroke="currentColor" stroke-width="6"/>'
        body += mark_group(style, 120, 24, 0.9, 5.5)
        body += f'<path {fill} d="{tp("B.A. COSMOLOGY", 34, 300, 262, anchor="middle", tracking=.22, wght=500)}"/>'
        return (0, 0, 600, 350), body
    raise ValueError(kind)


def write(name, kind, style, color, bg=None, face=SANS):
    vb, body = lockup(kind, style, face)
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / f'{name}.svg').write_text(svg(vb, body, color, bg))


if __name__ == '__main__':
    for style in ('line', 'solid', 'shaded'):
        write(f'mark-{style}-ink', 'mark', style, COLORS['ink'])
        write(f'mark-{style}-gold-dark', 'mark', style, COLORS['gold'], '#111111')
    for kind in ('oval', 'dome', 'ba', 'horizontal', 'stacked'):
        for style in ('line', 'solid'):
            write(f'{kind}-{style}-ink', kind, style, COLORS['ink'])
            write(f'{kind}-{style}-gold-dark', kind, style, COLORS['gold'], '#111111')
    write('horizontal-solid-ink-serif', 'horizontal', 'solid', COLORS['ink'], face=SERIF)
    write('dome-solid-ink-serif', 'dome', 'solid', COLORS['ink'], face=SERIF)
    print('written to', OUT)
