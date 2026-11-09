'use client';
import {useEffect,useState} from 'react';
import {Target,CheckCircle2} from 'lucide-react';
import {api,formatMoney,toCents,type Dashboard} from '@/lib/api';
import {PageHeader,Panel,Notice,Loading} from '@/components/UI';
export default function GoalsPage(){
 const [dashboard,setDashboard]=useState<Dashboard|null>(null),[value,setValue]=useState(''),[error,setError]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 const load=()=>api<Dashboard>('/dashboard').then(d=>{setDashboard(d);setValue(d.goal?(d.goal.weeklyTargetCents/100).toFixed(2).replace('.',','):'');}).catch(e=>setError(e.message));
 useEffect(()=>{load();},[]);
 const save=async(e:React.FormEvent)=>{e.preventDefault();setError('');setMessage('');const weeklyTargetCents=toCents(value);if(!Number.isSafeInteger(weeklyTargetCents)||weeklyTargetCents<100){setError('Informe uma meta de pelo menos R$ 1,00.');return;}
  setBusy(true);try{await api('/goals',{method:'PUT',body:JSON.stringify({weeklyTargetCents})});setMessage('Sua meta foi salva.');await load();}catch(e){setError((e as Error).message);}finally{setBusy(false);}
 };
 const target=dashboard?.goal?.weeklyTargetCents||0;
 const progress=target?Math.max(0,Math.min(100,Math.round((dashboard?.profitCents||0)/target*100))):0;
 return <><PageHeader eyebrow="SEU PRÓXIMO OBJETIVO" title="Metas semanais" description="Transforme seu esforço em resultados que você consegue acompanhar."/>
  <div className="two-col"><Panel title="Definir meta" subtitle="Quanto você quer lucrar nesta semana?"><form className="stack" onSubmit={save}><div className="field"><label htmlFor="goal">Meta de lucro estimado (R$)</label><input id="goal" className="input" inputMode="decimal" required value={value} placeholder="Ex.: 800,00" onChange={e=>setValue(e.target.value)}/><span className="field-hint">A meta considera receitas menos despesas registradas.</span></div>{error&&<Notice kind="error">{error}</Notice>}{message&&<Notice kind="success">{message}</Notice>}<button className="btn" disabled={busy}><Target size={17}/> Salvar meta</button></form></Panel>
  <Panel title="Meu progresso" subtitle="Apuração de terça-feira a segunda-feira">{!dashboard?<Loading/>:!target?<div className="empty"><Target size={33}/>Defina sua meta para acompanhar a evolução.</div>:<div className="stack"><strong style={{font:'700 36px Outfit'}}>{progress}% <span style={{fontSize:12,color:'#97866a'}}>concluído</span></strong><div className="progress-bar"><div className="progress-fill" style={{width:`${progress}%`}}/></div><div className="row-between"><span>Lucro estimado: <strong>{formatMoney(dashboard.profitCents)}</strong></span><span className="text-muted" style={{fontSize:12}}>Meta: {formatMoney(target)}</span></div>{progress>=100&&<Notice kind="success"><CheckCircle2 size={18}/> Você alcançou sua meta nesta semana!</Notice>}</div>}</Panel></div>
 </>;
}
