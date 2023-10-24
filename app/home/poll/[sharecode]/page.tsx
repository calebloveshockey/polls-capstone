import styles from './page.module.css'
import PollVoter from './PollVoter'
export default function ViewPollPage({params} : {params: {sharecode: string}}) {

  return (
    <div className={styles.content}>
      <div className={styles.header}>VOTE</div>
      <PollVoter shareCode={params.sharecode}/>
    </div>
  )
}
