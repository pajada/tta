import type { NextPage } from "next";
import Head from "next/head";
import styles from "../styles/Home.module.css";
import { useEffect, useState } from "react";

const NAME = "international-season-14";
const TITLE = "International Season 14";

const Group = ({
  league,
  group,
  standings,
}: {
  league: string;
  group: number;
  standings: { player: string; points: number }[];
}) => {
  standings.sort((a, b) => b.points - a.points);

  return (
    <div className={styles.card}>
      <h3>
        {league} {group}
      </h3>
      <table className={styles.table}>
        {standings.map((st, i) => (
          <tr key={st.player}>
            <td>{st.player}</td>
            <td>{st.points}</td>
          </tr>
        ))}
      </table>
    </div>
  );
};

const League = ({ league, data }: { league: string; data: any }) => {
  const sorted = Object.keys(data).map((k) => parseInt(k, 10));
  sorted.sort((a, b) => a - b);

  return (
    <>
      {sorted.map((k) => (
        <Group
          key={k}
          league={league}
          group={k}
          standings={data[k].standings}
        />
      ))}
    </>
  );
};

const Home: NextPage = () => {
  const [state, setState] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const resp = await fetch(`/${NAME}.json`);
      const data = await resp.json();
      setState(data);
    })();
  }, []);

  return (
    <div className={styles.container}>
      <Head>
        <title>TTA: {TITLE}</title>
        <meta name="description" content={TITLE} />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>{TITLE}</h1>

        <div className={styles.grid}>
          {state?.master ? (
            <League data={state.grandmaster} league="Grandmaster" />
          ) : null}
        </div>

        <div className={styles.grid}>
          {state?.master ? (
            <League data={state.master} league="Master" />
          ) : null}
        </div>

        <div className={styles.grid}>
          {state?.platinum ? (
            <League data={state.platinum} league="Platinum" />
          ) : null}
        </div>

        <div className={styles.grid}>
          {state?.gold ? <League data={state.gold} league="Gold" /> : null}
        </div>

        <div className={styles.grid}>
          {state?.silver ? (
            <League data={state.silver} league="Silver" />
          ) : null}
        </div>

        <div className={styles.grid}>
          {state?.bronze ? (
            <League data={state.bronze} league="Bronze" />
          ) : null}
        </div>

        <div className={styles.grid}>
          {state?.wood ? <League data={state.wood} league="Wood" /> : null}
        </div>
      </main>

      <footer className={styles.footer}></footer>
    </div>
  );
};

export default Home;
