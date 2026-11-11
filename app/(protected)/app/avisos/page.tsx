'use client';
import {useCallback,useEffect,useState} from 'react';
import Link from 'next/link';
import {Bell,RefreshCw,ChevronRight,CalendarClock,AlertTriangle} from 'lucide-react';
import {PageHeader,Panel,Notice,Empty,Loading} from '@/components/UI';
import {api,dateLabel} from '@/lib/api';
type Alert={id:string;level:'warning'|'info';title:string;description:string;href:string;dueOn?:string};
type Payload={today:string;count:number;items:Alert[];truncated:boolean};
export default function AlertsPage(){
 const [payload,setPayload]=useState<Payload|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(true);
 const load=useCallback(async()=>{setLoading(true);setError('');try{setPayload(await api<Payload>('/avisos'));}catch(e){setError((e as Error).message);}finally{setLoading(false);}},[]);
 useEffect(()=>{void load();},[load]);
 return <>
  <PageHeader eyebrow="FASE 4 · ORGANIZAÇÃO" title="Central de avisos" description="Prazos de manutenção, próximas despesas e recebimentos particulares, tudo em um lugar." actions={<button className="btn secondary" onClick={()=>void load()} disabled={loading}><RefreshCw size={16}/> Atualizar</button>}/>
  {error&&<Notice kind="error">{error}</Notice>}
  <Panel title="O que merece atenção" subtitle="Avisos calculados com seus registros. Não há monitoramento em segundo plano nem notificações push.">
   {loading?<Loading/>:!payload?.items.length?<Empty message="Nenhuma pendência identificada nos seus registros neste momento."/>:<div className="stack-sm">{payload.items.map(item=><Link key={item.id} className="phase4-alert-item" href={item.href}><span className={`phase4-alert-icon ${item.level}`}>{item.level==='warning'?<AlertTriangle size={20}/>:<Bell size={20}/>}</span><span className="phase4-alert-body"><strong>{item.title}</strong><small>{item.description}</small>{item.dueOn&&<small><CalendarClock size={13} style={{verticalAlign:'middle'}}/> {dateLabel(item.dueOn)}</small>}</span><ChevronRight size={18}/></Link>)}</div>}
   {payload?.truncated&&<p className="tiny-note">Existem mais avisos. Resolva as pendências exibidas e atualize.</p>}
  </Panel>
  <p className="tiny-note phase4-note">Os avisos não substituem manutenção técnica, conferência de pagamentos ou lembretes externos. Os dados são consultados quando você abre esta página.</p>
 </>;
}
