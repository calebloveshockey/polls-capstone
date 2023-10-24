import ShowVotes from './PollVoter'
import styles from './page.module.css'
export default function ViewPollPage({params} : {params: {sharecode: string}}) {

  return (
    <div className={styles.content}>
      <div className={styles.header}>Results</div>
      <ShowVotes shareCode={params.sharecode}/>
    </div>
  )
}
