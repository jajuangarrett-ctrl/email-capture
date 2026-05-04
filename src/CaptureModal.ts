import { App, ButtonComponent, Modal, Notice, Setting } from "obsidian";
import { saveEmail } from "./append";
import {
  copyEdit,
  startRecording,
  transcribeWhisper,
  type VoiceRecorder,
} from "./transcribe";
import type EmailCapturePlugin from "../main";

export class CaptureModal extends Modal {
  private plugin: EmailCapturePlugin;
  private text = "";

  private textArea: HTMLTextAreaElement | null = null;
  private recordButton: ButtonComponent | null = null;
  private recorder: VoiceRecorder | null = null;
  private recording = false;
  private busy = false;

  constructor(app: App, plugin: EmailCapturePlugin) {
    super(app);
    this.plugin = plugin;
  }

  async onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: "Capture email" });

    new Setting(contentEl)
      .setName("Email")
      .setDesc("Tap Record to dictate, or type below. Copy-edit runs automatically when both API keys are set; otherwise the raw text is saved as-is.")
      .addTextArea((t) => {
        this.textArea = t.inputEl;
        t.inputEl.rows = 6;
        t.inputEl.style.width = "100%";
        t.onChange((v) => {
          this.text = v;
        });
      });

    new Setting(contentEl)
      .setName("Voice capture")
      .addButton((b) => {
        this.recordButton = b;
        b.setButtonText("Record").onClick(() => this.toggleRecord());
      });

    new Setting(contentEl)
      .addButton((b) =>
        b
          .setButtonText("Save")
          .setCta()
          .onClick(() => this.save(false))
      )
      .addButton((b) =>
        b.setButtonText("Save & capture another").onClick(() => this.save(true))
      );

    setTimeout(() => this.textArea?.focus(), 0);
  }

  private async toggleRecord() {
    if (this.busy || !this.recordButton) return;

    if (!this.recording) {
      if (!this.plugin.settings.openaiApiKey) {
        new Notice("Add your OpenAI API key in plugin settings before recording.");
        return;
      }
      try {
        this.recorder = await startRecording();
        this.recording = true;
        this.recordButton.setButtonText("Stop");
        this.recordButton.setWarning();
      } catch (e) {
        new Notice(`Microphone error: ${e instanceof Error ? e.message : String(e)}`);
      }
      return;
    }

    this.recording = false;
    this.busy = true;
    this.recordButton.setDisabled(true);
    this.recordButton.removeCta();
    this.recordButton.setButtonText("Transcribing...");

    try {
      const audio = await this.recorder!.stop();
      let transcript = await transcribeWhisper(
        audio,
        this.plugin.settings.openaiApiKey
      );

      if (this.plugin.settings.anthropicApiKey && transcript) {
        this.recordButton.setButtonText("Copy-editing...");
        transcript = await copyEdit(
          transcript,
          this.plugin.settings.anthropicApiKey,
          { acronyms: this.plugin.settings.customAcronyms }
        );
      }

      this.text = mergeTranscript(this.text, transcript);
      if (this.textArea) {
        this.textArea.value = this.text;
        this.textArea.focus();
      }
    } catch (e) {
      new Notice(`Voice capture failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      this.busy = false;
      this.recorder = null;
      if (this.recordButton) {
        this.recordButton.setDisabled(false);
        this.recordButton.setButtonText("Record");
      }
    }
  }

  private async save(forceAnother: boolean) {
    if (this.busy) {
      new Notice("Voice capture still running.");
      return;
    }
    const raw = this.text.trim();
    if (!raw) {
      new Notice("Add some text before saving.");
      return;
    }

    let finalText = raw;
    if (this.plugin.settings.anthropicApiKey) {
      try {
        finalText = await copyEdit(
          raw,
          this.plugin.settings.anthropicApiKey,
          { acronyms: this.plugin.settings.customAcronyms }
        );
      } catch (e) {
        new Notice(`Copy-edit failed, saving raw text: ${e instanceof Error ? e.message : String(e)}`);
        finalText = raw;
      }
    }

    let savedPath: string;
    try {
      savedPath = await saveEmail(
        this.app,
        this.plugin.settings.inboxFolderPath,
        { text: finalText }
      );
    } catch (e) {
      new Notice(`Save failed: ${e instanceof Error ? e.message : String(e)}`);
      return;
    }

    new Notice(`Saved ${savedPath}`);

    const reopen = forceAnother || this.plugin.settings.showAnotherAfterSave;
    this.close();
    if (reopen) {
      setTimeout(() => new CaptureModal(this.app, this.plugin).open(), 200);
    }
  }

  onClose() {
    if (this.recorder) {
      this.recorder.cancel();
      this.recorder = null;
    }
    this.contentEl.empty();
  }
}

function mergeTranscript(existing: string, addition: string): string {
  const a = existing.trim();
  const b = addition.trim();
  if (!a) return b;
  if (!b) return a;
  return `${a} ${b}`;
}
