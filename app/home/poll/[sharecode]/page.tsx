import { getPollType } from '@/actions/actions';
import styles from './page.module.css'
import PollVoter from './PollVoter'
import { Metadata, ResolvingMetadata } from 'next';

export async function generateMetadata({params} : {params: {sharecode: string}}, parent: ResolvingMetadata): Promise<Metadata> {
  // read route params
  const shareCode = params.sharecode;
 
  // fetch data
  const pollData = await getPollType(shareCode);
 
  return {
    title: pollData.pollName + "?",
    openGraph: {
      title: pollData.pollName + " - Vote Now!" 
    }
  }
}

export default function ViewPollPage({params} : {params: {sharecode: string}}) {
  return (
    <div className={styles.content}>
      <div className={styles.header}>VOTE</div>
      <PollVoter shareCode={params.sharecode}/>
    </div>
  )
}
