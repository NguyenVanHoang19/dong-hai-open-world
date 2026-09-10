import {notFound} from 'next/navigation';
import AudioCheck from './AudioCheck';
export default function Page(){if(process.env.NODE_ENV==='production')notFound();return <AudioCheck/>;}
