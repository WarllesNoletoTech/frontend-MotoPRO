 'use client';
/** Device ID do script oficial de segurança Mercado Pago. Se indisponível, Pix funciona normalmente. */
type MpWindow=Window & {MP_DEVICE_SESSION_ID?:unknown};
let loadScript:Promise<void>|null=null;
const valid=(value:unknown):value is string=>typeof value==='string'&&/^[A-Za-z0-9._:-]{10,200}$/.test(value);
async function getDeviceId():Promise<string|undefined>{
 if(typeof window==='undefined')return;
 const win=window as MpWindow;
 if(valid(win.MP_DEVICE_SESSION_ID))return win.MP_DEVICE_SESSION_ID;
 if(!loadScript){
  loadScript=new Promise<void>(resolve=>{
   const script=document.createElement('script');
   script.src='https://www.mercadopago.com/v2/security.js';
   script.async=true;
   script.setAttribute('view','checkout');
   script.setAttribute('output','MP_DEVICE_SESSION_ID');
   script.onload=()=>resolve();script.onerror=()=>resolve();
   document.head.appendChild(script);
  });
 }
 await Promise.race([loadScript,new Promise<void>(resolve=>window.setTimeout(resolve,2200))]);
 return valid(win.MP_DEVICE_SESSION_ID)?win.MP_DEVICE_SESSION_ID:undefined;
}
export async function pixOrderRequestOptions():Promise<RequestInit>{
 const deviceId=await getDeviceId();
 return {method:'POST',...(deviceId?{headers:{'x-mp-device-id':deviceId}}:{})};
}
