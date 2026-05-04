import { Plugin } from "obsidian";
import {
  EmailCaptureSettings,
  EmailCaptureSettingTab,
  DEFAULT_SETTINGS,
} from "./src/settings";
import { CaptureModal } from "./src/CaptureModal";

export default class EmailCapturePlugin extends Plugin {
  settings: EmailCaptureSettings = DEFAULT_SETTINGS;

  async onload() {
    await this.loadSettings();

    this.addRibbonIcon("mail", "Capture email", () => {
      new CaptureModal(this.app, this).open();
    });

    this.addCommand({
      id: "capture",
      name: "Capture email",
      callback: () => new CaptureModal(this.app, this).open(),
    });

    this.addSettingTab(new EmailCaptureSettingTab(this.app, this));
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
