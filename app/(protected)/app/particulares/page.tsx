'use client';
import {useCallback,useEffect,useState} from 'react';
import {Plus,CheckCircle2,Trash2,PenLine,Archive,RotateCcw,Download,Printer,Users,Wallet,Phone,ChevronLeft,ChevronRight} from 'lucide-react';
import {api,formatMoney,toCents,todayLocal,dateLabel} from '@/lib/api';
import {PageHeader,Panel,Notice,Loading,Empty} from '@/components/UI';

type Customer={id:string;name:string;phone:string;notes:string;archived:boolean};
type Delivery={id:string;customerId:string|null;customerName:string;description:string;amountCents:number;deliveredOn:string;paymentStatus:'pending'|'paid';paidAt:string|null};
type PageResult<T>={items:T[];total:number;page:number;limit:number};
type DeliveryResult=PageResult<Delivery>&{summary:{total:number;paid:number;pending:number;paidCents:number;pendingCents:number}};
type DeliveryForm={customerId:string;description:string;amount:string;deliveredOn:string};
const emptyDelivery=():DeliveryForm=>({customerId:'',description:'',amount:'',deliveredOn:todayLocal()});
const emptyCustomer=()=>({name:'',phone:'',notes:''});
const phoneLink=(s:string)=>{const digits=s.replace(/\D/g,'');const number=digits.startsWith('55')?digits:digits.length===11?'55'+digits:'';return /^55[1-9]{2}9\d{8}$/.test(number)?`https://wa.me/${number}`:null;};

export default function PrivatePage(){
 const [view,setView]=useState<'deliveries'|'customers'>('deliveries');
 const [filter,setFilter]=useState('all'),[page,setPage]=useState(1);
 const [deliveries,setDeliveries]=useState<DeliveryResult|null>(null);
 const [customers,setCustomers]=useState<Customer[]>([]),[customersTotal,setCustomersTotal]=useState(0);
 const [customerPage,setCustomerPage]=useState(1),[customerSearch,setCustomerSearch]=useState(''),[searchInput,setSearchInput]=useState('');
 const [form,setForm]=useState<DeliveryForm>(emptyDelivery),[editing,setEditing]=useState<string|null>(null);
 const [customerForm,setCustomerForm]=useState(emptyCustomer),[editingCustomer,setEditingCustomer]=useState<string|null>(null);
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 const load=useCallback(async()=>{
  setLoading(true);
  try{
   const [d,c]=await Promise.all([
    api<DeliveryResult>(`/particulares/deliveries?page=${page}&limit=15&status=${filter}`),
    api<PageResult<Customer>>(`/particulares/customers?page=${customerPage}&limit=50&search=${encodeURIComponent(customerSearch)}`)
   ]);
   setDeliveries(d);setCustomers(c.items);setCustomersTotal(c.total);
  }catch(e){setError((e as Error).message);}finally{setLoading(false);}
 },[page,filter,customerPage,customerSearch]);
 useEffect(()=>{void load();},[load]);
 const notify=(text:string)=>{setError('');setMessage(text);};
 const saveDelivery=async(e:React.FormEvent)=>{
  e.preventDefault();setError('');setMessage('');setBusy(true);
  const amountCents=toCents(form.amount);
  if(!Number.isSafeInteger(amountCents)||amountCents<1){setError('Informe um valor válido, por exemplo 18,50.');setBusy(false);return;}
  try{
   const data={customerId:form.customerId||null,description:form.description.trim(),amountCents,deliveredOn:form.deliveredOn};
   await api(editing?`/particulares/deliveries/${editing}`:'/particulares/deliveries',{
    method:editing?'PATCH':'POST',body:JSON.stringify(data)});
   setForm(emptyDelivery());setEditing(null);setPage(1);notify(editing?'Entrega atualizada.':'Entrega cadastrada como pendente de recebimento.');await load();
  }catch(e){setError((e as Error).message);}finally{setBusy(false);}
 };
 const editDelivery=(d:Delivery)=>{setEditing(d.id);setForm({customerId:d.customerId||'',description:d.description,amount:(d.amountCents/100).toFixed(2).replace('.',','),deliveredOn:d.deliveredOn});window.scrollTo({top:0,behavior:'smooth'});};
 const confirmPayment=async(d:Delivery)=>{
  if(!window.confirm(`Confirmar que você recebeu ${formatMoney(d.amountCents)} por esta entrega? O valor entrará no financeiro e não poderá ser editado por aqui.`))return;
  setBusy(true);setError('');setMessage('');
  try{await api(`/particulares/deliveries/${d.id}/confirm-payment`,{method:'POST'});notify('Recebimento confirmado e lançado nos seus ganhos.');await load();}
  catch(e){setError((e as Error).message);}finally{setBusy(false);}
 };
 const removeDelivery=async(d:Delivery)=>{
  if(!window.confirm('Excluir esta entrega pendente?'))return;
  setBusy(true);setError('');
  try{await api(`/particulares/deliveries/${d.id}`,{method:'DELETE'});notify('Entrega pendente excluída.');await load();}
  catch(e){setError((e as Error).message);}finally{setBusy(false);}
 };
 const saveCustomer=async(e:React.FormEvent)=>{
  e.preventDefault();setBusy(true);setError('');setMessage('');
  try{
   const body=JSON.stringify(customerForm);
   const result=await api<{id:string}>(editingCustomer?`/particulares/customers/${editingCustomer}`:'/particulares/customers',{
    method:editingCustomer?'PATCH':'POST',body});
   if(!editingCustomer&&result.id)setForm(old=>({...old,customerId:result.id}));
   notify(editingCustomer?'Cliente atualizado.':'Cliente salvo. Você pode selecioná-lo ao registrar uma entrega.');
   setCustomerForm(emptyCustomer());setEditingCustomer(null);setCustomerPage(1);await load();
  }catch(e){setError((e as Error).message);}finally{setBusy(false);}
 };
 const archiveCustomer=async(c:Customer)=>{
  if(!window.confirm(`${c.archived?'Reativar':'Arquivar'} ${c.name}? O histórico de entregas será preservado.`))return;
  setBusy(true);setError('');
  try{await api(`/particulares/customers/${c.id}`,{method:'PATCH',body:JSON.stringify({archived:!c.archived})});notify(c.archived?'Cliente reativado.':'Cliente arquivado.');await load();}
  catch(e){setError((e as Error).message);}finally{setBusy(false);}
 };
 const deleteCustomer=async(c:Customer)=>{
  if(!window.confirm(`Excluir permanentemente ${c.name}? Se houver entregas, os dados de contato serão anonimizados sem excluir os valores financeiros.`))return;
  setBusy(true);setError('');
  try{await api(`/particulares/customers/${c.id}`,{method:'DELETE'});notify('Cliente excluído. Se existia histórico de entregas, os dados pessoais foram anonimizados.');await load();}
  catch(e){setError((e as Error).message);}finally{setBusy(false);}
 };
 const summary=deliveries?.summary;
 return <>
  <PageHeader eyebrow="FASE 3 · CLIENTES PRÓPRIOS" title="Entregas particulares" description="Organize clientes e valores a receber. Uma entrega só conta como ganho quando você confirmar o pagamento." actions={<div className="phase3-header-actions"><a className="btn secondary" href="/api/particulares/deliveries/export" download="motopro-particulares.csv"><Download size={16}/> CSV</a><button className="btn secondary" onClick={()=>window.print()}><Printer size={16}/> PDF</button></div>}/>
  <div className="phase3-tabbar" role="group" aria-label="Área de entregas particulares"><button className={`btn ${view==='deliveries'?'':'secondary'}`} onClick={()=>setView('deliveries')}>Entregas</button><button className={`btn ${view==='customers'?'':'secondary'}`} onClick={()=>setView('customers')}><Users size={16}/> Clientes</button></div>
  {error&&<Notice kind="error">{error}</Notice>}{message&&<Notice kind="success">{message}</Notice>}
  {summary&&<div className="admin-stat-grid phase3-stats"><div className="admin-stat"><small>Entregas cadastradas</small><strong>{summary.total}</strong></div><div className="admin-stat"><small>Recebido</small><strong>{formatMoney(summary.paidCents)}</strong></div><div className="admin-stat"><small>A receber</small><strong>{formatMoney(summary.pendingCents)}</strong></div><div className="admin-stat"><small>Pagamentos pendentes</small><strong>{summary.pending}</strong></div></div>}
  {view==='deliveries'?<div className="two-col entry-layout phase3-panels">
   <Panel title={editing?'Editar entrega pendente':'Registrar entrega particular'} subtitle="O valor só entra nos ganhos depois que você confirmar o recebimento.">
    <form className="stack" onSubmit={saveDelivery}>
     <div className="field"><label htmlFor="private-customer">Cliente (opcional)</label><select id="private-customer" className="select" value={form.customerId} onChange={e=>setForm({...form,customerId:e.target.value})}><option value="">Sem cliente informado</option>{form.customerId&&!customers.some(c=>c.id===form.customerId)&&<option value={form.customerId}>{deliveries?.items.find(d=>d.customerId===form.customerId)?.customerName||'Cliente selecionado anteriormente'}</option>}{customers.filter(c=>!c.archived||c.id===form.customerId).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select><small className="field-hint">Clientes novos podem ser cadastrados na aba Clientes.</small></div>
     <div className="form-grid"><div className="field"><label htmlFor="private-amount">Valor cobrado (R$)</label><input id="private-amount" className="input" inputMode="decimal" required placeholder="25,00" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})}/></div><div className="field"><label htmlFor="private-date">Data da entrega</label><input id="private-date" type="date" className="input" required max={todayLocal()} value={form.deliveredOn} onChange={e=>setForm({...form,deliveredOn:e.target.value})}/></div></div>
     <div className="field"><label htmlFor="private-description">Descrição</label><input id="private-description" className="input" maxLength={160} placeholder="Ex.: entrega de mercadorias" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></div>
     <div className="form-actions">{editing&&<button type="button" className="btn secondary" onClick={()=>{setEditing(null);setForm(emptyDelivery());}}>Cancelar</button>}<button className="btn" disabled={busy}><Plus size={17}/> {editing?'Salvar alterações':'Cadastrar pendente'}</button></div>
    </form>
   </Panel>
   <Panel title="Histórico de entregas" subtitle="Recebidas e valores a cobrar" action={<select aria-label="Filtrar recebimentos" className="select" value={filter} onChange={e=>{setFilter(e.target.value);setPage(1);}}><option value="all">Todas</option><option value="pending">Pendentes</option><option value="paid">Recebidas</option></select>}>
    {loading?<Loading/>:!deliveries?.items.length?<Empty message="Nenhuma entrega cadastrada neste filtro."/>:<div className="phase3-delivery-list">{deliveries.items.map(d=><article className="phase3-delivery" key={d.id}><div className="row-between" style={{gap:8,flexWrap:'wrap'}}><strong>{d.customerName}</strong><span className={`pill ${d.paymentStatus==='paid'?'success':'warning'}`}>{d.paymentStatus==='paid'?'Recebido':'A receber'}</span></div><small>{dateLabel(d.deliveredOn)} · {d.description||'Entrega particular'}</small><div className="row-between phase3-delivery-actions"><strong className="phase3-price">{formatMoney(d.amountCents)}</strong>{d.paymentStatus==='pending'?<div className="phase3-header-actions"><button className="btn secondary" disabled={busy} onClick={()=>editDelivery(d)} aria-label="Editar entrega"><PenLine size={15}/></button><button className="btn secondary" disabled={busy} onClick={()=>void removeDelivery(d)} aria-label="Excluir entrega"><Trash2 size={15}/></button><button className="btn" disabled={busy} onClick={()=>void confirmPayment(d)}><CheckCircle2 size={15}/> Recebi</button></div>:<small className="text-income">Contabilizado no financeiro</small>}</div></article>)}</div>}
    <div className="row-between phase3-pager"><button className="btn secondary" disabled={page===1||loading} onClick={()=>setPage(n=>n-1)}><ChevronLeft size={15}/> Anterior</button><small>Página {page} de {Math.max(1,Math.ceil((deliveries?.total||0)/15))}</small><button className="btn secondary" disabled={page>=Math.ceil((deliveries?.total||0)/15)||loading} onClick={()=>setPage(n=>n+1)}>Próxima <ChevronRight size={15}/></button></div>
   </Panel>
  </div>:<div className="two-col entry-layout phase3-panels">
   <Panel title={editingCustomer?'Editar cliente':'Cadastrar cliente'} subtitle="Os contatos são visíveis somente na sua conta e no acesso administrativo auditado.">
    <form onSubmit={saveCustomer} className="stack"><div className="field"><label htmlFor="customer-name">Nome</label><input id="customer-name" className="input" minLength={2} maxLength={90} required value={customerForm.name} onChange={e=>setCustomerForm({...customerForm,name:e.target.value})}/></div><div className="field"><label htmlFor="customer-phone">WhatsApp ou telefone (opcional)</label><input id="customer-phone" className="input" maxLength={16} placeholder="(94) 99999-9999" value={customerForm.phone} onChange={e=>setCustomerForm({...customerForm,phone:e.target.value})}/></div><div className="field"><label htmlFor="customer-notes">Observações</label><textarea id="customer-notes" className="textarea" rows={3} maxLength={300} value={customerForm.notes} onChange={e=>setCustomerForm({...customerForm,notes:e.target.value})}/></div><div className="form-actions">{editingCustomer&&<button type="button" className="btn secondary" onClick={()=>{setEditingCustomer(null);setCustomerForm(emptyCustomer());}}>Cancelar</button>}<button className="btn" disabled={busy}><Plus size={16}/> {editingCustomer?'Salvar cliente':'Cadastrar cliente'}</button></div></form>
   </Panel>
   <Panel title="Meus clientes" subtitle={`${customersTotal} contato(s) neste filtro · página ${customerPage}`}>
    <form className="phase3-customer-search" onSubmit={e=>{e.preventDefault();setCustomerPage(1);setCustomerSearch(searchInput);}}><input className="input" aria-label="Pesquisar clientes por nome" placeholder="Buscar cliente pelo nome" maxLength={60} value={searchInput} onChange={e=>setSearchInput(e.target.value)}/><button className="btn secondary">Buscar</button></form>
    {loading?<Loading/>:!customers.length?<Empty message="Nenhum cliente particular cadastrado neste filtro."/>:<div className="phase3-delivery-list">{customers.map(c=><article className="phase3-delivery" key={c.id}><div className="row-between"><strong>{c.name}</strong>{c.archived&&<span className="pill neutral">Arquivado</span>}</div>{c.phone&&<small><Phone size={12} style={{verticalAlign:'middle'}}/> {c.phone} {phoneLink(c.phone)&&<a href={phoneLink(c.phone)!} target="_blank" rel="noopener noreferrer" className="inline-link">WhatsApp</a>}</small>}{c.notes&&<small>{c.notes}</small>}<div className="phase3-header-actions phase3-customer-actions"><button className="btn secondary" onClick={()=>{setEditingCustomer(c.id);setCustomerForm({name:c.name,phone:c.phone,notes:c.notes});window.scrollTo({top:0,behavior:'smooth'});}}><PenLine size={15}/> Editar</button><button disabled={busy} className="btn secondary" onClick={()=>void archiveCustomer(c)}>{c.archived?<RotateCcw size={15}/>:<Archive size={15}/>} {c.archived?'Reativar':'Arquivar'}</button><button disabled={busy} className="btn secondary" onClick={()=>void deleteCustomer(c)}><Trash2 size={15}/> Excluir</button></div></article>)}</div>}
    <div className="row-between phase3-pager"><button className="btn secondary" disabled={customerPage<=1||loading} onClick={()=>setCustomerPage(n=>n-1)}><ChevronLeft size={15}/> Anterior</button><small>Página {customerPage} de {Math.max(1,Math.ceil(customersTotal/50))}</small><button className="btn secondary" disabled={customerPage>=Math.ceil(customersTotal/50)||loading} onClick={()=>setCustomerPage(n=>n+1)}>Próxima <ChevronRight size={15}/></button></div>
   </Panel>
  </div>}
  <p className="tiny-note phase3-footnote"><Wallet size={14} style={{verticalAlign:'middle'}}/> A confirmação de recebimento registra uma receita única no seu financeiro. A plataforma não realiza nem cobra pagamentos dos seus clientes particulares. Para salvar o relatório em PDF, use o botão PDF e escolha “Salvar como PDF” na impressão do navegador.</p>
 </>;
}
