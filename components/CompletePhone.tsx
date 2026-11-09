'use client';
import {useState} from 'react';
import {Bike,Phone,LoaderCircle,LogOut} from 'lucide-react';
import {api} from '@/lib/api';
import {Notice} from '@/components/UI';
type Account={id:string;name:string;email:string;phone:string|null;role:string;trialEndsAt:string};
export default function CompletePhone({name,onComplete,onLogout}:{name:string;onComplete:(u:Account)=>void;onLogout:()=>void}){
 const [phone,setPhone]=useState('');
 const [saving,setSaving]=useState(false),[error,setError]=useState('');
 const save=async(e:React.FormEvent)=>{
  e.preventDefault();setSaving(true);setError('');
  try{const result=await api<{user:Account}>('/auth/phone',{method:'PATCH',body:JSON.stringify({phone})});onComplete(result.user);window.dispatchEvent(new Event('motopro:phone-completed'));}
  catch(err){setError(err instanceof Error?err.message:'Não foi possível salvar seu número');}
  finally{setSaving(false);}
 };
 return <div className="phone-completion-page"><section className="phone-completion-card" role="region" aria-label="Completar cadastro">
  <div className="phone-completion-icon"><Phone size={34}/></div>
  <div className="phone-completion-brand"><Bike size={22}/> Moto<span>PRO</span></div>
  <h1>Falta só seu número de celular</h1>
  <p>Olá, {name}. Para continuar usando o MotoPRO, informe seu número com DDD. Seus dados e sua assinatura continuam preservados.</p>
  <form onSubmit={save} className="stack">
   <label htmlFor="phone-complete">Celular / WhatsApp com DDD</label>
   <input className="input" id="phone-complete" type="tel" inputMode="tel" autoComplete="tel" placeholder="(94) 99999-1234" maxLength={24} required value={phone} onChange={e=>setPhone(e.target.value)}/>
   {error&&<Notice kind="error">{error}</Notice>}
   <button className="btn wide" disabled={saving}>{saving?<><LoaderCircle size={17} className="spin"/> Salvando...</>: 'Salvar número e continuar'}</button>
  </form>
  <button className="phone-completion-exit" type="button" onClick={onLogout}><LogOut size={16}/> Sair da conta</button>
 </section></div>;
}
