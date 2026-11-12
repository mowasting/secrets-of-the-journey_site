/* Secrets of the Journey - standalone YouTube player */
(function () {
  'use strict';
  const TEXT = {
    ar: {title:'مشغّل YouTube', hint:'الصق رابط فيديو أو قائمة تشغيل YouTube', placeholder:'https://www.youtube.com/watch?v=...', load:'تحميل', close:'إغلاق', play:'تشغيل', pause:'إيقاف مؤقت', back:'−10 ثوانٍ', forward:'+10 ثوانٍ', prev:'السابق', next:'التالي', open:'فتح على YouTube', empty:'الصق رابط فيديو أو قائمة تشغيل أولاً.', invalid:'الرابط غير صالح. تأكد أنه رابط YouTube.', loading:'جارٍ تحميل المشغّل...', ready:'جاهز للتشغيل', error:'تعذّر تشغيل هذا الفيديو. قد يكون التضمين غير مسموح لهذا الفيديو.', time:'الوقت'},
    en: {title:'YouTube Player', hint:'Paste a YouTube video or playlist link', placeholder:'https://www.youtube.com/watch?v=...', load:'Load', close:'Close', play:'Play', pause:'Pause', back:'−10 sec', forward:'+10 sec', prev:'Previous', next:'Next', open:'Open on YouTube', empty:'Paste a YouTube video or playlist link first.', invalid:'Invalid link. Please use a YouTube URL.', loading:'Loading player...', ready:'Ready to play', error:'This video could not be played. Embedding may be disabled.', time:'Time'},
    ckb:{title:'لێدەری YouTube', hint:'بەستەری ڤیدیۆ یان لیستی لێدانی YouTube دابنێ', placeholder:'https://www.youtube.com/watch?v=...', load:'بارکردن', close:'داخستن', play:'لێدان', pause:'وەستاندنی کاتی', back:'١٠ چرکە دواوە', forward:'١٠ چرکە پێشەوە', prev:'پێشوو', next:'دواتر', open:'کردنەوە لە YouTube', empty:'سەرەتا بەستەری ڤیدیۆ یان لیستی YouTube دابنێ.', invalid:'بەستەرەکە دروست نییە. بەستەری YouTube بەکاربهێنە.', loading:'لێدەرەکە بار دەکرێت...', ready:'ئامادەیە بۆ لێدان', error:'ئەم ڤیدیۆیە ناتوانرێت بلێدرێت. ڕەنگە ڕێگەی embed پێنەدرابێت.', time:'کات'}
  };
  const $ = id => document.getElementById(id);
  let overlay, input, msg, host, title, hint, loadBtn, closeBtn, playBtn, seek, current, duration, prevBtn, nextBtn, backBtn, forwardBtn, openLink;
  let player = null, apiReady = false, pending = null, timer = null, lastUrl = '', playerReady = false;

  function lang(){ const s=$('langSelect'); const v=(s&&s.value)||localStorage.getItem('lang')||'ar'; return TEXT[v]?v:'ar'; }
  function tr(k){return TEXT[lang()][k]||TEXT.ar[k]||k;}
  function el(tag, cls, text){const n=document.createElement(tag); if(cls)n.className=cls; if(text!==undefined)n.textContent=text; return n;}
  function parse(raw){
    try {
      const u=new URL(String(raw||'').trim());
      if(u.protocol!=='https:')return null;
      const h=u.hostname.toLowerCase().replace(/^www\./,'');
      if(!['youtube.com','m.youtube.com','music.youtube.com','youtu.be','youtube-nocookie.com'].includes(h))return null;
      const p=u.pathname.split('/').filter(Boolean); let id=''; const list=u.searchParams.get('list')||'';
      if(h==='youtu.be')id=p[0]||'';
      else if(p[0]==='watch')id=u.searchParams.get('v')||'';
      else if(['embed','shorts','live'].includes(p[0]))id=p[1]||'';
      if(id&&!/^[A-Za-z0-9_-]{11}$/.test(id))return null;
      if(list&&!/^[A-Za-z0-9_-]{2,128}$/.test(list))return null;
      if(!id&&!list)return null;
      return {id,list,url:u.href};
    } catch(_){return null;}
  }
  function fmt(s){if(!Number.isFinite(s)||s<0)s=0; s=Math.floor(s); const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sec=s%60; return h?`${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`:`${m}:${String(sec).padStart(2,'0')}`;}
  function updateLabels(){
    if(!overlay)return;
    title.textContent=tr('title'); hint.textContent=tr('hint'); input.placeholder=tr('placeholder'); loadBtn.textContent=tr('load'); closeBtn.textContent='✕'; closeBtn.setAttribute('aria-label',tr('close'));
    playBtn.textContent=player&&player.getPlayerState&&player.getPlayerState()===1?'Ⅱ': '▶'; playBtn.title=player&&player.getPlayerState&&player.getPlayerState()===1?tr('pause'):tr('play');
    prevBtn.title=tr('prev');nextBtn.title=tr('next');backBtn.title=tr('back');forwardBtn.title=tr('forward');
    openLink.textContent=tr('open');
    const navLabel=$('youtubeNavLabel'); if(navLabel)navLabel.textContent='YouTube';
    const nav=$('youtubeNavBtn'); if(nav)nav.setAttribute('aria-label','YouTube');
  }
  function show(){overlay.classList.add('is-open');document.body.classList.add('sj-yt-open'); input.focus();}
  function hide(){overlay.classList.remove('is-open');document.body.classList.remove('sj-yt-open');}
  function loadApi(done){
    if(apiReady&&window.YT&&window.YT.Player){done();return;}
    pending=done;
    if(window.YT&&window.YT.Player){apiReady=true;const f=pending;pending=null;f();return;}
    if(!document.getElementById('sjYoutubeApi')){
      const old=window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady=function(){if(typeof old==='function')old();apiReady=true;const f=pending;pending=null;if(f)f();};
      const s=document.createElement('script');s.id='sjYoutubeApi';s.src='https://www.youtube.com/iframe_api';s.async=true;document.head.appendChild(s);
    }
  }
  function setMessage(v){msg.textContent=v;}
  function loadVideo(forceVideoOnly){
    const data=parse(input.value);
    if(!input.value.trim()){setMessage(tr('empty'));return;}
    if(!data){setMessage(tr('invalid'));return;}
    const useList = !!data.list && forceVideoOnly!==true;
    lastUrl=data.url; try{localStorage.setItem('sj_youtube_link',lastUrl);}catch(_){}
    openLink.href=data.url;openLink.hidden=false;setMessage(tr('loading'));
    loadApi(()=>{
      const vars={playsinline:1,rel:0,origin:location.origin};
      if(useList){vars.listType='playlist';vars.list=data.list;}
      const opts={height:'100%',width:'100%',videoId:useList?undefined:(data.id||undefined),playerVars:vars,events:{
        onReady:()=>{playerReady=true;setMessage(tr('ready'));sync();},
        onStateChange:sync,
        onError:(e)=>{
          if(useList&&data.id){loadVideo(true);return;}
          setMessage(tr('error')+' ('+(e&&e.data)+')');
        }}};
      if(player){try{player.destroy();}catch(_){} player=null;}
      playerReady=false;
      host.replaceChildren();const frame=el('div');frame.id='sjYtPlayerFrame';host.appendChild(frame);
      player=new YT.Player(frame.id,opts);
    });
  }
  function sync(){
    if(!player||!player.getPlayerState)return;
    const state=player.getPlayerState();playBtn.textContent=state===1?'Ⅱ':'▶';playBtn.title=state===1?tr('pause'):tr('play');
    try{const d=player.getDuration()||0,c=player.getCurrentTime()||0;duration.textContent=fmt(d);current.textContent=fmt(c);seek.max=String(Math.max(1,Math.floor(d)));seek.value=String(Math.min(Math.floor(c),Math.max(1,Math.floor(d))));}catch(_){}
  }
  function seekBy(delta){if(player&&playerReady){try{player.seekTo(Math.max(0,(player.getCurrentTime()||0)+delta),true);sync();}catch(_){}}}
  function build(){
    const nav=$('youtubeNavBtn'); if(!nav||$('sjYoutubeOverlay'))return;
    nav.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();show();},true);
    const style=el('style');style.textContent=`
      .sj-yt-overlay{position:fixed;inset:0;z-index:2147483000;display:none;align-items:center;justify-content:center;padding:16px;background:rgba(5,12,28,.78)}
      .sj-yt-overlay.is-open{display:flex!important}.sj-yt-sheet{width:min(700px,100%);max-height:94vh;overflow:auto;background:var(--card,#fff);color:var(--text,#17233d);border:1px solid var(--line,#ddd);border-radius:22px;padding:18px;box-shadow:0 20px 70px #0005}
      .sj-yt-head{display:flex;align-items:center;justify-content:space-between;gap:12px}.sj-yt-head strong{font-size:1.15rem}.sj-yt-close{border:0;border-radius:10px;padding:8px 13px;background:var(--soft,#eee);color:inherit;font:inherit;cursor:pointer}
      .sj-yt-hint,.sj-yt-msg{color:var(--muted,#687386);font-size:.92rem;line-height:1.6;margin:10px 0}.sj-yt-row{display:flex;gap:8px;margin:12px 0}.sj-yt-input{flex:1;min-width:0;padding:12px;border:1px solid var(--line,#ccc);border-radius:12px;background:var(--bg,#fff);color:inherit;font:inherit;direction:ltr}.sj-yt-load{border:0;border-radius:12px;padding:10px 18px;background:#d92323;color:white;font:inherit;font-weight:700;cursor:pointer}
      .sj-yt-host{width:100%;aspect-ratio:16/9;background:#000;border-radius:14px;overflow:hidden;margin-top:10px}.sj-yt-host iframe{width:100%;height:100%;border:0;display:block}.sj-yt-controls{display:grid;grid-template-columns:auto auto 1fr auto auto;align-items:center;gap:9px;margin-top:14px}.sj-yt-control{border:0;border-radius:11px;padding:10px 12px;background:var(--soft,#eee);color:inherit;font:inherit;cursor:pointer}.sj-yt-main{background:#d92323;color:#fff;min-width:48px;font-weight:800}.sj-yt-seekrow{display:flex;align-items:center;gap:8px;margin-top:10px;font-variant-numeric:tabular-nums;font-size:.85rem}.sj-yt-seek{flex:1;min-width:0;accent-color:#d92323;cursor:pointer}.sj-yt-open{display:inline-block;margin-top:12px;color:var(--accent,#243b65);font-weight:700}.sj-yt-overlay[dir="rtl"] .sj-yt-row{flex-direction:row}
      @media(max-width:520px){.sj-yt-overlay{padding:0;align-items:flex-end}.sj-yt-sheet{width:100%;max-height:96vh;border-radius:20px 20px 0 0;padding:14px 12px 22px}.sj-yt-row{flex-direction:column}.sj-yt-load{width:100%}.sj-yt-controls{grid-template-columns:repeat(4,1fr)}.sj-yt-seekrow{grid-column:1/-1;grid-row:2}.sj-yt-controls .sj-yt-main{grid-column:1/-1;grid-row:1}}
    `;document.head.appendChild(style);
    overlay=el('div','sj-yt-overlay');overlay.id='sjYoutubeOverlay';overlay.dir='auto';overlay.addEventListener('click',e=>{if(e.target===overlay)hide();});
    const sheet=el('section','sj-yt-sheet');sheet.setAttribute('role','dialog');sheet.setAttribute('aria-modal','true');
    const head=el('div','sj-yt-head');title=el('strong');closeBtn=el('button','sj-yt-close','✕');closeBtn.type='button';closeBtn.addEventListener('click',hide);head.append(title,closeBtn);
    hint=el('p','sj-yt-hint');const row=el('div','sj-yt-row');input=el('input','sj-yt-input');input.type='url';input.autocomplete='url';loadBtn=el('button','sj-yt-load');loadBtn.type='button';loadBtn.addEventListener('click',loadVideo);input.addEventListener('keydown',e=>{if(e.key==='Enter')loadVideo();});row.append(input,loadBtn);
    msg=el('p','sj-yt-msg');host=el('div','sj-yt-host');
    const controls=el('div','sj-yt-controls');prevBtn=el('button','sj-yt-control','|◀');prevBtn.type='button';prevBtn.addEventListener('click',()=>{if(player&&playerReady)player.previousVideo();});
    backBtn=el('button','sj-yt-control','−10');backBtn.type='button';backBtn.addEventListener('click',()=>seekBy(-10));
    playBtn=el('button','sj-yt-control sj-yt-main','▶');playBtn.type='button';playBtn.addEventListener('click',()=>{if(!player||!playerReady)return;const s=player.getPlayerState();if(s===1)player.pauseVideo();else player.playVideo();sync();});
    forwardBtn=el('button','sj-yt-control','+10');forwardBtn.type='button';forwardBtn.addEventListener('click',()=>seekBy(10));
    nextBtn=el('button','sj-yt-control','▶|');nextBtn.type='button';nextBtn.addEventListener('click',()=>{if(player&&playerReady)player.nextVideo();});controls.append(prevBtn,backBtn,playBtn,forwardBtn,nextBtn);
    const seekrow=el('div','sj-yt-seekrow');current=el('span',null,'0:00');seek=el('input','sj-yt-seek');seek.type='range';seek.min='0';seek.max='1';seek.value='0';seek.setAttribute('aria-label','Seek');seek.addEventListener('input',()=>{if(player&&playerReady){current.textContent=fmt(Number(seek.value));}});seek.addEventListener('change',()=>{if(player&&playerReady)player.seekTo(Number(seek.value),true);});duration=el('span',null,'0:00');seekrow.append(current,seek,duration);
    openLink=el('a','sj-yt-open');openLink.target='_blank';openLink.rel='noopener noreferrer';openLink.hidden=true;
    sheet.append(head,hint,row,msg,host,controls,seekrow,openLink);overlay.appendChild(sheet);document.body.appendChild(overlay);
    try{input.value=localStorage.getItem('sj_youtube_link')||'';}catch(_){}
    updateLabels();
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&overlay.classList.contains('is-open'))hide();});
    const ls=$('langSelect');if(ls)ls.addEventListener('change',updateLabels);
    if(timer)clearInterval(timer);timer=setInterval(sync,500);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',build);else build();
})();
