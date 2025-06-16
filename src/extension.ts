import * as vscode from 'vscode';
import * as fs from 'fs';

let statusBarItem: vscode.StatusBarItem;
let watchedFiles: string[] = [];
let channel: vscode.OutputChannel;

const enabledText = "$(check) Auto Reload";
const disabledText = "$(x) Auto Reload";
const defaultInterval = 200;

/**
 * Runs on activation of the extension
 */
export function activate(context: vscode.ExtensionContext) {
	// create output channel
	channel = vscode.window.createOutputChannel('Auto Reload');
	channel.show(true);

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
	channel.appendLine("Configuration changed");

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
		channel.appendLine("Unwatch file: " + currentFile);

		fs.unwatchFile(currentFile);
		let index = watchedFiles.indexOf(currentFile);
		watchedFiles.splice(index, 1);
	}
	else if (fs.existsSync(currentFile))
	{
		let interval = getConfiguredInterval();

		channel.appendLine("Watch file: " + currentFile + " with interval: " + interval);

		fs.watchFile(currentFile, { interval: interval }, () => vscode.commands.executeCommand('workbench.action.files.revert'));
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
