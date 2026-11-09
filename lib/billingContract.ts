/**
 * Contrato defensivo da resposta /api/billing/me.
 * Uma resposta HTTP 200 com JSON de versão antiga NÃO confirma assinatura.
 * Preserve o fail-closed do Premium; jamais liberar acesso por campos ausentes.
 */
export type BillingNotice={
 status:'none'|'active'|'expiring'|'expired'|'trial'|'courtesy';
 title:string;message:string;activeUntil:string|null;remainingDays:number|null;renewalAllowed:boolean;
};
export type BillingStatus={
 contractVersion?:number;
 renewalAllowed:boolean;
 notice:BillingNotice;
 access:{premiumRequired:boolean;allowed:boolean};
 latestPix:null|{id:string;status:'pending'|'approved'|'rejected'|'refunded'|'canceled';amountCents:number;paidAt?:string|null};
 courtesyUntil:string|null;
 plan:{priceCents:number;frequency:number;frequencyUnit:string;pixAutomaticAvailable:boolean};
 billingEnabled:boolean;
 subscription:null|{method:'pix'|'credit';status:string;activeUntil?:string;active:boolean;cancelAtPeriodEnd:boolean};
 pendingPix:null|{id:string;code?:string;qrCodeBase64?:string;ticketUrl?:string;expiresAt?:string};
};

const isRecord=(v:unknown):v is Record<string,unknown> => typeof v==='object' && v!==null && !Array.isArray(v);
const statuses=new Set(['none','active','expiring','expired','trial','courtesy']);
const versionError=()=>new Error('A API do Heroku respondeu, mas não enviou os dados de assinatura exigidos por esta versão do MotoPRO. Atualize/publice o backend V3.7 ou superior e depois atualize esta página.');

export function readBillingStatus(raw:unknown):BillingStatus{
 if(!isRecord(raw)||!isRecord(raw.plan)||!isRecord(raw.notice)||!isRecord(raw.access))throw versionError();
 const {plan,notice,access}=raw;
 if(typeof plan.priceCents!=='number'||!Number.isFinite(plan.priceCents)||plan.priceCents<=0||
    typeof raw.billingEnabled!=='boolean'||typeof raw.renewalAllowed!=='boolean'||
    typeof notice.status!=='string'||!statuses.has(notice.status)||
    typeof notice.title!=='string'||typeof notice.message!=='string'||
    typeof notice.renewalAllowed!=='boolean'||
    typeof access.premiumRequired!=='boolean'||typeof access.allowed!=='boolean')throw versionError();
 if(raw.contractVersion!==undefined&&raw.contractVersion!==2)throw versionError();
 if(raw.subscription!=null){
  if(!isRecord(raw.subscription)||typeof raw.subscription.active!=='boolean'||typeof raw.subscription.method!=='string')throw versionError();
  if(raw.subscription.active && (typeof raw.subscription.activeUntil!=='string'||!Number.isFinite(Date.parse(raw.subscription.activeUntil))))throw versionError();
 }
 if(raw.latestPix!=null && (!isRecord(raw.latestPix)||typeof raw.latestPix.status!=='string'||typeof raw.latestPix.amountCents!=='number'))throw versionError();
 if(raw.pendingPix!=null && (!isRecord(raw.pendingPix)||typeof raw.pendingPix.id!=='string'))throw versionError();
 return {...raw,
  latestPix:raw.latestPix??null,
  pendingPix:raw.pendingPix??null,
  subscription:raw.subscription??null,
  courtesyUntil:typeof raw.courtesyUntil==='string'?raw.courtesyUntil:null
 } as BillingStatus;
}
