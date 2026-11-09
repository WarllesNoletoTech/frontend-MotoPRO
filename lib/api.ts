export type ApiError = Error & {status?:number};
export async function api<T>(path:string,options:RequestInit={}):Promise<T>{
 const headers=new Headers(options.headers);
 if(options.body && !(options.body instanceof FormData))headers.set('Content-Type','application/json');
 const response=await fetch(`/api${path}`,{...options,headers,credentials:'same-origin',cache:'no-store'});
 let payload:any;
 try{payload=await response.json();}catch{payload={};}
 if(!response.ok){
  const message = payload.error || (response.status>=500 ? 'Não foi possível acessar o servidor. Confirme se o backend está ligado na porta 4000.' : `Erro HTTP ${response.status}`);
  const err=new Error(message) as ApiError;err.status=response.status;throw err;
 }
 return payload as T;
}
export function todayLocal():string{
 const d=new Date();
 return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
export const formatMoney=(cents:number)=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(cents/100);
export function toCents(input:string):number{
 const cleaned=input.trim().replace(/\s/g,'').replace(/^R\$/i,'');
 if(!/^(?:\d{1,3}(?:\.\d{3})+|\d+)(?:,\d{1,2})?$/.test(cleaned))return NaN;
 return Math.round(Number(cleaned.replace(/\./g,'').replace(',','.'))*100);
}
export function dateLabel(date:string){
 const [y,m,d]=date.split('-').map(Number);
 return new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short'}).format(new Date(y,m-1,d));
}
export type Entry={_id:string;type:'income'|'expense';category:string;description:string;amountCents:number;occurredOn:string;source:'manual'|'voice'|'integration'};
export type Dashboard={period:{from:string;to:string};incomeCents:number;expenseCents:number;profitCents:number;byDay:{day:string;incomeCents:number;expenseCents:number}[];goal:{weeklyTargetCents:number}|null};
export const incomeCategories=[{value:'delivery',label:'Entregas'},{value:'bonus',label:'Gorjeta / bônus'},{value:'other',label:'Outros ganhos'}];
export const expenseCategories=[{value:'fuel',label:'Combustível'},{value:'maintenance',label:'Manutenção'},{value:'food',label:'Alimentação'},{value:'other',label:'Outras despesas'}];
export const categoryLabel=(key:string)=>[...incomeCategories,...expenseCategories].find(c=>c.value===key)?.label||key;
