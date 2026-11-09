'use client';
import {useCallback,useEffect,useState} from 'react';
import {QrCode,ShieldCheck,RotateCcw,Crown,Copy,Check,CalendarClock} from 'lucide-react';
import {PageHeader,Panel,Notice,Loading} from '@/components/UI';
import {api} from '@/lib/api';

type Status={courtesyUntil?:string|null;plan:{priceCents:number;frequency:number;frequencyUnit:string;pixAutomaticAvailable:boolean};billingEnabled:boolean;subscription:null|{method:'pix'|'credit';status:string;activeUntil?:string;active:boolean;cancelAtPeriodEnd:boolean};pendingPix:null|{id:string;code?:string;qrCodeBase64?:string;ticketUrl?:string;expiresAt?:string}};
const money=(cents:number)=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(cents/100);
export default function SubscriptionPage(){
 const [state,setState]=useState<Status|null>(null);
 const [error,setError]=useState('');
 const [busy,setBusy]=useState('');
 const [message,setMessage]=useState('');
 const [copied,setCopied]=useState(false);
 const [benefits,setBenefits]=useState<string[]>([]);
 const load=useCallback(async()=>{try{setState(await api<Status>('/billing/me'));}catch(e){setError(e instanceof Error?e.message:'Falha ao obter assinatura');}},[]);
 useEffect(()=>{void load();api<{premiumBenefits:string[]}>('/public/settings').then(r=>setBenefits(r.premiumBenefits)).catch(()=>{});},[load]);
 const call=async(path:string)=>{
  setError('');setMessage('');setBusy(path);
  try{
   const result=await api<{checkoutUrl?:string;message?:string}>(path,{method:'POST'});
   if(result.checkoutUrl){const url=new URL(result.checkoutUrl);if(!['https:'].includes(url.protocol)||!/(^|\.)mercadopago\.com(\.br)?$/.test(url.hostname))throw new Error('Link de pagamento não autorizado');window.location.assign(result.checkoutUrl);return;}
   setMessage(result.message||'Operação realizada.');await load();
  }catch(e){setError(e instanceof Error?e.message:'Não foi possível completar a operação');}finally{setBusy('');}
 };
 const copy=async()=>{if(state?.pendingPix?.code){await navigator.clipboard.writeText(state.pendingPix.code);setCopied(true);window.setTimeout(()=>setCopied(false),2000);}};
 return <><PageHeader eyebrow="MOTOPRO PREMIUM" title="Sua assinatura" description="Acesso Premium por 7 dias após cada Pix confirmado. Acompanhe pagamentos e validade." />
 {!state?<Loading/>:<div className="two-col">
  <Panel title="Premium" subtitle="Ferramentas adicionais para entregadores">
   <div className="payment-price">{money(state.plan.priceCents)} <span>/ semana</span></div>
   <div style={{margin:'12px 0 20px',fontSize:13,color:'var(--muted)'}}>Cada pagamento Pix confirmado concede 7 dias de Premium. Sem renovação automática nem taxa de adesão.</div>
   {(benefits.length?benefits:['Controle financeiro pessoal e metas','Gestão da moto','Assistente inteligente']).map(x=><div className="feature-check" key={x}><Check size={17}/> {x}</div>)}
   <div style={{marginTop:20}}><Notice kind={state.subscription?.active||state.courtesyUntil?'success':'info'}>{state.courtesyUntil&&new Date(state.courtesyUntil)>new Date()?`Cortesia ativa até ${new Date(state.courtesyUntil).toLocaleDateString('pt-BR')}.`:state.subscription?.active?`Premium ativo até ${new Date(state.subscription.activeUntil!).toLocaleDateString('pt-BR')}.`:state.subscription?.status==='pending'?'Pagamento aguardando confirmação.':'O acesso Premium será liberado somente após pagamento confirmado.'}</Notice></div>
   {error&&<div style={{marginTop:13}}><Notice kind="error">{error}</Notice></div>}
   {message&&<div style={{marginTop:13}}><Notice kind="success">{message}</Notice></div>}
  </Panel>
  <Panel title="Pagamento por Pix" subtitle="Única forma de pagamento nesta fase">
   <div className="stack">
    <div className="integration-item"><QrCode color="#39e5a5"/><div><strong>Pix</strong><small>Renovação manual a cada 7 dias, com liberação após confirmação do Pix.</small></div></div>
    <button className="btn wide" disabled={!state.billingEnabled||!!busy||!!state.subscription?.active} onClick={()=>call('/billing/pix')}><QrCode size={17}/> {busy==='/billing/pix'?'Gerando cobrança...':`Gerar Pix de ${money(state.plan.priceCents)}`}</button>
    {state.pendingPix?.code&&<div className="pix-result">
      <strong>Seu Pix</strong><small>Confirme o pagamento no aplicativo do banco. O acesso é liberado após validação.</small>
      {state.pendingPix.qrCodeBase64&&<img src={`data:image/png;base64,${state.pendingPix.qrCodeBase64}`} alt="QR Code do Pix" width={170} height={170}/>}
      <div className="pix-code">{state.pendingPix.code}</div><button className="btn secondary wide" onClick={copy}>{copied?<Check size={16}/>:<Copy size={16}/>} {copied?'Copiado':'Copiar Pix'}</button>
      {state.pendingPix.expiresAt&&<small>Válido até {new Date(state.pendingPix.expiresAt).toLocaleString('pt-BR')}</small>}
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
