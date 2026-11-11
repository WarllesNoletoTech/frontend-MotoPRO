'use client';
import {useState} from 'react';
import {Camera,ScanLine,CheckCircle2,AlertTriangle,FileText,RotateCcw} from 'lucide-react';
import {PageHeader,Panel,Notice} from '@/components/UI';
import {api,categoryLabel,expenseCategories,incomeCategories,formatMoney,toCents,todayLocal} from '@/lib/api';

type Suggestion={type:'income'|'expense';category:string;amountCents:number;occurredOn:string;description:string;merchant:string;confidence:'high'|'medium'|'low'};
type Analysis={scanId:string;suggestion:Suggestion;alreadyConfirmed:boolean;repeat:boolean};
const moneyInput=(c:number)=>c>0?(c/100).toFixed(2).replace('.',','):'';
export default function ReceiptPage(){
 const [file,setFile]=useState<File|null>(null),[data,setData]=useState<Analysis|null>(null);
 const [form,setForm]=useState({type:'expense' as 'income'|'expense',category:'other',amount:'',occurredOn:todayLocal(),description:''});
 const [processing,setProcessing]=useState(false),[saving,setSaving]=useState(false);
 const [error,setError]=useState(''),[success,setSuccess]=useState('');
 const analyze=async()=>{
  if(!file)return;
  setError('');setSuccess('');setProcessing(true);setData(null);
  if(file.size>4*1024*1024){setError('A foto deve ter no máximo 4 MB. Tire outra foto com tamanho menor.');setProcessing(false);return;}
  try{
   const payload=new FormData();payload.append('image',file);
   const response=await api<Analysis>('/receipts/analyze',{method:'POST',body:payload});
   setData(response);
   const s=response.suggestion;
   setForm({type:s.type,category:s.category,amount:moneyInput(s.amountCents),occurredOn:s.occurredOn,description:s.description||s.merchant||'Comprovante'});
  }catch(err){setError((err as Error).message);}
  finally{setProcessing(false);}
 };
 const confirm=async(e:React.FormEvent)=>{
  e.preventDefault();if(!data||data.alreadyConfirmed)return;
  const cents=toCents(form.amount);
  if(!Number.isSafeInteger(cents)||cents<=0){setError('Confira o valor total em reais. Exemplo: 25,90.');return;}
  if(form.occurredOn>todayLocal()){setError('Não é permitido cadastrar data futura.');return;}
  setSaving(true);setError('');
  try{
   const response=await api<{entry:{amountCents:number};alreadySaved:boolean}>(`/receipts/${data.scanId}/confirm`,{method:'POST',body:JSON.stringify({type:form.type,category:form.category,amountCents:cents,occurredOn:form.occurredOn,description:form.description})});
   setSuccess(response.alreadySaved?'Esse comprovante já estava no seu financeiro. Não foi duplicado.':`Registrado no financeiro: ${formatMoney(response.entry.amountCents)}.`);
   setData({...data,alreadyConfirmed:true});
  }catch(err){setError((err as Error).message);}
  finally{setSaving(false);}
 };
 return <><PageHeader eyebrow="FASE 2 · INTELIGÊNCIA ARTIFICIAL" title="Ler comprovante" description="Fotografe uma despesa ou recebimento; confira todos os campos antes de registrar."/>
  <div className="two-col"><Panel title="Fotografar ou selecionar comprovante" subtitle="Imagem JPG, PNG ou WEBP · máximo 4 MB" action={<Camera size={20}/> }>
   <div className="stack">
    <label className="field" htmlFor="receipt-file">Foto do comprovante
     <input className="input" id="receipt-file" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={e=>{setFile(e.target.files?.[0]||null);setData(null);setSuccess('');setError('');}}/>
    </label>
    <p className="field-hint">Ao enviar, a imagem é processada pelo serviço de IA. A foto não é armazenada no MotoPRO. Evite fotografar dados pessoais ou bancários desnecessários.</p>
    <button className="btn" type="button" disabled={!file||processing||saving} onClick={()=>void analyze()}><ScanLine size={18}/>{processing?'Analisando foto…':'Analisar com IA'}</button>
    {data?.repeat&&<Notice>Esta foto já foi analisada. O MotoPRO reutilizou a leitura anterior, sem cobrar outra análise.</Notice>}
    {data?.suggestion.confidence==='low'&&<Notice kind="error"><AlertTriangle size={15}/> Alguns campos não estavam claros. Confira principalmente o valor e a data.</Notice>}
   </div>
  </Panel>
  <div className="stack">
   <Panel title="Revisar lançamento" subtitle="Nenhum gasto é salvo sem a sua confirmação" action={<FileText size={18}/> }>
    {data?<form className="stack" onSubmit={confirm}>
     <p className="field-hint">Leitura da IA: <strong>{data.suggestion.confidence==='high'?'mais legível':data.suggestion.confidence==='medium'?'verifique os campos':'incerta'}</strong>. O valor pode estar incorreto.</p>
     <div className="form-grid"><div className="field"><label htmlFor="rc-type">Tipo</label><select id="rc-type" className="select" value={form.type} disabled={data.alreadyConfirmed} onChange={e=>setForm({...form,type:e.target.value as 'income'|'expense',category:'other'})}><option value="expense">Despesa</option><option value="income">Receita</option></select></div>
      <div className="field"><label htmlFor="rc-category">Categoria</label><select id="rc-category" className="select" value={form.category} disabled={data.alreadyConfirmed} onChange={e=>setForm({...form,category:e.target.value})}>{(form.type==='expense'?expenseCategories:incomeCategories).map(x=><option key={x.value} value={x.value}>{x.label}</option>)}</select></div></div>
     <div className="form-grid"><div className="field"><label htmlFor="rc-money">Total pago / recebido (R$)</label><input id="rc-money" className="input" inputMode="decimal" placeholder="Ex.: 35,50" required value={form.amount} disabled={data.alreadyConfirmed} onChange={e=>setForm({...form,amount:e.target.value})}/></div>
      <div className="field"><label htmlFor="rc-date">Data</label><input id="rc-date" className="input" type="date" max={todayLocal()} required value={form.occurredOn} disabled={data.alreadyConfirmed} onChange={e=>setForm({...form,occurredOn:e.target.value})}/></div></div>
     <div className="field"><label htmlFor="rc-desc">Descrição</label><input id="rc-desc" className="input" maxLength={160} value={form.description} disabled={data.alreadyConfirmed} onChange={e=>setForm({...form,description:e.target.value})}/></div>
     {!data.alreadyConfirmed?<button className="btn" type="submit" disabled={saving}><CheckCircle2 size={18}/>{saving?'Salvando…':'Confirmar e registrar no financeiro'}</button>:<Notice kind="success"><CheckCircle2 size={16}/> Comprovante registrado. Uma nova tentativa não duplicará o gasto.</Notice>}
     <button type="button" className="btn secondary" onClick={()=>{setFile(null);setData(null);setSuccess('');setError('');}}><RotateCcw size={16}/> Ler outro comprovante</button>
    </form>:<p className="field-hint">Envie uma imagem para ver a sugestão da IA. Você poderá corrigir valor, categoria, descrição e data.</p>}
   </Panel>
  </div></div>
  {(error||success)&&<div style={{marginTop:16}}>{error&&<Notice kind="error">{error}</Notice>}{success&&<Notice kind="success">{success}</Notice>}</div>}
  <div className="page-footer">A leitura é uma sugestão. Confira o total no comprovante original antes de confirmar; não é uma conferência bancária.</div>
 </>;
}
