import { App, ButtonComponent, Modal, Notice, Setting, TFile } from "obsidian";
import { saveEmail } from "./append";
import {
  draftEmail,
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
  private saveButton: ButtonComponent | null = null;
  private saveAnotherButton: ButtonComponent | null = null;
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
      .setName("Email gist")
      .setDesc("Tap Record to dictate, or type below. On Save, GPT-4o drafts the email per the standard format (subject line, three paragraphs, Best regards / Franklin sign-off) and writes the drafted email to AI Team/Team_Inbox. Requires OpenAI API key.")
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
      .addButton((b) => {
        this.saveButton = b;
        b.setButtonText("Save")
          .setCta()
          .onClick(() => this.save(false));
      })
      .addButton((b) => {
        this.saveAnotherButton = b;
        b.setButtonText("Save & capture another").onClick(() => this.save(true));
      });

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
      const transcript = await transcribeWhisper(
        audio,
        this.plugin.settings.openaiApiKey
      );

      if (!transcript.trim()) {
        new Notice(
          "Voice capture returned empty. Check microphone permissions and try again.",
          8000
        );
      } else {
        this.text = mergeTranscript(this.text, transcript);
        if (this.textArea) {
          this.textArea.value = this.text;
          this.textArea.focus();
        }
      }
    } catch (e) {
      new Notice(`Voice capture failed: ${e instanceof Error ? e.message : String(e)}`, 8000);
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
      new Notice("Voice capture still running.", 6000);
      return;
    }
    // Read directly from the DOM so a missed onChange / paste-race doesn't
    // silently feed an empty string to GPT-4o, which then hallucinates a
    // generic Dean-flavored email from the system prompt context alone.
    const liveValue = (this.textArea?.value ?? "").trim();
    const cachedValue = this.text.trim();
    const raw = liveValue || cachedValue;
    if (!raw) {
      // Make this loud and keep the modal open so the Dean can actually see
      // the failure instead of the modal silently closing on mobile.
      new Notice(
        "Nothing to save — the textarea is empty. Dictate or type your gist, then tap Save.",
        8000
      );
      this.textArea?.focus();
      return;
    }
    // Sync the cache so any downstream code (and a re-Save) stays consistent.
    this.text = raw;

    this.busy = true;
    this.setSaveButtonsDisabled(true);
    this.saveButton?.setButtonText("Drafting...");

    let finalText = raw;
    if (this.plugin.settings.openaiApiKey) {
      try {
        finalText = await draftEmail(
          raw,
          this.plugin.settings.openaiApiKey,
          { acronyms: this.plugin.settings.customAcronyms }
        );
      } catch (e) {
        new Notice(`Drafting failed, saving raw text: ${e instanceof Error ? e.message : String(e)}`, 8000);
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
      new Notice(`Save failed: ${e instanceof Error ? e.message : String(e)}`, 8000);
      this.busy = false;
      this.setSaveButtonsDisabled(false);
      this.saveButton?.setButtonText("Save");
      return;
    }

    this.busy = false;
    new Notice(`Saved ${savedPath}`);

    const reopen = forceAnother || this.plugin.settings.showAnotherAfterSave;
    this.close();
    if (this.plugin.settings.openSavedFileAfterSave) {
      await this.openSavedFile(savedPath);
    }
    if (reopen) {
      setTimeout(() => new CaptureModal(this.app, this.plugin).open(), 200);
    }
  }

  private async openSavedFile(path: string): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(path);
    if (!(file instanceof TFile)) return;
    await this.app.workspace.getLeaf(false).openFile(file);
  }

  private setSaveButtonsDisabled(disabled: boolean) {
    this.saveButton?.setDisabled(disabled);
    this.saveAnotherButton?.setDisabled(disabled);
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
