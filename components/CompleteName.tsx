 'use client';
import {useState} from 'react';
import {Bike,UserRound,LoaderCircle,LogOut} from 'lucide-react';
import {api} from '@/lib/api';
import {Notice} from '@/components/UI';
export type AccountWithName={id:string;name:string;firstName:string;lastName:string;requiresNameCompletion:boolean;email:string;phone:string|null;role:string;trialEndsAt:string};
export default function CompleteName({user,onComplete,onLogout}:{user:AccountWithName;onComplete:(u:AccountWithName)=>void;onLogout:()=>void}){
 const [firstName,setFirstName]=useState(user.firstName||'');
 const [lastName,setLastName]=useState(user.lastName||'');
 const [saving,setSaving]=useState(false),[error,setError]=useState('');
 const save=async(e:React.FormEvent)=>{
  e.preventDefault();setSaving(true);setError('');
  try{const response=await api<{user:AccountWithName}>('/auth/name',{method:'PATCH',body:JSON.stringify({firstName,lastName})});onComplete(response.user);window.dispatchEvent(new Event('motopro:profile-updated'));}
  catch(err){setError(err instanceof Error?err.message:'Não foi possível atualizar o nome completo');}
  finally{setSaving(false);}
 };
 return <div className="phone-completion-page"><section className="phone-completion-card" role="region" aria-label="Completar nome e sobrenome">
   <div className="phone-completion-icon"><UserRound size={34}/></div>
   <div className="phone-completion-brand"><Bike size={22}/> Moto<span>PRO</span></div>
   <h1>Confirme seu nome e sobrenome</h1>
   <p>Para continuar no MotoPRO, precisamos do seu nome e sobrenome completos. Eles serão enviados ao Mercado Pago na identificação da sua cobrança Pix. Sua assinatura e seu histórico serão preservados.</p>
   <form onSubmit={save} className="stack">
     <label htmlFor="complete-first-name">Nome</label>
     <input className="input" id="complete-first-name" autoComplete="given-name" required minLength={2} maxLength={90} value={firstName} onChange={e=>setFirstName(e.target.value)} placeholder="Ex.: João"/>
     <label htmlFor="complete-last-name">Sobrenome</label>
     <input className="input" id="complete-last-name" autoComplete="family-name" required minLength={2} maxLength={90} value={lastName} onChange={e=>setLastName(e.target.value)} placeholder="Ex.: da Silva"/>
     {error&&<Notice kind="error">{error}</Notice>}
     <button className="btn wide" disabled={saving}>{saving?<><LoaderCircle size={17} className="spin"/> Salvando...</>:'Salvar nome e continuar'}</button>
   </form>
   <button className="phone-completion-exit" type="button" onClick={onLogout}><LogOut size={16}/> Sair da conta</button>
 </section></div>;
}
