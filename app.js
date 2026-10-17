const $=id=>document.getElementById(id);
const canvas=$('canvas'),ctx=canvas.getContext('2d');
let strokes=[],active=null,pointer=null,worker,ready=false,version=0,timer,loadTimer,lookupTimer,dictionaryPromise,selection=0;
let history=[];
try{const saved=JSON.parse(localStorage.getItem('hanzi-recent')||'[]');if(Array.isArray(saved))history=saved.filter(c=>typeof c==='string'&&[...c].length===1).slice(0,20);}catch{}
function status(message,error=false){$('status').textContent=message;$('status').classList.toggle('error',error);}
function fail(message){ready=false;clearTimeout(loadTimer);clearTimeout(lookupTimer);worker?.terminate();status(message,true);$('retry').hidden=false;}
function init(){worker?.terminate();clearTimeout(loadTimer);clearTimeout(lookupTimer);ready=false;version++;$('retry').hidden=true;status('正在載入辨識核心…');
  try{worker=new Worker(new URL('./worker.js',import.meta.url));
  worker.onerror=()=>fail('辨識核心啟動失敗，請檢查連線後重試。');
  worker.onmessage=({data})=>{
    if(data.type==='ready'){clearTimeout(loadTimer);ready=true;status('辨識已就緒 · 寫完會自動找字');schedule();}
    else if(data.type==='error'){if(data.id===undefined||data.id===version)fail('辨識失敗，請重新載入核心。');}
    else if(data.type==='result'&&data.id===version){clearTimeout(lookupTimer);renderCandidates(data.matches);status(data.matches.length?'找到候選字，點一下查看讀音。':'沒有找到相近的字，試試依筆順重寫。');}
  };loadTimer=setTimeout(()=>fail('核心載入逾時，請檢查連線後重試。'),30000);worker.postMessage({type:'init'});
  }catch{fail('此瀏覽器無法啟動辨識，請使用新版 Safari 或 Chrome。');}
}
function point(e){const r=canvas.getBoundingClientRect();return [Math.max(0,Math.min(640,(e.clientX-r.left)/r.width*640)),Math.max(0,Math.min(640,(e.clientY-r.top)/r.height*640))];}
function redraw(){ctx.clearRect(0,0,640,640);ctx.strokeStyle='#2d4337';ctx.fillStyle='#2d4337';ctx.lineWidth=11;ctx.lineCap='round';ctx.lineJoin='round';for(const stroke of [...strokes,...(active?[active]:[])]){if(!stroke.length)continue;ctx.beginPath();ctx.moveTo(...stroke[0]);for(const p of stroke.slice(1))ctx.lineTo(...p);ctx.stroke();if(stroke.length===1){ctx.beginPath();ctx.arc(...stroke[0],5.5,0,Math.PI*2);ctx.fill();}}$('hint').hidden=!!(strokes.length||active);$('stroke-count').textContent=`${strokes.length} 筆`;$('undo').disabled=$('clear').disabled=!strokes.length;}
function invalidate(){version++;clearTimeout(timer);clearTimeout(lookupTimer);$('candidates').replaceChildren();}
canvas.addEventListener('pointerdown',e=>{if(pointer!==null||e.button!==0)return;e.preventDefault();pointer=e.pointerId;canvas.setPointerCapture(pointer);invalidate();active=[point(e)];redraw();});
canvas.addEventListener('pointermove',e=>{if(e.pointerId!==pointer||!active)return;const p=point(e),last=active.at(-1);if(Math.hypot(p[0]-last[0],p[1]-last[1])>2){active.push(p);redraw();}});
function finish(e,cancel=false){if(e.pointerId!==pointer)return;if(active&&!cancel){active.push(point(e));strokes.push(active);}active=null;pointer=null;invalidate();redraw();schedule();}
canvas.addEventListener('pointerup',e=>finish(e));canvas.addEventListener('pointercancel',e=>finish(e,true));canvas.addEventListener('lostpointercapture',e=>{if(pointer!==null)finish(e,true);});
function schedule(){clearTimeout(timer);if(!strokes.length){$('candidates').innerHTML='<p class="empty">寫完後，候選字會出現在這裡。</p>';if(ready)status('辨識已就緒 · 寫完會自動找字');return;}if(!ready)return;const id=version;timer=setTimeout(()=>{status('正在辨識…');lookupTimer=setTimeout(()=>fail('辨識逾時，請重新載入核心。'),15000);worker.postMessage({type:'lookup',id,strokes,limit:10});},350);}
$('undo').onclick=()=>{strokes.pop();invalidate();redraw();schedule();};$('clear').onclick=()=>{strokes=[];invalidate();redraw();schedule();};$('retry').onclick=init;
function renderCandidates(matches){$('candidates').replaceChildren();for(const {hanzi} of matches){const b=document.createElement('button');b.textContent=hanzi;b.setAttribute('aria-label',`查詢「${hanzi}」`);b.onclick=()=>{for(const c of $('candidates').children){c.classList.toggle('selected',c===b);c.setAttribute('aria-pressed',String(c===b));}showCharacter(hanzi);};$('candidates').append(b);}}
function dictionary(){if(!dictionaryPromise)dictionaryPromise=fetch(new URL('./data/dictionary.json',import.meta.url)).then(r=>{if(!r.ok)throw new Error('dictionary');return r.json();}).catch(e=>{dictionaryPromise=null;throw e;});return dictionaryPromise;}
function el(tag,text,className){const n=document.createElement(tag);n.textContent=text;if(className)n.className=className;return n;}
async function showCharacter(char){const token=++selection;$('result').replaceChildren(el('p','正在查詢讀音…'));try{const dict=await dictionary();if(token!==selection)return;const result=$('result');result.replaceChildren();const head=el('div','','char-head');head.append(el('span',char,'big-char'));const speak=el('button','▶ 聽發音');speak.id='speak';speak.onclick=()=>pronounce(char);head.append(speak);result.append(head);const readings=dict[char];
    if(!readings?.length)result.append(el('p','字典尚未收錄這個字的讀音與解釋。可嘗試其他候選字。','muted'));
    for(const reading of readings||[]){const row=el('div','','pronunciation');row.append(el('span',reading.bopomofo||'未提供注音','zhuyin'),el('span',reading.pinyin||'未提供拼音','pinyin'));result.append(row);const list=el('ol','','definitions');for(const def of reading.definitions.slice(0,2))list.append(el('li',def));result.append(list);}
    result.append(el('p','多音字請依詞語與上下文判斷；裝置朗讀可能選用其中一個讀音。','muted'));history=[char,...history.filter(c=>c!==char)].slice(0,20);saveHistory();renderHistory();
  }catch{if(token!==selection)return;const msg=el('p','字典載入失敗，請檢查連線後再試。');const retry=el('button','重試查字');retry.onclick=()=>showCharacter(char);$('result').replaceChildren(msg,retry);}}
function pronounce(char){if(!('speechSynthesis'in window)){status('此瀏覽器不支援朗讀。',true);return;}speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(char);u.lang='zh-TW';u.rate=.75;const voices=speechSynthesis.getVoices();const v=voices.find(v=>/^zh[-_]TW$/i.test(v.lang))||voices.find(v=>/zh.*(TW|Hant)/i.test(v.lang));if(v)u.voice=v;u.onerror=e=>{if(e.error!=='interrupted'&&e.error!=='canceled')status('發音失敗，請確認裝置已安裝中文語音。',true);};speechSynthesis.speak(u);}
function saveHistory(){try{localStorage.setItem('hanzi-recent',JSON.stringify(history));}catch{}}
function renderHistory(){$('history').replaceChildren();$('clear-history').disabled=!history.length;if(!history.length)$('history').append(el('p','查過的字會留在這裡。','empty'));for(const char of history){const b=el('button',char);b.setAttribute('aria-label',`再次查詢「${char}」`);b.onclick=()=>showCharacter(char);$('history').append(b);}}
$('clear-history').onclick=()=>{history=[];saveHistory();renderHistory();};
async function offline(){if(!('serviceWorker'in navigator)){$('offline').textContent='此瀏覽器不支援離線儲存，仍可連網使用。';return;}try{await navigator.serviceWorker.register(new URL('./sw.js',import.meta.url),{scope:'./'});const registration=await navigator.serviceWorker.ready;const check=()=>{const channel=new MessageChannel();channel.port1.onmessage=e=>{$('offline').textContent=e.data?'已可離線查字 · 資料儲存在此裝置':'離線資源尚未準備完成，請保持連線後重新整理。';};(navigator.serviceWorker.controller||registration.active)?.postMessage('check', [channel.port2]);};check();navigator.serviceWorker.addEventListener('controllerchange',check);}catch{$('offline').textContent='離線儲存未完成，請保持連線並重新整理。';}}
renderHistory();init();offline();
