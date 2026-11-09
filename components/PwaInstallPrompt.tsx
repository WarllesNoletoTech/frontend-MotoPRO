'use client';
import {useEffect,useState} from 'react';
import {usePathname} from 'next/navigation';
import {Download,Smartphone,X} from 'lucide-react';
import {api} from '@/lib/api';

type InstallEvent=Event&{prompt:()=>Promise<unknown>;userChoice:Promise<{outcome:'accepted'|'dismissed'}>};
const DISMISS_KEY='motopro-install-remind-after';
const DISMISS_MS=7*24*60*60*1000;
function isInstalled(){
 return window.matchMedia('(display-mode: standalone)').matches || Boolean((navigator as Navigator&{standalone?:boolean}).standalone);
}
export default function PwaInstallPrompt(){
 const path=usePathname();
 const [deferred,setDeferred]=useState<InstallEvent|null>(null);
 const [installed,setInstalled]=useState(false);
 const [eligible,setEligible]=useState(false);
 const [visible,setVisible]=useState(false);
 const [ios,setIos]=useState(false);
 const [android,setAndroid]=useState(false);
 const [profileReady,setProfileReady]=useState(false);
 useEffect(()=>{
  const agent=navigator.userAgent;
  setIos(/iPad|iPhone|iPod/i.test(agent) || (navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1));
  setAndroid(/Android/i.test(agent));
  setInstalled(isInstalled());
  const before=(event:Event)=>{event.preventDefault();setDeferred(event as InstallEvent);setEligible(true);};
  const done=()=>{setInstalled(true);setVisible(false);setDeferred(null);};
  window.addEventListener('beforeinstallprompt',before);
  window.addEventListener('appinstalled',done);
  return()=>{window.removeEventListener('beforeinstallprompt',before);window.removeEventListener('appinstalled',done);};
 },[]);
 useEffect(()=>{
  if(!path?.startsWith('/app')){setProfileReady(false);return;}
  let active=true;
  let phoneCompleted=false;
  // Concluir o telefone vem antes do convite PWA. Cadastro antigo não recebe dois modais.
  void api<{user:{role:string;phone:string|null}}>('/auth/me').then(r=>{
   if(active&&!phoneCompleted)setProfileReady(r.user.role==='admin'||Boolean(r.user.phone));
  }).catch(()=>{if(active)setProfileReady(false);});
  const completed=()=>{phoneCompleted=true;setProfileReady(true);};
  window.addEventListener('motopro:phone-completed',completed);
  return()=>{active=false;window.removeEventListener('motopro:phone-completed',completed);};
 },[path]);
 useEffect(()=>{
  const onApp=path?.startsWith('/app');
  let postponed=false;
  try{postponed=Number(localStorage.getItem(DISMISS_KEY)||0)>Date.now();}catch{/* Armazenamento local indisponível: o app continua funcional. */}
  setVisible(Boolean(onApp&&profileReady&&!installed&&!postponed&&(eligible||ios||android)));
 },[path,profileReady,installed,eligible,ios,android]);
 const dismiss=()=>{setVisible(false);try{localStorage.setItem(DISMISS_KEY,String(Date.now()+DISMISS_MS));}catch{/* Falha não impede fechar o convite. */}};
 const install=async()=>{
  if(!deferred)return;
  try{
   await deferred.prompt();
   const choice=await deferred.userChoice;
   setDeferred(null);
   if(choice.outcome==='accepted'){setVisible(false);}else{dismiss();}
  }catch{setDeferred(null);setVisible(false);}
 };
 if(!visible)return null;
 return <div className="pwa-install-overlay" role="presentation"><section role="dialog" aria-modal="true" aria-labelledby="pwa-install-title" className="pwa-install-dialog">
  <button className="pwa-install-close" type="button" onClick={dismiss} aria-label="Agora não"><X size={19}/></button>
  <div className="pwa-install-icon"><Smartphone size={32}/></div>
  <h2 id="pwa-install-title">Instale o MotoPRO no seu celular</h2>
  <p>Abra o MotoPRO pela tela inicial, como um aplicativo, sem precisar digitar o endereço no navegador.</p>
  {deferred?<button className="btn wide" onClick={()=>void install()}><Download size={19}/> Instalar MotoPRO</button>:
   <div className="pwa-install-instructions">{ios?'No iPhone, toque em Compartilhar e depois em “Adicionar à Tela de Início”.': 'No navegador, abra o menu ⋮ e escolha “Instalar app” ou “Adicionar à tela inicial”, se disponível.'}</div>}
  <button className="pwa-install-later" type="button" onClick={dismiss}>Agora não</button>
 </section></div>;
}
