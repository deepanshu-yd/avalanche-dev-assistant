import * as vscode from "vscode";
import { postJson } from "./utils/http";

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand("avalancheAssistant.ask", async () => {
    const question = await vscode.window.showInputBox({
      title: "Avalanche: Ask",
      prompt: "Ask an Avalanche development question…",
      placeHolder: "e.g., How do I deploy a contract to Fuji?"
    });

    if (!question || !question.trim()) {
      vscode.window.showInformationMessage("No question provided.");
      return;
    }

    const config = vscode.workspace.getConfiguration();
    const serverUrl = config.get<string>("avalancheAssistant.serverUrl", "http://localhost:3000");

    const output = vscode.window.createOutputChannel("Avalanche Assistant");
    output.show(true);
    output.appendLine(`> Q: ${question}\n`);

    try {
      type AskResponse = { answer: string; sources: Array<{ title: string; url?: string }> };
      const data = await postJson<AskResponse>(`${serverUrl}/ask`, { question });

      output.appendLine(data.answer);
      if (data.sources?.length) {
        output.appendLine("\nSources:");
        for (const s of data.sources) {
          output.appendLine(`- ${s.title}${s.url ? ` (${s.url})` : ""}`);
        }
      }
    } catch (err: any) {
      vscode.window.showErrorMessage(`Request failed: ${err?.message || err}`);
      output.appendLine(`\n[Error] ${err?.message || String(err)}`);
      output.appendLine(`\nTIP: Ensure the server is running at ${serverUrl}.`);
    }
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {}
