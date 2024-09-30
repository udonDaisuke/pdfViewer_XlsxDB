// XLSXで取得したデータを処理するクラス
class XLSXdata{
  constructor(table){
    this.data = table
    this.length = table.length
    return this
  }

  // get data as 1D array by key
  raw(key="none"){
    let filtered = []
    if(typeof key === 'string'){
      this.data.forEach(element => {
        filtered.push(element[key] ?? null)
      });
      return filtered
    }else{return false}
  }

  // get reducted data as object by array of keys
  raws(keys="none"){
    let filtered = []
    if(typeof keys === 'object'){
      this.data.forEach(element => {
        let line = {} 
        keys.forEach(key=>{
          line[key] = element[key] ?? null
        })
        filtered.push(line)
      });
      return filtered
    }else{return false}
  }

  // get index list as filtered by a condition 
  findIndex(condition=""){
    const regex1 = /\S\s+/g
    const regex2 = /\s+\S/g
    condition.replace(regex1," ").replace(regex2," ")
    const condition_elements = condition.split(" ")
    const key = condition_elements[0]
    const operator = condition_elements[1]
    const value = condition_elements[2]
    let index_list = []

    if(condition_elements.length !== 3 || 
      !["=","!=",">","<",">=","<="].includes(operator)){return false}
    let filtered_item = this.raw(key)
    for (let index = 0; index < filtered_item .length; index++) {
      if(this.#evaluate(filtered_item[index],operator,value)){
        index_list.push(index)    
      }
    }
    return index_list
  }

  // get filtered data by a condition 
  findLines(condition=""){
    let index_list = this.findIndex(condition)
    let filtered_lines = []
    index_list.forEach(index=>{
      filtered_lines.push(this.data[index])
    })
    return filtered_lines

  }

  // evaluate condition
  #evaluate(key,operator,value,always_lwr_case=true){
    if(always_lwr_case){key=key.toString().toLowerCase();value=value.toLowerCase()}
    switch(operator){
      case "=":
        return key == value
      case "!=":
        return key !== value
      case ">":
        return key > value
      case ">=":
        return key >= value
      case "<":
        return key < value
      case "<=":
        return key <= value
      default:
        throw new Error('invalid operator')
    }
  }
}
// ==============================================================


function xlsxLoading(filename,sheetname){
  return fetch(`${filename}`).then(response=>response.arrayBuffer())
  .then(data=>{
    let file = new Uint8Array(data)
    let opts = {
      type: 'array',
    }
    const book = XLSX.read(file,opts)
    let sheet = book.Sheets[sheetname]

    let table = XLSX.utils.sheet_to_json(sheet);
    let element = document.querySelector(".list")
    element.innerHTML = XLSX.utils.sheet_to_html(sheet)
    return table
  })
}

function injectPdf(selector="",srcfolder="./",files=[], index =0, index_end=999,adddata={}){
  const element = document.querySelector(selector)
  let filesString,adddataString
  filesString = JSON.stringify(files) ;
  adddataString = JSON.stringify(adddata)
  // console.log(filesString)
  let prev_index = index-1>=0 ? index-1 : 0
  let next_index = index+1<=index_end ? index+1 : index_end
  let info_text1 = `Section: ${adddata.section_info[index]} `
  let info_text2 = `<p>#${adddata.tag_info[index].split("#").filter(Boolean).join("</p><p>#")}</p>`
  let note = adddata.note

  const iframe = `
    <li style="display:flex;flex-direction:column; position:relative">
      <iframe id = "inject_${index}" class = "pageview" src="${srcfolder}/${files[index]}#page=1&toolbar=0&view=FitV" width="100%" height="100%" ></iframe>
      <div class="section-info" style="display:flex; position:absolute;z-index:9999;top:25px;right:30px"><p class="info1">${info_text1}</p><div class="info2">${info_text2}</div></div>
      <div class="overlay" style="display:flex;width:110%;height:105%;position:absolute;z-index:998"></div>
      <div class="btn-group" style="display:flex; position:absolute ; z-index:999">
        <button title="Back to 1st slide" onclick='injectPdf("${selector}","${srcfolder}",JSON.parse(\`${filesString.replace(/"/g, '\\"')}\`),0,${index_end},JSON.parse(\`${adddataString.replace(/"/g, '\\"')}\`))'>
          <p> << </p>
        </button>
        <button title="previous slide" onclick='injectPdf("${selector}","${srcfolder}",JSON.parse(\`${filesString.replace(/"/g, '\\"')}\`),${prev_index},${index_end},JSON.parse(\`${adddataString.replace(/"/g, '\\"')}\`))'>
          <p> < </p>
        </button>
        <button title="next slide" onclick='injectPdf("${selector}","${srcfolder}",JSON.parse(\`${filesString.replace(/"/g, '\\"')}\`),${next_index},${index_end},JSON.parse(\`${adddataString.replace(/"/g, '\\"')}\`))'>
          <p> > </p>
        </button>
        <button title="Go to the final slide" onclick='injectPdf("${selector}","${srcfolder}",JSON.parse(\`${filesString.replace(/"/g, '\\"')}\`),${index_end},${index_end},JSON.parse(\`${adddataString.replace(/"/g, '\\"')}\`))'>
          <p> >> </p>
        </button>
      </div>
      <div class="note" ><p>${note[index]}</p></div>
    </li>
  `
  // console.log("iftest::",iframe)
  element.innerHTML=iframe
  

}

function addPreloadLink(href) {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = 'fetch';
  link.type = 'application/pdf';
  document.head.appendChild(link);
}

function preloadResources(srcfolder="",resources, interval = 1000) {
  let index = 0;
  const preloadNext = () => {
      if (index < resources.length) {
          addPreloadLink(srcfolder+"/"+resources[index]);
          index++;
          setTimeout(preloadNext, interval);
      }
  };
  preloadNext();
}

const srcfolder = "./sample_comp2"
const filename = './test.xlsx'
const sheetname = 'Sheet1'
xlsxLoading(filename,sheetname).then(table=>{
  let xlsx = new XLSXdata(table)
  let files = xlsx.raw("file")
  let section_info = xlsx.raw("section")
  let tag_info = xlsx.raw("tag")
  let note = xlsx.raw("note")

  let add_data = {section_info,tag_info,note}
  // preloadResources("./sample",files, 1000)
  let id_with_flag = xlsx.findIndex("flag = TRUE")
  // console.log("files:",files)
  // console.log("is_with_flag:",id_with_flag)
  injectPdf(".list",srcfolder,files,0,files.length-1,add_data)
  // console.log("test::::",JSON.stringify(array))
  // console.log("test::::",JSON.parse(JSON.stringify(array)))
})