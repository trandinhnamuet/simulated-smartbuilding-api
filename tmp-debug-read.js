const fs = require('fs');
const path = require('path');
const readline = require('readline');

async function readCsvToMap(p){
  const map = new Map();
  if(!fs.existsSync(p)) return map;
  const rl = readline.createInterface({ input: fs.createReadStream(p), crlfDelay: Infinity });
  let isHeader = true;
  for await(const lineRaw of rl){
    const line = lineRaw.trim();
    if(!line) continue;
    if(isHeader){ isHeader=false; continue; }
    const parts = line.split(/,|;/).map(s=>s.trim());
    if(parts.length<2) continue;
    let ts=null;
    for(let i=0;i<parts.length;i++){ const d=new Date(parts[i]); if(!isNaN(d.getTime())){ ts=parts[i]; break; } }
    if(!ts) continue;
    let tsNorm = ts;
    if(/^\d{9,}$/.test(ts)) tsNorm = new Date(parseInt(ts,10)*1000).toISOString(); else { const d=new Date(ts); if(!isNaN(d.getTime())) tsNorm = d.toISOString(); }
    let val=null;
    for(let i=parts.length-1;i>=0;i--){ if(parts[i]===ts) continue; const v=parseFloat(parts[i]); if(!isNaN(v)){ val=v; break; } }
    if(val===null) continue;
    map.set(tsNorm,val);
  }
  return map;
}

(async ()=>{
  const roomDir = path.join(__dirname,'archive','KETI','413');
  const SENSOR_FILES=[
    {names:['CO2.csv','co2.csv'],dbCol:'co2_ppm'},
    {names:['Humidity.csv','humidity.csv'],dbCol:'humidity_pct'},
    {names:['Temp.csv','temp.csv','temperature.csv'],dbCol:'temperature_c'},
    {names:['Light.csv','light.csv'],dbCol:'luminosity_lux'},
    {names:['PIR.csv','pir.csv'],dbCol:'pir_value'},
  ];

  for(const s of SENSOR_FILES){
    let found=null;
    for(const n of s.names){ const p=path.join(roomDir,n); if(fs.existsSync(p)){ found=p; break; } }
    console.log('sensor',s.names,'found ->',found);
    if(found){ const m = await readCsvToMap(found); console.log('  size:', m.size); const it = m.entries(); for(let i=0;i<3;i++){ const r = it.next(); if(r.done) break; console.log('   ',r.value); }}
  }
})();
