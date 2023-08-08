import { App, Editor, MarkdownView, Notice, Plugin, PluginSettingTab, Setting, WorkspaceLeaf } from 'obsidian';
import { SpreadsheetView, VIEW_TYPE_SPREADSHEET } from "./view"


// Remember to rename these classes and interfaces!

interface SpreadsheetPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: SpreadsheetPluginSettings = {
	mySetting: 'default'
}



async function create_new_file(app, folder_path, file_no){


	
	if(folder_path){
		try {
			await app.vault.createFolder(folder_path);
		} catch (err) {
			console.log("issue in making folder");
			console.log(err);
		}
	}	
	

	let file_name = "Untitled.sheet"

	if(file_no){
		file_name = "Untitled"+ file_no +".sheet"
	}

	let file_path = file_name;
	if(folder_path){
		file_path = folder_path + "/" + file_name;
	}

	try {
		await app.vault.create(file_path, "");

		await app.workspace.getLeaf(true).setViewState({
			type: VIEW_TYPE_SPREADSHEET,
			active: true,
			state: { file: file_path }
		  });

		new Notice('Create spreadsheet at : ' + file_path);
	} catch (err) {
		const error = err;
   		if (error.message.includes("File already exists")) {
			return await create_new_file(app , folder_path , (file_no||0)+1 )
		}
	}
}


export default class SpreadsheetPlugin extends Plugin {
	settings: SpreadsheetPluginSettings;

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('table', 'New Spreadsheet', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			create_new_file(this.app);
			
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');


		let that = this;

		this.registerEvent(
			this.app.workspace.on("file-menu", (menu, file) => {
				menu.addItem((item) => {
				  item.setTitle("New spreadsheet").setIcon("document").onClick(function(){
					 create_new_file(that.app, file.path, 0 )
				  });
				});
			})
		  );



		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));



		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));


		this.registerView(
			VIEW_TYPE_SPREADSHEET,
			  (leaf: WorkspaceLeaf) => new SpreadsheetView(leaf)
		  );


		this.registerExtensions(["sheet"], VIEW_TYPE_SPREADSHEET);


	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}


class SampleSettingTab extends PluginSettingTab {
	plugin: SpreadsheetPlugin;

	constructor(app: App, plugin: SpreadsheetPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Setting')
			.setDesc('settings')
			.addText(text => text
				.setPlaceholder('...')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
