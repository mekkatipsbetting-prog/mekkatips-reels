// Short vertical 1080x1920: voz por escena (edge-tts) + escenas HTML (Playwright) + ffmpeg.
// Se lanza desde render/render.js cuando data.kind === 'short' (usa reel.yml, sale como reel.mp4).
const {chromium}=require('playwright');const fs=require('fs');const {execFileSync}=require('child_process');
const run=(c,a)=>execFileSync(c,a,{stdio:['ignore','pipe','inherit']}).toString();
(async()=>{
  const data=JSON.parse(fs.readFileSync('data.json','utf8'));
  const OUT=process.env.SHORT_OUT||'short.mp4';
  try{run('python3',['-c','import edge_tts'])}catch(e){run('python3',['-m','pip','install','--quiet','--break-system-packages','edge-tts'])}
  const voice=data.voice||'es-MX-JorgeNeural';const FPS=24;
  fs.mkdirSync('work/f',{recursive:true});
  const durs=[];
  for(let i=0;i<data.scenes.length;i++){
    const s=data.scenes[i];const mp3=`work/a${i}.mp3`;
    run('python3',['-m','edge_tts','--voice',voice,'--rate='+(data.rate||'+8%'),'--text',String(s.say||' '),'--write-media',mp3]);
    const d=parseFloat(run('ffprobe',['-v','error','-show_entries','format=duration','-of','csv=p=0',mp3]));
    const dur=Math.round((d+0.45)*100)/100;durs.push(dur);
    run('ffmpeg',['-y','-loglevel','error','-i',mp3,'-af','apad=whole_dur='+dur,'-ar','44100','-ac','2',`work/a${i}.wav`]);
  }
  fs.writeFileSync('work/list.txt',durs.map((_,i)=>`file 'a${i}.wav'`).join('\n'));
  run('ffmpeg',['-y','-loglevel','error','-f','concat','-safe','0','-i','work/list.txt','-c','copy','work/voice.wav']);
  const b=await chromium.launch(process.env.CHROME?{executablePath:process.env.CHROME}:{});const p=await b.newPage({viewport:{width:1080,height:1920}});
  await p.addInitScript(d=>{window.DATA=d},Object.assign({},data,{durs}));
  await p.goto('file://'+process.cwd()+'/shorts/scene.html');await p.waitForTimeout(500);
  const total=durs.reduce((a,c)=>a+c,0);const N=Math.ceil(total*FPS);
  for(let i=0;i<N;i++){await p.evaluate(t=>window.render(t),i/FPS);await p.screenshot({path:`work/f/${String(i).padStart(5,'0')}.jpg`,type:'jpeg',quality:90});}
  await b.close();
  run('ffmpeg',['-y','-loglevel','error','-framerate',String(FPS),'-i','work/f/%05d.jpg','-i','work/voice.wav','-map','0:v','-map','1:a','-c:v','libx264','-preset','veryfast','-crf','20','-pix_fmt','yuv420p','-c:a','aac','-b:a','160k','-shortest','-movflags','+faststart',OUT]);
  console.log('ok',N,'frames',total.toFixed(1),'s ->',OUT);
})().catch(e=>{console.error(e);process.exit(1)});
