'use client';
import {useEffect,useRef,useState} from 'react';
import {usePathname} from 'next/navigation';
import {BellRing,Download,Smartphone,X,ShieldCheck,CheckCircle2,Settings2,ArrowRight,LoaderCircle} from 'lucide-react';
import MotoMark from '@/components/MotoMark';
import {api} from '@/lib/api';
import {type PushConfig,readPushConfig,canRequestPush,isDeviceSubscribed,enableNotifications,isIosDevice,isStandalone,PUSH_CONSENT_DELAY_MS} from '@/lib/notificationConsent';

type InstallEvent=Event&{prompt:()=>Promise<void>;userChoice:Promise<{outcome:'accepted'|'dismissed'}>};
type Account={id:string;role:string;phone:string|null;requiresNameCompletion:boolean};
type Stage='notifications'|'install'|null;
const INSTALL_DELAY_KEY='motopro-install-remind-after';
const NOTIFY_DELAY_PREFIX='motopro-notifications-remind-after:';
const LOGIN_KEY='motopro:postlogin-setup';
const delay=(key:string)=>{try{return Number(localStorage.getItem(key)||0)>Date.now();}catch{return false;}};
const postpone=(key:string,period=PUSH_CONSENT_DELAY_MS)=>{try{localStorage.setItem(key,String(Date.now()+period));}catch{/* Preferências não podem impedir o uso do app. */}};

/** Convites coordenados, sem sobrepor permissões do navegador, sem interromper o login. */
export default function PwaInstallPrompt(){
 const path=usePathname();
 const [deferred,setDeferred]=useState<InstallEvent|null>(null);
 const [installed,setInstalled]=useState(false);
 const [platform,setPlatform]=useState<'ios'|'android'|'other'>('other');
 const [account,setAccount]=useState<Account|null>(null);
 const [config,setConfig]=useState<PushConfig|null>(null);
 const [stage,setStage]=useState<Stage>(null);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const primaryRef=useRef<HTMLButtonElement|null>(null);
 const evaluated=useRef<string>('');

 useEffect(()=>{
  setPlatform(isIosDevice()?'ios':/Android/i.test(navigator.userAgent)?'android':'other');
  setInstalled(isStandalone());
  const before=(event:Event)=>{event.preventDefault();setDeferred(event as InstallEvent);};
  const done=()=>{setInstalled(true);setStage(null);setDeferred(null);postpone(INSTALL_DELAY_KEY,365*24*60*60*1000);};
  window.addEventListener('beforeinstallprompt',before);
  window.addEventListener('appinstalled',done);
  return()=>{window.removeEventListener('beforeinstallprompt',before);window.removeEventListener('appinstalled',done);};
 },[]);
 useEffect(()=>{
  if(!path?.startsWith('/app')){evaluated.current='';setAccount(null);setConfig(null);setStage(null);return;}
  let active=true;
  const load=async()=>{
   try{
    const {user}=await api<{user:Account}>('/auth/me');
    if(!active)return;
    if(user.requiresNameCompletion||(user.role==='driver'&&!user.phone)){
     setAccount(null);return;
    }
    setAccount(user);
    const settings=await readPushConfig().catch(()=>null);
    if(active)setConfig(settings||{supported:false,provider:'none',oneSignalAppId:null,publicKey:null,registeredDevices:0});
   }catch{if(active){setAccount(null);setConfig(null);}}
  };
  void load();
  window.addEventListener('motopro:phone-completed',load);
  window.addEventListener('motopro:profile-updated',load);
  return()=>{active=false;window.removeEventListener('motopro:phone-completed',load);window.removeEventListener('motopro:profile-updated',load);};
 },[path]);

 const canInstall=()=>!installed&&!isStandalone()&&(Boolean(deferred)||platform==='ios'||platform==='android'||/Chrome|Edg/i.test(navigator.userAgent))&&!delay(INSTALL_DELAY_KEY);
 const complete=()=>{
  try{sessionStorage.removeItem(LOGIN_KEY);}catch{/* Sem armazenamento de sessão. */}
  setStage(null);
 };
 const afterNotification=()=>{
  setError('');setBusy(false);
  if(canInstall())setStage('install');else complete();
 };
 useEffect(()=>{
  if(!account||!config||stage)return;
  let freshLogin=false;
  try{freshLogin=Boolean(sessionStorage.getItem(LOGIN_KEY));}catch{/* Sessão sem storage. */}
  const stamp=`${account.id}:${freshLogin}:${installed}:${Boolean(deferred)}:${platform}`;
  if(evaluated.current===stamp)return;
  evaluated.current=stamp;
  let active=true;
  const check=async()=>{
   const key=NOTIFY_DELAY_PREFIX+account.id;
   const inviteNotifications=freshLogin&&account.role==='driver'&&canRequestPush(config)&&!delay(key);
   // No iPhone, a instalação é condição para receber web push.
   if(inviteNotifications){
    const subscribed=await isDeviceSubscribed(config,account.id).catch(()=>false);
    if(active&&!subscribed){setStage('notifications');return;}
   }
   if(active&&canInstall()){setStage('install');return;}
   if(active&&freshLogin)complete();
  };
  void check();return()=>{active=false;};
 },[account,config,stage,installed,deferred,platform]);
 useEffect(()=>{
  if(!stage)return;
  const old=document.body.style.overflow;document.body.style.overflow='hidden';
  primaryRef.current?.focus();
  const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'&&!busy){event.preventDefault();if(stage==='notifications'){if(account)postpone(NOTIFY_DELAY_PREFIX+account.id);afterNotification();}else{postpone(INSTALL_DELAY_KEY);complete();}}};
  document.addEventListener('keydown',escape);
  return()=>{document.body.style.overflow=old;document.removeEventListener('keydown',escape);};
 },[stage,busy,account]);
 const closeNotification=()=>{
  if(account)postpone(NOTIFY_DELAY_PREFIX+account.id);
  afterNotification();
 };
 const acceptNotification=async()=>{
  if(!account||!config||busy)return;
  setBusy(true);setError('');
  try{
   await enableNotifications(config,account.id);
   // Não repetir o convite quando já houve autorização.
   postpone(NOTIFY_DELAY_PREFIX+account.id,365*24*60*60*1000);
   afterNotification();
  }catch(e){setError(e instanceof Error?e.message:'Não foi possível ativar notificações. Você pode tentar novamente em Configurações.');setBusy(false);}
 };
 const dismissInstall=()=>{postpone(INSTALL_DELAY_KEY);complete();};
 const acceptInstall=async()=>{
  if(!deferred)return;
  setBusy(true);setError('');
  try{
   await deferred.prompt();
   const choice=await deferred.userChoice;
   setDeferred(null);
   if(choice.outcome==='accepted')postpone(INSTALL_DELAY_KEY,365*24*60*60*1000);
   else postpone(INSTALL_DELAY_KEY);
   complete();
  }catch{setDeferred(null);setError('Não foi possível iniciar a instalação. Use o menu do navegador para adicionar o aplicativo.');}
  finally{setBusy(false);}
 };
 if(!stage||!account)return null;
 const notificationStage=stage==='notifications';
 return <div className="pwa-install-overlay" role="presentation"><section role="dialog" aria-modal="true" aria-labelledby="pwa-install-title" aria-describedby="pwa-install-description" className="pwa-install-dialog app-setup-dialog">
  <button className="pwa-install-close" type="button" onClick={notificationStage?closeNotification:dismissInstall} aria-label="Agora não" disabled={busy}><X size={20}/></button>
  <div className="app-setup-brand"><span className="brand-mark"><MotoMark size={28}/></span><span>Moto<strong>PRO</strong></span></div>
  <div className="app-setup-progress"><span className="active"/><span className={notificationStage?'':'active'}/></div>
  <div className="pwa-install-icon">{notificationStage?<BellRing size={32}/>:<Smartphone size={32}/>}</div>
  <span className="app-setup-label">{notificationStage?'FIQUE POR DENTRO':'ACESSO MAIS RÁPIDO'}</span>
  <h2 id="pwa-install-title">{notificationStage?'Ative as notificações do MotoPRO':'Instale o MotoPRO no seu celular'}</h2>
  <p id="pwa-install-description">{notificationStage?'Receba avisos de manutenção, despesas e pendências. Você controla as permissões e pode desativar quando quiser.':'Abra o MotoPRO direto pela tela inicial, como um aplicativo, sem precisar digitar o endereço no navegador.'}</p>
  {notificationStage?<div className="app-setup-advantages"><span><CheckCircle2 size={17}/> Avisos importantes no aparelho</span><span><ShieldCheck size={17}/> Sem valores financeiros na tela bloqueada</span></div>:
   <div className="app-setup-advantages"><span><CheckCircle2 size={17}/> Ícone do MotoPRO na tela inicial</span><span><ShieldCheck size={17}/> Acesso rápido e navegação em tela cheia</span></div>}
  {error&&<div className="app-setup-error" role="alert">{error}</div>}
  {notificationStage?<button ref={primaryRef} className="btn wide app-setup-primary" onClick={()=>void acceptNotification()} disabled={busy}>{busy?<LoaderCircle size={18} className="spin"/>:<BellRing size={18}/>} {busy?'Ativando...':'Ativar notificações'}</button>:
   deferred?<button ref={primaryRef} className="btn wide app-setup-primary" onClick={()=>void acceptInstall()} disabled={busy}>{busy?<LoaderCircle size={18} className="spin"/>:<Download size={18}/>} {busy?'Preparando...':'Instalar aplicativo'}</button>:
   <div className="pwa-install-instructions" role="note">{platform==='ios'?<>No Safari, toque em <strong>Compartilhar</strong> e depois em <strong>Adicionar à Tela de Início</strong>. Abra o MotoPRO pelo novo ícone.</>:<>No Chrome ou Edge, abra o menu <strong>⋮</strong> e escolha <strong>Instalar aplicativo</strong> ou <strong>Adicionar à tela inicial</strong>, se disponível.</>}</div>}
  <button type="button" className="pwa-install-later" disabled={busy} onClick={notificationStage?closeNotification:dismissInstall}>{notificationStage?'Agora não, continuar':'Agora não'} <ArrowRight size={14}/></button>
  {!notificationStage&&<span className="app-setup-footnote"><Settings2 size={13}/> A instalação é opcional e não altera sua assinatura.</span>}
 </section></div>;
}
