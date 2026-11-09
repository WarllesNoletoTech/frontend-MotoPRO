'use client';
import {useEffect,useState} from 'react';
import {LogOut,ShieldCheck,Info,UserRound,Download} from 'lucide-react';
import {useRouter} from 'next/navigation';
import {api} from '@/lib/api';
import {PageHeader,Panel,Notice,Loading} from '@/components/UI';
type User={name:string;email:string;role:string};
export default function SettingsPage(){
 const router=useRouter();const [user,setUser]=useState<User|null>(null),[error,setError]=useState('');
 useEffect(()=>{api<{user:User}>('/auth/me').then(r=>setUser(r.user)).catch(e=>setError(e.message));},[]);
 const [exporting,setExporting]=useState(false);
 const downloadData=async()=>{setExporting(true);setError('');try{const response=await fetch('/api/account/export',{credentials:'same-origin',cache:'no-store'});if(!response.ok)throw new Error('Não foi possível exportar seus dados.');const blob=await response.blob();const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='motopro-meus-dados.json';a.click();URL.revokeObjectURL(url);}catch(e){setError(e instanceof Error?e.message:'Falha na exportação');}finally{setExporting(false);}};
 const logout=async()=>{await api('/auth/logout',{method:'POST'}).catch(()=>{});router.replace('/entrar');};
 return <><PageHeader eyebrow="MINHA CONTA" title="Configurações" description="Informações da sua conta e preferências da primeira versão."/>
 <div className="two-col"><Panel title="Dados da conta" subtitle="Cadastro do MotoPRO">{!user?<Loading/>:<div className="stack"><div className="field"><label>Nome</label><input className="input" value={user.name} readOnly/></div><div className="field"><label>E-mail</label><input className="input" value={user.email} readOnly/></div><div className="integration-item"><UserRound color="#138755"/><div><strong>Conta individual</strong><small>Dados dos entregadores são separados por identificação.</small></div></div></div>}{error&&<Notice kind="error">{error}</Notice>}</Panel>
 <Panel title="Privacidade e acesso" subtitle="Proteção dos seus dados"><div className="stack"><div className="feature-check"><ShieldCheck size={18}/> Sessão com cookie HttpOnly</div><div className="feature-check"><Info size={18}/> Integrações externas desligadas por padrão</div><div className="feature-check"><ShieldCheck size={18}/> Nenhum lançamento por voz sem confirmação</div><div className="notice info">Acesse e exporte seus próprios dados mesmo após o vencimento do Premium. A exclusão da conta e a política de privacidade ainda precisam ser finalizadas antes do lançamento comercial.</div><button className="btn secondary" disabled={exporting} onClick={downloadData}><Download size={17}/> {exporting?'Preparando seus dados...':'Exportar meus dados (JSON)'}</button><button className="btn danger" onClick={logout}><LogOut size={17}/> Sair da conta</button></div></Panel></div>
 </>;
}
