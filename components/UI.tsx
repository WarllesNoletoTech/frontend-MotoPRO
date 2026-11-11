'use client';
import {AlertCircle,Inbox,LoaderCircle} from 'lucide-react';
export function PageHeader({eyebrow,title,description,actions}:{eyebrow?:string;title:string;description?:string;actions?:React.ReactNode}){return <div className="page-header"><div className="page-heading-copy"><div className="eyebrow">{eyebrow||'MOTOPRO'}</div><h1>{title}</h1>{description&&<p>{description}</p>}</div>{actions&&<div className="page-actions">{actions}</div>}</div>;}
export function Panel({title,subtitle,children,action,className=''}:{title?:string;subtitle?:string;children:React.ReactNode;action?:React.ReactNode;className?:string}){return <section className={`panel ${className}`}><div className="panel-header">{title&&<div><h2>{title}</h2>{subtitle&&<p>{subtitle}</p>}</div>}{action}</div>{children}</section>;}
export function Notice({children,kind='info'}:{children:React.ReactNode;kind?:'info'|'error'|'success'}){return <div className={`notice ${kind}`}><AlertCircle size={17}/><span>{children}</span></div>;}
export function Loading(){return <div className="data-loading"><LoaderCircle size={20} className="spin"/> Carregando...</div>;}
export function Empty({message}:{message:string}){return <div className="empty"><Inbox size={30}/><span>{message}</span></div>;}
