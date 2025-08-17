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
    const serverUrl = config.get<string>("avalancheAssistant.serverUrl", "http://localhost:3001");

    // Create webview panel
    const panel = vscode.window.createWebviewPanel(
      'avalancheAssistant',
      'Avalanche Assistant',
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        retainContextWhenHidden: true
      }
    );

    // Show loading state
    panel.webview.html = getLoadingHtml(question);

    try {
      type AskResponse = {
        answer: string;
        sources: Array<{ title: string; url?: string; section?: string; similarity?: number }>;
        context?: Array<{ text: string; metadata?: any }>;
      };

      const data = await postJson<AskResponse>(`${serverUrl}/ask`, { question });

      // Show result in webview
      panel.webview.html = getResultHtml(question, data);

    } catch (err: any) {
      // Show error in webview
      panel.webview.html = getErrorHtml(question, err?.message || String(err), serverUrl);
      vscode.window.showErrorMessage(`Avalanche Assistant: ${err?.message || err}`);
    }
  });

  context.subscriptions.push(disposable);
}

function getLoadingHtml(question: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Avalanche Assistant</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                margin: 0;
                padding: 20px;
                background: var(--vscode-editor-background);
                color: var(--vscode-editor-foreground);
            }
            .container {
                max-width: 800px;
                margin: 0 auto;
            }
            .question {
                background: var(--vscode-textBlockQuote-background);
                border-left: 4px solid var(--vscode-textLink-foreground);
                padding: 15px;
                margin-bottom: 20px;
                border-radius: 4px;
            }
            .loading {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 20px 0;
                color: var(--vscode-textLink-foreground);
            }
            .spinner {
                width: 20px;
                height: 20px;
                border: 2px solid var(--vscode-textLink-foreground);
                border-top: 2px solid transparent;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .logo {
                font-size: 24px;
                font-weight: bold;
                color: var(--vscode-textLink-foreground);
                margin-bottom: 10px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">⛷️ Avalanche Assistant</div>
                <p>Powered by semantic search and AI</p>
            </div>

            <div class="question">
                <strong>Question:</strong> ${escapeHtml(question)}
            </div>

            <div class="loading">
                <div class="spinner"></div>
                <span>Searching documentation and generating answer...</span>
            </div>
        </div>
    </body>
    </html>
  `;
}

function getResultHtml(question: string, data: any): string {
  const sourcesHtml = data.sources?.length > 0 ? `
    <div class="sources">
      <details open>
        <summary><strong>📚 Sources (${data.sources.length})</strong></summary>
        <ul>
          ${data.sources.map((s: any) => `
            <li>
              <strong>${escapeHtml(s.title)}</strong>
              ${s.section ? `<br><small>Section: ${escapeHtml(s.section)}</small>` : ''}
              ${s.similarity ? `<br><small>Relevance: ${Math.round(s.similarity * 100)}%</small>` : ''}
              ${s.url ? `<br><a href="${escapeHtml(s.url)}" target="_blank">View Documentation</a>` : ''}
            </li>
          `).join('')}
        </ul>
      </details>
    </div>
  ` : '';

  const contextHtml = data.context?.length > 0 ? `
    <div class="context">
      <details>
        <summary><strong>🔍 Context Snippets (${data.context.length})</strong></summary>
        <div class="context-items">
          ${data.context.map((ctx: any, i: number) => `
            <div class="context-item">
              <div class="context-header">Snippet ${i + 1}</div>
              <div class="context-text">${escapeHtml(ctx.text.substring(0, 200))}${ctx.text.length > 200 ? '...' : ''}</div>
            </div>
          `).join('')}
        </div>
      </details>
    </div>
  ` : '';

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Avalanche Assistant</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                margin: 0;
                padding: 20px;
                background: var(--vscode-editor-background);
                color: var(--vscode-editor-foreground);
            }
            .container {
                max-width: 800px;
                margin: 0 auto;
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .logo {
                font-size: 24px;
                font-weight: bold;
                color: var(--vscode-textLink-foreground);
                margin-bottom: 10px;
            }
            .question {
                background: var(--vscode-textBlockQuote-background);
                border-left: 4px solid var(--vscode-textLink-foreground);
                padding: 15px;
                margin-bottom: 20px;
                border-radius: 4px;
            }
            .answer {
                background: var(--vscode-editor-background);
                border: 1px solid var(--vscode-panel-border);
                padding: 20px;
                margin-bottom: 20px;
                border-radius: 8px;
                white-space: pre-wrap;
            }
            .sources {
                background: var(--vscode-textBlockQuote-background);
                border: 1px solid var(--vscode-panel-border);
                padding: 15px;
                margin-bottom: 15px;
                border-radius: 4px;
            }
            .context {
                background: var(--vscode-input-background);
                border: 1px solid var(--vscode-panel-border);
                padding: 15px;
                border-radius: 4px;
            }
            .context-items {
                margin-top: 10px;
            }
            .context-item {
                background: var(--vscode-editor-background);
                border: 1px solid var(--vscode-panel-border);
                padding: 10px;
                margin-bottom: 10px;
                border-radius: 4px;
            }
            .context-header {
                font-weight: bold;
                color: var(--vscode-textLink-foreground);
                margin-bottom: 5px;
                font-size: 14px;
            }
            .context-text {
                font-size: 13px;
                color: var(--vscode-descriptionForeground);
                font-family: var(--vscode-editor-font-family);
            }
            details {
                cursor: pointer;
            }
            summary {
                padding: 5px 0;
                color: var(--vscode-textLink-foreground);
            }
            summary:hover {
                color: var(--vscode-textLink-activeForeground);
            }
            ul {
                margin: 10px 0;
                padding-left: 20px;
            }
            li {
                margin-bottom: 10px;
            }
            a {
                color: var(--vscode-textLink-foreground);
                text-decoration: none;
            }
            a:hover {
                color: var(--vscode-textLink-activeForeground);
                text-decoration: underline;
            }
            small {
                color: var(--vscode-descriptionForeground);
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">⛷️ Avalanche Assistant</div>
                <p>Powered by semantic search and AI</p>
            </div>

            <div class="question">
                <strong>Question:</strong> ${escapeHtml(question)}
            </div>

            <div class="answer">
${escapeHtml(data.answer || 'No answer received.')}
            </div>

            ${sourcesHtml}
            ${contextHtml}
        </div>
    </body>
    </html>
  `;
}

function getErrorHtml(question: string, error: string, serverUrl: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Avalanche Assistant - Error</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                margin: 0;
                padding: 20px;
                background: var(--vscode-editor-background);
                color: var(--vscode-editor-foreground);
            }
            .container {
                max-width: 800px;
                margin: 0 auto;
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .logo {
                font-size: 24px;
                font-weight: bold;
                color: var(--vscode-textLink-foreground);
                margin-bottom: 10px;
            }
            .question {
                background: var(--vscode-textBlockQuote-background);
                border-left: 4px solid var(--vscode-textLink-foreground);
                padding: 15px;
                margin-bottom: 20px;
                border-radius: 4px;
            }
            .error {
                background: var(--vscode-inputValidation-errorBackground);
                border: 1px solid var(--vscode-inputValidation-errorBorder);
                padding: 20px;
                margin-bottom: 20px;
                border-radius: 8px;
                color: var(--vscode-errorForeground);
            }
            .tips {
                background: var(--vscode-textBlockQuote-background);
                padding: 15px;
                border-radius: 4px;
                border-left: 4px solid var(--vscode-notificationsInfoIcon-foreground);
            }
            .tips h4 {
                margin-top: 0;
                color: var(--vscode-notificationsInfoIcon-foreground);
            }
            code {
                background: var(--vscode-textCodeBlock-background);
                padding: 2px 6px;
                border-radius: 3px;
                font-family: var(--vscode-editor-font-family);
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">⛷️ Avalanche Assistant</div>
                <p>Powered by semantic search and AI</p>
            </div>

            <div class="question">
                <strong>Question:</strong> ${escapeHtml(question)}
            </div>

            <div class="error">
                <strong>❌ Error:</strong> ${escapeHtml(error)}
            </div>

            <div class="tips">
                <h4>💡 Troubleshooting Tips:</h4>
                <ul>
                    <li>Ensure the server is running at <code>${escapeHtml(serverUrl)}</code></li>
                    <li>Check if your Gemini API key is configured and has quota remaining</li>
                    <li>Try running: <code>cd server && npm run dev</code></li>
                    <li>Verify the server port in VS Code settings (Avalanche Assistant: Server URL)</li>
                </ul>
            </div>
        </div>
    </body>
    </html>
  `;
}

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function deactivate() {}
