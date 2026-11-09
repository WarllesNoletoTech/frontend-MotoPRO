'use client';
import {useEffect,useState} from 'react';
import {Plug,Link2,ShieldCheck,Wallet,Mic,AlertCircle} from 'lucide-react';
import {api} from '@/lib/api';
import {PageHeader,Panel,Notice,Loading} from '@/components/UI';
type Provider={id:string;name:string;status:string};
export default function IntegrationsPage(){
 const [items,setItems]=useState<Provider[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState('');
 useEffect(()=>{api<{providers:Provider[]}>('/integrations').then(r=>setItems(r.providers)).catch(e=>setError(e.message)).finally(()=>setLoading(false));},[]);
 return <><PageHeader eyebrow="CONEXÕES AUTORIZADAS" title="Integrações" description="O MotoPRO funciona sozinho. Conexões automáticas serão opcionais e autorizadas."/>
 <div className="two-col"><Panel title="Plataformas" subtitle="Disponibilidade das integrações">{loading?<Loading/>:<div className="stack-sm">{items.map(item=><div className="integration-item" key={item.id}><span className="badge-icon"><Plug/></span><div><strong>{item.name}</strong><small>{item.status==='pending_agreement'?'Aguardando autorização e definição da API':'Integração não disponibilizada'}</small></div><span className="pill warning">Em preparação</span></div>)}</div>}{error&&<Notice kind="error">{error}</Notice>}
 <div style={{marginTop:18}} className="not-ready"><AlertCircle size={16} style={{verticalAlign:'middle'}}/> Conexões automáticas ainda não estão habilitadas nesta versão. Não conecte credenciais de outras plataformas aqui.</div></Panel>
 <Panel title="Já funciona sem integração" subtitle="Você não depende de nenhuma plataforma"><div className="stack"><div className="feature-check"><Wallet size={18}/> Cadastro manual de ganhos e despesas</div><div className="feature-check"><Mic size={18}/> Comando por voz, quando configurado</div><div className="feature-check"><ShieldCheck size={18}/> Dados financeiros isolados por conta</div><div className="feature-check"><Link2 size={18}/> Conectores independentes, no futuro</div></div><p style={{fontSize:12,color:'#778d7f',marginTop:18}}>Para o Rappidex, será necessário um contrato de integração com autenticação, escopos de acesso, identificação do entregador e tratamento de duplicações.</p></Panel></div>
 </>;
}
