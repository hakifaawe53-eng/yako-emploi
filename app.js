window.addEventListener("error",e=>{const c=document.getElementById("count");if(c)c.textContent="Erreur : "+e.message+" (ligne "+e.lineno+")"});
window.addEventListener("unhandledrejection",e=>{const c=document.getElementById("count");if(c)c.textContent="Erreur : "+(e.reason&&e.reason.message||e.reason)});
const sb=supabase.createClient("https://nazevlmgzbtbkhtdpnqy.supabase.co","sb_publishable_noD_yAq7D4Q_kvaBHA8o5w_-35dB_oV");
const CITIES=["Abidjan","Yamoussoukro","Bouaké","Daloa","San-Pédro","Korhogo","Man","Autre"];
const CATS=["Commerce et vente","Comptabilité et gestion","Couture et mode","Livraison et transport","Bâtiment et artisanat","Restauration","Informatique et digital","Santé","Éducation","Autre"];
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let me=null,posts=[],ft="tous",fc="",fk="",q="",openId=null,pt="cherche",am="in",mt="tel",editId=null,sugFor=null;
const opt=(a,first)=>(first?`<option value="">${first}</option>`:"")+a.map(c=>`<option>${c}</option>`).join("");
$("fcity").innerHTML=opt(CITIES);$("fcityf").innerHTML=opt(CITIES,"Toutes les villes");
$("fd").innerHTML=opt(CATS);$("fcatf").innerHTML=opt(CATS,"Tous les métiers");
const NUM=/^(225)?\d{10}$/,norm=d=>d.length===10?"225"+d:d;
function ago(t){const m=Math.floor((Date.now()-new Date(t))/6e4);if(m<1)return "à l’instant";if(m<60)return "il y a "+m+" min";const h=Math.floor(m/60);if(h<24)return "il y a "+h+" h";return "il y a "+Math.floor(h/24)+" j"}
function waLink(w){let d=String(w||"").replace(/\D/g,"");if(!d)return "";if(d.length<=10)d="225"+d;return "https://wa.me/"+d}
function card(p){
  const mine=me&&p.user_id===me.id,done=p.status==="trouve",open=openId===p.id,rs=(p.replies||[]).slice().sort((a,b)=>a.created_at<b.created_at?-1:1),lk=p.likes||[],liked=me&&lk.some(x=>x.user_id===me.id),wa=waLink(p.whatsapp),v=p.views||0;
  if(editId===p.id)return `<article class="post ${p.kind}"><div class="form" style="padding:0"><label>Message<textarea id="em" maxlength="400">${esc(p.message)}</textarea></label><label>Numéro WhatsApp<input id="ew" type="tel" value="${esc(p.whatsapp||"")}"></label><label>Autre numéro (facultatif)<input id="ep" type="tel" value="${esc(p.phone||"")}"></label><p class="err" id="eerr"></p><div class="acts"><button class="btn" type="button" data-sv="${p.id}">Enregistrer</button><button class="btn ghost" type="button" data-e="${p.id}">Annuler</button></div></div></article>`;
  return `<article class="post ${p.kind}${done?" done":""}" data-id="${p.id}">
<div class="meta"><span class="tag">${p.kind==="cherche"?"Je cherche":"J’offre"}</span><span>${esc(p.city)}</span><span>${ago(p.created_at)}</span>${done?`<span class="found">${p.kind==="cherche"?"✅ A trouvé un emploi":"✅ Poste pourvu"}</span>`:""}</div>
<h3>${esc(p.author)}<small>${esc(p.category)}</small></h3>
<p>${esc(p.message)}</p>
<div class="stats"><span>👁 ${v} vue${v>1?"s":""}</span><button class="lk${liked?" on":""}" type="button" data-l="${p.id}" aria-label="J’aime">${liked?"♥":"♡"} ${lk.length}</button></div>
<div class="acts">${done?"":`${wa?`<a class="btn wa" href="${wa}" target="_blank" rel="noopener">Écrire sur WhatsApp</a>`:""}${p.phone?`<a class="btn ghost" href="tel:+${esc(p.phone)}">Appeler</a>`:""}`}<button class="btn ghost" type="button" data-r="${p.id}">Réponses (${rs.length})</button>${mine?`${done?`<button class="btn ghost" type="button" data-o="${p.id}">Rouvrir</button>`:`<button class="btn ghost" type="button" data-e="${p.id}">Modifier</button><button class="btn ghost" type="button" data-f="${p.id}">${p.kind==="cherche"?"J’ai trouvé ✅":"Poste pourvu ✅"}</button>`}<button class="btn ghost" type="button" data-x="${p.id}">Supprimer</button>`:""}</div>
${open?`<div class="replies">${rs.map(x=>`<p><b>${esc(x.author)}</b> ${esc(x.message)}</p>`).join("")}${me?`<div class="rform"><input id="ri" maxlength="200" placeholder="Écris une réponse"><button class="btn" type="button" data-s="${p.id}">Envoyer</button></div>`:'<p>Connecte-toi pour répondre.</p>'}</div>`:""}
</article>`}
function draw(){
  const l=posts.filter(p=>(ft==="tous"||p.kind===ft)&&(!fc||p.city===fc)&&(!fk||p.category===fk)&&(!q||(p.author+" "+p.category+" "+p.message+" "+p.city).toLowerCase().includes(q)));
  $("list").innerHTML=l.length?l.map(card).join(""):'<p class="empty">Aucune annonce ici pour l’instant. Publie la première !</p>';
  $("count").textContent=l.length+(l.length>1?" annonces":" annonce");
  watch();
}
async function load(){
  const{data,error}=await sb.from("posts").select("*,replies(id,user_id,author,message,created_at),likes(user_id)").order("created_at",{ascending:false}).limit(100);
  if(error){$("count").textContent="Impossible de charger les annonces. Vérifie ta connexion.";return}
  posts=data;draw();remind();
}
function ui(){
  $("pub").hidden=!me;$("tog").textContent=me?"Déconnexion":"Se connecter";
  if(me){$("auth").hidden=true;const n=me.user_metadata&&me.user_metadata.name;if(n&&!$("fn").value)$("fn").value=n}
  draw();remind();
}
function seg(box,attr,fn){box.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;box.querySelectorAll("button").forEach(x=>x.classList.toggle("on",x===b));fn(b.dataset[attr])})}
seg($("ptype"),"t",v=>pt=v);
seg($("ftype"),"f",v=>{ft=v;draw()});
seg($("amet"),"m",v=>{mt=v;$("al").textContent=v==="tel"?"Numéro de téléphone":"Adresse e-mail (Gmail…)";const i=$("ae");i.type=v==="tel"?"tel":"email";i.inputMode=v==="tel"?"tel":"email";i.placeholder=v==="tel"?"Ex. 07 00 00 00 00":"exemple@gmail.com";i.value=""});
seg($("amode"),"a",v=>{am=v;$("nl").hidden=v==="in";$("ago").textContent=v==="in"?"Se connecter":"Créer mon compte"});
$("fcityf").onchange=e=>{fc=e.target.value;draw()};
$("fcatf").onchange=e=>{fk=e.target.value;draw()};
$("q").oninput=e=>{q=e.target.value.trim().toLowerCase();draw()};
$("reload").onclick=load;
$("tog").onclick=async()=>{if(me){await sb.auth.signOut()}else{$("auth").hidden=!$("auth").hidden}};
$("ago").onclick=async()=>{
  const val=$("ae").value.trim(),raw=val.replace(/\D/g,""),password=$("ap").value,name=$("an").value.trim();
  $("aerr").textContent="";
  let email;
  if(mt==="tel"){if(!/^(225)?\d{10}$/.test(raw)){$("aerr").textContent="Entre ton numéro à 10 chiffres.";return}email=(raw.length===10?"225"+raw:raw)+"@barachap.app"}
  else{email=val.toLowerCase();if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){$("aerr").textContent="Entre une adresse e-mail valide.";return}}
  if(mt==="tel"&&am==="up"){$("aerr").textContent="L’inscription par numéro avec code SMS arrive bientôt. Pour l’instant, crée ton compte avec ton e-mail.";return}
  if(am==="up"&&name.length<2){$("aerr").textContent="Ajoute ton nom.";return}
  const r=am==="in"?await sb.auth.signInWithPassword({email,password}):await sb.auth.signUp({email,password,options:{data:{name},emailRedirectTo:location.origin}});
  if(r.error){const nc=/confirm/i.test(r.error.message||"");$("aerr").textContent=am==="in"?(nc?"Confirme d’abord ton e-mail : ouvre le message que nous t’avons envoyé (regarde aussi les spams).":"Identifiant ou mot de passe incorrect."):"Inscription impossible. Ce compte existe peut-être déjà, ou le mot de passe est trop court (6 caractères minimum).";return}
  if(am==="up"&&!r.data.session)$("aerr").textContent="Un e-mail de confirmation vient d’être envoyé à "+email+". Ouvre-le et appuie sur le lien (regarde aussi les spams), puis reviens te connecter.";
};
$("list").addEventListener("click",async e=>{
  const g=k=>e.target.closest("["+k+"]"),r=g("data-r"),s=g("data-s"),x=g("data-x"),l=g("data-l"),f=g("data-f"),o=g("data-o"),ed=g("data-e"),sv=g("data-sv");
  const up=async(id,v)=>{await sb.from("posts").update(v).eq("id",id);load()};
  if(x){if(x.dataset.c){await sb.from("posts").delete().eq("id",x.dataset.x);load()}else{x.dataset.c=1;x.textContent="Confirmer ?"}return}
  if(l){if(!me){$("auth").hidden=false;scrollTo(0,0);return}const id=l.dataset.l,p=posts.find(z=>z.id===id);if((p.likes||[]).some(z=>z.user_id===me.id))await sb.from("likes").delete().eq("post_id",id).eq("user_id",me.id);else await sb.from("likes").insert({post_id:id});load();return}
  if(f){await up(f.dataset.f,{status:"trouve"});return}
  if(o){await up(o.dataset.o,{status:"actif",last_check:new Date().toISOString()});return}
  if(ed){editId=editId===ed.dataset.e?null:ed.dataset.e;draw();return}
  if(sv){const m=$("em").value.trim(),w=$("ew").value.replace(/\D/g,""),ph=$("ep").value.replace(/\D/g,"");
    if(m.length<10){$("eerr").textContent="Message trop court.";return}
    if(!NUM.test(w)){$("eerr").textContent="Le numéro WhatsApp est obligatoire (10 chiffres).";return}
    if(ph&&!NUM.test(ph)){$("eerr").textContent="L’autre numéro doit avoir 10 chiffres.";return}
    editId=null;await up(sv.dataset.sv,{message:m,whatsapp:norm(w),phone:ph?norm(ph):null});return}
  if(r){openId=openId===r.dataset.r?null:r.dataset.r;draw()}
  if(s){const v=$("ri").value.trim();if(!v)return;const who=(me.user_metadata&&me.user_metadata.name)||"Anonyme";
    const{error}=await sb.from("replies").insert({post_id:s.dataset.s,author:who,message:v});if(!error)load()}
});
$("send").onclick=async()=>{
  const author=$("fn").value.trim(),message=$("fm").value.trim(),w=$("fw").value.replace(/\D/g,""),ph=$("fp").value.replace(/\D/g,"");
  if(author.length<2||message.length<10){$("err").textContent="Ajoute ton nom et un message d’au moins 10 caractères.";return}
  if(!NUM.test(w)){$("err").textContent="Le numéro WhatsApp est obligatoire (10 chiffres).";return}
  if(ph&&!NUM.test(ph)){$("err").textContent="L’autre numéro doit avoir 10 chiffres.";return}
  $("err").textContent="";
  const{error}=await sb.from("posts").insert({author,kind:pt,city:$("fcity").value,category:$("fd").value,message,whatsapp:norm(w),phone:ph?norm(ph):null});
  if(error){$("err").textContent="Publication impossible. Réessaie dans un instant.";return}
  $("fm").value="";$("fp").value="";$("pub").open=false;ft="tous";fc="";fk="";q="";$("q").value="";$("fcityf").value="";$("fcatf").value="";
  $("ftype").querySelectorAll("button").forEach(b=>b.classList.toggle("on",b.dataset.f==="tous"));
  load();
};
function watch(){
  if(!("IntersectionObserver"in window))return;
  const day=new Date().toISOString().slice(0,10);
  const io=new IntersectionObserver(es=>es.forEach(en=>{if(!en.isIntersecting)return;const el=en.target,id=el.dataset.id;io.unobserve(el);const p=posts.find(z=>z.id===id);if(!p||(me&&p.user_id===me.id))return;const k="v:"+id+":"+day;try{if(localStorage.getItem(k))return;localStorage.setItem(k,1)}catch(_){}
    sb.rpc("add_view",{p_id:id}).then(()=>{p.views=(p.views||0)+1;const s=el.querySelector(".stats span");if(s)s.textContent="👁 "+p.views+" vue"+(p.views>1?"s":"")})}),{threshold:.6});
  document.querySelectorAll(".post[data-id]").forEach(el=>io.observe(el));
}
function remind(){
  const box=$("rem");box.innerHTML="";
  if(!me)return;
  const sug=sugFor&&posts.find(p=>p.id===sugFor);
  if(sug){
    const offers=posts.filter(o=>o.kind==="offre"&&o.status==="actif"&&o.category===sug.category).sort((a,b)=>(b.city===sug.city)-(a.city===sug.city)).slice(0,3);
    const msg=encodeURIComponent("Je cherche du travail ("+sug.category+", "+sug.city+"). Mon annonce sur Barachap : "+location.origin);
    box.innerHTML=`<div class="rem"><b>Pas de souci, voici 3 actions pour avancer :</b>
<p><b>1. Écris aux employeurs</b> qui recrutent dans ton domaine. Écrire vite augmente tes chances.</p>${offers.length?offers.map(o=>`<p class="of">${esc(o.author)} · ${esc(o.city)} : ${esc(o.message.slice(0,90))}… <a class="btn wa" href="${waLink(o.whatsapp)}" target="_blank" rel="noopener">Écrire</a></p>`).join(""):"<p>Aucune offre dans ce domaine pour l’instant. Reviens demain.</p>"}
<p><b>2. Partage ton annonce</b> à tes contacts WhatsApp.</p><a class="btn wa" href="https://wa.me/?text=${msg}" target="_blank" rel="noopener">Partager sur WhatsApp</a>
<p><b>3. Améliore ton annonce</b> : précise ton expérience, ton quartier et quand tu es disponible.</p><div class="acts"><button class="btn ghost" type="button" data-re="${sug.id}">Modifier mon annonce</button><button class="btn ghost" type="button" data-rc="1">Fermer</button></div></div>`;
    return;
  }
  const due=posts.find(p=>p.user_id===me.id&&p.kind==="cherche"&&p.status==="actif"&&Date.now()-new Date(p.last_check||p.created_at)>=864e5);
  if(due)box.innerHTML=`<div class="rem"><b>Bonjour ! Tu as trouvé un emploi ?</b><p>Ton annonce : ${esc(due.category)} à ${esc(due.city)}.</p><div class="acts"><button class="btn" type="button" data-rf="${due.id}">Oui, j’ai trouvé ✅</button><button class="btn ghost" type="button" data-rn="${due.id}">Pas encore</button></div></div>`;
}
$("rem").addEventListener("click",async e=>{
  const g=k=>e.target.closest("["+k+"]"),f=g("data-rf"),n=g("data-rn"),ed=g("data-re");
  if(f){await sb.from("posts").update({status:"trouve"}).eq("id",f.dataset.rf);load()}
  if(n){await sb.from("posts").update({last_check:new Date().toISOString()}).eq("id",n.dataset.rn);sugFor=n.dataset.rn;load()}
  if(ed){editId=ed.dataset.re;sugFor=null;remind();draw();scrollTo(0,$("list").offsetTop)}
  if(g("data-rc")){sugFor=null;remind()}
});
sb.auth.onAuthStateChange((_,s)=>{me=s?s.user:null;ui()});
load();
if("serviceWorker"in navigator)navigator.serviceWorker.register("sw.js").catch(()=>{});
  
