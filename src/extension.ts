import * as vscode from 'vscode';
import * as fs from 'fs';

let statusBarItem: vscode.StatusBarItem;
let watchedFiles: string[] = [];

let enabledText = "$(check) Auto Reload";
let disabledText = "$(x) Auto Reload";

/**
 * Runs on activation of the extension
 */
export function activate(context: vscode.ExtensionContext) {

	let disposable = vscode.commands.registerCommand('auto-reload.toggle', toggleStatus);
	vscode.window.onDidChangeActiveTextEditor(updateStatusBarItem);

	statusBarItem = vscode.window.createStatusBarItem(
		vscode.StatusBarAlignment.Right,
		90
	);
	statusBarItem.command = "auto-reload.toggle";
	updateStatusBarItem(vscode.window.activeTextEditor);

	context.subscriptions.push(disposable);
}

/**
 * Runs on deactivation of the extension
 */
export function deactivate() {}

/**
 * Enables or disables watching the file of the current editor
 */
function toggleStatus() {
	if (!vscode.window.activeTextEditor) { return; }

	let currentFile = vscode.window.activeTextEditor.document.uri.fsPath;
	if (watchedFiles.includes(currentFile))
	{
		fs.unwatchFile(currentFile);
		let index = watchedFiles.indexOf(currentFile);
		watchedFiles.splice(index, 1);
	}
	else if (fs.existsSync(currentFile))
	{
		fs.watchFile(currentFile, { interval: 200 }, () => {});
		watchedFiles.push(currentFile);
	}

	updateStatusBarItem(vscode.window.activeTextEditor);
}

/**
 * Updates the visibility and text of the status bar item
 */
function updateStatusBarItem(activeEditor: vscode.TextEditor | undefined)
{
	if (activeEditor && activeEditor.document.uri.scheme === "file")
	{
		let enabled = watchedFiles.includes(activeEditor.document.uri.fsPath);
		statusBarItem.text = enabled ? enabledText : disabledText;
		statusBarItem.show();
	}
	else
	{
		statusBarItem.hide();
	}
}