'use client';
import {useCallback,useEffect,useState} from 'react';
import {Plug,Link2,ShieldCheck,Wallet,Mic,RefreshCw,Unplug,CheckCircle2} from 'lucide-react';
import {api} from '@/lib/api';
import {PageHeader,Panel,Notice,Loading} from '@/components/UI';
type Provider={id:string;name:string;status:'connected'|'available'|'not_configured'|'not_available';connection?:{name:string;linkedAt:string;lastSyncAt:string|null}|null};
type SyncResult={created:number;updated:number;removed:number;missingPayoutCount:number};
export default function IntegrationsPage(){
 const [providers,setProviders]=useState<Provider[]>([]),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false);
 const [code,setCode]=useState(''),[error,setError]=useState(''),[message,setMessage]=useState('');
 const [from,setFrom]=useState(''),[to,setTo]=useState('');
 const load=useCallback(async()=>{const r=await api<{providers:Provider[]}>('/integrations');setProviders(r.providers);},[]);
 useEffect(()=>{void load().catch(e=>setError(e.message)).finally(()=>setLoading(false));},[load]);
 const rappidex=providers.find(p=>p.id==='rappidex'),linked=rappidex?.status==='connected';
 async function connect(){setError('');setMessage('');
  if(!/^[a-f\d]{48}$/i.test(code.trim())){setError('Cole o código de 48 caracteres do seu perfil no Rappidex.');return;}
  setBusy(true);try{await api('/integrations/rappidex/link',{method:'POST',body:JSON.stringify({code:code.trim()})});setCode('');await load();setMessage('Rappidex conectado. Sincronize os ganhos para importar suas entregas finalizadas.');}
  catch(e:any){setError(e.message);}finally{setBusy(false);}
 }
 async function sync(historical=false){setError('');setMessage('');
  if(historical&&(!from||!to)){setError('Informe as duas datas.');return;}
  setBusy(true);try{const r=await api<SyncResult>('/integrations/rappidex/sync',{method:'POST',body:JSON.stringify(historical?{from,to,force:true}:{force:true})});await load();
   setMessage(`Sincronizado: ${r.created} novo(s), ${r.updated} conferido(s), ${r.removed} revertido(s).${r.missingPayoutCount?` ${r.missingPayoutCount} entrega(s) sem repasse registrado foram ignoradas.`:''}`);
  }catch(e:any){setError(e.message);}finally{setBusy(false);}
 }
 async function disconnect(){if(!window.confirm('Desconectar o Rappidex? Seus lançamentos já importados serão preservados.'))return;
  setError('');setMessage('');setBusy(true);
  try{await api('/integrations/rappidex/link',{method:'DELETE'});await load();setMessage('Desconectado. Seus lançamentos históricos permanecem no MotoPRO.');}
  catch(e:any){setError(e.message);}finally{setBusy(false);}
 }
 return <><PageHeader eyebrow="CONEXÕES AUTORIZADAS" title="Integrações" description="Importe automaticamente os repasses previstos das suas entregas concluídas."/>
 {error&&<Notice kind="error">{error}</Notice>}{message&&<Notice kind="success">{message}</Notice>}
 <div className="two-col">
  <Panel title="Rappidex" subtitle="Conecte sua própria conta de motoboy">
   {loading?<Loading/>:rappidex?.status==='not_configured'?<Notice>Integração ainda não configurada pelo administrador.</Notice>:
    linked?<div className="stack">
     <div className="feature-check"><CheckCircle2 size={18}/> Conectado como <strong>{rappidex?.connection?.name}</strong></div>
     <p className="text-muted" style={{fontSize:13}}>Última sincronização: {rappidex?.connection?.lastSyncAt?new Date(rappidex.connection.lastSyncAt).toLocaleString('pt-BR'):'ainda não feita'}</p>
     <p className="text-muted" style={{fontSize:13}}>O painel sincroniza automaticamente ao abrir, no máximo uma vez a cada 10 minutos. Ou atualize agora:</p>
     <button type="button" className="btn" disabled={busy} onClick={()=>sync(false)}><RefreshCw size={16}/>{busy?'Sincronizando...':'Sincronizar ganhos agora'}</button>
     <div style={{marginTop:9,paddingTop:11,borderTop:'1px solid #554836'}}>
      <p style={{fontSize:13,marginBottom:8}}>Importar ganhos antigos (até 31 dias por consulta):</p>
      <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
       <label>De <input type="date" value={from} onChange={e=>setFrom(e.target.value)} style={{display:'block',padding:10,borderRadius:8}}/></label>
       <label>Até <input type="date" value={to} onChange={e=>setTo(e.target.value)} style={{display:'block',padding:10,borderRadius:8}}/></label>
      </div>
      <button type="button" className="btn secondary" disabled={busy||!from||!to} style={{marginTop:10}} onClick={()=>sync(true)}>Importar período</button>
     </div>
     <button type="button" className="btn outline" disabled={busy} onClick={disconnect}><Unplug size={16}/> Desconectar</button>
    </div>:<div className="stack">
     <p style={{fontSize:13}}>1. Entre na sua conta no Rappidex.</p>
     <p style={{fontSize:13}}>2. No <strong>Perfil</strong>, clique em <strong>Gerar código de conexão</strong>. O código vale por 10 minutos.</p>
     <p style={{fontSize:13}}>3. Cole o código aqui e autorize a importação dos seus próprios repasses.</p>
     <label htmlFor="rappidex-code">Código de autorização</label>
     <input id="rappidex-code" value={code} autoComplete="off" spellCheck={false} maxLength={48} onChange={e=>setCode(e.target.value.trim())} placeholder="Cole seu código aqui" style={{width:'100%',padding:12,borderRadius:10}}/>
     <button type="button" className="btn" disabled={busy||rappidex?.status!=='available'} onClick={connect}><Link2 size={16}/>{busy?'Conectando...':'Conectar Rappidex'}</button>
    </div>}
  </Panel>
  <Panel title="Suas informações protegidas" subtitle="A importação não muda seu Pix ou sua assinatura">
   <div className="stack">
    <div className="feature-check"><Plug size={18}/> Apenas entregas FINALIZADAS.</div>
    <div className="feature-check"><Wallet size={18}/> Apenas o repasse previsto para o motoboy, não a taxa da loja.</div>
    <div className="feature-check"><ShieldCheck size={18}/> Vínculo por código, sem enviar sua senha ao MotoPRO.</div>
    <div className="feature-check"><Link2 size={18}/> Não duplica entregas já importadas; revê valores ao sincronizar.</div>
    <div className="feature-check"><Mic size={18}/> Ganhos manuais e por voz continuam disponíveis.</div>
    <p className="text-muted" style={{fontSize:12}}>Se você já lançou uma entrega manualmente, revise esse lançamento para não contar duas vezes. Importações sem repasse definido são ignoradas. Repasse previsto não significa dinheiro já recebido.</p>
   </div>
  </Panel>
 </div></>;
}
