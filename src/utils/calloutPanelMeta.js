/** Callout panel-only colors (inside the bordered box). Block-level colours stay on manual_block.text_color / background_color. */

export const CALLOUT_PANEL_TEXT_KEY = 'callout_panel_text_color'
export const CALLOUT_PANEL_BG_KEY = 'callout_panel_background_color'

export function getCalloutPanelColors(metadata) {
  const m = metadata && typeof metadata === 'object' ? metadata : {}
  return {
    text: m[CALLOUT_PANEL_TEXT_KEY] ?? null,
    background: m[CALLOUT_PANEL_BG_KEY] ?? null,
  }
}

function hexToRgb(hex) {
  if (!hex || typeof hex !== 'string') return null
  let h = hex.trim().replace('#', '')
  if (h.length === 3) {
    h = h
      .split('')
      .map((c) => c + c)
      .join('')
  }
  if (h.length !== 6) return null
  const n = parseInt(h, 16)
  if (Number.isNaN(n)) return null
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

function rgbToHex(r, g, b) {
  return `#${[r, g, b]
    .map((x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0'))
    .join('')}`
}

/** Darken panel fill for the left accent bar (factor: lower = darker). */
export function darkenPanelHex(hex, factor = 0.68) {
  const rgb = hexToRgb(hex)
  if (!rgb) return null
  return rgbToHex(rgb.r * factor, rgb.g * factor, rgb.b * factor)
}

/** Left border colour derived from chosen panel background; null if no custom panel bg. */
export function calloutPanelLeftAccent(panelBackgroundHex) {
  if (!panelBackgroundHex) return null
  return darkenPanelHex(panelBackgroundHex, 0.68)
}
