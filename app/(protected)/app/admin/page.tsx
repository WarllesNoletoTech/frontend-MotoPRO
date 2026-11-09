'use client';
import {useEffect,useState} from 'react';
import {Users,Wallet,ShieldCheck,Gift} from 'lucide-react';
import {PageHeader,Panel,Loading,Notice} from '@/components/UI';
import {api,formatMoney} from '@/lib/api';
type Admin={users:number;activeSubscribers:number;receivedCents:number;approvedPayments:number;weeklyPriceCents:number;monthlyCampaign:{status:string;message:string}};
export default function AdminBillingPage(){
 const [data,setData]=useState<Admin|null>(null);const [error,setError]=useState('');
 useEffect(()=>{api<Admin>('/admin/billing/overview').then(setData).catch(e=>setError(e instanceof Error?e.message:'Acesso restrito'));},[]);
 return <><PageHeader eyebrow="ADMINISTRADOR" title="Financeiro MotoPRO" description="Visão de assinaturas e pagamentos aprovados. Acesso restrito."/>
 {error?<Notice kind="error">{error}</Notice>:!data?<Loading/>:<><div className="grid-cards">{[
 {label:'Contas cadastradas',value:String(data.users),Icon:Users},
 {label:'Assinaturas ativas',value:String(data.activeSubscribers),Icon:ShieldCheck},
 {label:'Receita Pix aprovada',value:formatMoney(data.receivedCents),Icon:Wallet}
 ].map(({label,value,Icon})=><div key={label} className="metric"><Icon className="metric-icon"/><span className="metric-label">{label}</span><strong className="metric-value">{value}</strong></div>)}</div>
 <div className="two-col"><Panel title="Conciliação" subtitle="Recebimentos Pix confirmados pelo Mercado Pago"><p>{data.approvedPayments} pagamentos aprovados registrados.</p><p className="text-muted" style={{marginTop:8,fontSize:12}}>Assinaturas de cartão têm conciliação própria. Este indicador não representa receita total de cartões.</p></Panel>
 <Panel title="Campanhas e premiações" subtitle="Área de planejamento"><div className="integration-item"><Gift color="#39e5a5"/><div><strong>Em preparação</strong><small>{data.monthlyCampaign.message}</small></div></div></Panel></div></>}
 </>;
}
