import chalk from "chalk";

export const asciiArt = `
██████╗  ██████╗ ████████╗██████╗  █████╗  ██████╗██╗  ██╗    
██╔══██╗██╔═══██╗╚══██╔══╝██╔══██╗██╔══██╗██╔════╝██║ ██╔╝    
██████╔╝██║   ██║   ██║   ██████╔╝███████║██║     █████╔╝     
██╔══██╗██║   ██║   ██║   ██╔══██╗██╔══██║██║     ██╔═██╗     
██║  ██║╚██████╔╝   ██║   ██║  ██║██║  ██║╚██████╗██║  ██╗    
╚═╝  ╚═╝ ╚═════╝    ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝    
                                                              
`;

const hexToRgb = (hex: string) => {
  const v = parseInt(hex.replace(/^#/, ""), 16);
  return { r: (v >> 16) & 255, g: (v >> 8) & 255, b: v & 255 };
};

const rgbToHex = (r: number, g: number, b: number) =>
  "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();

const interpolateColor = (c1: string, c2: string, f: number) => {
  const a = hexToRgb(c1);
  const b = hexToRgb(c2);
  return rgbToHex(
    Math.round(a.r + f * (b.r - a.r)),
    Math.round(a.g + f * (b.g - a.g)),
    Math.round(a.b + f * (b.b - a.b))
  );
};

export const gradientText = (text: string, start: string, end: string) =>
  [...text].map((char, i) => {
    const f = text.length > 1 ? i / (text.length - 1) : 0;
    return chalk.hex(interpolateColor(start, end, f))(char);
  }).join("");

export const purpleGradientText = (text: string) =>
  gradientText(text, "#DA70D6", "#8A2BE2");

export interface TableRow {
  left: string;
  right: string;
  leftFormatted?: string;
  rightFormatted?: string;
}

let tableRows: TableRow[] = [];
let bannerPrinted = false;

export const clearTableRows = () => {
  tableRows = [];
};

const formatRow = (row: TableRow): string => {
  const cols = process.stdout.columns || 80;
  const left = row.leftFormatted || row.left;
  const right = row.rightFormatted || row.right;
  const line = `${left} | ${right}`;
  const pad = Math.max(0, Math.floor((cols - line.length) / 2));
  return " ".repeat(pad) + line;
};

export const addTableRow = (row: TableRow) => {
  tableRows.push(row);
  if (bannerPrinted) {
    console.log(formatRow(row));
  }
};

export const printBannerOnce = () => {
  if (bannerPrinted) return;
  bannerPrinted = true;

  const rows = process.stdout.rows || 24;
  const cols = process.stdout.columns || 80;

  console.clear();

  const artLines = asciiArt.trim().split("\n");
  const artH = artLines.length;
  const artW = Math.max(...artLines.map(l => l.length));
  const contentHeight = artH + 4 + tableRows.length;
  const padTop = Math.max(0, Math.floor((rows - contentHeight) / 2));
  const padLeft = Math.max(0, Math.floor((cols - artW) / 2));

  process.stdout.write("\n".repeat(padTop));

  const denom = (artH - 1) + (artW - 1) || 1;
  artLines.forEach((line, r) => {
    const linePadded = " ".repeat(padLeft) + line;
    const colored = [...linePadded].map((ch, c) => {
      const f = (r + c - padLeft) / denom;
      return chalk.hex(interpolateColor("#FF4C4C", "#B22222", f)).bold(ch);
    }).join("");
    console.log(colored);
  });

  console.log("");

  const sigText = " MADE BY IAMTHEBESTTS ";
  const sigColored = purpleGradientText(sigText);
  const sigPad = Math.max(0, Math.floor((cols - sigText.length) / 2));
  console.log(" ".repeat(sigPad) + sigColored + "\n");

  const msgText = "RoTrack, seu Update Tracker para Roblox OPEN SOURCE";
  const msgColored =
    gradientText("RoTrack", "#FFA500", "#FF8C00") +
    ", seu Update Tracker para Roblox " +
    gradientText("OPEN SOURCE", "#FFA500", "#FF8C00");
  const msgPad = Math.max(0, Math.floor((cols - msgText.length) / 2));
  console.log(" ".repeat(msgPad) + msgColored + "\n");

  tableRows.forEach(row => {
    console.log(formatRow(row));
  });
};
