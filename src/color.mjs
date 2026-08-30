const HEX = /^#[0-9A-Fa-f]{6}$/;
const WHITE = "#FFFFFF";
const ZINC_950 = "#09090B";

function channels(color) {
  if (!HEX.test(color)) {
    throw new TypeError(`Expected #RRGGBB color, received: ${color}`);
  }

  return [1, 3, 5].map((index) => Number.parseInt(color.slice(index, index + 2), 16) / 255);
}

function luminance(color) {
  const [red, green, blue] = channels(color).map((channel) => (
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  ));

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

export function contrastRatio(foreground, background) {
  const foregroundLuminance = luminance(foreground);
  const backgroundLuminance = luminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

export function isHexColor(color) {
  return typeof color === "string" && HEX.test(color);
}

export function validateProjectColors(project) {
  const errors = [];
  const id = project?.id ?? "unknown";
  const accent = project?.accent ?? {};

  for (const [surface, color, background] of [
    ["light", accent.light, WHITE],
    ["dark", accent.dark, ZINC_950],
  ]) {
    if (!isHexColor(color)) {
      errors.push(`Invalid accent.${surface} for ${id}: ${color}`);
      continue;
    }

    const ratio = contrastRatio(color, background);
    if (ratio < 4.5) {
      errors.push(`${id} accent.${surface} contrast ${ratio.toFixed(2)}:1 is below 4.5:1 on ${background}`);
    }
  }

  return errors;
}
