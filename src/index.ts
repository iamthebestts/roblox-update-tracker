import { versionEmitter } from "./services/events";
import chalk from "chalk";
import {
  VersionTracker,
  type Platform,
  type TrackerConfig,
} from "./services/tracker";
import { addTableRow, clearTableRows, gradientText, printBannerOnce } from "./services/banner";

const CHECK_INTERVAL_MS = 5000 // 5 Seconds

const trackers: Partial<Record<Platform, VersionTracker>> = {};
const trackerUrls: Record<Platform, TrackerConfig> = {
  windows: {
    url: "https://clientsettingscdn.roblox.com/v1/client-version/WindowsPlayer",
    type: "api",
    debug: false,
  },
  mac: {
    url: "https://clientsettingscdn.roblox.com/v1/client-version/MacPlayer",
    type: "api",
    debug: false,
  },
  ios: {
    url: "https://itunes.apple.com/lookup?bundleId=com.roblox.robloxmobile",
    type: "store",
    debug: false,
  },
  android: {
    url: "com.roblox.client",
    type: "scraper",
    debug: false,
  },
};

const checkUpdates = async () => {
  for (const platform of Object.keys(
    trackerUrls
  ) as (keyof typeof trackerUrls)[]) {
    if (!(platform in trackerUrls)) {
      throw new Error(`Invalid platform: ${platform}`);
    }

    const typedPlatform = platform as Platform;

    if (!trackers[typedPlatform]) {
      trackers[typedPlatform] = new VersionTracker(
        typedPlatform,
        trackerUrls[typedPlatform]
      );
      if (trackers[typedPlatform].debug) {
        console.debug(chalk.gray(`[${typedPlatform}] Tracker inicializado.`));
      }
    }

    await trackers[typedPlatform]!.checkForUpdate();
  }
};


versionEmitter.on("versionChanged", (data) => {
  switch (data.type) {
    case "update": {
      addTableRow({
        left: gradientText(`UPDATE DETECTED: ${data.platform}`, "#00FF7F", "#008000"),
        right: gradientText(`Versão: ${data.version}`, "#00FF7F", "#008000"),
      });
      break;
    }
    case "revert": {
      addTableRow({
        left: gradientText(`REVERT DETECTED: ${data.platform}`, "#FFA500", "#FF4500"),
        right: gradientText(`${data.oldVersion} (OLD) -> ${data.version} (NEW)`, "#FFA500", "#FF4500"),
      });
      break;
    }
  }
});

clearTableRows()
printBannerOnce()
setInterval(checkUpdates, CHECK_INTERVAL_MS);

process.on('uncaughtException', (ex) => {
  addTableRow({
    left: gradientText("Error:", "#FF0000", "#8B0000"),
    right: gradientText(`Message: ${ex.message}`, "#FF0000", "#8B0000")
  });
})