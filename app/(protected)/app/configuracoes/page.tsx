'use client';
import {useEffect,useState} from 'react';
import {LogOut,ShieldCheck,Info,UserRound} from 'lucide-react';
import {useRouter} from 'next/navigation';
import {api} from '@/lib/api';
import {PageHeader,Panel,Notice,Loading} from '@/components/UI';
type User={name:string;email:string;role:string};
export default function SettingsPage(){
 const router=useRouter();const [user,setUser]=useState<User|null>(null),[error,setError]=useState('');
 useEffect(()=>{api<{user:User}>('/auth/me').then(r=>setUser(r.user)).catch(e=>setError(e.message));},[]);
 const logout=async()=>{await api('/auth/logout',{method:'POST'}).catch(()=>{});router.replace('/entrar');};
 return <><PageHeader eyebrow="MINHA CONTA" title="Configurações" description="Informações da sua conta e preferências da primeira versão."/>
 <div className="two-col"><Panel title="Dados da conta" subtitle="Cadastro do MotoPRO">{!user?<Loading/>:<div className="stack"><div className="field"><label>Nome</label><input className="input" value={user.name} readOnly/></div><div className="field"><label>E-mail</label><input className="input" value={user.email} readOnly/></div><div className="integration-item"><UserRound color="#138755"/><div><strong>Conta individual</strong><small>Dados dos entregadores são separados por identificação.</small></div></div></div>}{error&&<Notice kind="error">{error}</Notice>}</Panel>
 <Panel title="Privacidade e acesso" subtitle="Proteção dos seus dados"><div className="stack"><div className="feature-check"><ShieldCheck size={18}/> Sessão com cookie HttpOnly</div><div className="feature-check"><Info size={18}/> Integrações externas desligadas por padrão</div><div className="feature-check"><ShieldCheck size={18}/> Nenhum lançamento por voz sem confirmação</div><div className="notice info">Versão de desenvolvimento: antes de comercializar, implementar fluxo de exportação e exclusão de conta, termos e política de privacidade.</div><button className="btn danger" onClick={logout}><LogOut size={17}/> Sair da conta</button></div></Panel></div>
 </>;
}
