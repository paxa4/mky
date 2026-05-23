import { Link } from "react-router-dom";

const DIRECTIONS = [
  { title: "ГИА", to: "/noko/gia-9/" },
  { title: "ВСОШ", to: "/konkursy/students/vsosh/" },
  { title: "Конкурсы и конференции для педагогов", to: "/konkursy/teachers/" },
  { title: "Олимпиады и конкурсы для учащихся", to: "/konkursy/students/" },
  { title: "КПК", to: "/deyatelnost/povyshenie-kvalifikatsii/" },
  { title: "Инновационная деятельность", to: "/deyatelnost/innovacii/" },
  { title: "Методические материалы", to: "/metodika/rekomendacii/" },
  { title: "Воспитательное пространство", to: "/deyatelnost/vospitanie/" },
  { title: "Муниципальный семейный клуб «Фамилия»", to: "/deyatelnost/vospitanie/" },
];

export default function EventsSection() {
  return (
    <section className="directions-band">
      <style>{`
        .directions-band {
          background: #EAF7FA;
          padding: 34px 24px 46px;
        }
        .directions-panel {
          max-width: 1200px;
          margin: 0 auto;
          border-radius: 24px;
          background:
            radial-gradient(circle at 88% 12%, rgba(255,255,255,.22), transparent 24rem),
            linear-gradient(135deg, #19789C 0%, #145F7D 100%);
          color: #fff;
          padding: 34px;
          box-shadow: 0 18px 38px rgba(25, 120, 156, .2);
        }
        .directions-top {
          margin-bottom: 26px;
        }
        .directions-kicker {
          margin: 0 0 8px;
          color: rgba(255,255,255,.78);
          font-size: 12px;
          font-weight: 900;
          letter-spacing: .08em;
          text-transform: uppercase;
        }
        .directions-title {
          margin: 0;
          max-width: 660px;
          color: #fff;
          font-size: 30px;
          line-height: 1.12;
          font-weight: 950;
        }
        .directions-list {
          display: flex;
          flex-wrap: wrap;
          gap: 10px 13px;
        }
        .directions-link {
          color: #fff;
          background: rgba(255,255,255,.13);
          border: 1px solid rgba(255,255,255,.28);
          border-radius: 999px;
          padding: 9px 13px;
          font-size: 14px;
          line-height: 1.25;
          font-weight: 850;
          text-decoration: none;
          transition: background .16s ease, border-color .16s ease, transform .16s ease;
        }
        .directions-link:hover {
          background: rgba(255,255,255,.22);
          border-color: rgba(255,255,255,.48);
          transform: translateY(-1px);
        }
        @media (max-width: 760px) {
          .directions-panel { padding: 24px; border-radius: 14px; }
          .directions-title { font-size: 24px; }
          .directions-link { border-radius: 8px; width: 100%; }
        }
      `}</style>

      <div className="directions-panel">
        <div className="directions-top">
          <div>
            <p className="directions-kicker">Направления</p>
            <h2 className="directions-title">Мероприятия, конкурсы, олимпиады и методическая поддержка</h2>
          </div>
        </div>

        <nav className="directions-list" aria-label="Разделы мероприятий и методической работы">
          {DIRECTIONS.map((item) => (
            <Link className="directions-link" key={item.title} to={item.to}>
              {item.title}
            </Link>
          ))}
        </nav>
      </div>
    </section>
  );
}
