const {chromium}=require('playwright');const fs=require('fs');const {execSync}=require('child_process');
(async()=>{const data=JSON.parse(fs.readFileSync('data.json','utf8'));
const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1920}});
await p.addInitScript(d=>{window.DATA=d},data);
await p.goto('file://'+process.cwd()+'/render/reel.html');await p.waitForTimeout(500);
const dur=await p.evaluate(()=>window.DURATION);const N=Math.ceil(dur*30);fs.mkdirSync('frames',{recursive:true});
for(let i=0;i<N;i++){await p.evaluate(t=>window.render(t),i/30);await p.screenshot({path:`frames/f_${String(i).padStart(4,'0')}.jpg`,type:'jpeg',quality:92});}
await b.close();
execSync('ffmpeg -y -loglevel error -framerate 30 -i frames/f_%04d.jpg -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p -movflags +faststart reel.mp4',{stdio:'inherit'});
console.log('ok',N,'frames');})();
