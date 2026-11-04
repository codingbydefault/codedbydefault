const $=(s,c=document)=>c.querySelector(s), $$=(s,c=document)=>[...c.querySelectorAll(s)];
document.documentElement.classList.add('js'); $('#year').textContent=new Date().getFullYear();

const reveal=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible')}),{threshold:.12});
$$('.reveal').forEach(el=>reveal.observe(el));

window.addEventListener('pointermove',e=>{const g=$('.cursor-glow');g.style.left=e.clientX+'px';g.style.top=e.clientY+'px'});
$$('.magnetic').forEach(el=>el.addEventListener('pointermove',e=>{const r=el.getBoundingClientRect();el.style.transform=`translate(${(e.clientX-r.left-r.width/2)*.12}px,${(e.clientY-r.top-r.height/2)*.12}px)`}));
$$('.magnetic').forEach(el=>el.addEventListener('pointerleave',()=>el.style.transform=''));

const canvas=$('#field'),ctx=canvas.getContext('2d');let dots=[],mx=innerWidth*.6,my=innerHeight*.3;
function size(){canvas.width=innerWidth*devicePixelRatio;canvas.height=innerHeight*devicePixelRatio;ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);dots=Array.from({length:Math.min(90,Math.floor(innerWidth/14))},()=>({x:Math.random()*innerWidth,y:Math.random()*innerHeight,vx:(Math.random()-.5)*.18,vy:(Math.random()-.5)*.18}))}size();addEventListener('resize',size);addEventListener('pointermove',e=>{mx=e.clientX;my=e.clientY});
function draw(){ctx.clearRect(0,0,innerWidth,innerHeight);dots.forEach((d,i)=>{d.x+=d.vx;d.y+=d.vy;if(d.x<0||d.x>innerWidth)d.vx*=-1;if(d.y<0||d.y>innerHeight)d.vy*=-1;let dist=Math.hypot(d.x-mx,d.y-my);ctx.fillStyle=dist<180?'rgba(199,255,53,.65)':'rgba(255,255,255,.19)';ctx.beginPath();ctx.arc(d.x,d.y,dist<180?1.7:1,0,7);ctx.fill();if(dist<150){ctx.strokeStyle=`rgba(199,255,53,${(1-dist/150)*.18})`;ctx.beginPath();ctx.moveTo(d.x,d.y);ctx.lineTo(mx,my);ctx.stroke()}dots.slice(i+1,i+4).forEach(n=>{let q=Math.hypot(d.x-n.x,d.y-n.y);if(q<110){ctx.strokeStyle=`rgba(255,255,255,${(1-q/110)*.05})`;ctx.beginPath();ctx.moveTo(d.x,d.y);ctx.lineTo(n.x,n.y);ctx.stroke()}})});requestAnimationFrame(draw)}draw();

const modes={
 web:{idx:'01 / WEB DESIGN',title:'Design in<br><em>motion.</em>',text:'Beweeg over het canvas. Elke interactie vormt de ervaring—speels aan de voorkant, doelgericht onder de motorkap.',a:'#c7ff35',b:'#765cff'},
 software:{idx:'02 / SOFTWARE',title:'Logic made<br><em>visible.</em>',text:'Sterke software maakt ingewikkeld werk rustig. Heldere flows, betrouwbare logica en precies genoeg interface.',a:'#765cff',b:'#36d7ff'},
 ai:{idx:'03 / AI SYSTEMS',title:'Intelligence<br><em>at work.</em>',text:'AI wordt waardevol wanneer het een duidelijke rol krijgt: vinden, ordenen, voorstellen en samenwerken met mensen.',a:'#ff5c35',b:'#c7ff35'},
 it:{idx:'04 / IT & INTEGRATION',title:'Connected<br><em>by design.</em>',text:'Geen losse eilanden, maar techniek die als één geheel functioneert—veilig, onderhoudbaar en klaar om mee te groeien.',a:'#36d7ff',b:'#765cff'}
};
$$('.cap-card').forEach(card=>card.addEventListener('click',()=>{const m=modes[card.dataset.mode];$$('.cap-card').forEach(c=>c.classList.remove('active'));card.classList.add('active');$('.lab-index').textContent=m.idx;$('#lab-title').innerHTML=m.title;$('#lab-text').textContent=m.text;$('#lab-visual').style.background=`radial-gradient(circle at center,${m.b}55,transparent 48%),linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px)`;$('.demo-core').style.background=`linear-gradient(135deg,${m.a},${m.b})`;$('#lab').scrollIntoView({behavior:'smooth',block:'center'})}));

const visual=$('#lab-visual');visual.addEventListener('pointermove',e=>{const r=visual.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;$('.demo-core').style.transform=`translate(calc(-50% + ${x*35}px),calc(-50% + ${y*35}px)) rotate(${45+x*18}deg) scale(${1+Math.abs(x)*.08})`});visual.addEventListener('pointerleave',()=>$('.demo-core').style.transform='');

const quickscanForm=$('#quickscan-form');
if(quickscanForm){
  quickscanForm.addEventListener('submit',event=>{
    event.preventDefault();
    if(!quickscanForm.reportValidity())return;
    const data=new FormData(quickscanForm);
    const status=$('#quickscan-status');
    const button=quickscanForm.querySelector('button[type="submit"]');
    button.disabled=true;
    button.querySelector('span').textContent='Aanvraag versturen…';
    status.textContent='Een moment, we verwerken je aanvraag veilig.';
    status.classList.remove('is-error');
    fetch('/api/quickscan',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(Object.fromEntries(data.entries()))
    }).then(async response=>{
      const result=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(result.message||'Versturen is niet gelukt.');
      quickscanForm.reset();
      status.textContent='Bedankt! De bevestiging is onderweg. Binnen 24 uur ontvang je ons persoonlijke rapport met drie mogelijke verbeteringen.';
      status.classList.add('is-active');
      if(typeof window.va==='function')window.va('event',{name:'Quickscan aangevraagd'});
    }).catch(error=>{
      status.textContent=`${error.message} Probeer het opnieuw of mail naar codedbydefault@gmail.com.`;
      status.classList.add('is-error');
    }).finally(()=>{
      button.disabled=false;
      button.querySelector('span').textContent='Vraag mijn quickscan aan';
    });
  });
}

const guideForm=$('#guide-form');
if(guideForm){
  guideForm.addEventListener('submit',event=>{
    event.preventDefault();
    if(!guideForm.reportValidity())return;
    const data=new FormData(guideForm);
    const status=$('#guide-status');
    const button=guideForm.querySelector('button[type="submit"]');
    button.disabled=true;
    button.querySelector('span').textContent='Gids versturen…';
    status.textContent='Een moment, we maken je downloadmail klaar.';
    status.classList.remove('is-success','is-error');
    fetch('/api/guide',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(Object.fromEntries(data.entries()))
    }).then(async response=>{
      const result=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(result.message||'Versturen is niet gelukt.');
      guideForm.reset();
      status.textContent='Gelukt! Controleer je inbox voor de downloadlink. Kijk ook even bij ongewenste e-mail.';
      status.classList.add('is-success');
      if(typeof window.va==='function')window.va('event',{name:'AI-gids aangevraagd'});
    }).catch(error=>{
      status.textContent=`${error.message} Probeer het opnieuw of mail naar codedbydefault@gmail.com.`;
      status.classList.add('is-error');
    }).finally(()=>{
      button.disabled=false;
      button.querySelector('span').textContent='Stuur de gids naar mijn inbox';
    });
  });
}
