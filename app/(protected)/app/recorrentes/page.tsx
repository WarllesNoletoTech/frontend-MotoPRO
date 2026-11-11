'use client';
import {useCallback,useEffect,useState} from 'react';
import {CalendarClock,Plus,PenLine,PauseCircle,PlayCircle,Trash2,RefreshCw} from 'lucide-react';
import {PageHeader,Panel,Notice,Empty,Loading} from '@/components/UI';
import {api,toCents,formatMoney,categoryLabel,dateLabel} from '@/lib/api';

type Recurrence={id:string;label:string;category:'fuel'|'maintenance'|'food'|'other';amountCents:number;dayOfMonth:number;startMonth:string;enabled:boolean;nextDueOn:string|null};
const blank={label:'',category:'other' as Recurrence['category'],amount:'',dayOfMonth:'5'};
export default function RecurringExpensesPage(){
 const [items,setItems]=useState<Recurrence[]>([]),[today,setToday]=useState('');
 const [form,setForm]=useState(blank),[editing,setEditing]=useState<string|null>(null);
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[success,setSuccess]=useState('');
 const load=useCallback(async()=>{
  const result=await api<{today:string;items:Recurrence[]}>('/recorrentes');
  setItems(result.items);setToday(result.today);
 },[]);
 useEffect(()=>{load().catch(e=>setError((e as Error).message)).finally(()=>setLoading(false));},[load]);
 const save=async(e:React.FormEvent)=>{
  e.preventDefault();setError('');setSuccess('');
  const amountCents=toCents(form.amount),dayOfMonth=Number(form.dayOfMonth);
  if(!Number.isSafeInteger(amountCents)||amountCents<=0||amountCents>100_000_000){setError('Informe um valor em reais válido.');return;}
  if(!Number.isInteger(dayOfMonth)||dayOfMonth<1||dayOfMonth>31){setError('O dia deve estar entre 1 e 31.');return;}
  setBusy(true);
  try{
   await api(editing?`/recorrentes/${editing}`:'/recorrentes',{
    method:editing?'PATCH':'POST',body:JSON.stringify({label:form.label.trim(),category:form.category,amountCents,dayOfMonth})
   });
   const r=await api<{created:number}>('/recorrentes/sync',{method:'POST'});
   await load();setEditing(null);setForm(blank);
   setSuccess(`Regra salva. ${r.created?`${r.created} lançamento(s) do mês registrados.`:'Os próximos lançamentos serão registrados quando a data chegar e você acessar o aplicativo.'}`);
  }catch(err){setError((err as Error).message);}finally{setBusy(false);}
 };
 const edit=(r:Recurrence)=>{setEditing(r.id);setForm({label:r.label,category:r.category,amount:(r.amountCents/100).toFixed(2).replace('.',','),dayOfMonth:String(r.dayOfMonth)});window.scrollTo({top:0,behavior:'smooth'});};
 const toggle=async(r:Recurrence)=>{
  setBusy(true);setError('');setSuccess('');
  try{await api(`/recorrentes/${r.id}`,{method:'PATCH',body:JSON.stringify({enabled:!r.enabled})});await load();setSuccess(r.enabled?'Regra pausada. Lançamentos anteriores preservados.':'Regra reativada.');}
  catch(e){setError((e as Error).message);}finally{setBusy(false);}
 };
 const remove=async(r:Recurrence)=>{
  if(!window.confirm(`Excluir a regra “${r.label}”? Os lançamentos anteriores serão preservados.`))return;
  setBusy(true);setError('');setSuccess('');
  try{await api(`/recorrentes/${r.id}`,{method:'DELETE'});if(editing===r.id){setEditing(null);setForm(blank);}await load();setSuccess('Regra excluída.');}
  catch(e){setError((e as Error).message);}finally{setBusy(false);}
 };
 const sync=async()=>{setBusy(true);setError('');try{const r=await api<{created:number}>('/recorrentes/sync',{method:'POST'});await load();setSuccess(r.created?`${r.created} despesa(s) registrada(s) neste mês.`:'Nenhuma despesa nova com vencimento até hoje.');}catch(e){setError((e as Error).message);}finally{setBusy(false);}};
 return <>
  <PageHeader eyebrow="FASE 4 · ROTINA FINANCEIRA" title="Despesas recorrentes" description="Programe gastos mensais fixos. O MotoPRO registra apenas uma vez por mês, ao abrir o aplicativo depois da data prevista." actions={<button className="btn secondary" disabled={busy} onClick={()=>void sync()}><RefreshCw size={16}/> Conferir agora</button>}/>
  {error&&<Notice kind="error">{error}</Notice>}{success&&<Notice kind="success">{success}</Notice>}
  <div className="two-col entry-layout phase4-panels">
   <Panel title={editing?'Editar regra mensal':'Nova despesa mensal'} subtitle="Edite o valor ou pause a regra sem alterar lançamentos de meses passados.">
    <form onSubmit={save} className="stack">
     <div className="field"><label htmlFor="repeat-title">Descrição</label><input id="repeat-title" required minLength={2} maxLength={100} className="input" placeholder="Ex.: internet, financiamento, seguro" value={form.label} onChange={e=>setForm({...form,label:e.target.value})}/></div>
     <div className="field"><label htmlFor="repeat-category">Categoria</label><select id="repeat-category" className="select" value={form.category} onChange={e=>setForm({...form,category:e.target.value as Recurrence['category']})}><option value="other">Outras despesas</option><option value="fuel">Combustível</option><option value="maintenance">Manutenção</option><option value="food">Alimentação</option></select></div>
     <div className="form-grid"><div className="field"><label htmlFor="repeat-amount">Valor (R$)</label><input id="repeat-amount" required className="input" inputMode="decimal" placeholder="89,90" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})}/></div><div className="field"><label htmlFor="repeat-day">Dia de cada mês</label><input id="repeat-day" required className="input" type="number" min={1} max={31} value={form.dayOfMonth} onChange={e=>setForm({...form,dayOfMonth:e.target.value})}/></div></div>
     <div className="form-actions">{editing&&<button type="button" className="btn secondary" onClick={()=>{setEditing(null);setForm(blank);}}>Cancelar</button>}<button className="btn" disabled={busy}><Plus size={16}/> {editing?'Salvar alterações':'Cadastrar despesa'}</button></div>
    </form>
   </Panel>
   <Panel title="Minhas despesas programadas" subtitle={`${items.filter(r=>r.enabled).length} ativas · ${items.length} cadastradas`}>
    {loading?<Loading/>:items.length===0?<Empty message="Você ainda não cadastrou despesas recorrentes."/>:<div className="stack-sm">{items.map(r=><article key={r.id} className="phase4-list-card"><div className="row-between" style={{gap:8}}><strong>{r.label}</strong><span className={`pill ${r.enabled?'success':'neutral'}`}>{r.enabled?'Ativa':'Pausada'}</span></div><div className="row-between"><small>{categoryLabel(r.category)} · Dia {r.dayOfMonth}</small><strong>{formatMoney(r.amountCents)}</strong></div><small>{r.enabled&&r.nextDueOn?`Próxima previsão: ${dateLabel(r.nextDueOn)}`:'Sem lançamentos futuros enquanto pausada'}</small><div className="phase4-actions"><button className="btn secondary" disabled={busy} onClick={()=>edit(r)}><PenLine size={15}/> Editar</button><button className="btn secondary" disabled={busy} onClick={()=>void toggle(r)}>{r.enabled?<PauseCircle size={15}/>:<PlayCircle size={15}/>} {r.enabled?'Pausar':'Ativar'}</button><button className="btn secondary" disabled={busy} onClick={()=>void remove(r)}><Trash2 size={15}/> Excluir</button></div></article>)}</div>}
   </Panel>
  </div>
  <p className="tiny-note phase4-note"><CalendarClock size={14} style={{verticalAlign:'middle'}}/> Nenhuma cobrança é efetuada automaticamente. O lançamento é apenas um registro financeiro. Datas 29, 30 ou 31 são ajustadas ao último dia dos meses menores. A criação de despesas vencidas no mês atual pode gerar um registro imediatamente.</p>
 </>;
}
