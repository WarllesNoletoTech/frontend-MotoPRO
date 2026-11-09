'use client';
import {useCallback,useEffect,useState} from 'react';
import {QrCode,ShieldCheck,RotateCcw,Crown,Copy,Check,CheckCircle2,Clock3,CalendarClock,AlertCircle} from 'lucide-react';
import {PageHeader,Panel,Notice,Loading} from '@/components/UI';
import {api} from '@/lib/api';
import {readBillingStatus,type BillingStatus} from '@/lib/billingContract';

type Status=BillingStatus;
const money=(cents:number)=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(cents/100);
export default function SubscriptionPage(){
 const [state,setState]=useState<Status|null>(null);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const [busy,setBusy]=useState('');
 const [message,setMessage]=useState('');
 const [copied,setCopied]=useState(false);
 const [benefits,setBenefits]=useState<string[]>([]);
 const load=useCallback(async()=>{setLoading(true);try{setState(readBillingStatus(await api<unknown>('/billing/me')));setError('');}catch(e){setState(null);setError(e instanceof Error?e.message:'Falha ao obter assinatura');}finally{setLoading(false);}},[]);
 useEffect(()=>{void load();api<{premiumBenefits?:unknown}>('/public/settings').then(r=>setBenefits(Array.isArray(r.premiumBenefits)?r.premiumBenefits.filter((item):item is string=>typeof item==='string'):[])).catch(()=>setBenefits([]));},[load]);
 // Enquanto houver Pix pendente, o frontend consulta a API periodicamente.
 // O backend consulta o Mercado Pago e confere valor, referência e status antes de aprovar.
 useEffect(()=>{
  const pending=state?.pendingPix;
  if(!pending?.id || !state?.billingEnabled || state.latestPix?.status!=='pending')return;
  if(pending.expiresAt && new Date(pending.expiresAt).getTime()<=Date.now())return;
  let stopped=false;
  let inFlight=false;
  let timer:ReturnType<typeof setTimeout>|undefined;
  const tick=async()=>{
   if(stopped||inFlight||document.visibilityState!=='visible')return;
   if(pending.expiresAt && new Date(pending.expiresAt).getTime()<=Date.now()){
    setState(current=>current?{...current}:current);
    return;
   }
   inFlight=true;
   try{
    await api<{ok:boolean}>('/billing/refresh',{method:'POST'});
    const updated=readBillingStatus(await api<unknown>('/billing/me'));
    if(!stopped){
     setState(updated);
     if(updated.latestPix?.status==='approved')setMessage('');
    }
   }catch{
    // Falhas temporárias não confirmam pagamento; o usuário pode conferir manualmente.
   }finally{
    inFlight=false;
    if(!stopped)timer=setTimeout(tick,6500);
   }
  };
  const onVisible=()=>{
   if(document.visibilityState==='visible'&&!inFlight){
    if(timer)clearTimeout(timer);
    void tick();
   }
  };
  timer=setTimeout(tick,4500);
  document.addEventListener('visibilitychange',onVisible);
  return()=>{stopped=true;if(timer)clearTimeout(timer);document.removeEventListener('visibilitychange',onVisible);};
 },[state?.pendingPix?.id,state?.pendingPix?.expiresAt,state?.billingEnabled,state?.latestPix?.status]);
 const call=async(path:string)=>{
  setError('');setMessage('');setBusy(path);
  try{
   await api<unknown>(path,{method:'POST'});
   const updated=readBillingStatus(await api<unknown>('/billing/me'));
   setState(updated);
   if(path==='/billing/pix')setMessage('Pix gerado. A confirmação será verificada automaticamente.');
   else if(path==='/billing/refresh' && updated.latestPix?.status==='pending')setMessage('Pagamento ainda pendente. Vamos continuar verificando automaticamente.');
  }catch(e){setError(e instanceof Error?e.message:'Não foi possível completar a operação');}finally{setBusy('');}
 };
 const copy=async()=>{if(state?.pendingPix?.code){await navigator.clipboard.writeText(state.pendingPix.code);setCopied(true);window.setTimeout(()=>setCopied(false),2000);}};
 const approvedPix=state?.latestPix?.status==='approved' && state.subscription?.active===true && state.subscription.method==='pix';
 const pendingPix=state?.pendingPix && state.latestPix?.status==='pending' ? state.pendingPix:null;
 const expiredPix=!!pendingPix?.expiresAt && new Date(pendingPix.expiresAt).getTime()<=Date.now();
 return <><PageHeader eyebrow="MOTOPRO PREMIUM" title="Sua assinatura" description="Acesso Premium por 7 dias após cada Pix confirmado. Acompanhe pagamentos e validade." />
 {!state?(loading?<Loading/>:<section className="premium-gate" role="alert"><div className="premium-gate-symbol"><AlertCircle size={34}/></div><h2>Não foi possível consultar seu pagamento</h2><p>Não foi possível confirmar sua assinatura. Isso não significa que ela venceu. Caso o problema seja uma atualização pendente no Heroku, o administrador deverá publicar o backend compatível antes de tentar novamente.</p>{error&&<div className="premium-gate-error">{error}</div>}<button className="btn wide" onClick={()=>void load()}><RotateCcw size={17}/> Tentar novamente</button></section>):<div className="two-col">
  <Panel title="Premium" subtitle="Ferramentas adicionais para entregadores">
   <div className="payment-price">{money(state.plan.priceCents)} <span>/ semana</span></div>
   <div style={{margin:'12px 0 20px',fontSize:13,color:'var(--muted)'}}>Cada pagamento Pix confirmado concede 7 dias de Premium. Renovação manual, sem débito automático.</div>
   {state.notice&&<div role="status" className={`renewal-alert ${state.notice.status}`}>
    <div className="renewal-alert-icon">{state.notice.status==='expiring'?<Clock3 size={20}/>:state.notice.status==='expired'?<CalendarClock size={20}/>:<ShieldCheck size={20}/>}</div>
    <div><strong>{state.notice.title}</strong><small>{state.notice.message}</small>{state.notice.activeUntil&&<small>Validade: {new Date(state.notice.activeUntil).toLocaleDateString('pt-BR')}{state.notice.remainingDays!==null?` · ${state.notice.remainingDays} dia(s) restante(s)`:''}</small>}</div>
   </div>}
   {(benefits.length?benefits:['Controle financeiro pessoal e metas','Gestão da moto','Assistente inteligente']).map(x=><div className="feature-check" key={x}><Check size={17}/> {x}</div>)}
   <div style={{marginTop:20}}><Notice kind={state.subscription?.active||state.courtesyUntil?'success':'info'}>{state.courtesyUntil&&new Date(state.courtesyUntil)>new Date()?`Cortesia ativa até ${new Date(state.courtesyUntil).toLocaleDateString('pt-BR')}.`:state.subscription?.active?`Premium ativo até ${new Date(state.subscription.activeUntil!).toLocaleDateString('pt-BR')}.`:state.subscription?.status==='pending'?'Pagamento aguardando confirmação.':'O acesso Premium será liberado somente após pagamento confirmado.'}</Notice></div>
   {error&&<div style={{marginTop:13}}><Notice kind="error">{error}</Notice></div>}
   {message&&<div style={{marginTop:13}}><Notice kind="info">{message}</Notice></div>}
  </Panel>
  <Panel title="Pagamento por Pix" subtitle="Única forma de pagamento nesta fase">
   {state.notice.status==='expired'&&<div className="pix-subscription-prompt expired" role="status"><CalendarClock size={24}/><div><strong>Sua assinatura venceu</strong><span>Seu acesso Premium expirou. Gere um Pix para renovar por mais 7 dias e liberar novamente todos os recursos do MotoPRO.</span></div></div>}
   {state.notice.status==='none'&&<div className="pix-subscription-prompt none" role="status"><QrCode size={24}/><div><strong>Você ainda não ativou sua assinatura</strong><span>Faça o primeiro pagamento de {money(state.plan.priceCents)} pelo Pix para desbloquear todos os recursos do MotoPRO por 7 dias.</span></div></div>}
   {state.notice.status==='expiring'&&<div className="pix-subscription-prompt expiring" role="status"><Clock3 size={24}/><div><strong>Seu Premium está perto de vencer</strong><span>Renove pelo Pix agora para acrescentar 7 dias sem perder o período restante.</span></div></div>}
   {approvedPix&&<div className="pix-approved" role="status" aria-live="polite">
     <div className="pix-approved-mark"><CheckCircle2 size={53} strokeWidth={2.1}/></div>
     <strong>Pagamento confirmado!</strong>
     <span>Seu Pix de {money(state.latestPix!.amountCents)} foi aprovado pelo Mercado Pago.</span>
     <div className="pix-approved-validity"><ShieldCheck size={18}/> Premium liberado até {new Date(state.subscription!.activeUntil!).toLocaleDateString('pt-BR')}</div>
     {state.latestPix?.paidAt&&<small>Confirmado em {new Date(state.latestPix.paidAt).toLocaleString('pt-BR')}</small>}
   </div>}
   {pendingPix&&!expiredPix&&<div className="pix-awaiting" role="status" aria-live="polite">
     <Clock3 size={21} className="pix-clock"/>
     <div><strong>Aguardando pagamento</strong><small>Assim que o Mercado Pago confirmar, aparecerá um OK verde nesta tela. Verificação automática ativada.</small></div>
   </div>}
   {expiredPix&&<Notice kind="info">Este QR Code venceu. Você pode gerar um novo Pix para continuar.</Notice>}
   <div className="stack">
    <div className="integration-item"><QrCode color="#39e5a5"/><div><strong>Pix</strong><small>Renovação manual a cada 7 dias, com liberação após confirmação do Pix.</small></div></div>
    {!state.renewalAllowed&&<Notice kind="info">Sua assinatura ainda tem mais de 48 horas. A renovação ficará disponível nos últimos dois dias de validade.</Notice>}
    <button className="btn wide" disabled={!state.billingEnabled||!!busy||!state.renewalAllowed} onClick={()=>call('/billing/pix')}><QrCode size={17}/> {busy==='/billing/pix'?'Gerando cobrança...':state.notice.status==='expired'?`Gerar Pix para renovar · ${money(state.plan.priceCents)}`:state.notice.status==='none'?`Gerar Pix e ativar · ${money(state.plan.priceCents)}`:`Gerar Pix de ${money(state.plan.priceCents)}`}</button>
    {pendingPix?.code&&!expiredPix&&<div className="pix-result">
      <strong>Seu Pix</strong><small>Confirme o pagamento no aplicativo do banco. O acesso é liberado após validação.</small>
      {pendingPix.qrCodeBase64&&<img src={`data:image/png;base64,${pendingPix.qrCodeBase64}`} alt="QR Code do Pix" width={170} height={170}/>}
      <div className="pix-code">{pendingPix.code}</div><button className="btn secondary wide" onClick={copy}>{copied?<Check size={16}/>:<Copy size={16}/>} {copied?'Copiado':'Copiar Pix'}</button>
      {pendingPix.expiresAt&&<small>Válido até {new Date(pendingPix.expiresAt).toLocaleString('pt-BR')}</small>}
    </div>}
    <button className="btn outline wide" disabled={!state.billingEnabled||!!busy} onClick={()=>call('/billing/refresh')}><RotateCcw size={17}/> Verificar confirmação do pagamento</button>
    {state.subscription?.method==='credit'&&!state.subscription.cancelAtPeriodEnd&&<button className="btn danger wide" disabled={!state.billingEnabled||!!busy} onClick={()=>{if(window.confirm('Cancelar futuras cobranças no crédito?'))void call('/billing/cancel');}}>Cancelar renovação automática</button>}
    {!state.billingEnabled&&<Notice>Os pagamentos estão em homologação. Nenhuma cobrança será iniciada até a configuração ser habilitada pelo administrador.</Notice>}
    <div style={{display:'flex',gap:9,alignItems:'flex-start',fontSize:12,color:'var(--muted)'}}><ShieldCheck size={17}/><span>O pagamento Pix é gerado pelo Mercado Pago. Confira o valor e os dados do destinatário antes de pagar.</span></div>
   </div>
  </Panel>
 </div>}
 <div style={{marginTop:18}}><Panel title="Premiação e benefícios" subtitle="Campanhas e recompensas do MotoPRO"><div className="integration-item"><Crown color="#39e5a5"/><div><strong>Premiação mensal em preparação</strong><small>O prêmio, o regulamento e eventuais autorizações legais serão divulgados antes de qualquer campanha. A assinatura não concede automaticamente participação em sorteios.</small></div></div><div className="integration-item" style={{marginTop:12}}><CalendarClock color="#39e5a5"/><div><strong>Transparência</strong><small>Nenhum sorteio está ativo, e o aplicativo não faz seleção aleatória de ganhadores.</small></div></div></Panel></div>
 </>;
}
