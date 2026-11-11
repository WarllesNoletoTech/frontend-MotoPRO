'use client';
import {useCallback,useEffect,useState} from 'react';
import {ChartNoAxesCombined,ArrowUpRight,ArrowDownRight,CalendarDays} from 'lucide-react';
import {PageHeader,Panel,Loading,Notice,Empty} from '@/components/UI';
import {api,formatMoney,categoryLabel,dateLabel,todayLocal} from '@/lib/api';
type Result={month:string;period:{from:string;to:string};incomeCents:number;expenseCents:number;profitCents:number;byDay:{day:string;incomeCents:number;expenseCents:number}[];previous:{month:string;profitCents:number;incomeCents:number;expenseCents:number};deltaProfitCents:number;activeDays:number;elapsedDays:number;averageProfitPerDayCents:number;deliveryLaunches:number;averageDeliveryEntryCents:number;expenseSharePercent:number|null;breakdown:{type:string;category:string;totalCents:number;count:number}[];note:string};
function months(){const now=todayLocal().slice(0,7);const [year,m]=now.split('-').map(Number);return Array.from({length:5},(_,i)=>{const d=new Date(year,m-1-i,1);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;});}
export default function ProductivityPage(){
 const options=months();const [month,setMonth]=useState(options[0]),[data,setData]=useState<Result|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState('');
 const load=useCallback(async()=>{setLoading(true);setError('');try{setData(await api<Result>(`/produtividade?month=${month}`));}catch(e){setError((e as Error).message);}finally{setLoading(false);}},[month]);
 useEffect(()=>{void load();},[load]);
 const max=Math.max(1,...(data?.byDay.map(d=>d.incomeCents)||[]));
 return <>
  <PageHeader eyebrow="FASE 4 · ANÁLISE PESSOAL" title="Minha produtividade" description="Analise receitas, despesas e resultado estimado para planejar suas finanças com mais clareza." actions={<label className="phase4-month-picker">Mês <select className="select" aria-label="Selecionar mês" value={month} onChange={e=>setMonth(e.target.value)}>{options.map(m=><option key={m} value={m}>{m.slice(5)}/{m.slice(0,4)}</option>)}</select></label>}/>
  {error&&<Notice kind="error">{error}</Notice>}
  {loading?<Loading/>:data?<>
   <div className="admin-stat-grid phase4-stats">
    <div className="admin-stat"><small>Resultado estimado</small><strong>{formatMoney(data.profitCents)}</strong></div>
    <div className="admin-stat"><small>Receitas</small><strong>{formatMoney(data.incomeCents)}</strong></div>
    <div className="admin-stat"><small>Despesas</small><strong>{formatMoney(data.expenseCents)}</strong></div>
    <div className="admin-stat"><small>Diferença para mês anterior</small><strong>{data.deltaProfitCents>=0?<ArrowUpRight size={16}/>:<ArrowDownRight size={16}/>} {formatMoney(data.deltaProfitCents)}</strong></div>
   </div>
   <div className="two-col phase4-panels">
    <Panel title="Ganhos por dia" subtitle={`${dateLabel(data.period.from)} a ${dateLabel(data.period.to)} · receita bruta`}>
     <div className="phase4-chart-scroll"><div className="bar-chart phase4-chart">{data.byDay.map(d=><div className="bar-item" key={d.day} title={`${d.day}: ${formatMoney(d.incomeCents)}`}><div className="bar" style={{height:`${Math.max(2,d.incomeCents/max*100)}%`}}/><span className="bar-label">{d.day.slice(-2)}</span></div>)}</div></div>
     <p className="tiny-note">Os valores mostram lançamentos por dia. Não medem horas de trabalho nem velocidade nas entregas.</p>
    </Panel>
    <Panel title="Resumo do período" subtitle="Médias baseadas somente nos registros que você cadastrou ou importou.">
     <div className="stack-sm"><div className="row-between"><span><CalendarDays size={16} style={{verticalAlign:'middle'}}/> Dias com registros</span><strong>{data.activeDays} / {data.elapsedDays}</strong></div><div className="row-between"><span>Média diária estimada</span><strong>{formatMoney(data.averageProfitPerDayCents)}</strong></div><div className="row-between"><span>Lançamentos de receita por entrega</span><strong>{data.deliveryLaunches}</strong></div><div className="row-between"><span>Receita média por lançamento de entrega</span><strong>{formatMoney(data.averageDeliveryEntryCents)}</strong></div><div className="row-between"><span>Despesas / receitas</span><strong>{data.expenseSharePercent===null?'Sem receitas':`${data.expenseSharePercent}%`}</strong></div><div className="row-between"><span>Lucro estimado no mês anterior</span><strong>{formatMoney(data.previous.profitCents)}</strong></div></div>
    </Panel>
   </div>
   <Panel title="Valores por categoria" subtitle="Contagem e soma dos lançamentos no mês selecionado">
    {!data.breakdown.length?<Empty message="Nenhum lançamento neste período."/>:<div className="phase4-summary-list">{data.breakdown.map((r,i)=><div key={i} className="row-between phase4-summary-row"><span>{r.type==='income'?'Receita':'Despesa'} · {categoryLabel(r.category)} <small>({r.count})</small></span><strong>{formatMoney(r.totalCents)}</strong></div>)}</div>}
   </Panel>
   <p className="tiny-note phase4-note"><ChartNoAxesCombined size={14} style={{verticalAlign:'middle'}}/> {data.note} O resultado é uma estimativa contábil, não uma previsão ou garantia de faturamento.</p>
  </>:null}
 </>;
}
