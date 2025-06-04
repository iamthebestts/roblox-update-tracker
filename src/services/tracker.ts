import axios from "axios";
import fs from "fs";
import path from "path";
// @ts-ignore
import gplay from "google-play-scraper";
import { versionEmitter } from "./events";

type Platform = "windows" | "mac" | "ios" | "android";

interface versionEntry {
  version: string;
  date: string; // ISO
}

interface TrackerConfig {
  url: string;
  type: "api" | "store" | "scraper";
  debug?: boolean;
}

class VersionTracker {
  config: TrackerConfig;
  platform: string;
  versionsDir: string;
  debug: boolean;

  constructor(platform: string, config: TrackerConfig) {
    this.platform = platform;
    this.config = config;
    this.debug = config.debug ?? false;
    this.versionsDir = path.join(import.meta.dirname, "versions");

    if (!fs.existsSync(this.versionsDir)) {
      fs.mkdirSync(this.versionsDir);
      if (this.debug) {
        console.debug(
          `[${this.platform}] Criado diretório de versões: ${this.versionsDir}`
        );
      }
    }
  }
  private readHistory(): versionEntry[] {
    const historyFilePath = path.join(
      this.versionsDir,
      `${this.platform}History.json`
    );

    try {
      if (!fs.existsSync(this.versionsDir)) {
        fs.mkdirSync(this.versionsDir, { recursive: true });
        if (this.debug) {
          console.debug(`[${this.platform}] Criado diretório de versões: ${this.versionsDir}`);
        }
      }

      if (!fs.existsSync(historyFilePath)) {
        fs.writeFileSync(historyFilePath, '[]', 'utf8');
        if (this.debug) {
          console.debug(`[${this.platform}] Criado novo arquivo de histórico`);
        }
        return [];
      }

      const fileContent = fs.readFileSync(historyFilePath, "utf8");

      if (fileContent.trim() === "") {
        fs.writeFileSync(historyFilePath, '[]', 'utf8');
        if (this.debug) {
          console.debug(`[${this.platform}] Arquivo de histórico vazio, inicializado`);
        }
        return [];
      }

      try {
        const history = JSON.parse(fileContent);
        if (!Array.isArray(history)) {
          throw new Error('Histórico não é um array');
        }
        if (this.debug) {
          console.debug(`[${this.platform}] Histórico lido:`, history);
        }
        return history;
      } catch (error) {
        fs.writeFileSync(historyFilePath, '[]', 'utf8');
        if (this.debug) {
          console.debug(`[${this.platform}] Erro ao ler histórico, arquivo reinicializado:`, error);
        }
        return [];
      }
    } catch (error) {
      if (this.debug) {
        console.debug(`[${this.platform}] Erro ao acessar arquivo de histórico:`, error);
      }
      return [];
    }
  }

  private saveVersion(version: string) {
    const history = this.readHistory();
    const newVersion = {
      version,
      date: new Date().toISOString(),
    } satisfies versionEntry;
    history.push(newVersion);

    const historyFilePath = path.join(
      this.versionsDir,
      `${this.platform}History.json`
    );
    fs.writeFileSync(historyFilePath, JSON.stringify(history, null, 2));
    if (this.debug) {
      console.debug(`[${this.platform}] Nova versão salva:`, newVersion);
    }
  }

  private deleteVersion(version: string) {
    let history = this.readHistory();
    history = history.filter((v: { version: string }) => v.version !== version);

    const historyFilePath = path.join(
      this.versionsDir,
      `${this.platform}History.json`
    );
    fs.writeFileSync(historyFilePath, JSON.stringify(history, null, 2));
    if (this.debug) {
      console.debug(
        `[${this.platform}] Versão deletada do histórico: ${version}`
      );
    }
  }

  versionExists(version: string) {
    const history = this.readHistory();
    const exists = history.some(
      (v: { version: string }) => v.version === version
    );
    if (this.debug) {
      console.debug(
        `[${this.platform}] Verificando se versão existe (${version}): ${exists}`
      );
    }
    return exists;
  }

  public hasLatestVersion(): boolean {
    const history = this.readHistory();

    if (history.length === 0) {
      if (this.debug) {
        console.debug(
          `[${this.platform}] Nenhuma versão encontrada no histórico.`
        );
      }
      return false;
    }

    const latestEntry = history[history.length - 1];
    const hasLatest = latestEntry !== undefined && latestEntry.version !== "";
    if (this.debug) {
      console.debug(`[${this.platform}] Última versão existe: ${hasLatest}`);
    }
    return hasLatest;
  }

  async fetchVersion(): Promise<versionEntry | string> {
    try {
      if (this.debug) {
        console.debug(
          `[${this.platform}] Buscando versão usando tipo: ${this.config.type}`
        );
      }
      if (this.config.type === "scraper") {
        const rbx = await gplay.app({ appId: this.config.url });
        const updatedDate = new Date(rbx.updated);
        if (this.debug) {
          console.debug(
            `[${this.platform}] Versão obtida via scraper: ${rbx.version}`
          );
        }
        return {
          version: rbx.version,
          date: updatedDate.toISOString(),
        };
      }

      const response = await axios.get(this.config.url);
      if (this.debug) {
        console.debug(`[${this.platform}] Dados recebidos da API.`);
      }

      const data = response.data;
      switch (this.platform) {
        case "windows":
        case "mac":
          return {
            version: data.clientVersionUpload.trim(),
            date: new Date().toISOString(),
          };
        case "ios":
          return {
            version: data.results[0].version.trim(),
            date: data.results[0].currentVersionReleaseDate,
          };
        default:
          return "";
      }
    } catch (error) {
      if (this.debug) {
        console.debug(`[${this.platform}] Erro ao buscar versão:`, error);
      }
      throw error;
    }
  }

  async checkForUpdate(): Promise<void> {
    if (this.debug) {
      console.debug(`[${this.platform}] Checando por atualização...`);
    }
    const currentVersion = await this.fetchVersion();
    const versionStr =
      typeof currentVersion === "string"
        ? currentVersion
        : currentVersion.version;

    const history = this.readHistory();    if (history.length === 0 && versionStr.length > 0) {
      this.saveVersion(versionStr);
      versionEmitter.emit("versionChanged", {
        version: versionStr,
        oldVersion: null,
        date: new Date().toISOString(),
        type: "update",
        platform: this.platform as Platform,
      });
      if (this.debug) {
        console.debug(
          `[${this.platform}] Primeira versão adicionada e notificada: ${versionStr}`
        );
      }
      return;
    }

    // Encontra a posição da versão atual no histórico (se existir)
    const versionIndex = history.findIndex((v) => v.version === versionStr);
    const isFirstVersion = versionIndex === 0;

    if (versionIndex !== -1) {
      if (!isFirstVersion) {
        if (this.debug) {
          console.debug(
            `[${this.platform}] Revert detectado: versão ${versionStr} encontrada no índice ${versionIndex}`
          );
        }

        const revertedVersion = history.shift();
        if (this.debug) {
          console.debug(
            `[${this.platform}] Removendo versão revertida: ${revertedVersion?.version}`
          );
        }
        const revertEntry = history.splice(versionIndex - 1, 1)[0];
        if (revertEntry) {
          history.unshift(revertEntry);
        }

        const historyFilePath = path.join(
          this.versionsDir,
          `${this.platform}History.json`
        );
        fs.writeFileSync(historyFilePath, JSON.stringify(history, null, 2));        versionEmitter.emit("versionChanged", {
          version: versionStr,
          oldVersion: revertedVersion?.version ?? null,
          date: new Date().toISOString(),
          type: "revert",
          platform: this.platform as Platform,
        });
        if (this.debug) {
          console.debug(
            `[${this.platform}] Histórico reorganizado após revert`
          );
        }
      } else {
        if (this.debug) {
          console.debug(
            `[${this.platform}] Versão ${versionStr} já é a mais recente`
          );
        }
      }
    } else {      const oldVersion = history.length > 0 ? history[history.length - 1]?.version ?? null : null;
      this.saveVersion(versionStr);
      versionEmitter.emit("versionChanged", {
        version: versionStr,
        oldVersion: oldVersion,
        date: new Date().toISOString(),
        type: "update",
        platform: this.platform as Platform,
      });
      if (this.debug) {
        console.debug(
          `[${this.platform}] Nova versão detectada e notificada: ${versionStr} (versão anterior: ${oldVersion})`
        );
      }
    }
  }
}

export { VersionTracker, type Platform, type TrackerConfig };
