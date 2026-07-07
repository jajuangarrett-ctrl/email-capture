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
    const openCapture = () => new CaptureModal(this.app, this).open();

    this.addRibbonIcon("mail", "Capture email", openCapture);

    this.addCommand({
      id: "capture",
      name: "Capture email",
      callback: openCapture,
    });

    this.registerObsidianProtocolHandler("email-capture", openCapture);

    this.app.workspace.onLayoutReady(() => {
      this.recoverMissedAdvancedUriLaunch(openCapture);
    });

    this.addSettingTab(new EmailCaptureSettingTab(this.app, this));
  }

  private recoverMissedAdvancedUriLaunch(openCapture: () => void) {
    const advancedUri = (this.app as any).plugins?.getPlugin?.("obsidian-advanced-uri");
    if (advancedUri?.lastParameters?.commandid === `${this.manifest.id}:capture`) {
      setTimeout(openCapture, 250);
    }
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
