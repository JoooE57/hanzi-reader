/* Recognition runs separately so handwriting remains responsive. */
let ready=false;
self.onmessage=async({data})=>{
  try {
    if(data.type==='init'){
      importScripts('vendor/hanzi_lookup.js');
      const response=await fetch('vendor/hanzi_lookup_bg.wasm');
      if(!response.ok) throw new Error('無法下載辨識核心');
      await wasm_bindgen(await response.arrayBuffer());
      ready=true;postMessage({type:'ready'});
    }else if(data.type==='lookup'){
      if(!ready) throw new Error('辨識核心尚未就緒');
      // Upstream Rust converts coordinates to u8; keep every point in 0..255.
      const strokes=data.strokes.map(stroke=>stroke.map(([x,y])=>[Math.round(x/640*255),Math.round(y/640*255)]));
      postMessage({type:'result',id:data.id,matches:JSON.parse(wasm_bindgen.lookup(strokes,10))});
    }
  }catch(error){postMessage({type:'error',id:data.id,message:error.message});}
};
