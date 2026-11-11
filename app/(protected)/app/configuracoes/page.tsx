'use client';
import {useEffect,useState} from 'react';
import {LogOut,ShieldCheck,Info,UserRound,Download} from 'lucide-react';
import {useRouter} from 'next/navigation';
import {api} from '@/lib/api';
import {unlinkOnLogout} from '@/lib/notificationConsent';
import {PageHeader,Panel,Notice,Loading} from '@/components/UI';
import PushNotifications from '@/components/PushNotifications';
type PrivacyRequest={_id:string;type:'deletion'|'correction';note:string;status:'open'|'resolved';response?:string;createdAt:string;resolvedAt?:string};
type User={id:string;name:string;firstName:string;lastName:string;requiresNameCompletion:boolean;email:string;phone:string|null;role:string};
export default function SettingsPage(){
 const router=useRouter();const [user,setUser]=useState<User|null>(null),[error,setError]=useState('');
 const [phone,setPhone]=useState(''),[savingPhone,setSavingPhone]=useState(false),[phoneSaved,setPhoneSaved]=useState(false);
 const [privacyRequests,setPrivacyRequests]=useState<PrivacyRequest[]>([]);
 const [privacyType,setPrivacyType]=useState<'deletion'|'correction'>('deletion');
 const [privacyNote,setPrivacyNote]=useState('');
 const [privacyMessage,setPrivacyMessage]=useState('');
 const [privacyError,setPrivacyError]=useState('');
 const [privacyBusy,setPrivacyBusy]=useState(false);
 const loadPrivacy=()=>api<{items:PrivacyRequest[]}>('/account/privacy-requests').then(r=>setPrivacyRequests(r.items));
 const [firstName,setFirstName]=useState(''),[lastName,setLastName]=useState(''),[savingName,setSavingName]=useState(false),[nameSaved,setNameSaved]=useState(false);
 useEffect(()=>{void loadPrivacy().catch(()=>{});},[]);
 const requestPrivacy=async()=>{
  setPrivacyBusy(true);setPrivacyError('');setPrivacyMessage('');
  try{await api('/account/privacy-requests',{method:'POST',body:JSON.stringify({type:privacyType,note:privacyNote})});
   setPrivacyMessage('Solicitação registrada. Ela será analisada pela administração; nenhum dado foi apagado automaticamente.');setPrivacyNote('');await loadPrivacy();
  }catch(e){setPrivacyError(e instanceof Error?e.message:'Não foi possível registrar a solicitação');}
  finally{setPrivacyBusy(false);}
 };
 useEffect(()=>{api<{user:User}>('/auth/me').then(r=>{setUser(r.user);setPhone(r.user.phone||'');setFirstName(r.user.firstName||'');setLastName(r.user.lastName||'');}).catch(e=>setError(e.message));},[]);
 const savePhone=async(e:React.FormEvent)=>{e.preventDefault();setSavingPhone(true);setError('');setPhoneSaved(false);try{const response=await api<{user:User}>('/auth/phone',{method:'PATCH',body:JSON.stringify({phone})});setUser(response.user);setPhone(response.user.phone||'');setPhoneSaved(true);}catch(err){setError(err instanceof Error?err.message:'Falha ao salvar telefone');}finally{setSavingPhone(false);}};
 const saveName=async(e:React.FormEvent)=>{e.preventDefault();setSavingName(true);setNameSaved(false);setError('');try{const response=await api<{user:User}>('/auth/name',{method:'PATCH',body:JSON.stringify({firstName,lastName})});setUser(response.user);setNameSaved(true);window.dispatchEvent(new Event('motopro:profile-updated'));}catch(err){setError(err instanceof Error?err.message:'Falha ao atualizar o nome completo');}finally{setSavingName(false);}};
 const [exporting,setExporting]=useState(false);
 const downloadData=async()=>{setExporting(true);setError('');try{const response=await fetch('/api/account/export',{credentials:'same-origin',cache:'no-store'});if(!response.ok)throw new Error('Não foi possível exportar seus dados.');const blob=await response.blob();const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='motopro-meus-dados.json';a.click();URL.revokeObjectURL(url);}catch(e){setError(e instanceof Error?e.message:'Falha na exportação');}finally{setExporting(false);}};
 const logout=async()=>{if(user?.id)await unlinkOnLogout(user.id);await api('/auth/logout',{method:'POST'}).catch(()=>{});router.replace('/entrar');};
 return <><PageHeader eyebrow="MINHA CONTA" title="Configurações" description="Informações da sua conta, notificações e privacidade."/>
 <div className="two-col"><Panel title="Dados da conta" subtitle="Cadastro do MotoPRO">{!user?<Loading/>:<div className="stack"><form className="stack" onSubmit={saveName}><div className="field"><label htmlFor="account-first-name">Nome</label><input id="account-first-name" className="input" autoComplete="given-name" required minLength={2} maxLength={90} value={firstName} onChange={e=>{setFirstName(e.target.value);setNameSaved(false);}}/></div><div className="field"><label htmlFor="account-last-name">Sobrenome</label><input id="account-last-name" className="input" autoComplete="family-name" required minLength={2} maxLength={90} value={lastName} onChange={e=>{setLastName(e.target.value);setNameSaved(false);}}/></div><button className="btn secondary" disabled={savingName}>{savingName?'Salvando...':'Atualizar nome completo'}</button>{nameSaved&&<Notice kind="success">Nome atualizado.</Notice>}</form><div className="field"><label>E-mail</label><input className="input" value={user.email} readOnly/></div><form className="stack" onSubmit={savePhone}><div className="field"><label htmlFor="account-phone">Celular / WhatsApp com DDD</label><input id="account-phone" className="input" type="tel" autoComplete="tel" maxLength={24} required value={phone} onChange={e=>{setPhone(e.target.value);setPhoneSaved(false);}} placeholder="(94) 99999-1234"/></div><button className="btn secondary" disabled={savingPhone}>{savingPhone?'Salvando...':'Atualizar número'}</button>{phoneSaved&&<Notice kind="success">Número atualizado.</Notice>}</form><div className="integration-item"><UserRound color="#876329"/><div><strong>Conta individual</strong><small>Dados dos entregadores são separados por identificação.</small></div></div></div>}{error&&<Notice kind="error">{error}</Notice>}</Panel>
 <Panel title="Privacidade e acesso" subtitle="Proteção dos seus dados"><div className="stack"><div className="feature-check"><ShieldCheck size={18}/> Sessão com cookie HttpOnly</div><div className="feature-check"><Info size={18}/> Integrações externas desligadas por padrão</div><div className="feature-check"><ShieldCheck size={18}/> Nenhum lançamento por voz sem confirmação</div><div className="notice info">O administrador do MotoPRO pode consultar registros financeiros, metas, informações da moto e integração para suporte e acompanhamento da plataforma. A Fase 3 também permite que você cadastre nomes e telefones de clientes particulares, usados apenas para organizar suas entregas. Você pode arquivar clientes ou apagar seus contatos preservando o histórico financeiro. As consultas individuais são auditadas. A política de privacidade deve detalhar esses acessos antes da publicação comercial.</div><div className="notice info">Leitura de comprovantes e transcrição de voz são enviadas à OpenAI somente quando você solicita; as imagens e o áudio não são armazenados pelo MotoPRO. Métricas de uso e sugestões financeiras podem ser mantidas por prazo limitado. Acesse e exporte seus próprios dados mesmo após o vencimento do Premium. A política pública de privacidade ainda precisa ser finalizada antes do lançamento comercial. Você pode registrar solicitações de privacidade abaixo.</div><button className="btn secondary" disabled={exporting} onClick={downloadData}><Download size={17}/> {exporting?'Preparando seus dados...':'Exportar meus dados (JSON)'}</button><button className="btn danger" onClick={logout}><LogOut size={17}/> Sair da conta</button></div></Panel></div>
 {user?.role==='driver'&&<Panel title="Solicitações de privacidade" subtitle="Acompanhe pedidos de correção ou exclusão de dados">
  <div className="stack">
   <p>Você pode solicitar correção ou exclusão dos seus dados. O pedido é encaminhado à administração para análise, incluindo possíveis registros financeiros que precisem ser conservados por obrigação legal. <strong>Esta solicitação não exclui automaticamente sua conta.</strong></p>
   <label>Tipo de solicitação<select className="input" value={privacyType} onChange={e=>setPrivacyType(e.target.value as 'deletion'|'correction')}><option value="deletion">Solicitar exclusão dos dados</option><option value="correction">Solicitar correção dos dados</option></select></label>
   <label>Observações (opcional)<textarea className="textarea" rows={3} maxLength={500} value={privacyNote} onChange={e=>setPrivacyNote(e.target.value)} placeholder="Explique brevemente o pedido"/></label>
   <button type="button" className="btn secondary" disabled={privacyBusy} onClick={()=>void requestPrivacy()}>{privacyBusy?'Enviando...':'Registrar solicitação'}</button>
   {privacyMessage&&<Notice kind="success">{privacyMessage}</Notice>}
   {privacyError&&<Notice kind="error">{privacyError}</Notice>}
   {privacyRequests.length>0&&<div className="stack-sm"><strong>Histórico de solicitações</strong>{privacyRequests.map(r=><div className="notice info" key={r._id}>{r.type==='deletion'?'Exclusão de dados':'Correção de dados'} · {r.status==='open'?'Em análise':'Atendida'} · {new Date(r.createdAt).toLocaleDateString('pt-BR')}{r.response&&<div>{r.response}</div>}</div>)}</div>}
  </div>
 </Panel>}
 {user?.role==='driver'&&<Panel title="Notificações do MotoPRO" subtitle="Avisos opcionais no seu aparelho"><PushNotifications/></Panel>}

 </>;
}
