'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {ArrowUpRight,ArrowDownRight,Wallet,Plus,Mic,TrendingUp,Fuel,ReceiptText,Target,ArrowRight,RefreshCw} from 'lucide-react';
import {api,formatMoney,dateLabel,categoryLabel,type Dashboard,type Entry} from '@/lib/api';
import {PageHeader,Panel,Loading,Notice,Empty} from '@/components/UI';
export default function DashboardPage(){
 const [data,setData]=useState<Dashboard|null>(null),[entries,setEntries]=useState<Entry[]>([]),[error,setError]=useState('');
 const load=async()=>{setError('');try{await api('/integrations/rappidex/sync',{method:'POST',body:JSON.stringify({})});}catch{/* Integração opcional não bloqueia financeiro manual. */}try{const [d,l]=await Promise.all([api<Dashboard>('/dashboard'),api<{items:Entry[]}>('/entries?limit=5')]);setData(d);setEntries(l.items);}catch(e:any){setError(e.message);}};
 useEffect(()=>{load();},[]);
 const max=Math.max(1,...(data?.byDay.map(d=>d.incomeCents)||[]));
 const goal=data?.goal?.weeklyTargetCents||0;
 const progress=goal?Math.min(100,Math.max(0,Math.round((data?.profitCents||0)/goal*100))):0;
 return <><PageHeader eyebrow="SEU PAINEL" title="Vamos fazer o corre render?" description="Tudo o que importa sobre o seu dinheiro, em um só lugar." actions={<button className="btn secondary" onClick={load}><RefreshCw size={16}/> Atualizar</button>}/>
 {error&&<Notice kind="error">{error}</Notice>}
 {!data?<Loading/>:<>
  <div className="grid-cards">
   <div className="metric primary"><span className="metric-label">Lucro estimado · semana</span><Wallet size={22} className="metric-icon"/><strong className="metric-value">{formatMoney(data.profitCents)}</strong><span className="metric-note">Receitas − despesas registradas</span></div>
   <div className="metric"><span className="metric-label">Ganhos registrados</span><ArrowUpRight size={24} className="metric-icon"/><strong className="metric-value">{formatMoney(data.incomeCents)}</strong><span className="metric-note">Entradas no período</span></div>
   <div className="metric"><span className="metric-label">Despesas registradas</span><ArrowDownRight size={24} className="metric-icon"/><strong className="metric-value">{formatMoney(data.expenseCents)}</strong><span className="metric-note">Gastos informados por você</span></div>
  </div>
  <div className="highlight-strip" style={{marginBottom:19}}><span className="badge-icon"><Mic size={23}/></span><div><strong>Seu financeiro, só na voz.</strong><p>Diga "Abasteci 35 reais" ou "Quanto lucrei essa semana?"</p></div><Link className="btn" href="/app/assistente">Abrir assistente <ArrowRight size={15}/></Link></div>
  <div className="two-col">
   <Panel title="Ganhos por dia" subtitle={`Semana: ${dateLabel(data.period.from)} a ${dateLabel(data.period.to)}`} action={<span className="pill">Terça a segunda</span>}>
    <div className="bar-chart">{data.byDay.map(day=><div className="bar-item" key={day.day} title={`${dateLabel(day.day)} · ${formatMoney(day.incomeCents)}`}><div className="bar" style={{height:`${Math.max(2,day.incomeCents/max*100)}%`}}/><span className="bar-label">{dateLabel(day.day)}</span></div>)}</div>
    <p className="tiny-note">Barras representam receitas, não o lucro líquido.</p>
   </Panel>
   <div className="stack">
    <Panel title="Minha meta" subtitle="Lucro estimado da semana" action={<Target size={19} color="#b88738"/>}>
     {goal?<><div className="row-between"><strong style={{font:'700 27px Outfit'}}>{progress}%</strong><span className="text-muted" style={{fontSize:12}}>Meta de {formatMoney(goal)}</span></div><div className="progress-bar"><div className="progress-fill" style={{width:`${progress}%`}}/></div><div className="progress-info"><span>{formatMoney(Math.max(0,data.profitCents))}</span><span className="text-muted">Faltam {formatMoney(Math.max(0,goal-data.profitCents))}</span></div></>:<><p className="text-muted" style={{fontSize:13,marginBottom:15}}>Defina quanto deseja lucrar por semana e acompanhe sua evolução.</p><Link href="/app/metas" className="btn secondary">Definir meta</Link></>}
    </Panel>
    <Panel title="Acesso rápido"><div className="stack-sm"><Link href="/app/lancamentos" className="btn wide secondary"><Plus size={17}/> Registrar lançamento</Link><Link href="/app/moto" className="btn wide outline"><Fuel size={17}/> Minha moto</Link></div></Panel>
   </div>
  </div>
  <div style={{height:18}}/>
  <Panel title="Últimos lançamentos" subtitle="Seu histórico mais recente" action={<Link href="/app/lancamentos" className="inline-link">Ver todos →</Link>}>
   {!entries.length?<Empty message="Nenhum lançamento ainda. Registre sua primeira entrega!"/>:entries.map(entry=><div key={entry._id} className="activity-row"><span className="badge-icon">{entry.type==='income'?<TrendingUp size={19}/>:<ReceiptText size={19}/>}</span><div><strong>{entry.description||categoryLabel(entry.category)}</strong><small>{categoryLabel(entry.category)} · {dateLabel(entry.occurredOn)}</small></div><span className={`amount ${entry.type==='income'?'text-income':'text-expense'}`}>{entry.type==='income'?'+':'−'} {formatMoney(entry.amountCents)}</span></div>)}
  </Panel>
 </>}
 <div className="page-footer">MotoPRO MVP · Dados financeiros estimados com base nos lançamentos registrados.</div>
 </>;
}
