import * as vscode from 'vscode';
import * as fs from 'fs';

let statusBarItem: vscode.StatusBarItem;
let watchedFiles: string[] = [];

const enabledText = "$(check) Auto Reload";
const disabledText = "$(x) Auto Reload";
const defaultInterval = 200;

/**
 * Runs on activation of the extension
 */
export function activate(context: vscode.ExtensionContext) {

	// register events
	vscode.window.onDidChangeActiveTextEditor(updateStatusBarItem);
	vscode.workspace.onDidChangeConfiguration(configurationChanged);

	// register commands
	let toggleCommand = vscode.commands.registerCommand('auto-reload.toggle', toggleStatus);
	context.subscriptions.push(toggleCommand);

	// register UI elements
	statusBarItem = vscode.window.createStatusBarItem(
		vscode.StatusBarAlignment.Right,
		90
	);
	statusBarItem.command = "auto-reload.toggle";
	updateStatusBarItem(vscode.window.activeTextEditor);
}

/**
 * Runs on deactivation of the extension
 */
export function deactivate() {}

/**
 * Reads the configuration and
 * @returns the currently configured polling interval in ms
 */
function getConfiguredInterval() {
	const config = vscode.workspace.getConfiguration("auto-reload");
	return config.get<number>("interval") ?? defaultInterval;
}

/**
 * Updates the active file watchers with the new configuration
 */
function configurationChanged() {
	for (let file of watchedFiles){
		fs.unwatchFile(file);
	}

	watchedFiles.length = 0;
}

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
		let interval = getConfiguredInterval();
		fs.watchFile(currentFile, { interval: interval }, () => {});
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