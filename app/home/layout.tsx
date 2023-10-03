import Navbar from "@/components/Navbar";
import styles from "./page.module.css";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={styles.MainLayout}>
      <Navbar/>
      <>{children}</>
    </div>
    
  )
}
