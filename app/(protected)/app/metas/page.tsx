'use client';
import {useEffect,useState} from 'react';
import {Target,CheckCircle2,CalendarDays} from 'lucide-react';
import {api,formatMoney,toCents,type Dashboard} from '@/lib/api';
import {PageHeader,Panel,Notice,Loading} from '@/components/UI';

export default function GoalsPage(){
 const [dashboard,setDashboard]=useState<Dashboard|null>(null);
 const [weekly,setWeekly]=useState(''),[monthly,setMonthly]=useState('');
 const [error,setError]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 const load=async()=>{
  try{
   const d=await api<Dashboard>('/dashboard');
   setDashboard(d);
   setWeekly(d.goal?.weeklyTargetCents?(d.goal.weeklyTargetCents/100).toFixed(2).replace('.',','):'');
   setMonthly(d.goal?.monthlyTargetCents?(d.goal.monthlyTargetCents/100).toFixed(2).replace('.',','):'');
  }catch(e){setError(e instanceof Error?e.message:'Falha ao buscar metas');}
 };
 useEffect(()=>{void load();},[]);
 const save=async(event:React.FormEvent,period:'weekly'|'monthly')=>{
  event.preventDefault();setError('');setMessage('');
  const cents=toCents(period==='weekly'?weekly:monthly);
  if(!Number.isSafeInteger(cents)||cents<100||cents>100_000_000){setError('Informe um valor válido, de R$ 1,00 até R$ 1.000.000,00.');return;}
  setBusy(true);
  try{
   await api(period==='weekly'?'/goals':'/goals/monthly',{method:'PUT',
    body:JSON.stringify(period==='weekly'?{weeklyTargetCents:cents}:{monthlyTargetCents:cents})});
   setMessage(period==='weekly'?'Meta semanal atualizada.':'Meta mensal atualizada.');
   await load();
  }catch(e){setError(e instanceof Error?e.message:'Não foi possível salvar a meta');}
  finally{setBusy(false);}
 };
 const weeklyTarget=dashboard?.goal?.weeklyTargetCents||0;
 const weeklyProgress=weeklyTarget?Math.max(0,Math.min(100,Math.round((dashboard?.profitCents||0)/weeklyTarget*100))):0;
 const month=dashboard?.month;
 return <>
  <PageHeader eyebrow="PLANEJAMENTO FINANCEIRO" title="Minhas metas" description="Defina objetivos de lucro semanal e mensal com base nos registros do MotoPRO."/>
  {error&&<Notice kind="error">{error}</Notice>}
  {message&&<Notice kind="success">{message}</Notice>}
  <div className="two-col">
   <Panel title="Meta semanal" subtitle="De terça-feira a segunda-feira">
    <form className="stack" onSubmit={e=>void save(e,'weekly')}>
     <label htmlFor="weekly-goal">Quanto pretende lucrar na semana?</label>
     <input id="weekly-goal" className="input" inputMode="decimal" required value={weekly} placeholder="Ex.: 800,00" onChange={e=>setWeekly(e.target.value)}/>
     <button className="btn" disabled={busy}><Target size={17}/> Salvar meta semanal</button>
    </form>
    {!dashboard?<Loading/>:weeklyTarget>0?<div className="stack">
     <div className="row-between"><strong>{weeklyProgress}% da meta</strong><span>{formatMoney(weeklyTarget)}</span></div>
     <div className="progress-bar"><div className="progress-fill" style={{width:`${weeklyProgress}%`}}/></div>
     <p>Lucro estimado: <strong>{formatMoney(dashboard.profitCents)}</strong></p>
     <p>Faltam: <strong>{formatMoney(Math.max(0,weeklyTarget-dashboard.profitCents))}</strong></p>
     {weeklyProgress>=100&&<Notice kind="success"><CheckCircle2 size={18}/> Meta alcançada!</Notice>}
    </div>:<p className="admin-small">Salve sua meta semanal para acompanhar o progresso.</p>}
   </Panel>
   <Panel title="Meta mensal" subtitle="Planeje seus resultados sem precisar fazer contas">
    <form className="stack" onSubmit={e=>void save(e,'monthly')}>
     <label htmlFor="monthly-goal">Quanto pretende lucrar neste mês?</label>
     <input id="monthly-goal" className="input" inputMode="decimal" required value={monthly} placeholder="Ex.: 4.000,00" onChange={e=>setMonthly(e.target.value)}/>
     <button className="btn" disabled={busy}><CalendarDays size={17}/> Salvar meta mensal</button>
    </form>
    {!dashboard?<Loading/>:month&&month.targetCents>0?<div className="stack">
     <div className="row-between"><strong>{month.progressPercent}% da meta</strong><span>{formatMoney(month.targetCents)}</span></div>
     <div className="progress-bar"><div className="progress-fill" style={{width:`${month.progressPercent}%`}}/></div>
     <p>Lucro estimado no mês: <strong>{formatMoney(month.profitCents)}</strong></p>
     <p>Faltam: <strong>{formatMoney(month.remainingCents)}</strong></p>
     <p>Média necessária por dia restante: <strong>{formatMoney(month.requiredDailyCents)}</strong> ({month.daysRemaining} dias no calendário, incluindo hoje).</p>
     {month.progressPercent>=100&&<Notice kind="success"><CheckCircle2 size={18}/> Meta mensal alcançada!</Notice>}
    </div>:<p className="admin-small">Defina uma meta e acompanhe quanto já registrou neste mês.</p>}
   </Panel>
  </div>
  <p className="tiny-note">O lucro é uma estimativa: receitas menos despesas cadastradas. Inclua abastecimentos, manutenção e outras despesas para ter resultados mais próximos da realidade.</p>
 </>;
}
