'use client';
import {useEffect,useState} from 'react';
import {Plus,Trash2,PenLine,Check,Undo2,ChevronLeft,ChevronRight,Download} from 'lucide-react';
import {api,formatMoney,toCents,todayLocal,dateLabel,categoryLabel,incomeCategories,expenseCategories,type Entry} from '@/lib/api';
import {PageHeader,Panel,Notice,Loading,Empty} from '@/components/UI';
type Form={type:'income'|'expense';category:string;description:string;amount:string;occurredOn:string};
const initial=():Form=>({type:'income',category:'delivery',description:'',amount:'',occurredOn:todayLocal()});
export default function EntriesPage(){
 const [form,setForm]=useState<Form>(initial),[editing,setEditing]=useState<string|null>(null);
 const [list,setList]=useState<Entry[]>([]),[count,setCount]=useState(0),[page,setPage]=useState(1);
 const [busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const [filter,setFilter]=useState('all');
 const load=async()=>{setLoading(true);try{const q=new URLSearchParams({limit:'12',page:String(page)});if(filter!=='all')q.set('type',filter);const r=await api<{items:Entry[];total:number}>(`/entries?${q}`);setList(r.items);setCount(r.total);}catch(e){setError((e as Error).message);}finally{setLoading(false);}};
 useEffect(()=>{load();},[page,filter]);
 const reset=()=>{setForm(initial());setEditing(null);};
 const submit=async(e:React.FormEvent)=>{e.preventDefault();setBusy(true);setError('');setNotice('');const amountCents=toCents(form.amount);
  if(!Number.isSafeInteger(amountCents)||amountCents<1){setError('Informe um valor válido, por exemplo 35,50.');setBusy(false);return;}
  try{await api(editing?`/entries/${editing}`:'/entries',{method:editing?'PATCH':'POST',body:JSON.stringify({type:form.type,category:form.category,description:form.description,amountCents,occurredOn:form.occurredOn,source:'manual'})});setNotice(editing?'Lançamento atualizado.':'Lançamento registrado.');reset();setPage(1);await load();}
  catch(e){setError((e as Error).message);}finally{setBusy(false);}
 };
 const edit=(entry:Entry)=>{setEditing(entry._id);setForm({type:entry.type,category:entry.category,description:entry.description,amount:(entry.amountCents/100).toFixed(2).replace('.',','),occurredOn:entry.occurredOn});window.scrollTo({top:0,behavior:'smooth'});};
 const remove=async(entry:Entry)=>{if(!window.confirm('Excluir este lançamento?'))return;try{await api(`/entries/${entry._id}`,{method:'DELETE'});setNotice('Lançamento excluído.');await load();}catch(e){setError((e as Error).message);}};
 const categories=form.type==='income'?incomeCategories:expenseCategories;
 return <><PageHeader eyebrow="MEU FINANCEIRO" title="Ganhos e despesas" description="Registre cada entrada e saída para descobrir seu lucro estimado." actions={<a className="btn secondary" href="/api/entries/export" download="motopro-lancamentos.csv"><Download size={16}/> Exportar CSV</a>}/>
  <div className="two-col entry-layout">
   <Panel title={editing?'Editar lançamento':'Novo lançamento'} subtitle="Seus dados ficam salvos na sua conta.">
    <form className="stack" onSubmit={submit}>
     <div className="field"><label>Tipo de lançamento</label><div style={{display:'flex',gap:8}}><button type="button" className={`btn ${form.type==='income'?'':'secondary'}`} style={{flex:1}} onClick={()=>setForm({...form,type:'income',category:'delivery'})}>+ Receita</button><button type="button" className={`btn ${form.type==='expense'?'':'secondary'}`} style={{flex:1,background:form.type==='expense'?'#b95747':undefined}} onClick={()=>setForm({...form,type:'expense',category:'fuel'})}>− Despesa</button></div></div>
     <div className="field"><label htmlFor="amount">Valor (R$)</label><input id="amount" className="input" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} inputMode="decimal" required placeholder="Ex.: 35,50"/></div>
     <div className="form-grid"><div className="field"><label htmlFor="category">Categoria</label><select id="category" className="select" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{categories.map(c=><option key={c.value} value={c.value}>{c.label}</option>)}</select></div><div className="field"><label htmlFor="date">Data</label><input id="date" className="input" type="date" required value={form.occurredOn} onChange={e=>setForm({...form,occurredOn:e.target.value})}/></div></div>
     <div className="field"><label htmlFor="desc">Descrição (opcional)</label><input id="desc" className="input" maxLength={160} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Ex.: entregas do turno da noite"/></div>
     {error&&<Notice kind="error">{error}</Notice>}{notice&&<Notice kind="success">{notice}</Notice>}
     <div className="form-actions">{editing&&<button type="button" className="btn secondary" onClick={reset}><Undo2 size={17}/> Cancelar</button>}<button className="btn" disabled={busy}>{editing?<><Check size={17}/> Salvar edição</>:<><Plus size={17}/> Registrar</>}</button></div>
    </form>
   </Panel>
   <Panel title="Histórico de lançamentos" subtitle={`${count} registro(s)`} action={<select aria-label="Filtrar tipo" className="select" style={{width:145}} value={filter} onChange={e=>{setFilter(e.target.value);setPage(1);}}><option value="all">Todos</option><option value="income">Receitas</option><option value="expense">Despesas</option></select>}>
    {loading?<Loading/>:!list.length?<Empty message="Nenhum lançamento encontrado."/>:<div className="table-wrap"><table className="table"><thead><tr><th>Descrição</th><th>Data</th><th>Valor</th><th>Ações</th></tr></thead><tbody>{list.map(entry=><tr key={entry._id}><td><strong>{entry.description||categoryLabel(entry.category)}</strong><small>{categoryLabel(entry.category)} · {entry.source==='voice'?'Voz':entry.source==='manual'?'Manual':'Integração'}</small></td><td>{dateLabel(entry.occurredOn)}</td><td className={entry.type==='income'?'text-income':'text-expense'}>{entry.type==='income'?'+':'−'} {formatMoney(entry.amountCents)}</td><td>{entry.source==='integration'?<span className="pill neutral">Importado</span>:<div style={{display:'flex',gap:4}}><button title="Editar" aria-label="Editar lançamento" className="icon-btn" onClick={()=>edit(entry)}><PenLine size={16}/></button><button title="Excluir" aria-label="Excluir lançamento" className="icon-btn" style={{color:'#b25a4d'}} onClick={()=>remove(entry)}><Trash2 size={16}/></button></div>}</td></tr>)}</tbody></table></div>}
    <div className="row-between" style={{marginTop:20}}><button className="btn secondary" disabled={page<=1} onClick={()=>setPage(v=>v-1)}><ChevronLeft size={16}/> Anterior</button><span className="text-muted" style={{fontSize:12}}>Página {page} de {Math.max(1,Math.ceil(count/12))}</span><button className="btn secondary" disabled={page>=Math.ceil(count/12)} onClick={()=>setPage(v=>v+1)}>Próxima <ChevronRight size={16}/></button></div>
   </Panel>
  </div>
 </>;
}
