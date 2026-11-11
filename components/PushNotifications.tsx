'use client';
import {useCallback,useEffect,useState} from 'react';
import {Bell,BellOff} from 'lucide-react';
import {api} from '@/lib/api';
import {Notice,Loading} from '@/components/UI';
type Config={supported:boolean;publicKey:string|null;registeredDevices:number};
function decodeKey(key:string){
 const normal=key.replace(/-/g,'+').replace(/_/g,'/');
 const raw=atob(normal+'='.repeat((4-normal.length%4)%4));
 const buffer=new ArrayBuffer(raw.length);
 const bytes=new Uint8Array(buffer);
 for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
 return buffer;
}
export default function PushNotifications(){
 const [config,setConfig]=useState<Config|null>(null);
 const [enabled,setEnabled]=useState(false);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');
 const available=typeof window!=='undefined'&&'serviceWorker' in navigator&&'PushManager' in window&&'Notification' in window;
 const refresh=useCallback(async()=>{
  const settings=await api<Config>('/notifications/config');setConfig(settings);
  if(available){
   const reg=await navigator.serviceWorker.ready;
   const sub=await reg.pushManager.getSubscription();setEnabled(!!sub);
  }
 },[available]);
 useEffect(()=>{void refresh().catch(e=>setError(e instanceof Error?e.message:'Não foi possível consultar notificações'));},[refresh]);
 const toggle=async()=>{
  if(busy)return;
  setBusy(true);setError('');setNotice('');
  try{
   if(!available)throw new Error('Este navegador não oferece Web Push. Em alguns iPhones é necessário instalar o PWA na tela inicial.');
   const registration=await navigator.serviceWorker.ready;
   const current=await registration.pushManager.getSubscription();
   if(current){
    const endpoint=current.endpoint;
    // Cancelamento no servidor antes de desinscrever o dispositivo.
    await api('/notifications/unsubscribe',{method:'POST',body:JSON.stringify({endpoint})});
    await current.unsubscribe();setEnabled(false);setNotice('Notificações desativadas neste dispositivo.');
   }else{
    if(!config?.publicKey)throw new Error('O administrador ainda não configurou o Web Push no servidor.');
    const permission=await Notification.requestPermission();
    if(permission!=='granted')throw new Error('Você precisa permitir notificações nas configurações do navegador.');
    const sub=await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:decodeKey(config.publicKey)});
    try{
     const data=sub.toJSON();
     await api('/notifications/subscribe',{method:'POST',body:JSON.stringify({endpoint:sub.endpoint,keys:data.keys})});
    }catch(e){await sub.unsubscribe();throw e;}
    setEnabled(true);setNotice('Notificações ativadas neste dispositivo.');
   }
   await refresh();
  }catch(e){setError(e instanceof Error?e.message:'Falha ao atualizar notificações');}
  finally{setBusy(false);}
 };
 return <div className="stack">
  {!config?<Loading/>:<>
   <p>Receba avisos gerais sobre pendências de manutenção, despesas previstas e recebimentos quando houver notificações disponíveis. Nenhum valor financeiro aparece na tela bloqueada.</p>
   {enabled?<Notice kind="success">Notificações permitidas neste dispositivo.</Notice>:<Notice>Notificações desativadas neste dispositivo.</Notice>}
   {!config.supported&&<Notice>O envio automático ainda não está configurado no Heroku.</Notice>}
   <button type="button" className="btn secondary" disabled={busy||(!enabled&&!config.supported)} onClick={()=>void toggle()}>
    {enabled?<BellOff size={17}/>:<Bell size={17}/>}{busy?'Atualizando...':enabled?'Desativar notificações':'Ativar notificações'}
   </button>
   <p className="tiny-note">Opcional. Envio externo somente mediante seu consentimento e com o agendador ativo; depende de internet, navegador e permissão do aparelho. Avisos internos continuam disponíveis em Avisos e pendências.</p>
  </>}
  {notice&&<Notice kind="success">{notice}</Notice>}
  {error&&<Notice kind="error">{error}</Notice>}
 </div>;
}
