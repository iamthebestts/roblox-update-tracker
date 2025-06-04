/**
 * Isso sim foi feito por IA 🤓
 */

import chalk from "chalk";

process.stdout.write("\x1B[?25l");

export const asciiArt = `
   ▄████████  ▄██████▄      ███        ▄████████    ▄████████  ▄████████    ▄█   ▄█▄      
  ███    ███ ███    ███ ▀█████████▄   ███    ███   ███    ███ ███    ███   ███ ▄███▀      
  ███    ███ ███    ███    ▀███▀▀██   ███    ███   ███    ███ ███    █▀    ███▐██▀        
 ▄███▄▄▄▄██▀ ███    ███     ███   ▀  ▄███▄▄▄▄██▀   ███    ███ ███         ▄█████▀         
▀▀███▀▀▀▀▀   ███    ███     ███     ▀▀███▀▀▀▀▀   ▀███████████ ███        ▀▀█████▄         
▀███████████ ███    ███     ███     ▀███████████   ███    ███ ███    █▄    ███▐██▄        
  ███    ███ ███    ███     ███       ███    ███   ███    ███ ███    ███   ███ ▀███▄      
  ███    ███  ▀██████▀     ▄████▀     ███    ███   ███    █▀  ████████▀    ███   ▀█▀      
  ███    ███                          ███    ███                           ▀              
`;

let rotationOffset = 0;

const hexToRgb = (hex: string) => {
  hex = hex.replace(/^#/, "");
  const bigint = parseInt(hex, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
};

const rgbToHex = (r: number, g: number, b: number) => {
  return (
    "#" +
    ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()
  );
};

const interpolateColor = (color1: string, color2: string, factor: number) => {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  const r = Math.round(c1.r + factor * (c2.r - c1.r));
  const g = Math.round(c1.g + factor * (c2.g - c1.g));
  const b = Math.round(c1.b + factor * (c2.b - c1.b));
  return rgbToHex(r, g, b);
};

export const gradientText = (text: string, startColor: string, endColor: string) => {
  let result = "";
  for (let i = 0; i < text.length; i++) {
    const factor = text.length > 1 ? i / (text.length - 1) : 0;
    const color = interpolateColor(startColor, endColor, factor);
    result += chalk.hex(color)(text[i]);
  }
  return result;
};

// Applies a purple gradient to the provided text.
export const purpleGradientText = (text: string) => {
  const startPurple = "#DA70D6";
  const endPurple = "#8A2BE2";
  return gradientText(text, startPurple, endPurple);
};

export const purpleEmojiSides = (text: string) => {
  const emojis = ["🟣", "⭐", "🔮", "🪄", "✨", "⚡"];
  const leftEmoji = emojis[rotationOffset % emojis.length];
  const rightEmoji = emojis[(rotationOffset + 1) % emojis.length];
  return chalk.bold(leftEmoji + purpleGradientText(text) + rightEmoji);
};

const startColor = "#FF4C4C";
const endColor = "#B22222";

const orangeStart = "#FFA500";
const orangeEnd = "#FF8C00";

const additionalMessageEnabled = true;

export interface TableRow {
  left: string;
  right: string;
  leftFormatted?: string;
  rightFormatted?: string;
}

let tableRows: TableRow[] = [
  {
    left: "Formato",
    right: "Exemplo",
    leftFormatted: chalk.bold.underline("Formato"),
    rightFormatted: chalk.bold.underline("Exemplo"),
  },
  {
    left: "Verde",
    right: "Mensagem de Sucesso",
    leftFormatted: chalk.green("Verde"),
    rightFormatted: chalk.greenBright("Mensagem de Sucesso"),
  },
  {
    left: "Azul",
    right: "Informação",
    leftFormatted: chalk.blue("Azul"),
    rightFormatted: chalk.blueBright("Informação"),
  },
  {
    left: "Vermelho",
    right: "Erro",
    leftFormatted: chalk.red("Vermelho"),
    rightFormatted: chalk.redBright("Erro"),
  },
  {
    left: "Revert",
    right: "Detecta revert de atualizações",
    leftFormatted: chalk.magenta("Revert"),
    rightFormatted: gradientText(
      "Detecta revert de atualizações",
      "#DA70D6",
      "#8A2BE2"
    ),
  },
];

export const clearTableRows = () => {
  tableRows = [];
  drawScreen();
};

export const addTableRow = (row: TableRow) => {
  tableRows.push(row);
  drawScreen();
};

export const drawScreen = () => {
  const terminalHeight = process.stdout.rows || 24;
  const terminalWidth = process.stdout.columns || 80;

  process.stdout.write("\x1b[H");

  const artLines = asciiArt.trim().split("\n");
  const artHeight = artLines.length;

  const signatureText = " MADE BY IAMTHEBESTTS ";
  const plainAdditional = "RoTrack, seu Update Tracker para Roblox OPEN SOURCE";
  const paddedAdditional = " ".repeat(
    Math.floor((terminalWidth - plainAdditional.length) / 2)
  );

  const maxLineWidth = Math.max(
    ...artLines.map((line) => line.length),
    signatureText.length,
    plainAdditional.length
  );
  
  if (terminalWidth < maxLineWidth || terminalHeight < artHeight + 14) return;

  const paddingTop = Math.floor((terminalHeight - (artHeight + 14)) / 2);
  let output = "";
  output += "\n".repeat(paddingTop);

  // Denom for gradient calculations.
  const denom = (artHeight - 1) + (maxLineWidth - 1) || 1;

  artLines.forEach((line, rowIndex) => {
    const padLeft = Math.floor((terminalWidth - line.length) / 2);
    const coloredLine = line
      .split("")
      .map((char, colIndex) => {
        const factor = ((rowIndex + colIndex + rotationOffset) % denom) / denom;
        const gradientColor = interpolateColor(startColor, endColor, factor);
        return chalk.hex(gradientColor).bold(char);
      })
      .join("");
    output += " ".repeat(padLeft) + coloredLine + "\n";
  });

  output += "\n";
  const signaturePadding = Math.floor(
    (terminalWidth - signatureText.length - 2) / 2
  );
  output += " ".repeat(signaturePadding) + purpleEmojiSides(signatureText) + "\n";

  if (additionalMessageEnabled) {
    const part1 = gradientText("RoTrack", orangeStart, orangeEnd);
    const part2 = ", seu Update Tracker para Roblox ";
    const part3 = gradientText("OPEN SOURCE", orangeStart, orangeEnd);
    const additionalMessage = part1 + part2 + part3;
    output += "\n";
    output += paddedAdditional + additionalMessage + "\n";
  }

  output += "\n".repeat(5);

  tableRows.forEach((row) => {
    const leftText = row.leftFormatted || row.left;
    const rightText = row.rightFormatted || row.right;
    output += leftText + " | " + rightText + "\n";
  });

  process.stdout.write(output);

  rotationOffset = (rotationOffset + 1) % denom;
};
