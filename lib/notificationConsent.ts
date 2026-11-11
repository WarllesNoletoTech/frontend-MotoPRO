import {api} from '@/lib/api';

export type PushConfig={
 supported:boolean;
 provider:'onesignal'|'vapid'|'none';
 oneSignalAppId:string|null;
 publicKey:string|null;
 registeredDevices:number;
};

export const PUSH_CONSENT_DELAY_MS=7*24*60*60*1000;
const consentKey=(id:string)=>`motopro-onesignal-enabled:${id}`;

interface OneSignalSDK {
 init(options:{appId:string;serviceWorkerPath:string;serviceWorkerParam:{scope:string};notifyButton:{enable:boolean}}):Promise<void>;
 login(externalId:string):Promise<void>;
 logout():Promise<void>;
 Notifications:{requestPermission():Promise<void>;permission:boolean;permissionNative:string};
 User:{PushSubscription:{id:string|null;optedIn:boolean;optIn():Promise<void>;optOut():Promise<void>}};
}
type OneSignalGlobal=Window &{OneSignalDeferred?:Array<(sdk:OneSignalSDK)=>Promise<void>|void>};
let osLoader:Promise<OneSignalSDK>|null=null;
let osAppId:string|null=null;

function loadOneSignal(appId:string):Promise<OneSignalSDK>{
 if(osLoader&&osAppId===appId)return osLoader;
 osAppId=appId;
 osLoader=new Promise<OneSignalSDK>((resolve,reject)=>{
  const w=window as OneSignalGlobal;
  w.OneSignalDeferred=w.OneSignalDeferred||[];
  w.OneSignalDeferred.push(async sdk=>{
   try{
    await sdk.init({appId,serviceWorkerPath:'/push/onesignal/OneSignalSDKWorker.js',serviceWorkerParam:{scope:'/push/onesignal/'},notifyButton:{enable:false}});
    resolve(sdk);
   }catch(e){reject(e);}
  });
  if(!document.querySelector('script[data-motopro-onesignal]')){
   const script=document.createElement('script');
   script.dataset.motoproOnesignal='true';
   script.src='https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
   script.async=true;
   script.onerror=()=>reject(new Error('Não foi possível conectar ao OneSignal. Confira a conexão.'));
   document.head.appendChild(script);
  }
 }).catch(error=>{osLoader=null;osAppId=null;throw error;});
 return osLoader;
}

function canPush(){return typeof window!=='undefined'&&'Notification' in window&&'serviceWorker' in navigator&&'PushManager' in window;}
function b64Key(key:string){
 const normal=key.replace(/-/g,'+').replace(/_/g,'/');
 const raw=atob(normal+'='.repeat((4-normal.length%4)%4));
 const bytes=new Uint8Array(raw.length);
 for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
 return bytes.buffer;
}
export function isIosDevice(){
 if(typeof navigator==='undefined')return false;
 return /iPad|iPhone|iPod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
}
export function isStandalone(){
 if(typeof window==='undefined')return false;
 return window.matchMedia('(display-mode: standalone)').matches||Boolean((navigator as Navigator&{standalone?:boolean}).standalone);
}
export function canRequestPush(config:PushConfig|null){
 return Boolean(config?.supported&&canPush()&&Notification.permission!=='denied'&&(!isIosDevice()||isStandalone()));
}
export async function readPushConfig(){
 return api<PushConfig>('/notifications/config');
}
async function oldSubscription(){
 // /sw.js controla o PWA: o worker OneSignal fica isolado em /push/onesignal/.
 const registration=await Promise.race([navigator.serviceWorker.ready,new Promise<never>((_,reject)=>window.setTimeout(()=>reject(new Error('Não foi possível iniciar o serviço de notificações. Reabra o aplicativo.')),6000))]);
 return {registration,subscription:await registration.pushManager.getSubscription()};
}
export async function isDeviceSubscribed(config:PushConfig,userId:string){
 if(!canRequestPush(config)||Notification.permission!=='granted')return false;
 if(config.provider==='onesignal'){
  try{
   if(localStorage.getItem(consentKey(userId))!=='true'||!config.oneSignalAppId)return false;
   const sdk=await loadOneSignal(config.oneSignalAppId);
   await sdk.login(userId);
   return sdk.User.PushSubscription.optedIn===true&&Boolean(sdk.User.PushSubscription.id);
  }catch{return false;}
 }
 const {subscription}=await oldSubscription();
 return Boolean(subscription);
}
async function waitForOneSignalSubscription(sdk:OneSignalSDK){
 for(let i=0;i<9;i++){
  const id=sdk.User.PushSubscription.id;
  if(id&&sdk.User.PushSubscription.optedIn)return id;
  await new Promise<void>(resolve=>window.setTimeout(resolve,450));
 }
 throw new Error('Permissão autorizada, mas o OneSignal ainda não concluiu o cadastro. Tente novamente.');
}
export async function enableNotifications(config:PushConfig,userId:string){
 if(!canRequestPush(config))throw new Error(isIosDevice()&&!isStandalone()?'Instale e abra o MotoPRO pela Tela de Início antes de ativar notificações neste iPhone.':'Notificações indisponíveis ou bloqueadas neste navegador.');
 // Chamada síncrona no gesto do botão. Navegadores bloqueiam pedidos automáticos.
 const permission=Notification.permission==='default'?await Notification.requestPermission():Notification.permission;
 if(permission!=='granted')throw new Error('A permissão foi recusada. Você pode alterá-la nas configurações do navegador.');
 if(config.provider==='onesignal'){
  if(!config.oneSignalAppId)throw new Error('OneSignal não configurado no servidor.');
  const sdk=await loadOneSignal(config.oneSignalAppId);
  await sdk.login(userId);
  if(!sdk.User.PushSubscription.optedIn)await sdk.User.PushSubscription.optIn();
  const subscriptionId=await waitForOneSignalSubscription(sdk);
  await api('/notifications/onesignal/subscribe',{method:'POST',body:JSON.stringify({subscriptionId})});
  localStorage.setItem(consentKey(userId),'true');
  // Evitar notificações duplicadas por uma inscrição VAPID anterior no mesmo aparelho.
  try{const {subscription}=await oldSubscription();if(subscription){await api('/notifications/unsubscribe',{method:'POST',body:JSON.stringify({endpoint:subscription.endpoint})});await subscription.unsubscribe();}}catch{/* Migração VAPID é opcional. */}
 }else if(config.provider==='vapid'){
  if(!config.publicKey)throw new Error('A chave pública VAPID ainda não foi configurada no Heroku.');
  const {registration,subscription:existing}=await oldSubscription();
  const sub=existing||await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64Key(config.publicKey)});
  try{const data=sub.toJSON();await api('/notifications/subscribe',{method:'POST',body:JSON.stringify({endpoint:sub.endpoint,keys:data.keys})});}
  catch(e){if(!existing)await sub.unsubscribe();throw e;}
 }else throw new Error('Nenhum provedor de notificações está configurado.');
}
export async function disableNotifications(config:PushConfig,userId:string){
 if(config.provider==='onesignal'&&config.oneSignalAppId){
  const sdk=await loadOneSignal(config.oneSignalAppId);
  const subscriptionId=sdk.User.PushSubscription.id;
  await sdk.User.PushSubscription.optOut();
  localStorage.removeItem(consentKey(userId));
  if(subscriptionId)await api('/notifications/onesignal/unsubscribe',{method:'POST',body:JSON.stringify({subscriptionId})});
 }else{
  const {subscription}=await oldSubscription();
  if(subscription){await api('/notifications/unsubscribe',{method:'POST',body:JSON.stringify({endpoint:subscription.endpoint})});await subscription.unsubscribe();}
 }
}
export async function unlinkOnLogout(userId:string){
 // Nunca deixar OneSignal associado ao motoboy anterior em aparelhos compartilhados.
 try{
  if(!osLoader){
   if(localStorage.getItem(consentKey(userId))!=='true')return;
   const config=await readPushConfig();
   if(!config.oneSignalAppId)return;
   await loadOneSignal(config.oneSignalAppId);
  }
  const sdk=await osLoader!;
  const subscriptionId=sdk.User.PushSubscription.id;
  await sdk.User.PushSubscription.optOut();
  if(subscriptionId)await api('/notifications/onesignal/unsubscribe',{method:'POST',body:JSON.stringify({subscriptionId})});
  await sdk.logout();
  localStorage.removeItem(consentKey(userId));
 }catch{/* Falha externa não deve impedir sair da conta. */}
}
