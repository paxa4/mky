import { Link } from "react-router-dom";
import { methodikaSubjectSlug } from "../admin/articleTaxonomy.js";

const accentPalette = ["#19789C", "#047857", "#B45309", "#7C3AED", "#19789C"];

const priorityLinks = [
  {
    title: "ГИА",
    desc: "Итоговая аттестация, материалы и оперативная информация.",
    to: "/noko/",
    accent: "#19789C",
    surface: "#EAF7FA",
  },
  {
    title: "ВСОШ",
    desc: "Школьный, муниципальный и региональный этапы олимпиады.",
    to: "/konkursy/students/vsosh/",
    accent: "#B45309",
    surface: "#FEF3C7",
  },
  {
    title: "Конкурсы и конференции для педагогов",
    desc: "Профессиональное мастерство, конференции, положения и итоги.",
    to: "/konkursy/teachers/prof-masterstvo/",
    accent: "#7C3AED",
    surface: "#F5F3FF",
  },
  {
    title: "Олимпиады и конкурсы для учащихся",
    desc: "Олимпиады, конкурсы и конференции для обучающихся.",
    to: "/konkursy/students/",
    accent: "#B45309",
    surface: "#FEF3C7",
  },
  {
    title: "КПК",
    desc: "Курсы повышения квалификации и программы обучения.",
    to: "/deyatelnost/povyshenie-kvalifikatsii/",
    accent: "#19789C",
    surface: "#EAF7FA",
  },
  {
    title: "Инновации",
    desc: "Муниципальные площадки, проекты и практики.",
    to: "/deyatelnost/innovacii/",
    accent: "#0F766E",
    surface: "#CCFBF1",
  },
  {
    title: "Методические материалы",
    desc: "Рекомендации, разработки и практические подборки.",
    to: "/metodika/rekomendacii/",
    accent: "#19789C",
    surface: "#D1EEF5",
  },
  {
    title: "Воспитательное пространство",
    desc: "Практики, проекты и городские воспитательные события.",
    to: "/deyatelnost/vospitanie/",
    accent: "#047857",
    surface: "#ECFDF5",
  },
  {
    title: "Муниципальный семейный клуб «ФамилиЯ»",
    desc: "Городские семейные инициативы и воспитательные события.",
    to: "/deyatelnost/vospitanie/",
    accent: "#BE123C",
    surface: "#FFE4E6",
  },
];

function subjectLink(subject, title = subject, meta = "Предметное направление") {
  return {
    title,
    meta,
    to: `/metodika/${methodikaSubjectSlug(subject)}/`,
  };
}

const directionLinks = [
  { title: "ТПМПК", meta: "Запись, документы, консультации", to: "/tpmpk/" },
  { title: "КПК", meta: "Повышение квалификации", to: "/deyatelnost/povyshenie-kvalifikatsii/" },
  subjectLink("Дошкольное образование"),
  subjectLink("Дополнительное образование"),
  subjectLink("Начальная школа", "Начальное общее образование"),
  subjectLink("История"),
  subjectLink("Иркутсковедение", "История нашего края"),
  subjectLink("Обществознание"),
  subjectLink("ОДНКНР"),
  subjectLink("Иностранные языки"),
  subjectLink("Русский язык", "Русский язык и литература"),
  subjectLink("Математика"),
  subjectLink("Информатика"),
  subjectLink("Физика"),
  subjectLink("Химия"),
  subjectLink("Биология"),
  subjectLink("География"),
  subjectLink("Экология", "Байкаловедение и экология"),
  subjectLink("Физическая культура"),
  subjectLink("ОБЖ", "ОБЗР / ОБЖ"),
  subjectLink("Технология", "Труд / технология"),
  subjectLink("ИЗО", "Искусство и ИЗО"),
  subjectLink("Музыка"),
  subjectLink("Экономика"),
  { title: "Советники по воспитанию", meta: "Воспитательное пространство", to: "/deyatelnost/vospitanie/" },
  subjectLink("Психологическая служба", "Психологи"),
  { title: "Социальные педагоги", meta: "Воспитательное пространство", to: "/deyatelnost/vospitanie/" },
  { title: "Молодые специалисты", meta: "Дом учителя", to: "/dom-uchitelya/molodye-pedagogi/" },
  subjectLink("Логопедия и дефектология"),
  subjectLink("Классное руководство"),
];

const bannerLinks = [
  { title: "Год единства народов", text: "Главный баннер года", to: "/novosti/" },
  { title: "Образовательный форум", text: "Программа, цели, регистрация", to: "/konkursy/teachers/konferencii/" },
  { title: "Августовские встречи", text: "Ключевая площадка августа", to: "/konkursy/teachers/konferencii/" },
  { title: "Компьютериада", text: "Конкурсы для обучающихся", to: "/konkursy/students/" },
];

export default function DepartmentsSection() {
  return (
    <section className="home-directions-section" aria-labelledby="home-directions-title">
      <style>{`
        .home-directions-section {
          background: #EAF7FA;
          border-bottom: 1px solid rgba(25, 120, 156, .14);
          padding: 36px 20px 30px;
        }

        .home-directions-wrap {
          width: min(1200px, 100%);
          margin: 0 auto;
        }

        .home-directions-head {
          display: grid;
          grid-template-columns: minmax(0, 1.1fr) minmax(260px, .9fr);
          gap: 18px;
          align-items: end;
          margin-bottom: 18px;
        }

        .home-directions-kicker {
          display: inline-flex;
          width: fit-content;
          min-height: 30px;
          align-items: center;
          border-radius: 8px;
          background: #D1EEF5;
          color: #19789C;
          padding: 0 10px;
          font-size: 12px;
          font-weight: 900;
          margin-bottom: 10px;
        }

        .home-directions-head h1 {
          margin: 0;
          color: #0f172a;
          font-size: 36px;
          line-height: 1.08;
          letter-spacing: 0;
        }

        .home-directions-head p {
          margin: 0;
          color: #475569;
          font-size: 16px;
          line-height: 1.55;
          font-weight: 650;
        }

        .priority-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 12px;
        }

        .priority-card,
        .direction-card,
        .banner-card {
          color: inherit;
          text-decoration: none;
          border-radius: 10px;
          transition: border-color .16s ease, box-shadow .16s ease, transform .16s ease, background .16s ease;
        }

        .priority-card {
          min-height: 148px;
          display: flex;
          flex-direction: column;
          padding: 16px;
          background: transparent;
          border: 1px solid rgba(25, 120, 156, .3);
          box-shadow: 0 10px 26px rgba(25, 120, 156, .04);
        }

        .priority-card:hover,
        .direction-card:hover,
        .banner-card:hover {
          transform: translateY(-2px);
          border-color: #78C2D8;
          background: rgba(255, 255, 255, .26);
          box-shadow: 0 14px 30px rgba(25, 120, 156, .12);
        }

        .priority-mark {
          width: 38px;
          height: 38px;
          border-radius: 8px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 900;
          margin-bottom: 12px;
        }

        .priority-card h2,
        .direction-card h3,
        .banner-card h3 {
          margin: 0;
          color: #0B1728;
          letter-spacing: 0;
          overflow-wrap: anywhere;
        }

        .priority-card h2 {
          font-size: 16px;
          line-height: 1.18;
        }

        .priority-card p {
          margin: 8px 0 0;
          color: #33465C;
          font-size: 13px;
          line-height: 1.5;
          font-weight: 700;
        }

        .priority-block,
        .direction-block {
          margin-top: 26px;
        }

        .priority-block {
          border-radius: 14px;
          background: rgba(234, 247, 250, .74);
          border: 0;
          padding: 18px;
        }

        .direction-block,
        .banner-block {
          border-radius: 14px;
          background: rgba(234, 247, 250, .74);
          border: 0;
          padding: 18px;
        }

        .section-row-head {
          display: flex;
          align-items: end;
          justify-content: space-between;
          gap: 14px;
          margin-bottom: 12px;
        }

        .section-row-head h2 {
          margin: 0;
          color: #0f172a;
          font-size: 24px;
          line-height: 1.15;
          letter-spacing: 0;
        }

        .section-row-head p {
          margin: 0;
          max-width: 520px;
          color: #64748b;
          font-size: 14px;
          line-height: 1.45;
          font-weight: 650;
        }

        .direction-rail,
        .banner-rail {
          display: grid;
          grid-auto-flow: column;
          gap: 12px;
          overflow-x: auto;
          overscroll-behavior-inline: contain;
          scroll-snap-type: x proximity;
          padding: 2px 2px 12px;
          scrollbar-color: #94a3b8 transparent;
        }

        .direction-rail {
          grid-auto-columns: minmax(210px, 250px);
        }

        .direction-card {
          scroll-snap-align: start;
          min-height: 124px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 16px;
          background: transparent;
          border: 1px solid rgba(25, 120, 156, .3);
          padding: 16px;
        }

        .direction-card h3 {
          font-size: 16px;
          line-height: 1.22;
        }

        .direction-card span {
          color: #33465C;
          font-size: 12px;
          line-height: 1.35;
          font-weight: 850;
        }

        .banner-block {
          margin-top: 16px;
        }

        .banner-rail {
          grid-auto-columns: minmax(240px, 1fr);
        }

        .banner-card {
          scroll-snap-align: start;
          min-height: 92px;
          display: grid;
          align-content: center;
          gap: 6px;
          padding: 16px;
          background: transparent;
          border: 1px solid rgba(25, 120, 156, .3);
        }

        .banner-card h3 {
          font-size: 16px;
          line-height: 1.2;
        }

        .banner-card p {
          margin: 0;
          color: #33465C;
          font-size: 13px;
          line-height: 1.35;
          font-weight: 800;
        }

        .home-directions-section a:focus-visible {
          outline: 3px solid #19789C;
          outline-offset: 3px;
        }

        @media (max-width: 1020px) {
          .home-directions-head {
            grid-template-columns: 1fr;
          }

          .priority-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }

        @media (max-width: 620px) {
          .home-directions-section {
            padding: 26px 12px 24px;
          }

          .home-directions-head h1 {
            font-size: 28px;
          }

          .priority-grid {
            grid-template-columns: 1fr;
          }

          .section-row-head {
            display: grid;
          }
        }
      `}</style>

      <div className="home-directions-wrap">
        <div className="home-directions-head">
          <div>
            <h1 id="home-directions-title">МКУ развития образования города Иркутска</h1>
          </div>
        </div>

        <div className="priority-block">
          <div className="section-row-head">
            <h2>Главное</h2>
          </div>
          <div className="priority-grid">
            {priorityLinks.map((item) => (
              <Link key={item.title} className="priority-card" to={item.to}>
                <span className="priority-mark" style={{ background: item.surface, color: item.accent }}>
                  {item.title.slice(0, 3)}
                </span>
                <h2>{item.title}</h2>
                <p>{item.desc}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="direction-block">
          <div className="section-row-head">
            <h2>Направления деятельности</h2>
          </div>
          <div className="direction-rail" aria-label="Направления деятельности">
            {directionLinks.map((item, index) => (
              <Link
                key={`${item.title}-${item.to}`}
                className="direction-card"
                to={item.to}
              >
                <h3>{item.title}</h3>
                <span>{item.meta}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="banner-block">
          <div className="section-row-head">
            <h2>Ключевые события</h2>
          </div>
          <div className="banner-rail" aria-label="Ключевые события">
            {bannerLinks.map((item) => (
              <Link
                key={item.title}
                className="banner-card"
                to={item.to}
              >
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
