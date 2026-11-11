'use client';
import {useCallback,useEffect,useState} from 'react';
import {Bell,BellOff} from 'lucide-react';
import {api} from '@/lib/api';
import {Notice,Loading} from '@/components/UI';
import {type PushConfig,readPushConfig,isDeviceSubscribed,enableNotifications,disableNotifications,isIosDevice,isStandalone,canRequestPush} from '@/lib/notificationConsent';
export default function PushNotifications(){
 const [config,setConfig]=useState<PushConfig|null>(null);
 const [userId,setUserId]=useState('');
 const [enabled,setEnabled]=useState(false);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');
 const refresh=useCallback(async()=>{
  const [settings,profile]=await Promise.all([readPushConfig(),api<{user:{id:string}}>('/auth/me')]);
  setConfig(settings);setUserId(profile.user.id);
  setEnabled(await isDeviceSubscribed(settings,profile.user.id));
 },[]);
 useEffect(()=>{void refresh().catch(e=>setError(e instanceof Error?e.message:'Não foi possível consultar as notificações'));},[refresh]);
 const toggle=async()=>{
  if(busy||!config||!userId)return;
  setBusy(true);setError('');setNotice('');
  try{
   if(enabled){await disableNotifications(config,userId);setNotice('Notificações desativadas neste dispositivo.');}
   else{await enableNotifications(config,userId);setNotice('Notificações ativadas com sucesso.');}
   await refresh();
  }catch(e){setError(e instanceof Error?e.message:'Não foi possível atualizar as notificações.');}
  finally{setBusy(false);}
 };
 const needsInstall=isIosDevice()&&!isStandalone();
 return <div className="stack">
  {!config?<Loading/>:<>
   <p>Receba notificações opcionais sobre avisos e pendências. Nenhum valor financeiro é mostrado na tela bloqueada.</p>
   {enabled?<Notice kind="success">Notificações ativadas neste dispositivo.</Notice>:<Notice>Notificações ainda não ativadas neste dispositivo.</Notice>}
   {!config.supported&&<Notice>O administrador ainda precisa configurar o {config.provider==='onesignal'?'OneSignal':'serviço de notificações'} no Heroku.</Notice>}
   {needsInstall&&<Notice>Para receber notificações no iPhone, instale o MotoPRO pela opção “Adicionar à Tela de Início” e abra o aplicativo instalado.</Notice>}
   {typeof window!=='undefined'&&'Notification' in window&&Notification.permission==='denied'&&<Notice kind="error">As notificações estão bloqueadas nas permissões do navegador. Reative-as nas configurações do site.</Notice>}
   <button type="button" className="btn secondary" disabled={busy||!config.supported||(!enabled&&!canRequestPush(config))} onClick={()=>void toggle()}>
    {enabled?<BellOff size={17}/>:<Bell size={17}/>} {busy?'Atualizando...':enabled?'Desativar notificações':'Ativar notificações'}
   </button>
   <p className="tiny-note">Ativação voluntária. {config.provider==='onesignal'?'As notificações são entregues pelo OneSignal.':'Envio por Web Push do MotoPRO.'} O envio automático depende de internet e das configurações do servidor. Você pode desativar neste aparelho quando quiser.</p>
  </>}
  {notice&&<Notice kind="success">{notice}</Notice>}
  {error&&<Notice kind="error">{error}</Notice>}
 </div>;
}
