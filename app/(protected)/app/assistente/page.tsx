'use client';

import {useEffect, useRef, useState} from 'react';
import {Mic, Square, Send, Sparkles, CheckCircle2, XCircle, Wallet, Volume2, Clock3} from 'lucide-react';
import {api, formatMoney, todayLocal, categoryLabel} from '@/lib/api';
import {PageHeader, Panel, Notice} from '@/components/UI';

type Parsed =
  | {kind: 'entry'; type: 'income' | 'expense'; category: string; amountCents: number; description: string}
  | {kind: 'summary'; period: 'week' | 'today'; summary: {incomeCents: number; expenseCents: number; profitCents: number}; periodRange?: {from: string; to: string}}
  | {kind: 'unknown'; message: string};

const MAX_RECORDING_MS = 10_000;

export default function AssistantPage() {
  const [text, setText] = useState('');
  const [transcript, setTranscript] = useState('');
  const [pending, setPending] = useState<Parsed | null>(null);
  const [recording, setRecording] = useState(false);
  const [starting, setStarting] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(10);
  const [voiceInfo, setVoiceInfo] = useState('');
  const [voiceError, setVoiceError] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [entrySource, setEntrySource] = useState<'voice' | 'manual'>('manual');

  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ticker = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAt = useRef(0);
  const elapsedAtStop = useRef(0);
  const interpretSequence = useRef(0);
  const mounted = useRef(false);

  const clearRecordingTimers = () => {
    if (timeout.current !== null) clearTimeout(timeout.current);
    if (ticker.current !== null) clearInterval(ticker.current);
    timeout.current = null;
    ticker.current = null;
  };

  const releaseMicrophone = () => {
    stream.current?.getTracks().forEach(track => track.stop());
    stream.current = null;
  };

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      clearRecordingTimers();
      // Desmontagem da tela não deve enviar uma gravação incompleta.
      if (recorder.current && recorder.current.state !== 'inactive') {
        recorder.current.onstop = null;
        recorder.current.stop();
      }
      recorder.current = null;
      releaseMicrophone();
    };
  }, []);

  const interpret = async (content: string, source: 'voice' | 'manual') => {
    const currentRequest = ++interpretSequence.current;
    setError('');
    setSuccess('');
    setPending(null);
    setProcessing(true);
    setEntrySource(source);
    if (source === 'voice') setTranscript(content);
    try {
      const result = await api<Parsed>('/assistant/interpret', {
        method: 'POST',
        body: JSON.stringify({text: content}),
      });
      if (mounted.current && interpretSequence.current === currentRequest) setPending(result);
    } catch (e) {
      if (mounted.current && interpretSequence.current === currentRequest) setError((e as Error).message);
    } finally {
      if (mounted.current) setProcessing(false);
    }
  };

  const submitText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setTranscript('');
    setVoiceError('');
    setVoiceInfo('');
    await interpret(text.trim(), 'manual');
  };

  const stopRecording = (reason: 'manual' | 'limit' = 'manual') => {
    const active = recorder.current;
    if (active?.state !== 'recording') return;
    elapsedAtStop.current = Math.min(MAX_RECORDING_MS, Math.max(200, Date.now() - startedAt.current));
    clearRecordingTimers();
    setVoiceInfo(reason === 'limit'
      ? 'Limite de 10 segundos atingido. Transcrevendo sua fala…'
      : 'Gravação encerrada. Transcrevendo sua fala…');
    setRecording(false);
    active.stop();
  };

  const startRecording = async () => {
    if (starting || recording || processing || transcribing) return;
    interpretSequence.current++;
    setError('');
    setSuccess('');
    setVoiceError('');
    setVoiceInfo('');
    setTranscript('');
    setPending(null);
    setSecondsRemaining(10);
    if (typeof MediaRecorder === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setVoiceError('Este navegador não disponibiliza gravação de áudio. Use o campo de texto.');
      return;
    }

    setStarting(true);
    try {
      const media = await navigator.mediaDevices.getUserMedia({audio: {echoCancellation: true, noiseSuppression: true, autoGainControl: true}});
      if (!mounted.current) {
        media.getTracks().forEach(track => track.stop());
        return;
      }
      stream.current = media;
      chunks.current = [];
      elapsedAtStop.current = 0;
      const mime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']
        .find(m => MediaRecorder.isTypeSupported(m));
      const active = new MediaRecorder(media, mime ? {mimeType: mime} : undefined);
      recorder.current = active;

      active.ondataavailable = event => {
        if (event.data.size > 0) chunks.current.push(event.data);
      };
      active.onerror = () => {
        clearRecordingTimers();
        releaseMicrophone();
        if (mounted.current) {
          setRecording(false);
          setVoiceInfo('');
          setVoiceError('Não foi possível concluir a gravação. Tente novamente ou digite seu comando.');
        }
      };
      active.onstop = async () => {
        clearRecordingTimers();
        releaseMicrophone();
        recorder.current = null;
        if (!mounted.current) return;
        setRecording(false);
        setTranscribing(true);
        const ext = active.mimeType.includes('mp4') ? 'mp4' : 'webm';
        const blob = new Blob(chunks.current, {type: active.mimeType || 'audio/webm'});
        chunks.current = [];
        if (blob.size < 100) {
          setVoiceError('O áudio ficou vazio. Grave novamente.');
          setVoiceInfo('');
          setTranscribing(false);
          return;
        }
        try {
          const fd = new FormData();
          fd.append('audio', blob, `comando.${ext}`);
          fd.append('durationMs', String(elapsedAtStop.current));
          const response = await api<{text: string}>('/assistant/transcribe', {
            method: 'POST', body: fd,
          });
          if (!mounted.current) return;
          const spoken = response.text?.trim();
          if (!spoken) throw new Error('Não foi possível identificar sua fala. Tente novamente.');
          setTranscript(spoken);
          setText(spoken); // Permite corrigir a transcrição manualmente, se necessário.
          setVoiceInfo('Transcrição pronta. Confira abaixo antes de salvar.');
          await interpret(spoken, 'voice');
        } catch (e) {
          if (mounted.current) {
            setVoiceError((e as Error).message);
            setVoiceInfo('');
          }
        } finally {
          if (mounted.current) setTranscribing(false);
        }
      };

      active.start();
      startedAt.current = Date.now();
      setRecording(true);
      setStarting(false);
      timeout.current = setTimeout(() => stopRecording('limit'), MAX_RECORDING_MS);
      ticker.current = setInterval(() => {
        if (mounted.current) {
          const remaining = MAX_RECORDING_MS - (Date.now() - startedAt.current);
          setSecondsRemaining(Math.max(0, Math.ceil(remaining / 1000)));
        }
      }, 150);
    } catch (e) {
      clearRecordingTimers();
      releaseMicrophone();
      if (mounted.current) {
        const err = e as Error;
        const message = err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError'
          ? 'Nenhum microfone encontrado neste dispositivo.'
          : err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
            ? 'Permita o acesso ao microfone nas configurações do navegador.'
            : `Não foi possível acessar o microfone: ${err.message || 'dispositivo indisponível'}`;
        setVoiceError(message);
      }
    } finally {
      if (mounted.current) setStarting(false);
    }
  };

  const confirm = async () => {
    if (!pending || pending.kind !== 'entry') return;
    setProcessing(true);
    setError('');
    try {
      await api('/entries', {
        method: 'POST',
        body: JSON.stringify({
          type: pending.type,
          category: pending.category,
          description: pending.description,
          amountCents: pending.amountCents,
          occurredOn: todayLocal(),
          source: entrySource,
        }),
      });
      setSuccess('Pronto! Lançamento salvo no seu financeiro.');
      setPending(null);
      setText('');
      setTranscript('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setProcessing(false);
    }
  };

  return <>
    <PageHeader
      eyebrow="ASSISTENTE INTELIGENTE"
      title="Só falar. O MotoPRO organiza."
      description="Registre ganhos e despesas por voz ou texto. Gravações de até 10 segundos, sempre com confirmação antes de salvar."
    />
    <div className="two-col assistant-layout">
      <div className="stack">
        <div className="assistant-box">
          <Sparkles color="#e8bf7d" size={22}/>
          <strong style={{font: '700 24px Outfit'}}>Assistente MotoPRO</strong>
          <p>Fale com a moto parada. O comando é encerrado automaticamente após 10 segundos.</p>
          <button
            type="button"
            className={`assistant-mic ${recording ? 'recording' : ''}`}
            aria-label={recording ? 'Parar gravação' : 'Gravar comando de até 10 segundos'}
            onClick={recording ? () => stopRecording('manual') : startRecording}
            disabled={processing || transcribing || starting}
          >
            {recording ? <Square size={27}/> : <Mic size={30}/>}
          </button>
          <strong role="status" aria-live="polite">
            {starting ? 'Conectando ao microfone…' : recording
              ? `Gravando · ${secondsRemaining}s restantes`
              : transcribing ? 'Transcrevendo áudio…'
              : processing ? 'Interpretando comando…' : 'Toque para falar'}
          </strong>
          <div className="assistant-recording-time">
            <Clock3 size={14}/> Limite máximo: 10 segundos
          </div>
          {recording && <div
            className="assistant-recording-progress"
            role="progressbar"
            aria-label="Tempo da gravação"
            aria-valuemin={0}
            aria-valuemax={10}
            aria-valuenow={10 - secondsRemaining}
          ><span style={{width: `${Math.max(0, (10 - secondsRemaining) * 10)}%`}}/></div>}
          {voiceInfo && !recording && <p className="assistant-voice-info" role="status">{voiceInfo}</p>}
          {voiceError && <div className="assistant-voice-error" role="alert">{voiceError}</div>}
          {transcript && <div className="assistant-transcript" aria-live="polite">
            <span>O QUE FOI ENTENDIDO</span>
            <strong>“{transcript}”</strong>
            <small>Se a fala não estiver correta, edite no campo de texto antes de confirmar.</small>
          </div>}
          {transcript && <div className="assistant-voice-edit">
            <label htmlFor="voice-transcript-review">Confira ou corrija o que foi reconhecido</label>
            <textarea
              id="voice-transcript-review"
              className="textarea"
              rows={2}
              maxLength={500}
              value={text}
              onChange={e => {
                interpretSequence.current++;
                setText(e.target.value);
                setPending(null); // Nunca salvar a interpretação anterior depois de editar o texto.
                setError('');
                setVoiceInfo('Texto alterado. Interprete novamente antes de confirmar.');
              }}
            />
            <button
              type="button"
              className="btn"
              disabled={processing || transcribing || !text.trim()}
              onClick={() => interpret(text.trim(), 'voice')}
            > <Send size={16}/> {text.trim() !== transcript.trim() ? 'Interpretar texto corrigido' : 'Interpretar novamente'} </button>
          </div>}
          <div className="assistant-inline-result" aria-live="polite">
            <div className="assistant-result-title"><strong>Resultado do assistente</strong><small>Confira antes de salvar</small></div>
          {error && <Notice kind="error">{error}</Notice>}
          {success && <Notice kind="success">{success}</Notice>}
          {pending?.kind === 'entry' && <div className="confirm-card">
            <span className="pill">Lançamento identificado</span>
            <strong>{pending.type === 'income' ? 'Receita' : 'Despesa'} · {categoryLabel(pending.category)}</strong>
            <strong style={{font: '700 33px Outfit', color: pending.type === 'income' ? '#178253' : '#b65a45'}}>
              {formatMoney(pending.amountCents)}
            </strong>
            <small>{pending.description}</small>
            <small>Data do lançamento: hoje. Para outra data, use a tela Lançamentos.</small>
            <div className="form-grid">
              <button className="btn" onClick={confirm} disabled={processing}>
                <CheckCircle2 size={16}/> Confirmar e salvar
              </button>
              <button className="btn secondary" onClick={() => setPending(null)} disabled={processing}>
                <XCircle size={16}/> Cancelar
              </button>
            </div>
          </div>}
          {pending?.kind === 'summary' && <div className="stack-sm">
            <div className="assistant-reply"><Volume2 size={17}/> Aqui está seu resumo de {pending.period === 'today' ? 'hoje' : 'terça a segunda'}.</div>
            <div className="row-between"><span>Receitas</span><strong className="text-income">{formatMoney(pending.summary.incomeCents)}</strong></div>
            <div className="row-between"><span>Despesas</span><strong className="text-expense">{formatMoney(pending.summary.expenseCents)}</strong></div>
            <div className="row-between"><span>Lucro estimado</span><strong style={{font: '700 22px Outfit'}}>{formatMoney(pending.summary.profitCents)}</strong></div>
          </div>}
          {pending?.kind === 'unknown' && <Notice>{pending.message}</Notice>}
          {!pending && !error && !success && <div className="empty">
            <Wallet size={28}/> Seu comando aparecerá aqui para confirmação.
          </div>}
          </div>
          {!transcript && !recording && !voiceError && !voiceInfo && <p>Gravação iniciada apenas com seu toque.</p>}
        </div>


      </div>

      <div className="stack">
        <Panel title="Ou digite seu comando" subtitle="Funciona sem chave de IA">
          <form onSubmit={submitText} className="stack">
            <textarea
              className="textarea"
              value={text}
              onChange={e => setText(e.target.value)}
              maxLength={500}
              placeholder="Ex.: Ganhei 120 reais em entregas hoje"
            />
            <button className="btn" disabled={processing || transcribing || recording || !text.trim()}>
              <Send size={16}/> Interpretar comando
            </button>
          </form>
          <div className="tag-list" style={{marginTop: 15}}>
            {['Abasteci 35 reais', 'Ganhei 120 reais hoje', 'Quanto lucrei esta semana?'].map(s =>
              <button key={s} type="button" disabled={recording || processing || transcribing}
                onClick={() => {setText(s); setTranscript(''); setVoiceInfo(''); setVoiceError(''); interpret(s, 'manual');}}>
                {s}
              </button>)}
          </div>
        </Panel>
        <Panel title="Como funciona" subtitle="Seus dados e seu controle">
          <div className="stack-sm">
            <div className="feature-check"><CheckCircle2 size={17}/> Até 10 segundos por gravação</div>
            <div className="feature-check"><CheckCircle2 size={17}/> Transcrição visível junto ao microfone</div>
            <div className="feature-check"><CheckCircle2 size={17}/> Revisão do valor e categoria</div>
            <div className="feature-check"><CheckCircle2 size={17}/> Registro apenas após confirmar</div>
          </div>
        </Panel>
      </div>
    </div>
    <p className="page-footer">
      Áudio precisa de HTTPS/localhost, permissão de microfone e OPENAI_API_KEY no servidor.
      Comandos digitados não exigem serviço externo de IA.
    </p>
  </>;
}
