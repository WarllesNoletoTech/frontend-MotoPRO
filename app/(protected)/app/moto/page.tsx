'use client';
import {useEffect,useState} from 'react';
import {Bike,Plus,CheckCircle2,Wrench,Fuel,Trash2,ReceiptText} from 'lucide-react';
import {api,formatMoney,toCents,todayLocal,dateLabel} from '@/lib/api';
import {PageHeader,Panel,Notice,Loading,Empty} from '@/components/UI';
type Motorcycle={_id:string;model:string;year?:number;odometerKm:number;kmPerLiter?:number};
type Reminder={_id:string;label:string;dueOn?:string;dueKm?:number};
type FuelRecord={_id:string;amountCents:number;occurredOn:string;description:string;source:'manual'|'voice'|'integration';fuelLiters?:number;odometerKm?:number;fuelType?:'gasolina'|'etanol'|'diesel'|'outro';fuelStation?:string};
type FuelResponse={items:FuelRecord[];summary:{month:string;amountCents:number;liters:number;count:number}};
type FuelForm={amount:string;liters:string;date:string;odometer:string;station:string;fuelType:'gasolina'|'etanol'|'diesel'|'outro'};
const initialFuel=():FuelForm=>({amount:'',liters:'',date:todayLocal(),odometer:'',station:'',fuelType:'gasolina'});
const fuelTypes:Record<FuelForm['fuelType'],string>={gasolina:'Gasolina',etanol:'Etanol',diesel:'Diesel',outro:'Outro'};
const decimalNumber=(value:string)=>Number(value.trim().replace(',','.'));
const fuelMoneyCents=(value:string)=>toCents(/^\d+\.\d{1,2}$/.test(value.trim())?value.trim().replace('.',','):value);
export default function MotoPage(){
 const [bike,setBike]=useState({model:'',year:'',odometerKm:'',kmPerLiter:''});
 const [saved,setSaved]=useState<Motorcycle|null>(null),[reminders,setReminders]=useState<Reminder[]>([]),[loading,setLoading]=useState(true);
 const [rem,setRem]=useState({label:'',dueOn:'',dueKm:''});
 const [fuel,setFuel]=useState<FuelForm>(initialFuel);
 const [fuelList,setFuelList]=useState<FuelRecord[]>([]),[fuelSummary,setFuelSummary]=useState<FuelResponse['summary']|null>(null);
 const [fuelBusy,setFuelBusy]=useState(false);
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[success,setSuccess]=useState('');
 const load=async()=>{try{
  const [r,f]=await Promise.all([api<{motorcycle:Motorcycle|null;reminders:Reminder[]}>('/moto'),api<FuelResponse>('/moto/fuel')]);
  setSaved(r.motorcycle);setReminders(r.reminders);setFuelList(f.items);setFuelSummary(f.summary);
  if(r.motorcycle)setBike({model:r.motorcycle.model,year:String(r.motorcycle.year||''),odometerKm:String(r.motorcycle.odometerKm||0),kmPerLiter:String(r.motorcycle.kmPerLiter||'')});
 }catch(e){setError((e as Error).message);}finally{setLoading(false);}};
 useEffect(()=>{load();},[]);
 const saveBike=async(e:React.FormEvent)=>{e.preventDefault();setBusy(true);setError('');try{await api('/moto',{method:'PUT',body:JSON.stringify({model:bike.model,year:bike.year?Number(bike.year):undefined,odometerKm:Number(bike.odometerKm||0),kmPerLiter:bike.kmPerLiter?Number(bike.kmPerLiter.replace(',','.')):undefined})});setSuccess('Dados da moto atualizados.');await load();}catch(e){setError((e as Error).message);}finally{setBusy(false);}};
 const addReminder=async(e:React.FormEvent)=>{e.preventDefault();setError('');try{await api('/moto/reminders',{method:'POST',body:JSON.stringify({label:rem.label,dueOn:rem.dueOn||undefined,dueKm:rem.dueKm?Number(rem.dueKm):undefined})});setRem({label:'',dueOn:'',dueKm:''});setSuccess('Lembrete criado.');await load();}catch(e){setError((e as Error).message);}};
 const complete=async(id:string)=>{try{await api(`/moto/reminders/${id}/done`,{method:'PATCH'});await load();}catch(e){setError((e as Error).message);}};
 const registerFuel=async(e:React.FormEvent)=>{
  e.preventDefault();if(fuelBusy)return;setError('');setSuccess('');
  const amountCents=fuelMoneyCents(fuel.amount);
  const liters=fuel.liters.trim()?decimalNumber(fuel.liters):undefined;
  const odometerKm=fuel.odometer.trim()?decimalNumber(fuel.odometer):undefined;
  if(!Number.isSafeInteger(amountCents)||amountCents<=0){setError('Informe o valor pago. Ex.: 35,50.');return;}
  if(liters!==undefined&&(!Number.isFinite(liters)||liters<=0||liters>200)){setError('Litros inválidos. Informe um número de 0,001 até 200.');return;}
  if(odometerKm!==undefined&&(!Number.isFinite(odometerKm)||odometerKm<0||odometerKm>2000000)){setError('Quilometragem inválida.');return;}
  if(fuel.date>todayLocal()){setError('A data do abastecimento não pode ser futura.');return;}
  setFuelBusy(true);
  try{
   await api('/entries',{method:'POST',body:JSON.stringify({type:'expense',category:'fuel',source:'manual',description:fuel.station.trim()?`Abastecimento · ${fuel.station.trim()}`:'Abastecimento',amountCents,occurredOn:fuel.date,fuelType:fuel.fuelType, ...(fuel.station.trim()?{fuelStation:fuel.station.trim()}:{}),...(liters!==undefined?{fuelLiters:liters}:{}),...(odometerKm!==undefined?{odometerKm}:{} )})});
   setFuel(initialFuel());setSuccess('Abastecimento registrado! O gasto já está no seu Financeiro.');
   await load();
  }catch(err){setError(err instanceof Error?err.message:'Falha ao registrar abastecimento');}finally{setFuelBusy(false);}
 };
 const removeFuel=async(record:FuelRecord)=>{
  if(fuelBusy)return;
  if(!window.confirm(`Excluir o abastecimento de ${formatMoney(record.amountCents)}? O gasto também será removido do Financeiro.`))return;
  setError('');setSuccess('');setFuelBusy(true);
  try{await api(`/entries/${record._id}`,{method:'DELETE'});await load();setSuccess('Abastecimento excluído do histórico e do Financeiro.');}
  catch(err){setError(err instanceof Error?err.message:'Falha ao excluir abastecimento');}finally{setFuelBusy(false);}
 };
 return <><PageHeader eyebrow="CONTROLE DA MOTO" title="Minha moto" description="Organize quilometragem, abastecimentos e próximas manutenções em um só lugar."/>
 {loading?<Loading/>:<div className="two-col"><div className="stack">
  <Panel title="Dados da moto" subtitle="Atualize sempre que precisar"><form className="stack" onSubmit={saveBike}><div className="field"><label htmlFor="model">Modelo</label><input id="model" className="input" required minLength={2} maxLength={100} value={bike.model} placeholder="Ex.: Honda CG 160" onChange={e=>setBike({...bike,model:e.target.value})}/></div><div className="form-grid"><div className="field"><label htmlFor="year">Ano (opcional)</label><input id="year" className="input" type="number" min="1980" max="2100" value={bike.year} onChange={e=>setBike({...bike,year:e.target.value})}/></div><div className="field"><label htmlFor="km">Quilometragem atual</label><input id="km" className="input" type="number" min="0" max="2000000" value={bike.odometerKm} onChange={e=>setBike({...bike,odometerKm:e.target.value})}/></div></div><div className="field"><label htmlFor="kml">Consumo médio (km/L, opcional)</label><input id="kml" className="input" inputMode="decimal" value={bike.kmPerLiter} placeholder="Ex.: 35" onChange={e=>setBike({...bike,kmPerLiter:e.target.value})}/></div><button className="btn" disabled={busy}><Bike size={17}/> Salvar dados</button></form></Panel>
  <Panel title="Registrar abastecimento" subtitle="O valor entra automaticamente como despesa de combustível no seu Financeiro." action={<Fuel size={20} color="#f5bb5c"/>}>
   <form className="stack" onSubmit={registerFuel}>
    <div className="form-grid">
     <div className="field"><label htmlFor="fuel-amount">Valor pago (R$) *</label><input id="fuel-amount" className="input" inputMode="decimal" value={fuel.amount} placeholder="Ex.: 35,50" required onChange={e=>setFuel({...fuel,amount:e.target.value})}/></div>
     <div className="field"><label htmlFor="fuel-date">Data *</label><input id="fuel-date" className="input" type="date" required max={todayLocal()} value={fuel.date} onChange={e=>setFuel({...fuel,date:e.target.value})}/></div>
    </div>
    <div className="form-grid">
     <div className="field"><label htmlFor="fuel-type">Combustível</label><select id="fuel-type" className="select" value={fuel.fuelType} onChange={e=>setFuel({...fuel,fuelType:e.target.value as FuelForm['fuelType']})}>{Object.entries(fuelTypes).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></div>
     <div className="field"><label htmlFor="fuel-liters">Litros (opcional)</label><input id="fuel-liters" className="input" inputMode="decimal" value={fuel.liters} placeholder="Ex.: 5,25" onChange={e=>setFuel({...fuel,liters:e.target.value})}/></div>
    </div>
    <div className="form-grid">
     <div className="field"><label htmlFor="fuel-km">KM no abastecimento (opcional)</label><input id="fuel-km" className="input" inputMode="numeric" type="number" min="0" max="2000000" step="1" value={fuel.odometer} placeholder="Ex.: 18350" onChange={e=>setFuel({...fuel,odometer:e.target.value})}/></div>
     <div className="field"><label htmlFor="fuel-station">Posto (opcional)</label><input id="fuel-station" className="input" maxLength={100} value={fuel.station} placeholder="Ex.: Posto Central" onChange={e=>setFuel({...fuel,station:e.target.value})}/></div>
    </div>
    <button className="btn" disabled={fuelBusy}><Plus size={17}/>{fuelBusy?'Registrando...':'Registrar abastecimento'}</button>
   </form>
  </Panel>
  <Panel title="Histórico de abastecimentos" subtitle="Registros da sua conta · últimos 30" action={<ReceiptText size={18} color="#f5bb5c"/>}>
   {fuelSummary&&<div className="fuel-stats"><div><small>Gasto no mês</small><strong>{formatMoney(fuelSummary.amountCents)}</strong></div><div><small>Litros no mês</small><strong>{fuelSummary.liters.toLocaleString('pt-BR',{maximumFractionDigits:2})} L</strong></div><div><small>Abastecimentos no mês</small><strong>{fuelSummary.count}</strong></div></div>}
   {fuelList.length?fuelList.map(record=><div className="activity-row fuel-history-row" key={record._id}>
    <span className="badge-icon"><Fuel size={18}/></span>
    <div className="fuel-record-info"><strong>{record.fuelStation||record.description||'Combustível'}</strong><small>{dateLabel(record.occurredOn)} · {record.fuelType?fuelTypes[record.fuelType]: 'Combustível'}{record.fuelLiters?` · ${record.fuelLiters.toLocaleString('pt-BR',{maximumFractionDigits:2})} L`:''}{record.odometerKm!==undefined?` · ${record.odometerKm.toLocaleString('pt-BR')} km`:''}</small></div>
    <strong className="fuel-amount">{formatMoney(record.amountCents)}</strong>
    {record.source!=='integration'&&<button type="button" className="icon-btn fuel-remove" disabled={fuelBusy} aria-label="Excluir abastecimento" title="Excluir abastecimento" onClick={()=>removeFuel(record)}><Trash2 size={16}/></button>}
   </div>):<Empty message="Nenhum abastecimento registrado ainda."/>}
   <div className="field-hint" style={{marginTop:12}}>Inclui despesas de combustível registradas pelo Financeiro ou por voz. Excluir um registro também remove o gasto do Financeiro.</div>
  </Panel>
 </div><div className="stack"><Panel title="Próximas manutenções" subtitle="Alertas definidos por você" action={<Wrench size={19} color="#98743b"/>}>{reminders.length?reminders.map(r=><div key={r._id} className="activity-row"><span className="badge-icon"><Wrench size={18}/></span><div><strong>{r.label}</strong><small>{r.dueOn?`Data: ${r.dueOn.split('-').reverse().join('/')}`:''} {r.dueKm!==undefined?` · ${r.dueKm.toLocaleString('pt-BR')} km`:''}</small></div><button className="btn secondary" onClick={()=>complete(r._id)} title="Marcar como concluído"><CheckCircle2 size={16}/></button></div>):<Empty message="Nenhum lembrete cadastrado."/>}</Panel>
 <Panel title="Novo lembrete" subtitle="Use os intervalos recomendados pelo fabricante"><form className="stack" onSubmit={addReminder}><div className="field"><label htmlFor="rem-label">Serviço</label><input id="rem-label" className="input" required minLength={2} placeholder="Ex.: Troca de óleo" value={rem.label} onChange={e=>setRem({...rem,label:e.target.value})}/></div><div className="form-grid"><div className="field"><label htmlFor="rem-date">Data (opcional)</label><input id="rem-date" className="input" type="date" value={rem.dueOn} onChange={e=>setRem({...rem,dueOn:e.target.value})}/></div><div className="field"><label htmlFor="rem-km">KM (opcional)</label><input id="rem-km" className="input" type="number" min="0" max="2000000" placeholder="Ex.: 18000" value={rem.dueKm} onChange={e=>setRem({...rem,dueKm:e.target.value})}/></div></div><button className="btn secondary"><Plus size={17}/> Adicionar lembrete</button></form></Panel>
 </div></div>}
 {(error||success)&&<div style={{marginTop:18}}>{error&&<Notice kind="error">{error}</Notice>}{success&&!error&&<Notice kind="success">{success}</Notice>}</div>}
 <div className="page-footer">Os lembretes são informativos e não substituem o manual de manutenção da moto.</div>
 </>;
}
