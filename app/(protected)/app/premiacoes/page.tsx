'use client';
import {useEffect,useState} from 'react';
import {Gift,ClipboardCheck,Trophy,CheckCircle2,LockKeyhole} from 'lucide-react';
import {api} from '@/lib/api';
import {PageHeader,Panel,Loading,Empty,Notice} from '@/components/UI';

type Achievement={id:string;title:string;description:string;progress:number;target:number;unlocked:boolean};
type Campaign={id:string;title:string;description:string;reward:string;criteria:string;startsAt:string|null;endsAt:string|null};
type Response={achievements:Achievement[];unlocked:number;total:number;campaigns:Campaign[];note:string};
export default function RewardsPage(){
 const [data,setData]=useState<Response|null>(null),[error,setError]=useState('');
 useEffect(()=>{api<Response>('/conquistas').then(setData).catch(e=>setError(e instanceof Error?e.message:'Não foi possível consultar as conquistas'));},[]);
 return <>
  <PageHeader eyebrow="FASE 3 · EVOLUÇÃO PESSOAL" title="Conquistas e benefícios" description="Acompanhe sua organização financeira, metas e uso das ferramentas MotoPRO. Não é uma competição com outros motoboys."/>
  {error&&<Notice kind="error">{error}</Notice>}
  {!data&&!error?<Loading/>:data&&<>
   <Panel title={`Suas conquistas · ${data.unlocked} de ${data.total}`} subtitle="Marcos objetivos reconhecidos pelo uso dos recursos do aplicativo">
    <div className="phase3-achievements">{data.achievements.map(item=><div key={item.id} className={`phase3-achievement ${item.unlocked?'achieved':''}`}><div className="phase3-achievement-icon">{item.unlocked?<Trophy size={22}/>:<LockKeyhole size={21}/>}</div><div className="phase3-achievement-content"><div className="row-between" style={{gap:8}}><strong>{item.title}</strong>{item.unlocked&&<span className="pill success"><CheckCircle2 size={13}/> Conquistado</span>}</div><p>{item.description}</p><div className="phase3-bar-track"><span style={{width:`${Math.round(item.progress/item.target*100)}%`}}/></div><small>{item.progress} de {item.target}</small></div></div>)}</div>
   </Panel>
   <Panel title="Campanhas e benefícios divulgados" subtitle="Regras definidas pelo administrador, sem sorteio automático">
    {!data.campaigns.length?<Empty message="Não há campanhas ativas neste momento."/>:<div className="phase3-campaigns">{data.campaigns.map(c=><article className="phase3-delivery" key={c.id}><h3>{c.title}</h3><p>{c.description}</p><p><Gift size={16} style={{verticalAlign:'middle'}}/> <strong>Benefício:</strong> {c.reward}</p><p><ClipboardCheck size={16} style={{verticalAlign:'middle'}}/> <strong>Critérios:</strong> {c.criteria}</p>{c.endsAt&&<small>Até {new Date(c.endsAt).toLocaleDateString('pt-BR')}</small>}</article>)}</div>}
   </Panel>
   <p className="tiny-note">{data.note} O MotoPRO não executa sorteios nem distribui prêmios por sorteio.</p>
  </>}
 </>;
}
