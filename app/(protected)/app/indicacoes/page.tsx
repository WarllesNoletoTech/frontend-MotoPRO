'use client';
import {useEffect,useState} from 'react';
import {Gift,Copy,Send,Users,Wallet,CheckCircle2} from 'lucide-react';
import {api,formatMoney} from '@/lib/api';
import {PageHeader,Panel,Loading,Notice,Empty} from '@/components/UI';

type Referral={id:string;name:string;createdAt:string;status:'pending'|'available'|'paid'|'reversed';amountCents:number};
type ReferralData={code:string;bonusCents:number;totalInvited:number;rewardedCount:number;availableCents:number;paidCents:number;items:Referral[]};
const labels={pending:'Aguardando o 1º pagamento',available:'Bônus liberado',paid:'Bônus repassado',reversed:'Pagamento estornado'};
export default function ReferralsPage(){
 const [data,setData]=useState<ReferralData|null>(null),[error,setError]=useState(''),[copied,setCopied]=useState(false);
 const [url,setUrl]=useState('');
 useEffect(()=>{let active=true;api<ReferralData>('/referrals/me').then(r=>{if(active){setData(r);setUrl(`${window.location.origin}/cadastro?ref=${r.code}`);}}).catch(e=>{if(active)setError(e instanceof Error?e.message:'Não foi possível consultar suas indicações');});return()=>{active=false;};},[]);
 const copy=async()=>{try{await navigator.clipboard.writeText(url);setCopied(true);}catch{setError('Não foi possível copiar automaticamente. Selecione e copie o link abaixo.');}};
 const share=()=>{const msg=`Estou usando o MotoPRO para organizar meus ganhos como motoboy. Cadastre-se pelo meu link: ${url}`;window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`,'_blank','noopener,noreferrer');};
 return <>
  <PageHeader eyebrow="MOTOPRO • CONVITES" title="Indique e ganhe" description="Ganhe R$ 5 por cada novo motoboy indicado que concluir o primeiro pagamento da assinatura."/>
  {error&&<Notice kind="error">{error}</Notice>}
  {!data&&!error?<Loading/>:data&&<>
   <div className="referral-stats">
    <div className="admin-stat"><Users size={20}/><small>Indicações cadastradas</small><strong>{data.totalInvited}</strong></div>
    <div className="admin-stat"><Gift size={20}/><small>Indicações premiadas</small><strong>{data.rewardedCount}</strong></div>
    <div className="admin-stat"><Wallet size={20}/><small>Disponível para receber</small><strong>{formatMoney(data.availableCents)}</strong></div>
    <div className="admin-stat"><CheckCircle2 size={20}/><small>Já repassado</small><strong>{formatMoney(data.paidCents)}</strong></div>
   </div>
   <Panel title="Seu link de indicação" subtitle="Envie para amigos que ainda não possuem conta no MotoPRO">
    <div className="referral-code"><span>Código exclusivo</span><strong>{data.code}</strong></div>
    <div className="referral-url"><input className="input" readOnly value={url} aria-label="Meu link de indicação" onFocus={e=>e.target.select()}/><button className="btn secondary" onClick={()=>void copy()}><Copy size={16}/>{copied?'Copiado!':'Copiar'}</button></div>
    <button className="btn referral-share" onClick={share}><Send size={17}/> Compartilhar no WhatsApp</button>
    <p className="admin-small">O indicado precisa fazer um cadastro novo usando seu link ou código. O prêmio de {formatMoney(data.bonusCents)} é gerado somente quando o Mercado Pago confirma o primeiro pagamento. O administrador realiza o repasse fora do aplicativo; o saldo exibido não é uma transferência automática.</p>
   </Panel>
   <Panel title="Minhas indicações" subtitle="Status das pessoas convidadas" >
    {!data.items.length?<Empty message="Você ainda não indicou ninguém. Compartilhe seu link para começar."/>:<div className="admin-table-wrap"><table className="admin-table referral-history"><thead><tr><th>Indicado</th><th>Cadastro</th><th>Status</th><th>Bônus</th></tr></thead><tbody>{data.items.map(r=><tr key={r.id}><td><strong>{r.name}</strong></td><td>{new Date(r.createdAt).toLocaleDateString('pt-BR')}</td><td><span className={`admin-status ${r.status==='available'||r.status==='paid'?'good':'warning'}`}>{labels[r.status]}</span></td><td>{r.amountCents?formatMoney(r.amountCents):'—'}</td></tr>)}</tbody></table></div>}
    {data.totalInvited>data.items.length&&<p className="admin-small">Exibindo as {data.items.length} indicações mais recentes de {data.totalInvited}.</p>}
   </Panel>
  </>}
 </>;
}
