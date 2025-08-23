import i18next from "i18next"
import Backend from "i18next-fs-backend"
import middleware from "i18next-http-middleware"
import path from "path"

i18next
  .use(Backend)
  .use(middleware.LanguageDetector)
  .init({
    fallbackLng: "en",
    preload: ["en", "es", "bn"], // Preload English, Spanish, and Bengali
    ns: ["common", "errors"], // Namespaces for translation files
    defaultNS: "common",
    backend: {
      loadPath: path.join(__dirname, "../../locales/{{lng}}/{{ns}}.json"),
    },
    detection: {
      order: ["querystring", "header"],
      caches: ["cookie"],
    },
    debug: false, // Set to true for debugging i18next
  })

export default i18next
