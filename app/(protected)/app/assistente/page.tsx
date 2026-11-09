'use client';
import {useRef,useState} from 'react';
import {Mic,Square,Send,Sparkles,CheckCircle2,XCircle,Wallet,Volume2} from 'lucide-react';
import {api,formatMoney,todayLocal,categoryLabel} from '@/lib/api';
import {PageHeader,Panel,Notice} from '@/components/UI';
type Parsed={kind:'entry';type:'income'|'expense';category:string;amountCents:number;description:string}|{kind:'summary';period:'week'|'today';summary:{incomeCents:number;expenseCents:number;profitCents:number};periodRange?:{from:string;to:string}}|{kind:'unknown';message:string};
export default function AssistantPage(){
 const [text,setText]=useState(''),[transcript,setTranscript]=useState(''),[pending,setPending]=useState<Parsed|null>(null);
 const [recording,setRecording]=useState(false),[processing,setProcessing]=useState(false),[error,setError]=useState(''),[success,setSuccess]=useState('');
 const [entrySource,setEntrySource]=useState<'voice'|'manual'>('manual');
 const recorder=useRef<MediaRecorder|null>(null),stream=useRef<MediaStream|null>(null),chunks=useRef<Blob[]>([]);
 const interpret=async(content:string,source:'voice'|'manual')=>{
  setError('');setSuccess('');setPending(null);setProcessing(true);setTranscript(content);setEntrySource(source);
  try{const result=await api<Parsed>('/assistant/interpret',{method:'POST',body:JSON.stringify({text:content})});setPending(result);}
  catch(e){setError((e as Error).message);}finally{setProcessing(false);}
 };
 const submitText=async(e:React.FormEvent)=>{e.preventDefault();if(text.trim())await interpret(text.trim(),'manual');};
 const startRecording=async()=>{
  setError('');setSuccess('');
  if(typeof MediaRecorder==='undefined'||!navigator.mediaDevices?.getUserMedia){setError('Este navegador não disponibiliza gravação de áudio. Use o campo de texto.');return;}
  try{
   const media=await navigator.mediaDevices.getUserMedia({audio:true});stream.current=media;chunks.current=[];
   const mime=['audio/webm;codecs=opus','audio/webm','audio/mp4'].find(m=>MediaRecorder.isTypeSupported(m));
   const r=new MediaRecorder(media,mime?{mimeType:mime}:undefined);recorder.current=r;
   r.ondataavailable=e=>{if(e.data.size>0)chunks.current.push(e.data);};
   r.onstop=async()=>{
    media.getTracks().forEach(t=>t.stop());setRecording(false);setProcessing(true);
    const ext=r.mimeType.includes('mp4')?'mp4':'webm';const blob=new Blob(chunks.current,{type:r.mimeType||'audio/webm'});
    if(blob.size<100){setError('O áudio ficou vazio. Grave novamente.');setProcessing(false);return;}
    try{const fd=new FormData();fd.append('audio',blob,`comando.${ext}`);
     const response=await api<{text:string}>('/assistant/transcribe',{method:'POST',body:fd});
     setText(response.text);await interpret(response.text,'voice');
    }catch(e){setError((e as Error).message);}finally{setProcessing(false);}
   };
   r.start();setRecording(true);
  }catch(e){setError(e instanceof Error?`Não foi possível acessar o microfone: ${e.message}`:'Microfone indisponível');}
 };
 const stopRecording=()=>{if(recorder.current?.state==='recording')recorder.current.stop();};
 const confirm=async()=>{
  if(!pending||pending.kind!=='entry')return;
  setProcessing(true);setError('');try{await api('/entries',{method:'POST',body:JSON.stringify({type:pending.type,category:pending.category,description:pending.description,amountCents:pending.amountCents,occurredOn:todayLocal(),source:entrySource})});setSuccess('Pronto! Lançamento salvo no seu financeiro.');setPending(null);setText('');}
  catch(e){setError((e as Error).message);}finally{setProcessing(false);}
 };
 return <><PageHeader eyebrow="ASSISTENTE INTELIGENTE" title="Só falar. O MotoPRO organiza." description="Registre ganhos e despesas por voz ou texto. Confira os dados antes de salvar."/>
 <div className="two-col"><div className="stack">
  <div className="assistant-box"><Sparkles color="#76e8a9" size={22}/><strong style={{font:'700 24px Outfit'}}>Assistente MotoPRO</strong><p>Grave um comando curto, com a moto parada. O áudio é transcrito para você confirmar.</p><button type="button" className={`assistant-mic ${recording?'recording':''}`} aria-label={recording?'Parar gravação':'Gravar comando'} onClick={recording?stopRecording:startRecording} disabled={processing}>{recording?<Square size={27}/>:<Mic size={30}/>}</button><strong>{recording?'Gravando... toque para parar':processing?'Processando...':'Toque para falar'}</strong><p>Gravação iniciada apenas com seu toque.</p></div>
  <Panel title="Ou digite seu comando" subtitle="Funciona sem chave de IA"><form onSubmit={submitText} className="stack"><textarea className="textarea" value={text} onChange={e=>setText(e.target.value)} maxLength={500} placeholder="Ex.: Ganhei 120 reais em entregas hoje"/><button className="btn" disabled={processing||!text.trim()}><Send size={16}/> Interpretar comando</button></form><div className="tag-list" style={{marginTop:15}}>{['Abasteci 35 reais','Ganhei 120 reais hoje','Quanto lucrei esta semana?'].map(s=><button key={s} type="button" onClick={()=>{setText(s);interpret(s,'manual');}}>{s}</button>)}</div></Panel>
 </div><div className="stack"><Panel title="Resultado do assistente" subtitle="Nenhuma informação é salva sem sua confirmação">{error&&<Notice kind="error">{error}</Notice>}{success&&<Notice kind="success">{success}</Notice>}
  {transcript&&<div style={{padding:'13px 0',fontSize:13}}><span className="text-muted">Comando:</span> <strong>“{transcript}”</strong></div>}
  {pending?.kind==='entry'&&<div className="confirm-card"><span className="pill">Lançamento identificado</span><strong>{pending.type==='income'?'Receita':'Despesa'} · {categoryLabel(pending.category)}</strong><strong style={{font:'700 33px Outfit',color:pending.type==='income'?'#178253':'#b65a45'}}>{formatMoney(pending.amountCents)}</strong><small>{pending.description}</small><small>Data do lançamento: hoje. Para outra data, use a tela Lançamentos.</small><div className="form-grid"><button className="btn" onClick={confirm} disabled={processing}><CheckCircle2 size={16}/> Confirmar e salvar</button><button className="btn secondary" onClick={()=>setPending(null)}><XCircle size={16}/> Cancelar</button></div></div>}
  {pending?.kind==='summary'&&<div className="stack-sm"><div className="assistant-reply"><Volume2 size={17}/> Aqui está seu resumo de {pending.period==='today'?'hoje':'terça a segunda'}.</div><div className="row-between"><span>Receitas</span><strong className="text-income">{formatMoney(pending.summary.incomeCents)}</strong></div><div className="row-between"><span>Despesas</span><strong className="text-expense">{formatMoney(pending.summary.expenseCents)}</strong></div><div className="row-between"><span>Lucro estimado</span><strong style={{font:'700 22px Outfit'}}>{formatMoney(pending.summary.profitCents)}</strong></div></div>}
  {pending?.kind==='unknown'&&<Notice>{pending.message}</Notice>}
  {!pending&&!transcript&&!error&&!success&&<div className="empty"><Wallet size={28}/>Seu comando aparecerá aqui para confirmação.</div>}
 </Panel><Panel title="Como funciona" subtitle="Seus dados e seu controle"><div className="stack-sm"><div className="feature-check"><CheckCircle2 size={17}/> Reconhecimento do comando</div><div className="feature-check"><CheckCircle2 size={17}/> Revisão do valor e categoria</div><div className="feature-check"><CheckCircle2 size={17}/> Registro apenas após confirmar</div><div className="feature-check"><CheckCircle2 size={17}/> Resumo calculado sem inventar valores</div></div></Panel></div></div>
 <p className="page-footer">Áudio precisa de HTTPS/localhost, permissão de microfone e OPENAI_API_KEY no servidor. Comandos digitados não exigem serviço externo de IA.</p>
 </>;
}
