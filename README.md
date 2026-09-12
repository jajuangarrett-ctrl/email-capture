# email-capture

## Live voice capture

Choose **Talk to capture** in the capture window. GPT-Live-1 fills visible fields and applies spoken corrections. Review the form and press its **Save** button to persist the capture; voice has no save operation. **Capture to FJG Vault** uses **Continue to Review** and does not save from its first screen. Existing recording and typing remain available. **Mute** pauses microphone input and **End voice** releases the microphone; closing the capture ends voice too. Audio and current capture fields are sent to OpenAI while connected.

Uses the plugin's saved OpenAI key or the existing FJG Objective Manager key. No keys are copied into releases. Touch controls support mobile layouts; update through BRAT on phones that do not sync plugin files. Physical phone microphone/playback verification remains necessary.

The shared implementation is maintained in obsidian-task-manager/apps/obsidian-plugin/src/capture-live and copied into each capture plugin's src/capture-live so each plugin works independently. Keep those copies synchronized when fixing the shared protocol or form tools.
