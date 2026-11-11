'use client';
import {useCallback,useEffect,useState} from 'react';
import {BellRing,Send,Save,ShieldCheck,RefreshCcw,Smartphone,Info} from 'lucide-react';
import {Panel,Loading,Notice} from '@/components/UI';
import PushNotifications from '@/components/PushNotifications';
import {api} from '@/lib/api';

type Kind='summary'|'maintenance'|'recurring'|'receivables'|'subscription';
type Template={title:string;body:string};
type Settings={enabled:boolean;categories:Record<Exclude<Kind,'summary'>,boolean>;templates:Record<Kind,Template>};
type Status={settings:Settings;provider:'onesignal'|'vapid'|'none';providerReady:boolean;myDevices:number;totalDevices:number;missingConfiguration:string|null;note:string};
const kinds:{key:Kind;label:string;description:string}[]=[
 {key:'summary',label:'Resumo diário',description:'Quando existem avisos de mais de uma categoria'},
 {key:'maintenance',label:'Manutenção da moto',description:'Manutenções próximas ou vencidas'},
 {key:'recurring',label:'Despesas recorrentes',description:'Contas programadas para os próximos dias'},
 {key:'receivables',label:'Entregas pendentes',description:'Entregas particulares ainda não recebidas'},
 {key:'subscription',label:'Assinaturas',description:'Premium pago próximo ao vencimento'}
];
export default function AdminNotificationsPanel(){
 const [status,setStatus]=useState<Status|null>(null);
 const [settings,setSettings]=useState<Settings|null>(null);
 const [kind,setKind]=useState<Kind>('summary');
 const [loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[sending,setSending]=useState(false);
 const [error,setError]=useState(''),[success,setSuccess]=useState('');
 const load=useCallback(async()=>{
  setLoading(true);setError('');
  try{const v=await api<Status>('/admin/billing/notifications');setStatus(v);setSettings(v.settings);}
  catch(e){setError(e instanceof Error?e.message:'Falha ao carregar as notificações');}
  finally{setLoading(false);}
 },[]);
 useEffect(()=>{void load();},[load]);
 const changeTemplate=(field:keyof Template,value:string)=>setSettings(s=>s?({...s,templates:{...s.templates,[kind]:{...s.templates[kind],[field]:value}}}):s);
 const save=async()=>{
  if(!settings||saving)return;
  setSaving(true);setError('');setSuccess('');
  try{const r=await api<{settings:Settings}>('/admin/billing/notifications',{method:'PATCH',body:JSON.stringify(settings)});setSettings(r.settings);setSuccess('Modelos e categorias de notificações salvos.');}
  catch(e){setError(e instanceof Error?e.message:'Falha ao salvar');}
  finally{setSaving(false);}
 };
 const test=async()=>{
  if(!settings||sending||!status?.providerReady)return;
  setSending(true);setError('');setSuccess('');
  const template=settings.templates[kind];
  try{
   const response=await api<{message:string;acceptedDevices:number}>('/admin/billing/notifications/test',{
    method:'POST',body:JSON.stringify({category:kind,title:template.title.replaceAll('{quantidade}','2'),body:template.body.replaceAll('{quantidade}','2')})});
   setSuccess(`${response.message} Dispositivos de destino: ${response.acceptedDevices}.`);
  }catch(e){setError(e instanceof Error?e.message:'Não foi possível enviar o teste.');}
  finally{setSending(false);}
 };
 return <div className="notify-admin-stack">
  {loading?<Loading/>:settings&&status&&<>
   <div className="notify-admin-kpis">
    <div className="admin-stat"><BellRing size={19}/><small>Provedor</small><strong>{status.provider==='onesignal'?'OneSignal':status.provider==='vapid'?'Web Push':'Não configurado'}</strong></div>
    <div className="admin-stat"><ShieldCheck size={19}/><small>Conexão para envio</small><strong>{status.providerReady?'Configurada':'Pendente'}</strong></div>
    <div className="admin-stat"><Smartphone size={19}/><small>Meus dispositivos</small><strong>{status.myDevices}</strong></div>
    <div className="admin-stat"><BellRing size={19}/><small>Dispositivos autorizados</small><strong>{status.totalDevices}</strong></div>
   </div>
   {!status.providerReady&&<Notice kind="error">{status.missingConfiguration||'Configure o OneSignal ou as chaves Web Push no Heroku antes de testar.'} Apenas registrar o App ID não habilita os envios.</Notice>}
   <div className="notify-admin-columns">
    <Panel title="Configuração das notificações" subtitle="Personalize o conteúdo antes de enviar aos aparelhos que autorizaram">
     <div className="stack">
      <label className="admin-toggle"><input type="checkbox" checked={settings.enabled} onChange={e=>setSettings(s=>s?({...s,enabled:e.target.checked}):s)}/> Ativar avisos diários automáticos</label>
      <p className="admin-small">A desativação não impede testes manuais do administrador. Não há envio em massa nesta tela.</p>
      <div className="notify-category-list">
       {kinds.filter(v=>v.key!=='summary').map(v=>{
        const key=v.key as Exclude<Kind,'summary'>;
        return <label key={key} className="notify-category-row"><input type="checkbox" checked={settings.categories[key]} onChange={e=>setSettings(s=>s?({...s,categories:{...s.categories,[key]:e.target.checked}}):s)}/><span><strong>{v.label}</strong><small>{v.description}</small></span></label>;
       })}
      </div>
      <label className="stack-sm">Modelo de mensagem
       <select className="select" value={kind} onChange={e=>setKind(e.target.value as Kind)}>{kinds.map(v=><option key={v.key} value={v.key}>{v.label}</option>)}</select>
      </label>
      <label className="stack-sm">Título da notificação
       <input className="input" value={settings.templates[kind].title} maxLength={75} minLength={4} onChange={e=>changeTemplate('title',e.target.value)}/>
      </label>
      <label className="stack-sm">Mensagem
       <textarea className="textarea" rows={3} value={settings.templates[kind].body} maxLength={180} minLength={10} onChange={e=>changeTemplate('body',e.target.value)}/>
      </label>
      <p className="tiny-note">Use <code>{'{quantidade}'}</code> para inserir o número de avisos. Evite nomes, valores e endereços: notificações podem aparecer na tela bloqueada.</p>
      <div className="notify-admin-buttons">
       <button type="button" className="btn" disabled={saving} onClick={()=>void save()}><Save size={17}/>{saving?'Salvando...':'Salvar notificações'}</button>
       <button type="button" className="btn secondary" disabled={loading} onClick={()=>void load()}><RefreshCcw size={16}/> Atualizar</button>
      </div>
     </div>
    </Panel>
    <div className="notify-admin-stack">
     <Panel title="Prévia da notificação" subtitle="Simulação de como o alerta pode aparecer no celular">
      <div className="notify-preview">
       <div className="notify-preview-head"><img src="/icon-192.png" alt="" width={40} height={40}/><span>MotoPRO <small>agora · exemplo</small></span><BellRing size={18}/></div>
       <strong>{settings.templates[kind].title.replaceAll('{quantidade}','2')||'MotoPRO'}</strong>
       <p>{settings.templates[kind].body.replaceAll('{quantidade}','2')||'Mensagem de exemplo'}</p>
      </div>
      <button type="button" className="btn notify-send-button" disabled={!status.providerReady||sending||status.myDevices===0} onClick={()=>void test()}><Send size={17}/>{sending?'Enviando...':'Enviar notificação de teste'}</button>
      <p className="admin-small"><Info size={14} style={{display:'inline',verticalAlign:'middle'}}/> O teste vai somente para sua conta administrativa. O serviço confirmar o recebimento do pedido não significa que o celular exibiu a notificação. Limite: 3 testes a cada 15 minutos.</p>
     </Panel>
     <Panel title="Ativar neste dispositivo" subtitle="O teste exige que este aparelho esteja autorizado">
      <PushNotifications/>
      <p className="admin-small">Depois de ativar, use o botão Atualizar para atualizar a contagem de aparelhos habilitados.</p>
     </Panel>
    </div>
   </div>
  </>}
  {success&&<Notice kind="success">{success}</Notice>}
  {error&&<Notice kind="error">{error}</Notice>}
 </div>;
}
