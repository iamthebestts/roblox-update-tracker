import { EventEmitter } from "events"

interface Events {
  versionChanged: {
    version: string,
    oldVersion: string | null,
    date: string, // ISO
    type: "update" | "revert",
    platform: "windows" | "mac" | "ios" | "android";
  }
}

class VersionEmitter extends EventEmitter {
  emit<K extends keyof Events>(event: K, payload: Events[K]): boolean {
    return super.emit(event, payload)
  }

  on<K extends keyof Events>(event: K, listener: (payload: Events[K]) => void): this  {
    return super.on(event, listener)
  }
}

export const versionEmitter = new VersionEmitter()