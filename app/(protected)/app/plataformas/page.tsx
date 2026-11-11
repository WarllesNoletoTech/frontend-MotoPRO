'use client';
import {useEffect,useState} from 'react';
import {BarChart3,FileDown,Printer,AlertCircle} from 'lucide-react';
import {api,formatMoney,todayLocal} from '@/lib/api';
import {PageHeader,Panel,Notice,Loading,Empty} from '@/components/UI';

type Source={key:string;label:string;amountCents:number;count:number;importedCount:number};
type Month={month:string;incomeCents:number;breakdown:Record<string,number>};
type Response={period:{from:string;to:string};incomeCents:number;expenseCents:number;profitCents:number;disclaimer:string;sources:Source[];months:Month[]};
const initial=()=>{const today=todayLocal();return {from:`${today.slice(0,7)}-01`,to:today};};
const safeCsv=(text:string)=>{const guarded=/^[=+@-]/.test(text)?`'${text}`:text;return `"${guarded.replace(/"/g,'""')}"`;};
export default function PlatformsPage(){
 const [draft,setDraft]=useState(initial),[range,setRange]=useState(initial);
 const [data,setData]=useState<Response|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState('');
 useEffect(()=>{
  let active=true;setLoading(true);setError('');
  api<Response>(`/plataformas?from=${range.from}&to=${range.to}`)
   .then(r=>{if(active)setData(r);}).catch(e=>{if(active){setError((e as Error).message);setData(null);}})
   .finally(()=>{if(active)setLoading(false);});
  return()=>{active=false;};
 },[range]);
 const exportCsv=()=>{
  if(!data)return;
  const rows=[['Plataforma','Total de lançamentos','Total bruto (R$)','Importados'].map(safeCsv).join(';'),
   ...data.sources.map(x=>[x.label,String(x.count),(x.amountCents/100).toFixed(2).replace('.',','),String(x.importedCount)].map(safeCsv).join(';'))];
  const blob=new Blob(['\ufeff'+rows.join('\r\n')],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`motopro-plataformas-${data.period.from}-${data.period.to}.csv`;link.click();URL.revokeObjectURL(url);
 };
 const max=Math.max(1,...(data?.sources.map(s=>s.amountCents)||[]));
 return <>
  <PageHeader eyebrow="FASE 3 · INTELIGÊNCIA FINANCEIRA" title="Ganhos por plataforma" description="Compare seus ganhos registrados no Rappidex, iFood, entregas particulares e outras origens." actions={<div className="phase3-header-actions"><button className="btn secondary" onClick={exportCsv} disabled={!data}><FileDown size={16}/> CSV</button><button className="btn secondary" onClick={()=>window.print()} disabled={!data}><Printer size={16}/> PDF</button></div>}/>
  <Panel title="Período de análise" subtitle="Selecione até 366 dias de registros">
   <form className="phase3-date-form" onSubmit={e=>{e.preventDefault();setRange({...draft});}}><div className="field"><label htmlFor="platform-from">De</label><input id="platform-from" type="date" className="input" max={todayLocal()} required value={draft.from} onChange={e=>setDraft({...draft,from:e.target.value})}/></div><div className="field"><label htmlFor="platform-to">Até</label><input id="platform-to" type="date" className="input" max={todayLocal()} required value={draft.to} onChange={e=>setDraft({...draft,to:e.target.value})}/></div><button className="btn" type="submit"><BarChart3 size={16}/> Consultar</button></form>
  </Panel>
  {error&&<Notice kind="error">{error}</Notice>}
  {loading?<Loading/>:data&&<>
   <div className="admin-stat-grid phase3-stats"><div className="admin-stat"><small>Receitas registradas</small><strong>{formatMoney(data.incomeCents)}</strong></div><div className="admin-stat"><small>Despesas totais</small><strong>{formatMoney(data.expenseCents)}</strong></div><div className="admin-stat"><small>Lucro total estimado</small><strong>{formatMoney(data.profitCents)}</strong></div><div className="admin-stat"><small>Plataformas identificadas</small><strong>{data.sources.length}</strong></div></div>
   <Panel title="Comparativo de receitas" subtitle="Valores brutos por origem, não lucro de cada aplicativo">
    {!data.sources.length?<Empty message="Sem ganhos registrados nesse período."/>:<div className="phase3-bars">{data.sources.map(source=><div className="phase3-bar-row" key={source.key}><div className="row-between"><strong>{source.label}</strong><strong>{formatMoney(source.amountCents)}</strong></div><div className="phase3-bar-track"><span style={{width:`${Math.max(2,source.amountCents/max*100)}%`}}/></div><small>{source.count} lançamento(s) · {source.importedCount} importado(s){source.key==='ifood'?' · registros manuais':''}</small></div>)}</div>}
   </Panel>
   <Panel title="Evolução mensal" subtitle="Total de receitas registradas em cada mês">
    {!data.months.length?<Empty message="Sem dados mensais neste período."/>:<div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Mês</th><th>Receitas</th><th>Principais origens</th></tr></thead><tbody>{data.months.map(m=><tr key={m.month}><td>{m.month.split('-').reverse().join('/')}</td><td>{formatMoney(m.incomeCents)}</td><td>{Object.entries(m.breakdown).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([k,v])=>`${data.sources.find(x=>x.key===k)?.label||k}: ${formatMoney(v)}`).join(' · ')}</td></tr>)}</tbody></table></div>}
   </Panel>
   <Notice><AlertCircle size={16}/> {data.disclaimer}</Notice>
   <p className="tiny-note">Para identificar valores do iFood ou outras plataformas, informe a plataforma ao cadastrar uma receita manual. A integração direta com iFood não faz parte deste módulo. Para PDF, use a impressão do navegador.</p>
  </>}
 </>;
}
