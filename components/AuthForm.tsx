'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {Bike,LoaderCircle} from 'lucide-react';
import {api} from '@/lib/api';
import {Notice} from './UI';
export default function AuthForm({mode}:{mode:'login'|'register'}){
 const router=useRouter();
 const [firstName,setFirstName]=useState(''),[lastName,setLastName]=useState(''),[email,setEmail]=useState(''),[phone,setPhone]=useState(''),[password,setPassword]=useState('');
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 const [referralCode,setReferralCode]=useState('');
 useEffect(()=>{if(mode==='register'){const ref=new URLSearchParams(window.location.search).get('ref');if(ref)setReferralCode(ref.toUpperCase().slice(0,12));}},[mode]);
 const submit=async(e:React.FormEvent)=>{
  e.preventDefault();setError('');setBusy(true);
  try{const result=await api<{user:{role:string}}>(mode==='login'?'/auth/login':'/auth/register',{method:'POST',body:JSON.stringify(mode==='login'?{email,password}:{firstName,lastName,email,phone,password,...(referralCode.trim()?{referralCode:referralCode.trim().toUpperCase()}:{})})});router.replace(result.user.role==='admin'?'/app/admin':'/app');router.refresh();}
  catch(err){setError(err instanceof Error?err.message:'Falha no acesso');}
  finally{setBusy(false);}
 };
 return <div className="auth-page"><section className="auth-card"><Link href="/" className="brand"><span className="brand-mark"><Bike/></span><span><strong>Moto<span className="brand-highlight">PRO</span></strong><small>O controle é seu.</small></span></Link>
  <h1>{mode==='login'?'Bem-vindo de volta':'Comece a cuidar dos seus ganhos'}</h1><p>{mode==='login'?'Entre para acompanhar seu financeiro.':'Crie sua conta e comece a organizar suas entregas.'}</p>
  <form onSubmit={submit}>
   {mode==='register'&&<div className="field"><label htmlFor="first-name">Nome</label><input id="first-name" className="input" required minLength={2} maxLength={90} autoComplete="given-name" value={firstName} onChange={e=>setFirstName(e.target.value)} placeholder="Ex.: João"/></div>}
   {mode==='register'&&<div className="field"><label htmlFor="last-name">Sobrenome</label><input id="last-name" className="input" required minLength={2} maxLength={90} autoComplete="family-name" value={lastName} onChange={e=>setLastName(e.target.value)} placeholder="Ex.: da Silva"/><span className="field-hint">Informe os dois campos para identificar sua conta e sua cobrança Pix.</span></div>}
   {mode==='register'&&<div className="field"><label htmlFor="phone">Celular / WhatsApp com DDD</label><input id="phone" className="input" type="tel" inputMode="tel" required autoComplete="tel" maxLength={24} value={phone} onChange={e=>setPhone(e.target.value)} placeholder="(94) 99999-1234"/><span className="field-hint">Obrigatório para o cadastro. Informe seu número brasileiro com DDD.</span></div>}
   {mode==='register'&&<div className="field"><label htmlFor="referral-code">Código de indicação (opcional)</label><input id="referral-code" className="input" maxLength={12} autoCapitalize="characters" value={referralCode} onChange={e=>setReferralCode(e.target.value.toUpperCase().replace(/[^A-F0-9]/g,'').slice(0,12))} placeholder="Código de quem indicou você"/><span className="field-hint">Se você recebeu um convite, o código já aparece preenchido. O bônus de R$ 5 é liberado a quem convidou após seu primeiro pagamento aprovado.</span></div>}
   <div className="field"><label htmlFor="email">E-mail</label><input id="email" className="input" type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="seu@email.com"/></div>
   <div className="field"><label htmlFor="password">Senha</label><input id="password" className="input" type="password" required minLength={mode==='register'?8:1} autoComplete={mode==='register'?'new-password':'current-password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder={mode==='register'?'Mínimo 8 caracteres':'Sua senha'}/></div>
   {error&&<Notice kind="error">{error}</Notice>}
   <button className="btn wide" disabled={busy}>{busy?<><LoaderCircle size={17} className="spin"/> Aguarde...</>:mode==='login'?'Entrar no MotoPRO':'Criar conta'}</button>
  </form><div className="auth-footer">{mode==='login'?<>Ainda não tem conta? <Link href="/cadastro">Cadastre-se</Link></>:<>Já tem conta? <Link href="/entrar">Entrar</Link></>}</div>
 </section></div>;
}
