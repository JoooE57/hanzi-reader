import {readFileSync,writeFileSync} from 'node:fs';
const entries=JSON.parse(readFileSync(process.argv[2],'utf8'));
const dict={};
for(const e of entries) if([...e.title].length===1) dict[e.title]=e.heteronyms.map(h=>({bopomofo:h.bopomofo||'',pinyin:h.pinyin||'',definitions:h.definitions.map(d=>d.def)}));
writeFileSync('data/dictionary.json',JSON.stringify(dict));
console.log(Object.keys(dict).length,'characters');
