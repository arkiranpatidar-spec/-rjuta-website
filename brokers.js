const queryInput=document.querySelector('#broker-query');
const clearButton=document.querySelector('#clear-search');
const results=document.querySelector('#broker-results');
const datasetStatus=document.querySelector('#dataset-status');
const passport=document.querySelector('#passport');
let brokerData=[];

const normalize=value=>String(value||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
const escapeHtml=value=>String(value??'—').replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
const formatDate=value=>value?new Intl.DateTimeFormat('en-IN',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(`${value}T00:00:00`)):'Not available';
const statusClass=value=>value.toLowerCase().replace(/[^a-z]+/g,'-').replace(/^-|-$/g,'');
const statusLabel=value=>({ACTIVE:'Within displayed validity period',EXPIRED:'Displayed validity expired','REVOKED/CANCELLED':'Listed revoked/cancelled','STATUS_UNCERTAIN':'Status uncertain'}[value]||'Status uncertain');

function scoreBroker(broker,rawQuery){
  const plain=rawQuery.trim().toUpperCase(),compact=normalize(rawQuery),name=broker.legal_name.toUpperCase(),normalizedName=normalize(broker.legal_name);
  if(broker.registration_number_normalized===compact)return 1000;
  if(name===plain||normalizedName===compact)return 900;
  if(name.startsWith(plain)||normalizedName.startsWith(compact))return 700;
  if(name.includes(plain)||normalizedName.includes(compact))return 500;
  const words=plain.split(/\s+/).filter(Boolean);return words.every(word=>name.includes(word))?300:0;
}
function renderResults(){
  const raw=queryInput.value.trim();clearButton.hidden=!raw;
  if(raw.length<2){results.innerHTML='';return}
  const matches=brokerData.map(broker=>({broker,score:scoreBroker(broker,raw)})).filter(item=>item.score>0).sort((a,b)=>b.score-a.score||a.broker.legal_name.localeCompare(b.broker.legal_name)).slice(0,10);
  if(!matches.length){results.innerHTML='<p class="empty-results"><b>No matching regulatory record found.</b><br>Check spelling or search using the complete RERA number. Absence from this snapshot is not proof that a person is unregistered.</p>';return}
  results.innerHTML=matches.map(({broker})=>`<button class="broker-result" type="button" data-id="${broker.broker_id}"><span><strong>${escapeHtml(broker.legal_name)}</strong><span>${escapeHtml(broker.registration_number)} · ${escapeHtml(broker.agent_category)}</span></span><span class="result-status ${statusClass(broker.registration_status)}">${statusLabel(broker.registration_status)}</span></button>`).join('');
  results.querySelectorAll('[data-id]').forEach(button=>button.addEventListener('click',()=>showPassport(button.dataset.id)));
}
function showPassport(id){
  const broker=brokerData.find(item=>item.broker_id===id);if(!broker)return;
  document.querySelector('#passport-name').textContent=broker.legal_name;
  document.querySelector('#passport-category').textContent=`${broker.agent_category||'Category not available'} · ${broker.district||'District not available'}`;
  const status=document.querySelector('#passport-status');status.textContent=statusLabel(broker.registration_status);status.className=`passport-status ${statusClass(broker.registration_status)}`;
  document.querySelector('#passport-registration').textContent=broker.registration_number;
  document.querySelector('#passport-authority').textContent=broker.authority;
  document.querySelector('#passport-issued').textContent=formatDate(broker.certificate_issue_date);
  document.querySelector('#passport-expiry').textContent=formatDate(broker.certificate_expiry_date);
  document.querySelector('#passport-revocation').textContent=broker.revoked_status;
  document.querySelector('#passport-confidence').textContent=broker.data_confidence==='HIGH'?'High · core fields verified':'Review required';
  document.querySelector('#passport-source').href=broker.source_url;
  const certificate=document.querySelector('#passport-certificate');certificate.hidden=!broker.certificate_url;if(broker.certificate_url)certificate.href=broker.certificate_url;
  document.querySelector('#known-revocation').textContent=broker.revoked_status;
  passport.hidden=false;passport.scrollIntoView({behavior:'smooth',block:'start'});
}
queryInput.addEventListener('input',renderResults);
clearButton.addEventListener('click',()=>{queryInput.value='';clearButton.hidden=true;results.innerHTML='';queryInput.focus()});
document.querySelector('[data-year]').textContent=new Date().getFullYear();

fetch('data/brokers.json').then(response=>{if(!response.ok)throw new Error('Dataset unavailable');return response.json()}).then(payload=>{
  brokerData=payload.brokers||[];
  const counts=payload.metadata.status_counts||{};
  datasetStatus.textContent=`${Number(payload.metadata.record_count||0).toLocaleString('en-IN')} regulatory records · ${Number(counts.ACTIVE||0).toLocaleString('en-IN')} within displayed validity period`;
  document.querySelector('#verified-date').textContent=formatDate(payload.metadata.last_verified_at);
}).catch(()=>{datasetStatus.textContent='Broker data could not be loaded. Please use the official register links below.';queryInput.disabled=true});
