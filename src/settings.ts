import { App, PluginSettingTab, Setting } from "obsidian";
import type EmailCapturePlugin from "../main";

export interface EmailCaptureSettings {
  openaiApiKey: string;
  inboxFolderPath: string;
  showAnotherAfterSave: boolean;
  openSavedFileAfterSave: boolean;
  customAcronyms: string;
}

export const DEFAULT_SETTINGS: EmailCaptureSettings = {
  openaiApiKey: "",
  inboxFolderPath: "AI Team/Team_Inbox/Raw Email Drafts",
  showAnotherAfterSave: true,
  openSavedFileAfterSave: true,
  customAcronyms: "CalWORKs, VPSS, FJG",
};

export class EmailCaptureSettingTab extends PluginSettingTab {
  plugin: EmailCapturePlugin;

  constructor(app: App, plugin: EmailCapturePlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "Email Capture" });

    new Setting(containerEl)
      .setName("Raw email drafts folder path")
      .setDesc("Folder where each captured email draft is saved as its own file (relative to vault root).")
      .addText((t) =>
        t
          .setPlaceholder("AI Team/Team_Inbox/Raw Email Drafts")
          .setValue(this.plugin.settings.inboxFolderPath)
          .onChange(async (v) => {
            this.plugin.settings.inboxFolderPath = v.trim() || DEFAULT_SETTINGS.inboxFolderPath;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Show another after save")
      .setDesc("After saving an email, immediately reopen the capture modal.")
      .addToggle((t) =>
        t.setValue(this.plugin.settings.showAnotherAfterSave).onChange(async (v) => {
          this.plugin.settings.showAnotherAfterSave = v;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Open saved file after save")
      .setDesc("After saving an email draft, open the exact file that was created.")
      .addToggle((t) =>
        t.setValue(this.plugin.settings.openSavedFileAfterSave).onChange(async (v) => {
          this.plugin.settings.openSavedFileAfterSave = v;
          await this.plugin.saveSettings();
        })
      );

    containerEl.createEl("h3", { text: "OpenAI" });

    new Setting(containerEl)
      .setName("OpenAI API key")
      .setDesc("Used by Whisper for voice transcription AND by GPT-4o to draft captured emails on save. Required for both. Stored locally in plugin data.")
      .addText((t) => {
        t.inputEl.type = "password";
        t
          .setPlaceholder("sk-...")
          .setValue(this.plugin.settings.openaiApiKey)
          .onChange(async (v) => {
            this.plugin.settings.openaiApiKey = v.trim();
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("Custom acronyms")
      .setDesc("Comma-separated acronyms and proper nouns the drafting pass should preserve verbatim.")
      .addText((t) =>
        t
          .setPlaceholder("CalWORKs, VPSS, FJG")
          .setValue(this.plugin.settings.customAcronyms)
          .onChange(async (v) => {
            this.plugin.settings.customAcronyms = v;
            await this.plugin.saveSettings();
          })
      );
  }
}
