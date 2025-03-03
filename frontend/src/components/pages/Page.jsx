
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

//404 page component function start
function Page() {
  const { t } = useTranslation();

  const useBackendPort = import.meta.env.VITE_USE_BACKEND_PORT === "true";
  const API_URL = useBackendPort
    ? `${import.meta.env.VITE_BACKEND_URL}:${import.meta.env.VITE_BACKEND_PORT}`
    : import.meta.env.VITE_BACKEND_URL;




  useEffect(() => {
    document.title = t("404_page_title") + " - " + t("inkwell"); 
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


export default Page;
