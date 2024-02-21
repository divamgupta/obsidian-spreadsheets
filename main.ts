import { App, Editor, MarkdownView, Notice, Plugin, WorkspaceLeaf } from 'obsidian';
import { SpreadsheetView, VIEW_TYPE_SPREADSHEET } from "./view"



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

	async onload() {

		const ribbonIconEl = this.addRibbonIcon('table', 'New Spreadsheet', (evt: MouseEvent) => {
			create_new_file(this.app, undefined, undefined);
		});


		let app = this.app;

		this.registerEvent(
			this.app.workspace.on("file-menu", (menu, file) => {
				// Jaedon's Fix
				// Check if the selected item is a directory or a file
				if (file.hasOwnProperty("children"))
				{
					menu.addItem((item) => {
						item.setTitle("New spreadsheet").setIcon("document").onClick(function(){
						   create_new_file(app, file.path, 0 )
						});
					  });
				}
			})
		  );

		this.registerView(
			VIEW_TYPE_SPREADSHEET,
			  (leaf: WorkspaceLeaf) => new SpreadsheetView(leaf)
		  );


		this.registerExtensions(["sheet"], VIEW_TYPE_SPREADSHEET);


	}

	onunload() {

	}

}


