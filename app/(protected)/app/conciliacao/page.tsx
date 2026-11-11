'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {GitCompareArrows,RefreshCcw,AlertTriangle} from 'lucide-react';
import {PageHeader,Panel,Notice,Loading,Empty} from '@/components/UI';
import {api,formatMoney,todayLocal} from '@/lib/api';
type Daily={date:string;importedCents:number;manualCents:number;importedCount:number;manualCount:number};
type Duplicate={occurredOn:string;amountCents:number;manualId:string;integrationId:string};
type Reconciliation={period:{from:string;to:string};linked:boolean;importedCents:number;manualCents:number;importedCount:number;manualCount:number;possibleDuplicateCount:number;possibleDuplicates:Duplicate[];days:Daily[]};
const monthBack=(days:number)=>{const d=new Date();d.setDate(d.getDate()-days);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
export default function ReconciliationPage(){
 const [from,setFrom]=useState(monthBack(29)),[to,setTo]=useState(todayLocal());
 const [data,setData]=useState<Reconciliation|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState('');
 const load=async()=>{setLoading(true);setError('');try{setData(await api<Reconciliation>(`/reconciliation?from=${from}&to=${to}`));}catch(e){setError((e as Error).message);}finally{setLoading(false);}};
 useEffect(()=>{void load();},[]);
 return <><PageHeader eyebrow="FASE 2 · CONFERÊNCIA FINANCEIRA" title="Conciliação com Rappidex" description="Compare ganhos importados e registros manuais sem alterar dados automaticamente."/>
 <Panel title="Período da conferência" subtitle="Até 31 dias, usando lançamentos já sincronizados"><form className="stack" onSubmit={e=>{e.preventDefault();void load();}}>
 <div className="form-grid"><div className="field"><label htmlFor="rec-from">De</label><input className="input" id="rec-from" type="date" required value={from} max={todayLocal()} onChange={e=>setFrom(e.target.value)}/></div>
 <div className="field"><label htmlFor="rec-to">Até</label><input className="input" id="rec-to" type="date" required value={to} max={todayLocal()} onChange={e=>setTo(e.target.value)}/></div></div>
 <button className="btn" disabled={loading}><RefreshCcw size={16}/> Conferir lançamentos</button></form></Panel>
 {error&&<Notice kind="error">{error}</Notice>}
 {loading?<Loading/>:data&&<div className="stack" style={{marginTop:16}}>
  {!data.linked&&<Notice kind="error">Sua conta Rappidex não está vinculada. <Link href="/app/integracoes">Conectar Rappidex</Link> para conferir ganhos importados.</Notice>}
  <div className="admin-stat-grid"><div className="admin-stat"><small>Ganhos importados · Rappidex</small><strong>{formatMoney(data.importedCents)}</strong><small>{data.importedCount} registros</small></div><div className="admin-stat"><small>Ganhos manuais · entregas</small><strong>{formatMoney(data.manualCents)}</strong><small>{data.manualCount} registros</small></div><div className="admin-stat"><small>Possíveis duplicidades</small><strong>{data.possibleDuplicateCount}</strong><small>Requerem conferência</small></div></div>
  <Panel title="Registros que merecem atenção" subtitle="Mesma data e mesmo valor, em um registro manual e outro importado">
   {data.possibleDuplicates.length?data.possibleDuplicates.map((d,i)=><div className="activity-row" key={`${d.manualId}-${i}`}><span className="badge-icon"><AlertTriangle size={18}/></span><div><strong>{formatMoney(d.amountCents)}</strong><small>{d.occurredOn.split('-').reverse().join('/')} · possível repetição</small></div></div>):<Empty message="Nenhuma coincidência exata encontrada neste período."/>}
   <p className="field-hint">Coincidência de valor e data não significa necessariamente duplicação. Confira as entregas antes de excluir lançamentos.</p>
   <Link className="btn secondary" href="/app/lancamentos"><GitCompareArrows size={16}/> Revisar no financeiro</Link>
  </Panel>
  <Panel title="Ganhos registrados por dia" subtitle="Somente receitas na categoria Entregas"><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Data</th><th>Importado</th><th>Manual</th><th>Quantidade</th></tr></thead><tbody>{data.days.map(d=><tr key={d.date}><td>{d.date.split('-').reverse().join('/')}</td><td>{formatMoney(d.importedCents)}</td><td>{formatMoney(d.manualCents)}</td><td>{d.importedCount} + {d.manualCount}</td></tr>)}</tbody></table></div>{!data.days.length&&<Empty message="Nenhuma entrega neste período."/>}</Panel>
  <p className="field-hint">Estes números vêm dos lançamentos no MotoPRO, não de uma consulta bancária em tempo real. Para atualizar valores do Rappidex, sincronize na aba Integrações. Nada é apagado automaticamente.</p>
 </div>}
 </>;
}
