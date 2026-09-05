const records = [
  {project:'Birla Pravaah',promoter:'Birla Estates Private Limited',location:'Sector 71, Gurugram',until:'31 Mar 2032',status:'active',source:'https://haryanarera.gov.in/admincontrol/registered_projects/2'},
  {project:'Bodh 79',promoter:'Top Haven Developers Private Limited',location:'Sector 79, Gurugram',until:'09 Nov 2026',status:'active',source:'https://haryanarera.gov.in/admincontrol/registered_projects/2'},
  {project:'Bonheur Avenue',promoter:'Clarika Infra Private Limited',location:'Sector 35, Sohna',until:'31 Dec 2026',status:'active',source:'https://haryanarera.gov.in/admincontrol/registered_projects/2'},
  {project:'Bonheur Avenue Phase 2',promoter:'ATS Commercial Real Estate Private Limited',location:'Sector 35, Sohna',until:'30 Apr 2025',status:'past',source:'https://haryanarera.gov.in/admincontrol/registered_projects/2'},
  {project:'BPTP Amstoria Verti-Greens',promoter:'BPTP Limited',location:'Sector 102, Gurugram',until:'14 Dec 2031',status:'active',source:'https://haryanarera.gov.in/admincontrol/registered_projects/2'},
  {project:'BPTP Green Oaks Boulevard',promoter:'BPTP Limited',location:'Sector 70A, Gurugram',until:'31 Dec 2032',status:'active',source:'https://haryanarera.gov.in/admincontrol/registered_projects/2'}
];
const rows = document.querySelector('#project-rows');
const search = document.querySelector('#record-search');
const filter = document.querySelector('#status-filter');
const empty = document.querySelector('#empty-state');
document.querySelector('[data-year]').textContent = new Date().getFullYear();
function render(){
  const query=search.value.trim().toLowerCase(), status=filter.value;
  const visible=records.filter(r=>(status==='all'||r.status===status)&&`${r.project} ${r.promoter} ${r.location}`.toLowerCase().includes(query));
  rows.innerHTML=visible.map(r=>`<tr><td>${r.project}</td><td>${r.promoter}</td><td>${r.location}</td><td>${r.until}</td><td><span class="record-pill ${r.status}">${r.status==='active'?'Registration current':'Registration date passed'}</span></td><td><a class="source-out" href="${r.source}" target="_blank" rel="noopener">View record ↗</a></td></tr>`).join('');
  empty.hidden=visible.length>0;
}
search.addEventListener('input',render); filter.addEventListener('change',render); render();

const areaInput=document.querySelector('#area-input');
const rateInput=document.querySelector('#rate-input');
const offerInput=document.querySelector('#offer-input');
const rupeeCrore=value=>`₹${value.toFixed(2)}cr`;
const numberIndia=value=>Number(value).toLocaleString('en-IN');
function updateValuationilho(){
  const area=Number(areaInput.value),rate=Number(rateInput.value),offer=Number(offerInput.value)/100;
  const base=area*rate/10000000;
  const fair=base*1.08*1.06*.96*1.03;
  const low=fair*.95,high=fair*1.05;
  const difference=(offer/fair-1)*100;
  document.querySelector('#area-output').textContent=numberIndia(area);
  document.querySelector('#rate-output').textContent=numberIndia(rate);
  document.querySelector('#offer-output').textContent=offer.toFixed(2);
  document.querySelector('#base-value').textContent=rupeeCrore(base);
  document.querySelector('#fair-value').textContent=rupeeCrore(fair);
  document.querySelector('#low-value').textContent=rupeeCrore(low);
  document.querySelector('#high-value').textContent=rupeeCrore(high);
  let verdict='within';
  if(offer>high) verdict='above'; else if(offer<low) verdict='below';
  document.querySelector('#offer-verdict').textContent=`Offer is ${Math.abs(difference).toFixed(1)}% ${difference>=0?'above':'below'} the adjusted benchmark and ${verdict} the ±5% review range.`;
}
[areaInput,rateInput,offerInput].forEach(input=>input.addEventListener('input',updateValuationilho));
updateValuationilho();

const marketProjects=[
  {name:'DLF Privana North',short:'DLF Privana',corridor:'New Gurgaon',ticket:9.35,rate:23500,premium:74.7},
  {name:'Ganga Nandaka',short:'Ganga',corridor:'New Gurgaon',ticket:5.03,rate:13650,premium:27.6},
  {name:'Godrej Aristocrat',short:'Godrej',corridor:'Golf Course Extension',ticket:4.30,rate:20650,premium:22.6},
  {name:'Puri Diplomatic Residences',short:'Puri',corridor:'Dwarka Expressway',ticket:5.11,rate:18700,premium:15.8},
  {name:'M3M Mansion',short:'M3M',corridor:'Dwarka Expressway',ticket:3.60,rate:18000,premium:12.5},
  {name:'Max Estate 360',short:'Max',corridor:'Dwarka Expressway',ticket:5.54,rate:22050,premium:10.3},
  {name:'Smartworld One DXP',short:'Smartworld',corridor:'Dwarka Expressway',ticket:3.25,rate:16450,premium:2.8},
  {name:'Emaar Amaris',short:'Emaar',corridor:'Golf Course Extension',ticket:3.46,rate:21000,premium:-0.7},
  {name:'Silverglades Legacy',short:'Silverglades',corridor:'Golf Course Extension',ticket:7.00,rate:24350,premium:-1.4}
];
const dashboard=document.querySelector('.decision-dashboard');
if(dashboard){
  const median=values=>{const ordered=[...values].sort((a,b)=>a-b);return ordered[Math.floor(ordered.length/2)]};
  const escapeXml=value=>String(value).replace(/[<>&'\"]/g,char=>({'<':'&lt;','>':'&gt;','&':'&amp;',"'":'&apos;','\"':'&quot;'}[char]));
  const svgTooltip=document.createElement('div');
  svgTooltip.className='chart-tooltip';
  svgTooltip.setAttribute('role','tooltip');
  dashboard.appendChild(svgTooltip);
  let activeCorridor='All';

  function showTooltip(event,project){
    const box=dashboard.getBoundingClientRect();
    svgTooltip.innerHTML=`<b>${escapeXml(project.name)}</b><br>Entry ₹${project.ticket.toFixed(2)}cr · ₹${numberIndia(project.rate)}/sq ft<br>${project.premium>=0?'+':''}${project.premium.toFixed(1)}% versus sector`;
    svgTooltip.style.left=`${event.clientX-box.left}px`;
    svgTooltip.style.top=`${event.clientY-box.top}px`;
    svgTooltip.style.opacity='1';
  }
  function hideTooltip(){svgTooltip.style.opacity='0'}
  function connectTooltip(container,projects){
    container.querySelectorAll('[data-project]').forEach(mark=>{
      const project=projects.find(item=>item.name===mark.dataset.project);
      mark.addEventListener('pointermove',event=>showTooltip(event,project));
      mark.addEventListener('pointerleave',hideTooltip);
      mark.addEventListener('focus',event=>showTooltip(event,project));
      mark.addEventListener('blur',hideTooltip);
    });
  }
  function renderPositioning(projects){
    const target=document.querySelector('#positioning-chart');
    if(!projects.length){target.innerHTML='<div class="chart-empty">No projects in this selection.</div>';return}
    const width=Math.max(360,target.clientWidth||560),height=360,left=58,right=24,top=28,bottom=48;
    const minTicket=Math.min(...projects.map(p=>p.ticket)),maxTicket=Math.max(...projects.map(p=>p.ticket));
    const minRate=Math.min(...projects.map(p=>p.rate)),maxRate=Math.max(...projects.map(p=>p.rate));
    const xMin=Math.max(0,Math.floor(minTicket)-1),xMax=Math.ceil(maxTicket)+1;
    const yMin=Math.floor((minRate-1500)/5000)*5000,yMax=Math.ceil((maxRate+1500)/5000)*5000;
    const x=value=>left+(value-xMin)/(xMax-xMin)*(width-left-right);
    const y=value=>top+(yMax-value)/(yMax-yMin)*(height-top-bottom);
    const xTicks=Array.from({length:5},(_,i)=>xMin+(xMax-xMin)*i/4);
    const yTicks=Array.from({length:5},(_,i)=>yMin+(yMax-yMin)*i/4);
    target.innerHTML=`<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Entry ticket in crore rupees plotted against asking rate per square foot">${yTicks.map(v=>`<line class="chart-gridline" x1="${left}" x2="${width-right}" y1="${y(v)}" y2="${y(v)}"/><text class="chart-axis" x="${left-8}" y="${y(v)+4}" text-anchor="end">₹${Math.round(v/1000)}k</text>`).join('')}${xTicks.map(v=>`<text class="chart-axis" x="${x(v)}" y="${height-18}" text-anchor="middle">₹${v.toFixed(1)}cr</text>`).join('')}<text class="chart-axis" x="${(left+width-right)/2}" y="${height-2}" text-anchor="middle">Lowest advertised configuration</text>${projects.map((p,index)=>`<g data-project="${escapeXml(p.name)}" tabindex="0"><circle class="chart-dot ${index%2?'secondary':''}" cx="${x(p.ticket)}" cy="${y(p.rate)}" r="8"/><text class="chart-label" x="${x(p.ticket)+(x(p.ticket)>width*.72?-10:10)}" y="${y(p.rate)-11}" text-anchor="${x(p.ticket)>width*.72?'end':'start'}">${escapeXml(p.short)}</text></g>`).join('')}</svg>`;
    connectTooltip(target,projects);
  }
  function renderPremium(projects){
    const target=document.querySelector('#premium-svg-chart');
    if(!projects.length){target.innerHTML='<div class="chart-empty">No projects in this selection.</div>';return}
    const width=Math.max(360,target.clientWidth||560),left=Math.min(145,width*.32),right=35,top=15,row=34,height=top+projects.length*row+35;
    const min=-5,max=80,plot=width-left-right;
    const x=value=>left+(value-min)/(max-min)*plot;
    target.innerHTML=`<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Asking premium to sector benchmark in percent"><line class="chart-zero" x1="${x(0)}" x2="${x(0)}" y1="${top-4}" y2="${height-28}"/>${projects.map((p,index)=>{const zero=x(0),end=x(p.premium),barX=Math.min(zero,end),barWidth=Math.max(3,Math.abs(end-zero));return `<g data-project="${escapeXml(p.name)}" tabindex="0"><text class="chart-label" x="${left-8}" y="${top+index*row+16}" text-anchor="end">${escapeXml(p.short)}</text><rect class="chart-premium-bar ${p.premium<0?'negative':''}" x="${barX}" y="${top+index*row+5}" width="${barWidth}" height="15"/><text class="chart-label" x="${p.premium>=0?end+6:end-6}" y="${top+index*row+16}" text-anchor="${p.premium>=0?'start':'end'}">${p.premium>=0?'+':''}${Math.round(p.premium)}%</text></g>`}).join('')}<text class="chart-axis" x="${left+plot/2}" y="${height-4}" text-anchor="middle">Premium / discount to same-source sector rate</text></svg>`;
    connectTooltip(target,projects);
  }
  function renderDashboard(){
    const selected=activeCorridor==='All'?marketProjects:marketProjects.filter(p=>p.corridor===activeCorridor);
    document.querySelector('#dash-project-count').textContent=selected.length;
    document.querySelector('#dash-median-rate').textContent=`₹${(median(selected.map(p=>p.rate))/1000).toFixed(1)}k`;
    document.querySelector('#dash-median-ticket').textContent=`₹${median(selected.map(p=>p.ticket)).toFixed(2)}cr`;
    const premium=median(selected.map(p=>p.premium));
    document.querySelector('#dash-median-premium').textContent=`${premium>=0?'+':''}${Math.round(premium)}%`;
    renderPositioning(selected);renderPremium(selected);
  }
  document.querySelectorAll('[data-corridor]').forEach(button=>button.addEventListener('click',()=>{
    activeCorridor=button.dataset.corridor;
    document.querySelectorAll('[data-corridor]').forEach(peer=>{const active=peer===button;peer.classList.toggle('active',active);peer.setAttribute('aria-pressed',String(active))});
    renderDashboard();
  }));
  let resizeTimer;
  window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(renderDashboard,120)});
  renderDashboard();
}
