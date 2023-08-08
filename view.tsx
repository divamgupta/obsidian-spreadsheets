import { TextFileView } from "obsidian";

export const VIEW_TYPE_SPREADSHEET = "spreadsheet-view";



import { ItemView, WorkspaceLeaf } from "obsidian";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { createRoot } from "react-dom/client";

import { Workbook } from "@fortune-sheet/react";
import "@fortune-sheet/react/dist/index.css"

function set_ctx_pos(el) {
  let rect=el.getBoundingClientRect();
  let p =  {x:rect.left,y:rect.top};

  let r = document.querySelector(':root');
  if(p.x){
    r.style.setProperty('--ctx_menu_x',  -1*p.x + "px" );
    r.style.setProperty('--ctx_menu_y', (-1*p.y + 50 )+ "px"  );
  }
  
  // console.log("pos is set to ")
  // console.log( -1*p.x + "px")
  // console.log(   (-1*p.y + 50 )+ "px"  )

}


function transformData(responseData) {
  return responseData.map((sheet) => ({
    id: sheet.id,
    name: sheet.name,
    plugin: "divams_spreadsheets_for_obsidian",
    config: sheet.config,
    celldata: (sheet.data || []).flatMap((row, rIndex) =>
      row
        .map((cell, cIndex) => {
          if (cell !== null) {
            return {
              r: rIndex,
              c: cIndex,
              v: cell,
            };
          }

          return undefined;
        })
        .filter((cell) => cell !== undefined),
    ),
    calcChain: (sheet.calcChain || []).map((item) => {
      const relatedCell = sheet.data[item.r][item.c];
      return {
        r: item.r,
        c: item.c,
        id: item.id,
        v: relatedCell !== null ? relatedCell : null,
      };
    }),
  }));
}

function handleData(receivedData) {
  const newData = transformData(receivedData);

  if (receivedData.length > 0 && receivedData[0].calcChain) {
    newData[0].calcChain = receivedData[0].calcChain;
  }

  return newData;

}



export class SpreadsheetView extends TextFileView {
  table_element: HTMLElement;
  spreadsheet_container : HTMLElement;
  sheet_data_in : any;
  sheet_data_out : any;
  root : any;
  is_save_timer_wait : any;
  resize_observer : any;

  getViewData() {
    if(this.sheet_data_out){
      let r =  JSON.stringify( handleData(this.sheet_data_out) , null,  4 ) ;
      console.log("saved!!")
      return r;
    } else {
      return ""
    }
  }

  // If clear is set, then it means we're opening a completely different file.
  setViewData(data: string, clear: boolean) {

    if(data.trim()){
      this.sheet_data_in = JSON.parse(data)
    } else {
      this.sheet_data_in = [{ name: "Sheet1" }];
    }

    this.refresh();
  }

  refresh() {
    this.table_element.empty();

    let spreadsheet_container = this.table_element.createEl("div");
    spreadsheet_container.setAttribute("style","background-color:black; width:calc(100% - 15px) ; height: calc( 100vh - 130px); color:black ; ")
    // add filter: invert(1); for dark mode #TODO: make a button in settings page

    this.resize_observer = new ResizeObserver(function(){
        window.dispatchEvent(new Event('resize'));
        set_ctx_pos(spreadsheet_container)
    }).observe(spreadsheet_container)

    // 
    this.spreadsheet_container = spreadsheet_container; 
    let that = this;    

    const settings = {
      data: this.sheet_data_in, // sheet data
      onChange: (data:any) => { that.sheet_data_out = data;  that.maybe_save_data()}, // onChange event
    }

    this.root = createRoot(spreadsheet_container);
    this.root.render(
        <Workbook {...settings} />
    );

      
  }

  maybe_save_data(){
    let that = this;

    if(that.is_save_timer_wait)
      return;

    that.is_save_timer_wait = true;
     setTimeout(function(){
        
         that.requestSave();
         that.is_save_timer_wait = false;
     } , 4000 )
  }

  clear() {
  }

  getViewType() {
    return VIEW_TYPE_SPREADSHEET;
  }

  async onOpen() {
    this.table_element = this.contentEl.createEl("div");
  }

  async onClose() {

    if(this.resize_observer){
      this.resize_observer.disconnect()
    }
  
    this.requestSave();
    
    if(this.root)
      this.root.unmount()

    this.contentEl.empty();
  }
}