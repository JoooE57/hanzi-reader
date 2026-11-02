// barcode-wallet engine v1.3.0; no personal card data
module.exports={version:"1.3.0",run:async function(CARDS){
function barcode(card) {
  // 固定為小工具圖片框的比例，避免等比例縮放使短號碼條碼變窄。
  const width=1160, height=260, quiet=10;
  const unit=width/(card.widths.reduce((a,b)=>a+b,0)+quiet*2);
  const ctx=new DrawContext();ctx.size=new Size(width,height);
  ctx.opaque=true;ctx.respectScreenScale=false;
  ctx.setFillColor(new Color('#ffffff'));ctx.fillRect(new Rect(0,0,width,height));
  ctx.setFillColor(new Color('#000000'));
  let x=quiet*unit;
  card.widths.forEach((n,i)=>{if(i%2===0)ctx.fillRect(new Rect(x,12,n*unit,height-24));x+=n*unit;});
  return ctx.getImage();
}
function widget(card) {
  const w=new ListWidget();w.refreshAfterDate=new Date(Date.now()+5*60*1000);w.backgroundColor=new Color('#ffffff');w.setPadding(12,12,12,12);
  const title=w.addText(card.name);title.font=Font.boldSystemFont(15);title.textColor=new Color(card.color);
  w.addSpacer(7);
  const code=w.addImage(barcode(card));code.resizable=true;code.applyFittingContentMode();code.centerAlignImage();code.imageSize=new Size(290,65);
  w.addSpacer(6);
  const number=w.addText(card.value);number.font=Font.semiboldMonospacedSystemFont(16);number.textColor=new Color('#000000');number.centerAlignText();number.minimumScaleFactor=0.7;number.lineLimit=1;
  w.url='scriptable:///run?scriptName='+encodeURIComponent(Script.name())+'&card='+card.id;
  return w;
}
async function showCard(card) {
  const ctx=new DrawContext();ctx.size=new Size(1200,650);ctx.opaque=true;ctx.respectScreenScale=false;
  ctx.setFillColor(new Color('#ffffff'));ctx.fillRect(new Rect(0,0,1200,650));
  ctx.setTextAlignedCenter();ctx.setTextColor(new Color(card.color));ctx.setFont(Font.boldSystemFont(45));ctx.drawTextInRect(card.name,new Rect(30,55,1140,70));
  ctx.drawImageInRect(barcode(card),new Rect(30,170,1140,300));
  ctx.setTextColor(new Color('#000000'));ctx.setFont(Font.semiboldMonospacedSystemFont(42));ctx.drawTextInRect(card.value,new Rect(30,510,1140,70));
  const previous=Device.screenBrightness();
  try{Device.setScreenBrightness(1);await QuickLook.present(ctx.getImage(),true);}finally{Device.setScreenBrightness(previous);}
}
async function main() {
  const requested=String(args.queryParameters.card||args.widgetParameter||'carrier').trim().toLowerCase();
  const aliases={'1':'carrier','2':'family','3':'openpoint','載具':'carrier','全家':'family'};
  const card=CARDS.find(c=>c.id===(aliases[requested]||requested));
  if(config.runsInWidget){
    if(card)Script.setWidget(widget(card));
    else {const w=new ListWidget();w.addText('請設定參數：carrier、family 或 openpoint');Script.setWidget(w);}
    return;
  }
  if(args.queryParameters.card&&card){await showCard(card);return;}
  const menu=new Alert();menu.title='我的條碼卡';menu.message='選擇卡片預覽。主畫面加入三個中型小工具，再疊在一起即可上下切換。';
  CARDS.forEach(c=>menu.addAction(c.name));menu.addAction('安裝說明');menu.addCancelAction('取消');
  const selected=await menu.presentSheet();
  if(selected>=0&&selected<CARDS.length){
    const action=new Alert();action.title=CARDS[selected].name;action.addAction('預覽中型小工具');action.addAction('放大條碼');action.addCancelAction('取消');
    const choice=await action.presentSheet();if(choice===0)await widget(CARDS[selected]).presentMedium();if(choice===1)await showCard(CARDS[selected]);
  }else if(selected===CARDS.length){
    const info=new Alert();info.title='主畫面設定';info.message='新增三個 Scriptable 中型小工具，Script 都選本腳本。Parameter 分別填 carrier、family、openpoint。When Interacting 選 Run Script。將三個小工具拖疊在一起，編輯堆疊並關閉智慧型輪替與小工具建議。使用原色／淺色外觀，避免條碼被染色。';info.addAction('知道了');await info.presentAlert();
  }
}
await main();

}};
