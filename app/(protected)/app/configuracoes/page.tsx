'use client';
import {useEffect,useState} from 'react';
import {LogOut,ShieldCheck,Info,UserRound,Download,Mail,MailX} from 'lucide-react';
import {useRouter} from 'next/navigation';
import {api} from '@/lib/api';
import {PageHeader,Panel,Notice,Loading} from '@/components/UI';
type ReportEmailSettings={email:string;enabled:boolean;pendingVerification:boolean;configured:boolean};
type User={name:string;firstName:string;lastName:string;requiresNameCompletion:boolean;email:string;phone:string|null;role:string};
export default function SettingsPage(){
 const router=useRouter();const [user,setUser]=useState<User|null>(null),[error,setError]=useState('');
 const [phone,setPhone]=useState(''),[savingPhone,setSavingPhone]=useState(false),[phoneSaved,setPhoneSaved]=useState(false);
 const [reportEmail,setReportEmail]=useState<ReportEmailSettings|null>(null);
 const [reportMessage,setReportMessage]=useState(''),[reportError,setReportError]=useState(''),[reportBusy,setReportBusy]=useState(false);
 const reloadReportEmail=()=>api<ReportEmailSettings>('/account/report-email').then(setReportEmail);
 useEffect(()=>{
  let active=true;
  const token=new URLSearchParams(window.location.search).get('confirmarRelatorio');
  const start=async()=>{
   if(token){
    try{await api('/account/report-email/confirm',{method:'POST',body:JSON.stringify({token})});if(active)setReportMessage('Endereço confirmado. Seus relatórios serão enviados automaticamente quando o agendador estiver ativo.');}
    catch(e){if(active)setReportError(e instanceof Error?e.message:'Não foi possível confirmar o endereço.');}
    finally{window.history.replaceState(null,'',window.location.pathname);}
   }
   await reloadReportEmail().catch(e=>{if(active)setReportError(e instanceof Error?e.message:'Não foi possível consultar a preferência.');});
  };
  void start();return()=>{active=false;};
 },[]);
 const saveReportEmail=async(enable:boolean)=>{
  setReportBusy(true);setReportError('');setReportMessage('');
  try{await api(enable?'/account/report-email/request':'/account/report-email',{method:enable?'POST':'DELETE'});
   setReportMessage(enable?'Enviamos uma confirmação para seu e-mail. Verifique sua caixa de entrada.':'Envio automático desativado.');
   await reloadReportEmail();
  }catch(e){setReportError(e instanceof Error?e.message:'Falha ao atualizar envio.');}
  finally{setReportBusy(false);}
 };
 const [firstName,setFirstName]=useState(''),[lastName,setLastName]=useState(''),[savingName,setSavingName]=useState(false),[nameSaved,setNameSaved]=useState(false);
 useEffect(()=>{api<{user:User}>('/auth/me').then(r=>{setUser(r.user);setPhone(r.user.phone||'');setFirstName(r.user.firstName||'');setLastName(r.user.lastName||'');}).catch(e=>setError(e.message));},[]);
 const savePhone=async(e:React.FormEvent)=>{e.preventDefault();setSavingPhone(true);setError('');setPhoneSaved(false);try{const response=await api<{user:User}>('/auth/phone',{method:'PATCH',body:JSON.stringify({phone})});setUser(response.user);setPhone(response.user.phone||'');setPhoneSaved(true);}catch(err){setError(err instanceof Error?err.message:'Falha ao salvar telefone');}finally{setSavingPhone(false);}};
 const saveName=async(e:React.FormEvent)=>{e.preventDefault();setSavingName(true);setNameSaved(false);setError('');try{const response=await api<{user:User}>('/auth/name',{method:'PATCH',body:JSON.stringify({firstName,lastName})});setUser(response.user);setNameSaved(true);window.dispatchEvent(new Event('motopro:profile-updated'));}catch(err){setError(err instanceof Error?err.message:'Falha ao atualizar o nome completo');}finally{setSavingName(false);}};
 const [exporting,setExporting]=useState(false);
 const downloadData=async()=>{setExporting(true);setError('');try{const response=await fetch('/api/account/export',{credentials:'same-origin',cache:'no-store'});if(!response.ok)throw new Error('Não foi possível exportar seus dados.');const blob=await response.blob();const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='motopro-meus-dados.json';a.click();URL.revokeObjectURL(url);}catch(e){setError(e instanceof Error?e.message:'Falha na exportação');}finally{setExporting(false);}};
 const logout=async()=>{await api('/auth/logout',{method:'POST'}).catch(()=>{});router.replace('/entrar');};
 return <><PageHeader eyebrow="MINHA CONTA" title="Configurações" description="Informações da sua conta e preferências de privacidade e relatórios."/>
 <div className="two-col"><Panel title="Dados da conta" subtitle="Cadastro do MotoPRO">{!user?<Loading/>:<div className="stack"><form className="stack" onSubmit={saveName}><div className="field"><label htmlFor="account-first-name">Nome</label><input id="account-first-name" className="input" autoComplete="given-name" required minLength={2} maxLength={90} value={firstName} onChange={e=>{setFirstName(e.target.value);setNameSaved(false);}}/></div><div className="field"><label htmlFor="account-last-name">Sobrenome</label><input id="account-last-name" className="input" autoComplete="family-name" required minLength={2} maxLength={90} value={lastName} onChange={e=>{setLastName(e.target.value);setNameSaved(false);}}/></div><button className="btn secondary" disabled={savingName}>{savingName?'Salvando...':'Atualizar nome completo'}</button>{nameSaved&&<Notice kind="success">Nome atualizado.</Notice>}</form><div className="field"><label>E-mail</label><input className="input" value={user.email} readOnly/></div><form className="stack" onSubmit={savePhone}><div className="field"><label htmlFor="account-phone">Celular / WhatsApp com DDD</label><input id="account-phone" className="input" type="tel" autoComplete="tel" maxLength={24} required value={phone} onChange={e=>{setPhone(e.target.value);setPhoneSaved(false);}} placeholder="(94) 99999-1234"/></div><button className="btn secondary" disabled={savingPhone}>{savingPhone?'Salvando...':'Atualizar número'}</button>{phoneSaved&&<Notice kind="success">Número atualizado.</Notice>}</form><div className="integration-item"><UserRound color="#876329"/><div><strong>Conta individual</strong><small>Dados dos entregadores são separados por identificação.</small></div></div></div>}{error&&<Notice kind="error">{error}</Notice>}</Panel>
 <Panel title="Privacidade e acesso" subtitle="Proteção dos seus dados"><div className="stack"><div className="feature-check"><ShieldCheck size={18}/> Sessão com cookie HttpOnly</div><div className="feature-check"><Info size={18}/> Integrações externas desligadas por padrão</div><div className="feature-check"><ShieldCheck size={18}/> Nenhum lançamento por voz sem confirmação</div><div className="notice info">O administrador do MotoPRO pode consultar registros financeiros, metas, informações da moto e integração para suporte e acompanhamento da plataforma. A Fase 3 também permite que você cadastre nomes e telefones de clientes particulares, usados apenas para organizar suas entregas. Você pode arquivar clientes ou apagar seus contatos preservando o histórico financeiro. As consultas individuais são auditadas. A política de privacidade deve detalhar esses acessos antes da publicação comercial.</div><div className="notice info">Leitura de comprovantes e transcrição de voz são enviadas à OpenAI somente quando você solicita; as imagens e o áudio não são armazenados pelo MotoPRO. Métricas de uso e sugestões financeiras podem ser mantidas por prazo limitado. Acesse e exporte seus próprios dados mesmo após o vencimento do Premium. A exclusão da conta e a política de privacidade ainda precisam ser finalizadas antes do lançamento comercial.</div><button className="btn secondary" disabled={exporting} onClick={downloadData}><Download size={17}/> {exporting?'Preparando seus dados...':'Exportar meus dados (JSON)'}</button><button className="btn danger" onClick={logout}><LogOut size={17}/> Sair da conta</button></div></Panel></div>
 {user?.role==='driver'&&<Panel title="Envio automático de relatórios" subtitle="Controle sua autorização mesmo sem Premium ativo">
  <div className="stack">
   <p>Você pode receber o resumo financeiro semanal no e-mail <strong>{user.email}</strong>. O link de confirmação vale por 24 horas.</p>
   {!reportEmail?<Loading/>:<>
    {reportEmail.enabled?<Notice kind="success">Endereço confirmado e envio semanal ativado.</Notice>:
     reportEmail.pendingVerification?<Notice>Confirmação pendente: confira o e-mail que enviamos.</Notice>:
     <Notice>Os relatórios não são enviados automaticamente para sua conta.</Notice>}
    {!reportEmail.configured&&<Notice kind="error">O administrador ainda não configurou o serviço de e-mail no servidor.</Notice>}
    {reportEmail.enabled?<button className="btn secondary" disabled={reportBusy} onClick={()=>void saveReportEmail(false)}><MailX size={17}/> Desativar recebimento</button>:
     <button className="btn secondary" disabled={reportBusy||!reportEmail.configured} onClick={()=>void saveReportEmail(true)}><Mail size={17}/> {reportEmail.pendingVerification?'Reenviar confirmação':'Solicitar confirmação por e-mail'}</button>}
   </>}
   {reportMessage&&<Notice kind="success">{reportMessage}</Notice>}
   {reportError&&<Notice kind="error">{reportError}</Notice>}
   <p className="tiny-note">O envio será realizado para contas com Premium, teste gratuito ou cortesia vigente; requer confirmação e agendador ativo.</p>
  </div>
 </Panel>}
 </>;
}
