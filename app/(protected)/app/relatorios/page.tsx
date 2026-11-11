'use client';
import {useEffect,useState} from 'react';
import {ClipboardCopy,FileDown,RefreshCw,Share2} from 'lucide-react';
import {api,formatMoney,dateLabel,categoryLabel} from '@/lib/api';
import {PageHeader,Panel,Notice,Loading,Empty} from '@/components/UI';

type Report={period:{from:string;to:string};generatedAt:string;incomeCents:number;expenseCents:number;profitCents:number;
 previousProfitCents:number;profitChangeCents:number;entriesCount:number;integratedCount:number;
 categories:{type:string;category:string;totalCents:number;count:number}[];
 byDay:{day:string;incomeCents:number;expenseCents:number}[];message:string};
const label=(r:Report)=>`${dateLabel(r.period.from)} a ${dateLabel(r.period.to)}`;
const reportText=(r:Report)=>[
 `MotoPRO — Fechamento semanal (${label(r)})`,
 `Ganhos: ${formatMoney(r.incomeCents)}`,
 `Despesas: ${formatMoney(r.expenseCents)}`,
 `Lucro estimado: ${formatMoney(r.profitCents)}`,
 `Lançamentos: ${r.entriesCount} (${r.integratedCount} integrados)`,
 `Diferença de lucro vs. semana anterior: ${formatMoney(r.profitChangeCents)}`,
 'Valores baseados nos registros do aplicativo.'
].join('\n');

export default function ReportsPage(){
 const [weeksAgo,setWeeksAgo]=useState(1),[report,setReport]=useState<Report|null>(null);
 const [loading,setLoading]=useState(true),[error,setError]=useState(''),[message,setMessage]=useState('');
 useEffect(()=>{
  let active=true;setLoading(true);setError('');
  api<Report>(`/reports/weekly?weeksAgo=${weeksAgo}`).then(r=>{if(active)setReport(r);})
   .catch(e=>{if(active){setError(e instanceof Error?e.message:'Falha ao carregar relatório');setReport(null);}})
   .finally(()=>{if(active)setLoading(false);});
  return()=>{active=false;};
 },[weeksAgo]);
 const copy=async()=>{if(!report)return;try{await navigator.clipboard.writeText(reportText(report));setMessage('Resumo copiado.');}catch{setError('Não foi possível copiar. Use o compartilhamento.');}};
 const exportCsv=()=>{
  if(!report)return;
  const quote=(s:string)=>`"${s.replace(/"/g,'""')}"`;
  const rows=[['Categoria','Tipo','Quantidade','Valor (R$)'].join(';'),
   ...report.categories.map(c=>[categoryLabel(c.category),c.type==='income'?'Receita':'Despesa',String(c.count),(c.totalCents/100).toFixed(2).replace('.',',')].map(quote).join(';'))];
  const blob=new Blob(['\ufeff'+rows.join('\r\n')],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`motopro-fechamento-${report.period.from}.csv`;link.click();URL.revokeObjectURL(url);
 };
 return <>
  <PageHeader eyebrow="SEU FECHAMENTO FINANCEIRO" title="Relatório semanal" description="Relatórios calculados automaticamente a partir dos lançamentos, de terça a segunda-feira."/>
  <Panel title="Selecionar período" subtitle="Por padrão, mostramos a última semana concluída">
   <div className="admin-toolbar">
    <label>Semana
     <select className="select" value={weeksAgo} onChange={e=>{setWeeksAgo(Number(e.target.value));setMessage('');}}>
      <option value={0}>Semana atual (parcial)</option>
      {Array.from({length:12},(_,i)=><option key={i+1} value={i+1}>{i===0?'Última semana concluída':`${i+1} semanas atrás`}</option>)}
     </select>
    </label>
    <button className="btn secondary" onClick={()=>setWeeksAgo(v=>v===0?1:0)}><RefreshCw size={16}/> Alternar atual/anterior</button>
   </div>
  </Panel>
  {error&&<Notice kind="error">{error}</Notice>}
  {message&&<Notice kind="success">{message}</Notice>}
  {loading?<Loading/>:report&&<>
   <div className="admin-stat-grid">
    <div className="admin-stat"><small>Ganhos · {label(report)}</small><strong>{formatMoney(report.incomeCents)}</strong></div>
    <div className="admin-stat"><small>Despesas</small><strong>{formatMoney(report.expenseCents)}</strong></div>
    <div className="admin-stat"><small>Lucro estimado</small><strong>{formatMoney(report.profitCents)}</strong></div>
    <div className="admin-stat"><small>Variação vs. semana anterior</small><strong>{formatMoney(report.profitChangeCents)}</strong></div>
    <div className="admin-stat"><small>Lançamentos</small><strong>{report.entriesCount}</strong></div>
    <div className="admin-stat"><small>Importados automaticamente</small><strong>{report.integratedCount}</strong></div>
   </div>
   <Panel title="Detalhamento por categoria" subtitle="Valores agrupados conforme os lançamentos">
    {!report.categories.length?<Empty message="Sem lançamentos nesse período"/>:
     <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Categoria</th><th>Tipo</th><th>Quantidade</th><th>Total</th></tr></thead><tbody>
      {report.categories.map((c,i)=><tr key={i}><td>{categoryLabel(c.category)}</td><td>{c.type==='income'?'Receita':'Despesa'}</td><td>{c.count}</td><td>{formatMoney(c.totalCents)}</td></tr>)}
     </tbody></table></div>}
    <div className="admin-actions">
     <button className="btn secondary" onClick={()=>void copy()}><ClipboardCopy size={16}/> Copiar resumo</button>
     <button className="btn secondary" onClick={exportCsv}><FileDown size={16}/> Exportar CSV</button>
     <a className="btn secondary" href={`https://wa.me/?text=${encodeURIComponent(reportText(report))}`} target="_blank" rel="noopener noreferrer"><Share2 size={16}/> Compartilhar WhatsApp</a>
    </div>
   </Panel>
   <p className="tiny-note">{report.message} A geração ocorre ao abrir a página; envio agendado ainda não está configurado.</p>
  </>}
 </>;
}
