//this is a simple 404 page with some custom styling and routing
import { useEffect } from "react";
import styles from "../styles/Page.module.css";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

//404 page component function start
function Page() {
  const { t } = useTranslation();

  useEffect(() => {
    document.title = t("404_page_title"); // Dynamically sets the page title
  });

  return (
    <>
      <div className={styles.container}>
        <div id={styles.div}>
          <h1 id={styles.h1}>{t("404_error_code")}</h1>
          <hr />
          <p id={styles.p}>
            {t("404_message")}
            <Link to="/">{t("404_home_link")}</Link>
            &apos;.
          </p>
        </div>
      </div>
    </>
  );
}

//exporting the created function
export default Page;
