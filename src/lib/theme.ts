// Theme color constants
export const BG_PRIMARY = "var(--bg-primary)";
export const BG_SECONDARY = "var(--bg-secondary)";
export const BG_TERTIARY = "var(--bg-tertiary)";
export const BG_MODAL_BACKDROP = "var(--bg-modal-backdrop)";
export const TEXT_PRIMARY = "var(--text-primary)";
export const TEXT_SECONDARY = "var(--text-secondary)";
export const TEXT_TERTIARY = "var(--text-tertiary)";
export const BORDER_COLOR = "var(--border-color)";

export const MAIN_COLOR = "#92c81a";
export const GOLDEN = "#fcc200";
export const RED = "#da342f";
export const BRIGHT_RED = "#FF3B30";
export const YELLOW = "#eadb02";
export const BLUE = "#1e90ff";

const SYSTEM_FONT_CLASS = "system-font";

export function applyPixelFont(enabled: boolean) {
  document.body.classList.toggle(SYSTEM_FONT_CLASS, !enabled);
}
