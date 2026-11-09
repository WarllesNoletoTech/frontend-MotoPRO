'use client';
import {useEffect,useState} from 'react';
import {Gift,ClipboardCheck} from 'lucide-react';
import {api} from '@/lib/api';
import {PageHeader,Panel,Loading,Empty,Notice} from '@/components/UI';
type Campaign={_id:string;title:string;description:string;reward:string;objectiveCriteria:string;status:string;resultSummary?:string};
export default function RewardsPage(){
 const [items,setItems]=useState<Campaign[]|null>(null),[error,setError]=useState('');
 useEffect(()=>{api<{items:Campaign[]}>('/campaigns').then(x=>setItems(x.items)).catch(e=>setError(e instanceof Error?e.message:'Não foi possível consultar campanhas'));},[]);
 return <><PageHeader eyebrow="MOTOPRO" title="Benefícios e campanhas" description="Acompanhe as campanhas divulgadas e seus critérios objetivos."/>
 {error&&<Notice kind="error">{error}</Notice>}
 {!items&&!error?<Loading/>:items?.length===0?<Empty message="Nenhuma campanha publicada no momento"/>:items?.map(c=><Panel key={c._id} title={c.title} subtitle={c.status==='closed'?'Campanha encerrada':'Campanha divulgada'}><div style={{display:'grid',gap:13}}><p><Gift size={17} style={{verticalAlign:'middle'}}/> <b>Benefício:</b> {c.reward}</p><p>{c.description}</p><p><ClipboardCheck size={17} style={{verticalAlign:'middle'}}/> <b>Critérios:</b> {c.objectiveCriteria}</p>{c.resultSummary&&<p><b>Resultado:</b> {c.resultSummary}</p>}</div></Panel>)}
 <p style={{fontSize:12,marginTop:17,opacity:.7}}>O MotoPRO não realiza sorteios nem inscrição automática em promoções aleatórias.</p>
 </>;
}
